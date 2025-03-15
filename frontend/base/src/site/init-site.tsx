import { PrasiRoot } from "src/prasi/root";
import { router } from "./router";

export const initSite = async (opt: {
  site_id: string;
  urls: (typeof window.prasi_site)["urls"];
}) => {
  const fn = new Function(`return import("/prod/${opt.site_id}/index.js")`);
  const [pages, layout, exports] = await Promise.all([
    fetch(opt.urls.pages),
    fetch(opt.urls.layout),
    fn(),
  ]);
  router.init(await pages.json());
  router.layout = await layout.json();
  window.prasi_site = { exports, urls: opt.urls };
  window.siteReady(<PrasiRoot router={router} />);
};
