import { PrasiRoot } from "src/prasi/root";
import { router, type PageContent, type PageRoute } from "./router";

export const initSite = async (opt: {
  site_id: string;
  urls: (typeof window.prasi_site)["urls"];
}) => {
  window.prasi_site = {
    id: opt.site_id,
    serverurl: "",
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
    current: { page: PageRoute; params: any; content_tree: PageContent };
  };
  router.init(pages);
  router.layout = await layout.json();
  if (current) {
    router.current = { page: current.page, params: current.params };
    router.pages[current.page.id] = current.content_tree;
  }
  window.siteReady(<PrasiRoot router={router} />);
};
