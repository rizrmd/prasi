import type { RouterTypes } from "bun";
import { db } from "db/use";
import { compressedResponse } from "server/utils/compressed";
import { createRouter } from "frontend/base/src/site/router";

export const routePrasiPages: RouterTypes.RouteHandler<
  "/_prasi/:site_id/pages"
> = async (req) => {
  const pages = await db.page.findMany({
    select: {
      id: true,
      url: true,
      name: true,
    },
    where: {
      id_site: req.params.site_id,
      is_deleted: false,
      name: {
        not: { startsWith: "layout:" },
      },
    },
  });

  let current = null;
  if (req.method === "POST") {
    const pathname = (await req.json()).pathname;
    const router = createRouter();
    router.init(pages);
    current = router.match(pathname);
    if (current) {
      const page = await db.page.findFirst({
        where: { id: current?.page.id },
        select: { content_tree: true },
      });
      if (page) {
        (current as any).content_tree = page.content_tree;
      }
    }
  }
  return compressedResponse({ pages: pages, current });
};
