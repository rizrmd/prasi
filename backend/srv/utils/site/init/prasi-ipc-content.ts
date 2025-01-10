import { findRoute } from "rou3";
import type { PrasiContent, PrasiSite } from "utils/global";
import { crdt_comps, crdt_pages } from "../../../ws/crdt/shared";

export const newPrasiIpcContent = ({
  site_id,
  site,
}: {
  site: PrasiSite;
  site_id: string;
}): PrasiContent => {
  return {
    route(pathname: string) {
      const found = findRoute(site.router, undefined, pathname || "");
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
  };
};
