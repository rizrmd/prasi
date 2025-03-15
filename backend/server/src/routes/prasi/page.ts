import type { RouterTypes } from "bun";
import { db } from "db/use";
import { compressedResponse } from "server/utils/compressed";

export const routePrasiPage: RouterTypes.RouteHandler<
  "/_prasi/:site_id/page/:page_id"
> = async (req) => {
  const page = await db.page.findFirst({
    select: {
      content_tree: true,
    },
    where: {
      id_site: req.params.site_id,
      id: req.params.page_id,
    },
  });
  return compressedResponse(page?.content_tree || {});
};
