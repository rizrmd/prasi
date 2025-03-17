import type { RouterTypes } from "bun";
import { db } from "db/use";
import type { PageContent } from "frontend/base/src/site/router";
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
  const components = {} as Record<string, any>;
  const ctree = page?.content_tree as PageContent;
  if (
    ctree &&
    Array.isArray(ctree.component_ids) &&
    ctree.component_ids.length > 0
  ) {
    const comps_all = await db.component.findMany({
      where: {
        id: { in: ctree.component_ids },
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

  return compressedResponse({ page: ctree, components });
};
