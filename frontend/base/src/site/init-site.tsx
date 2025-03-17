import { initNavigation } from "src/libs/navigate";
import type { IItem } from "src/prasi/logic/types";
import { PrasiRoot } from "src/prasi/root";
import { createViWrite } from "src/prasi/vi/vi-state";
import { router, type PageContent, type PageRoute } from "./router";
import { subscribe } from "valtio";

export const initSite = async (opt: {
  site_id: string;
  site_url: string;
  urls: (typeof window.prasi_site)["urls"];
}) => {
  initNavigation();
  window.prasi_site = {
    id: opt.site_id,
    siteurl: opt.site_url,
    baseurl: `/prod/${opt.site_id}`,
    exports: {},
    urls: opt.urls,
  };
  const fn = new Function(`return import("/prod/${opt.site_id}/index.js")`);
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
    window.viWrite = createViWrite();

    subscribe(router.componentPendingRender, async (op) => {
      console.log(op);
      if (op.find((e) => e[0] === "set")) {
        const comps = await fetch(window.prasi_site.urls.components, {
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
  window.siteReady(<PrasiRoot router={router} />);
};
