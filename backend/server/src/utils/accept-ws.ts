import type { WebSocketHandler } from "bun";
import { g } from "./global";
import type { WebSocketData } from "server/ws/typings";
import { wsRouter } from "server/ws";

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

export const routerWS = {
  open(ws) {
    const route = wsRouter[ws.data.route as keyof typeof wsRouter];
    if (route) {
      route.open(ws);
    }
  },
  async message(ws, message) {
    const route = wsRouter[ws.data.route as keyof typeof wsRouter];
    if (route) {
      route.message(ws, message);
    }
  },
  close(ws, code, reason) {
    const route = wsRouter[ws.data.route as keyof typeof wsRouter];
    if (route) {
      route.close(ws, code, reason);
    }
  },
} as const satisfies WebSocketHandler<WebSocketData>;

export type WSHandler = WebSocketHandler<WebSocketData>;
