import type { RouterTypes } from "bun";
import { db } from "db/use";
import { site } from "../site";

export const routePrasiLayout: RouterTypes.RouteHandler<"/_prasi/layout"> = async (
  req
) => {
  const layout = await db.page.findFirst({
    select: {
      content_tree: true,
    },
    where: {
      id_site: site.id,
      is_deleted: false,
      name: { startsWith: "layout:" },
    },
  });
  return Response.json(layout);
};
