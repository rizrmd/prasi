import type { RouterTypes } from "bun";
import { db } from "db/use";

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
  return Response.json(pages);
};
