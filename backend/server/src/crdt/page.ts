import { db } from "db/use";
import type { PageContent } from "frontend/base/src/site/router";
import { validate } from "uuid";

const save = {} as Record<string, Timer>;

export default {
  init: async (id: string) => {
    const page_id = id.substring("page/".length);
    if (validate(page_id)) {
      const res = await db.page.findFirst({
        where: { id: page_id },
        select: { content_tree: true },
      });
      return res?.content_tree as PageContent;
    }
    return {} as any;
  },
  update: async (id: string, data: any) => {
    const page_id = id.substring("page/".length);
    if (validate(page_id)) {
      await db.page.update({
        where: { id: page_id },
        data: { content_tree: data },
      });
    }
  },
};
