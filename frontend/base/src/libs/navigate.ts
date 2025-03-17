import type { IItem } from "src/prasi/logic/types";
import { router, type PageContent } from "src/site/router";

export const getPathname = (pathname: string) => {
  if (pathname.startsWith(window.prasi_site.baseurl)) {
    return pathname.substring(window.prasi_site.baseurl.length);
  }
  return pathname;
};

export const navigate = async (href: string) => {
  if (window.isEditor) {
    return;
  }
  let final_href = href;
  if (typeof window.navigateOverride === "function") {
    final_href = window.navigateOverride(href);
    if (!final_href) return;
  }
  history.pushState({ prevUrl: window.location.href }, "", final_href);
  router.navigate(getPathname(final_href));
};
export const baseurl = (path: string) => {
  return window.prasi_site.baseurl + (path.startsWith("/") ? path : "/" + path);
};

export const siteurl = (path: string) => {
  const url = new URL(window.prasi_site.siteurl || location.href);
  url.pathname = path;
  return url.toString();
};
const preloading = {
  list: {} as Record<string, true>,
  timeout: null as any,
};
export const preload = async (paths: string[]) => {
  for (const path of paths) {
    if (preloading.list[path]) {
      continue;
    }
    preloading.list[path] = true;

    clearTimeout(preloading.timeout);
    preloading.timeout = setTimeout(async () => {
      const page_ids = new Set<string>();
      for (const [k, v] of Object.entries(preloading.list)) {
        const found = router.match(k);
        if (found) {
          if (!router.pages[found.page.id]) {
            page_ids.add(found.page.id);
          }
        }
      }

      await Promise.all(
        [...page_ids].map(async (page_id) => {
          const url = window.prasi_site.urls!.page.replace(":page_id", page_id);
          const page = await fetch(url);
          const loaded = (await page.json()) as {
            page: PageContent;
            components: Record<string, IItem>;
          };
          router.pages[page_id] = loaded.page;
          for (const [k, v] of Object.entries(loaded.components)) {
            router.components[k] = v;
          }
        })
      );
      preloading.list = {};
    }, 300);
  }
};
export const preloaded = (path: string) => {
  const found = router.match(path);
  if (found) {
    return !!router.pages[found.page.id];
  }
  return false;
};

export const initNavigation = () => {
  window.addEventListener("popstate", () => {
    router.navigate(getPathname(location.pathname));
  });
};
