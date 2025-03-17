import type { RouterTypes } from "bun";
import { db } from "db/use";
import type { PageContent } from "frontend/base/src/site/router";
import { compressedResponse } from "server/utils/compressed";

export const routePrasiComponents: RouterTypes.RouteHandler<
  "/_prasi/:site_id/components"
> = async (req) => {
  const comp_ids = await req.json();
  const components = {} as Record<string, any>;
  if (Array.isArray(comp_ids) && comp_ids.length > 0) {
    const comps_all = await db.component.findMany({
      where: {
        id: { in: comp_ids },
      },
      select: {
        id: true,
        content_tree: true,
      },
    });
    for (const comp of comps_all) {
      components[comp.id] = comp.content_tree;
    }
  }
  return compressedResponse(components);
};
