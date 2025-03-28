import { GlobalAlert } from "./components/ui/global-alert";
import { pageModules } from "./generated/pages";
import { Root, root } from "./lib/root";
import { matchRoute, parsePattern, type Params } from "./lib/router";

window.initSite({
  site_id: "a0170f25-a9d9-4646-a970-f1c2e5747971", // prasi-core
  site_url: "prasi.avolut.com",
  custom: {
    root: <Root />,
    async route(path) {
      // Try exact match first
      let pageLoader = pageModules[path];
      let matchedParams = {};

      // If no exact match, try parameterized routes
      if (!pageLoader) {
        for (const [pattern, loader] of Object.entries(pageModules)) {
          const routePattern = parsePattern(pattern);
          const params = matchRoute(path, routePattern);
          if (pattern.includes("~")) {
            console.log(pattern, path, routePattern, params);
          }
          if (params) {
            pageLoader = loader;
            matchedParams = params;
            break;
          }
        }
      }

      window.params = matchedParams;

      if (pageLoader) {
        const Page = (await pageLoader()).default;
        root.page = (
          <>
            <Page />
            <GlobalAlert />
          </>
        );
        root.render();
      }
    },
  },
});
