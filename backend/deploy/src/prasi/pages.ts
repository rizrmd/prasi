import type { RouterTypes } from "bun";
import { db } from "db/use";
import { site } from "../site";

export const routePrasiPage: RouterTypes.RouteHandler<"/_prasi/pages"> = async (
  req
) => {
  const pages = await db.page.findMany({
    select: {
      id: true,
      url: true,
      name: true,
    },
    where: {
      id_site: site.id,
      is_deleted: false,
      name: {
        not: { startsWith: "layout:" },
      },
    },
  });
  return Response.json(pages);
};
