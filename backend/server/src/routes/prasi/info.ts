import type { RouterTypes } from "bun";
import { db } from "db/use";

export const routePrasiInfo: RouterTypes.RouteHandler<
  "/_prasi/:site_id/info"
> = async (req) => {
  const site = await db.site.findFirst({
    where: {
      id: req.params.site_id,
      is_deleted: false,
    },
  });
  return Response.json(site);
};
