import type { WebSocketHandler } from "bun";
import { Site } from "prasi/site";
import type { WSHandler } from "server/utils/accept-ws";

export const wsSiteLoading = {
  open: async (ws) => {
    const site_id = ws.data.site_id;
    if (site_id) {
      if (!Site.ws_waiting[site_id]) {
        Site.ws_waiting[site_id] = new Set();
      }

      Site.ws_waiting[site_id].add(ws);
    }
  },
  message(ws, message) {},
  close(ws, code, reason) {
    const site_id = ws.data.site_id;
    if (site_id) {
      if (!Site.ws_waiting[site_id]) {
        Site.ws_waiting[site_id] = new Set();
      }
      Site.ws_waiting[site_id].delete(ws);
    }
  },
} as const satisfies WSHandler;
