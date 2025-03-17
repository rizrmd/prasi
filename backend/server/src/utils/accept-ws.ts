import type { WebSocketHandler } from "bun";
import { g } from "./global";

export const acceptWS = (params: { route: string } & Record<string, any>) => {
  return (req: Request) => {
    g.server.upgrade(req, {
      data: {
        ...((req as any).params || {}),
        route: params.route,
        url: req.url,
      },
    });
  };
};

export type WSHandler = WebSocketHandler<
  { route: string; url: string } & Record<string, any>
>;
