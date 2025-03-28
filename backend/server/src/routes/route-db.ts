import type { RouterTypes } from "bun";
import { execQuery, type DBArg } from "server/utils/query";

export const routeDb: RouterTypes.RouteHandler<"/_dbs"> = async (req) => {
  try {
    const params = req.params as DBArg;

    const result = await execQuery(params, db);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message });
  }
};
