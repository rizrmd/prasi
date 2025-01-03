import { removeAsync } from "fs-jetpack";
import {
  copyFileSync,
  existsSync,
  readdirSync,
  unlinkSync
} from "node:fs";
import { createContext } from "node:vm";
import { dirname, join } from "path";
import { PRASI_CORE_SITE_ID, waitUntil } from "prasi-utils";
import { addRoute, createRouter, findRoute } from "rou3";
import sync from "sync-directory";
import { c } from "utils/color";
import { editor } from "utils/editor";
import { fs } from "utils/files/fs";
import type { PrasiSite } from "utils/global";
import { debounce } from "utils/server/debounce";
import { crdt_comps, crdt_pages } from "../../../ws/crdt/shared";

export const siteLoaded = async (
  site_id: string,
  prasi: PrasiSite["prasi"]
) => {
  if (!g.site.loading[site_id]) {
    await waitUntil(() => g.site.loading[site_id]);
  }

  if (site_id === PRASI_CORE_SITE_ID) {
    waitUntil(() => fs.exists(`code:${site_id}/site/build/frontend`), {
      interval: 300,
    }).then(async () => {
      await removeAsync(fs.path(`root:backend/srv/psc`));
      sync(
        fs.path(`code:${site_id}/site/build/frontend`),
        fs.path(`root:backend/srv/psc`),
        {
          watch: true,
          type: "copy",
          supportSymlink: false,
        }
      );
    });
  }

  const loading = g.site.loading[site_id];

  const raw_pages = await _db.page.findMany({
    where: { is_deleted: false, id_site: site_id },
    select: { id: true, url: true, name: true },
  });
  const pages = [] as typeof raw_pages;
  const layout = { id: "", root: undefined as any };
  for (const page of raw_pages) {
    if (page.name.startsWith("layout:")) {
      if (!layout.id) {
        layout.id = page.id;
        const found = await _db.page.findFirst({
          where: { id: page.id },
          select: { content_tree: true },
        });
        if (found) {
          layout.root = found.content_tree;
        }
      }
    } else {
      pages.push(page);
    }
  }

  const router = createRouter<{ page_id: string }>();
  for (const page of pages) {
    addRoute(router, undefined, page.url, { page_id: page.id });
  }

  g.site.loaded[site_id] = {
    build: loading.process,
    data: loading.data!,
    config: {},
    id: site_id,
    router_base: {
      urls: pages,
      layout,
    },
    router,
    vm: {
      ctx: newContext(),
      reload: debounce(async () => {
        await g.site.loaded[site_id].vm.reload_immediately();
      }, 100),
      async reload_immediately() {
        try {
          const site = g.site.loaded[site_id];
          let is_reload = false;

          if (site.vm.init) {
            delete site.vm.init;
            is_reload = true;
          }

          let target_path = fs.path(
            join(`code:${site_id}/site/build`, dirname(prasi.paths.server))
          );

          if (existsSync(target_path)) {
            const dirs = readdirSync(fs.path(`data:site-srv/main/internal/vm`));
            for (const file of dirs) {
              if (file === "vm.ts" && existsSync(join(target_path, file))) {
                continue;
              }

              if (existsSync(join(target_path, file))) {
                unlinkSync(join(target_path, file));
              }

              copyFileSync(
                fs.path(`data:site-srv/main/internal/vm/${file}`),
                join(target_path, file)
              );
            }
          }

          const vm = require(join(target_path, "vm.ts")).vm;
          site.vm.init = await vm(site.vm.ctx);

          if (site.vm.init) {
            console.log(
              `${c.magenta}[SITE]${c.esc} ${site_id} ${is_reload ? "Reloading" : "Starting"}.`
            );

            await site.vm.init({
              site_id,
              server: () => g.server,
              mode: "vm",
              prasi,
              dev: g.mode === "dev",
              action: is_reload ? "reload" : "start",
              content: {
                route(pathname: string) {
                  const found = findRoute(
                    site.router,
                    undefined,
                    pathname || ""
                  );
                  if (found) {
                    return {
                      params: found.params || {},
                      data: { page_id: found.data.page_id },
                    };
                  }
                  return undefined;
                },
                async comps(ids) {
                  const result = {} as Record<string, any>;
                  const pending_ids = [] as string[];
                  for (const id of ids) {
                    const existing = crdt_comps[id];
                    if (existing) {
                      result[id] = existing.doc.getMap("data").toJSON();
                    } else {
                      pending_ids.push(id);
                    }
                  }
                  if (pending_ids.length > 0) {
                    (
                      await _db.component.findMany({
                        where: { id: { in: pending_ids } },
                        select: {
                          id: true,
                          content_tree: true,
                        },
                      })
                    ).map((e) => {
                      result[e.id] = e.content_tree;
                    });
                  }
                  return result;
                },
                async pages(ids: string[]) {
                  const result = [] as { id: string; root: any; url: string }[];
                  const pending_ids = [] as string[];
                  for (const id of ids) {
                    const existing = crdt_pages[id];
                    if (existing) {
                      result.push({
                        id,
                        root: existing.doc.getMap("data").toJSON(),
                        url: existing.url,
                      });
                    } else {
                      pending_ids.push(id);
                    }
                  }
                  if (pending_ids.length > 0) {
                    (
                      await _db.page.findMany({
                        where: { id: { in: pending_ids } },
                        select: {
                          id: true,
                          content_tree: true,
                          url: true,
                        },
                      })
                    ).map((e) => {
                      result.push({
                        id: e.id,
                        root: e.content_tree,
                        url: e.url,
                      });
                    });
                  }
                  return result;
                },
                async all_routes() {
                  return {
                    site: {
                      id: site_id,
                      api_url: site.data.config.api_url || "",
                    },
                    urls: site.router_base.urls,
                    layout: site.router_base.layout,
                  };
                },
              },
            });
          } else {
            console.log(
              `${c.magenta}[SITE]${c.esc} ${site_id} Failed to start.`
            );
          }
        } catch (e) {
          console.log(
            `${c.magenta}[SITE]${c.esc} ${site_id} Initialization Error.`
          );
          console.error(e);
        }
      },
    },
    process: {
      vsc_vars: {},
      log: {
        build_frontend: "",
        build_typings: "",
        build_backend: "",
        build_tailwind: "",
        run_server: "",
      },
      is_ready: { frontend: false, typings: false },
    },
    prasi,
  };
  delete g.site.loading[site_id];

  editor.broadcast(
    { site_id },
    { action: "site-ready", site: g.site.loaded[site_id].data }
  );
};

