import { db } from "db/use";

export const pageCache = {
  loaded: {} as Record<string, { id: string; url: string; name: string }[]>,
  loading: {} as Record<string, true>,
  load: async function (site_id: string) {
    if (!this.loaded[site_id] && !this.loading[site_id]) {
      this.loading[site_id] = true;
      const res = await db.page.findMany({
        select: { id: true, name: true, url: true },
        where: { id_site: site_id, is_deleted: false },
      });
      this.loaded[site_id] = res;
      delete this.loading[site_id];
    }

    return this.loaded[site_id];
  },
};
