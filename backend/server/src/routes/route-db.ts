import type { RouterTypes } from "bun";
import { execQuery, type DBArg } from "server/utils/query";

export const routeDb: RouterTypes.RouteHandler<
  "/_dbs/:table" | "/_dbs"
> = async (req) => {
  try {
    const dbarg = (await req.json()) as DBArg;
    const params = req.params as { table?: string };
    
    if (params.table === "check") {
      return Response.json({ ok: true });
    }

    const result = await execQuery(dbarg, db);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message });
  }
};
