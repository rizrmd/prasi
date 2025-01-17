import { editor } from "../utils/editor";
import { compressed } from "../utils/server/compressed";
import type { ServerCtx } from "../utils/server/ctx";

export default {
  url: "/page_load",
  api: async (ctx: ServerCtx) => {
    const [id, opt] = await ctx.req.json();
    return await compressed(ctx, await editor.page.load(id, opt));
  },
};