const newContext = () => {
  const exports = {};
  const ctx = {
    module: { exports },
    exports,
    AbortController,
    AbortSignal,
    alert,
    Blob,
    Buffer,
    Bun,
    ByteLengthQueuingStrategy,
    confirm,
    atob,
    btoa,
    BuildMessage,
    clearImmediate,
    clearInterval,
    clearTimeout,
    console,
    CountQueuingStrategy,
    Crypto,
    crypto,
    CryptoKey,
    CustomEvent,
    Event,
    EventTarget,
    fetch,
    FormData,
    Headers,
    HTMLRewriter,
    JSON,
    MessageEvent,
    performance,
    prompt,
    process: {
      ...process,
      cwd() {
        return this._cwd;
      },
      chdir(cwd: string) {
        this._cwd = cwd;
      },
      _cwd: "",
    },
    queueMicrotask,
    ReadableByteStreamController,
    ReadableStream,
    ReadableStreamDefaultController,
    ReadableStreamDefaultReader,
    reportError,
    require,
    ResolveMessage,
    Response,
    Request,
    setImmediate,
    setInterval,
    setTimeout,
    ShadowRealm,
    SubtleCrypto,
    DOMException,
    TextDecoder,
    TextEncoder,
    TransformStream,
    TransformStreamDefaultController,
    URL,
    URLSearchParams,
    WebAssembly,
    WritableStream,
    WritableStreamDefaultController,
    WritableStreamDefaultWriter,
  } as any;
  ctx.global = ctx;
  ctx.globalThis = ctx;
  return createContext(ctx);
};
