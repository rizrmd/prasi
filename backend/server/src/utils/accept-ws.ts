import type { WebSocketHandler } from "bun";
import { g } from "./global";

export const acceptWS = (params: { route: string } & Record<string, any>) => {
  return (req: Request) => {
    g.server.upgrade(req, {
      data: {
        ...((req as any).params || {}),
        route: "site-loading",
      },
    });
  };
};

export type WSHandler = WebSocketHandler<
  { route: string } & Record<string, any>
>;
