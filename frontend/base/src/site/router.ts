import type { IItem } from "base/prasi/logic/types";
import { createViWrite } from "base/prasi/vi/vi-state";
import { proxy } from "valtio";

export type PageRoute = { id: string; url: string; name: string };
export type RouteMatch = {
  page: PageRoute;
  params: Record<string, string>;
} | null;
type RouteEntry = { url: string; page: PageRoute; paramCount: number };

export type Router = ReturnType<typeof createRouter>;
export type PageContent = {
  id: string;
  id_page: string;
  responsive: "desktop" | "mobile";
  type: "root";
  childs: IItem[];
  component_ids: string[];
  state: Record<string, PageState>;
};
export type PageState = {
  name: string;
  usage: Record<string, { as: "value" }>;
  type: "static" | "promise" | "function" | "computed";
  initial_value: string;
};

export const createRouter = () => ({
  routes: [] as RouteEntry[],
  current: null as null | RouteMatch,
  components: {} as Record<string, IItem>,
  pages: {} as Record<string, PageContent>,
  render: () => {},
  componentPendingRender: proxy({} as Record<string, boolean>),
  get page() {
    const page_id = this.current?.page.id;
    if (page_id) {
      return this.pages[page_id];
    }
    return null;
  },
  layout: null as null | PageContent,
  navigate: async (href: string) => {
    const current = router.match(href);

    if (current) {
      const lastMode = window.viWrite.mode;
      if (router.current?.page.id !== current.page.id) {
        window.viWrite = createViWrite();
        if (lastMode) window.viWrite.mode = lastMode;
      }
      router.current = current;
      window.params = current.params;
      if (!router.pages[current.page.id]) {
        router.render();
        const page = await fetch(
          window.prasi_site.urls!.page.replace(":page_id", current.page.id)
        );
        const loaded = (await page.json()) as {
          page: PageContent;
          components: Record<string, IItem>;
        };
        router.pages[current.page.id] = loaded.page;
        for (const [k, v] of Object.entries(loaded.components)) {
          router.components[k] = v;
        }
        router.render();
      } else {
        router.render();
      }
    }
  },
  init(pages: PageRoute[]) {
    this.routes = [];
    for (const page of pages) {
      // Skip layout pages
      if (page.name.startsWith("layout:")) continue;

      // Normalize URLs by removing trailing slashes and ensuring leading slash
      const normalizedUrl = "/" + page.url.replace(/^\/+|\/+$/g, "");

      // Count parameter segments for sorting
      const paramCount = normalizedUrl
        .split("/")
        .filter((s) => s.startsWith(":")).length;

      this.routes.push({ url: normalizedUrl, page, paramCount });
    }

    // Sort routes by:
    // 1. Number of segments (descending)
    // 2. Number of parameter segments (ascending)
    // This ensures more specific routes (longer path, fewer params) match first
    this.routes.sort((a, b) => {
      const aSegments = a.url.split("/").filter(Boolean).length;
      const bSegments = b.url.split("/").filter(Boolean).length;

      if (aSegments !== bSegments) {
        return bSegments - aSegments; // Longer paths first
      }

      return a.paramCount - b.paramCount; // Fewer params first
    });
  },

  match(url: string): RouteMatch {
    // Normalize the input URL
    const normalizedUrl = "/" + url.replace(/^\/+|\/+$/g, "");
    const urlSegments = normalizedUrl.split("/").filter(Boolean);

    // Try each route in order (most specific first)
    for (const route of this.routes) {
      const routeSegments = route.url.split("/").filter(Boolean);

      // Allow URL to have fewer segments than route if the remaining route segments are all parameters
      if (urlSegments.length > routeSegments.length) {
        continue;
      }

      const remainingRouteSegments = routeSegments.slice(urlSegments.length);
      if (!remainingRouteSegments.every((seg) => seg.startsWith(":"))) {
        continue;
      }

      const params: Record<string, string> = {};
      let matches = true;

      // Check each URL segment against route
      for (let i = 0; i < routeSegments.length; i++) {
        const routeSegment = routeSegments[i];

        // If routeSegment is undefined (which TypeScript warns could happen), skip this route
        if (!routeSegment) {
          matches = false;
          break;
        }

        const urlSegment = urlSegments[i] || "";

        if (routeSegment.startsWith(":")) {
          // Parameter segment
          const paramName = routeSegment.slice(1);
          params[paramName] = urlSegment;
        } else if (routeSegment !== urlSegment) {
          // Static segment mismatch
          matches = false;
          break;
        }
      }

      if (matches) {
        return { page: route.page, params };
      }
    }

    return null;
  },
});

export const router = createRouter();
