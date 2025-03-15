import type { RouterTypes } from "bun";
import { db } from "db/use";

export const routePrasiLayout: RouterTypes.RouteHandler<
  "/_prasi/:site_id/layout"
> = async (req) => {
  const layout = await db.page.findFirst({
    select: {
      content_tree: true,
    },
    where: {
      id_site: req.params.site_id,
      is_deleted: false,
      name: { startsWith: "layout:" },
    },
  });
  return Response.json(layout);
};
