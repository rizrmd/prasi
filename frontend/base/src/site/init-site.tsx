import type { ReactElement } from "react";
import { initNavigation } from "base/libs/navigate";
import type { IItem } from "base/prasi/logic/types";
import { PrasiRoot } from "base/prasi/root";
import { createViWrite } from "base/prasi/vi/vi-state";
import { subscribe } from "valtio";
import { router, type PageContent, type PageRoute } from "./router";

export const initSite = async (opt: {
  site_id: string;
  site_url: string;
  urls?: (typeof window.prasi_site)["urls"];
  custom?: {
    root: ReactElement;
    route: (path: string) => void;
  };
}) => {
  window.prasi_site = {
    id: opt.site_id,
    siteurl: opt.site_url,
    baseurl: ["localhost", "prasi.avolut.com"].includes(location.hostname)
      ? `/prod/${opt.site_id}`
      : "/",
    exports: {},
    urls: opt.urls,
  };

  if (opt.custom) {
    window.prasi_site.custom = { page: <></> };
    window.navigate = async (href: string) => {
      history.pushState({ prevUrl: window.location.href }, "", href);
      opt.custom!.route(href);
    };
    window.addEventListener("popstate", () => {
      opt.custom!.route(location.pathname);
    });
    window.siteReady(opt.custom.root);
    opt.custom!.route(location.pathname);
  } else {
    initNavigation();
  }

  if (!opt.urls) {
    return;
  }
  const fn = new Function(
    `return import("${window.prasi_site.baseurl}/index.js")`
  );
  const pathname = location.pathname.substring(
    window.prasi_site.baseurl.length
  );
  const [pages_res, layout, exports] = await Promise.all([
    fetch(opt.urls.pages, {
      method: "POST",
      body: JSON.stringify({ pathname }),
    }),
    fetch(opt.urls.layout),
    fn(),
  ]);
  window.prasi_site.exports = exports;
  const { pages, current } = (await pages_res.json()) as {
    pages: PageRoute[];
    current: {
      page: PageRoute;
      params: any;
      content_tree: PageContent;
      components: Record<string, IItem>;
    };
  };
  router.init(pages);
  router.layout = await layout.json();
  if (current) {
    router.current = { page: current.page, params: current.params };
    router.pages[current.page.id] = current.content_tree;
    router.components = current.components;
    window.params = current.params;

    subscribe(router.componentPendingRender, async (op) => {
      if (op.find((e) => e[0] === "set")) {
        const comps = await fetch(window.prasi_site.urls!.components, {
          method: "POST",
          body: JSON.stringify(Object.keys(router.componentPendingRender)),
        });
        for (const [k, v] of Object.entries(await comps.json())) {
          router.components[k] = v as any;
          delete router.componentPendingRender[k];
        }
        router.render();
      }
    });
  }
  window.viWrite = createViWrite();
  window.siteReady(<PrasiRoot router={router} />);
};
