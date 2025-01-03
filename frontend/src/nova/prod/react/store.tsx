import { apiProxy } from "base/load/api/api-proxy";
import { dbProxy } from "base/load/db/db-proxy";
import { loadRouter, PageRoute, ProdRouter } from "prod/loader/route";
import { defineStore, rawStore } from "utils/react/define-store";
import { snapshot } from "valtio";
import { IItem } from "../../../utils/types/item";
import { EBaseComp, EPage } from "../../ed/logic/types";
import { base } from "../loader/base";
import { loadPages } from "../loader/page";

export const useProdState = defineStore({
  name: "prod-store",
  ref: {
    router: null as null | ProdRouter["router"],
    api: null as null | ReturnType<typeof apiProxy>,
    db: null as null | ReturnType<typeof dbProxy>,
    pages: [] as PageRoute[],
    timeout: {
      comps: null as any,
    },
    promise: {
      comps: {} as Record<
        string,
        { promise: Promise<IItem>; resolve: (item: IItem) => void }
      >,
    },
    comps: {} as Record<string, EBaseComp>,
    page: null as null | PageRoute,
    layout: { id: "", root: null as null | EPage["content_tree"] },
    vscode_exports: {} as any,
  },
  state: {
    ts: Date.now(),
    pathname: location.pathname,
    mode: "desktop" as "mobile" | "desktop",
    site: {
      id: "",
      name: "",
      domain: "",
      responsive: "all",
      api_url: "",
    },
    status: {
      router: "init" as "init" | "loading" | "ready",
      comps: {} as Record<string, "init" | "loading">,
    },
  },
  action: ({ state: s, update, ref: r }) => ({
    initRouter() {
      if (s.status.router === "init") {
        s.status.router = "loading";

        const site_id = (window as any)?._prasi?.site_id;
        const fn = new Function(
          location.hostname === "prasi.avolut.com" ||
          location.pathname.startsWith(`/prod/${site_id}`)
            ? `return import('/prod/${site_id}/index.js');`
            : `return import('/index.js');`
        );

        loadRouter().then(({ router, pages, site, layout }) => {
          update(async (s) => {
            s.site = site;
            r.layout = layout;
            r.router = router;
            r.pages = pages;

            r.vscode_exports = { ...(await fn()) };
            delete r.vscode_exports.default;
            for (const [k, v] of Object.entries(r.vscode_exports)) {
              (window as any)[k] = v;
            }
            
            if (site.api_url) {
              r.api = apiProxy(site.api_url);
              r.db = dbProxy(site.api_url);
            }
            s.status.router = "ready";
          });
        });
      }
    },
    loadComp(ids: string[]) {
      for (const id of ids) {
        if (!r.comps[id]) {
          if (!s.status.comps[id]) {
            s.status.comps[id] = "init";

            if (!r.promise.comps[id]) {
              const pending = { resolve: null as any };
              const promise = new Promise<IItem>((resolve) => {
                pending.resolve = resolve;
              });
              r.promise.comps[id] = { promise, resolve: pending.resolve };
            }
          }
        }
      }

      clearTimeout(r.timeout.comps);
      r.timeout.comps = setTimeout(async () => {
        const ids = Object.entries(s.status.comps)
          .filter(([_, status]) => {
            if (status === "init") return true;
          })
          .map(([id]) => id);

        update((s) => {
          for (const id of ids) {
            s.status.comps[id] = "loading";
          }
        });

        if (ids.length > 0) {
          const res = await fetch(base.url`_prasi/comps`, {
            method: "POST",
            body: JSON.stringify({ ids }),
          });

          const json = await res.json();

          if (typeof json === "object" && json) {
            update((s) => {
              for (const id of ids) {
                if (json[id]) {
                  r.comps[id] = structuredClone(json[id]);
                  if (r.promise.comps[id]) {
                    r.promise.comps[id].resolve(json[id]);
                  }
                }

                delete r.promise.comps[id];
                delete s.status.comps[id];
              }
            });
          }
        }
      }, 50);
    },
    loadPage(page: PageRoute) {
      if (r.page?.id !== page.id) {
        r.page = page;
      }

      if (!page.root && !page.loading) {
        page.loading = true;

        loadPages([page.id]).then((result) => {
          update((s) => {
            const tree = result[page.id];
            if (tree && r.page) {
              r.page.root = tree;

              let mode = (
                s.site.responsive !== "all" ? s.site.responsive : "desktop"
              ) as "mobile" | "desktop";
              s.mode = tree.responsive ? tree.responsive : mode;

              delete r.page.loading;

              if (tree.component_ids) {
                const ids = tree.component_ids;
                if (Array.isArray(ids)) {
                  this.loadComp(ids);
                }
              }
            }
          });
        });
      }
    },
  }),
});

export const rawProd = rawStore<typeof useProdState>("prod-store");
