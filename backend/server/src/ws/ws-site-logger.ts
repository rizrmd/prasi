import { gunzipSync, gzipSync, type ServerWebSocket } from "bun";
import { Site } from "prasi/site";
import type { WSHandler } from "server/utils/accept-ws";
import type { SiteLogMessage, WebSocketData } from "./typings";
import { pack } from "msgpackr";
import { validate } from "uuid";
const g = global as unknown as {
  site_log_listener: Record<string, Set<ServerWebSocket<WebSocketData>>>;
};
if (!g.site_log_listener) {
  g.site_log_listener = {};
}
export const siteLogListener = g.site_log_listener;

export const broadcastSiteLog = (
  site_id: string,
  arg?: {
    ws?: ServerWebSocket<WebSocketData>;
    site_msg?:
      | "Done"
      | "server"
      | "frontend"
      | "backend"
      | "server-start"
      | "server-stop";
  }
) => {
  const send = (message: SiteLogMessage) => {
    const payload = gzipSync(pack(message));
    if (arg?.ws) {
      arg.ws.send(payload);
      return;
    }
    const listeners = siteLogListener[site_id];
    if (listeners) {
      for (const listener of listeners) {
        listener.send(payload);
      }
    }
  };
  const site = Site.loaded[site_id];
  const loading = Site.loading[site_id];
  if (site) {
    if (arg?.ws) {
      send({
        status: "init",
        frontend: site.log.build.frontend,
        backend: site.log.build.backend,
        ts: Date.now(),
        server: site.log.server,
        server_status: site.server.process ? "started" : "stopped",
      });
    } else {
      if (arg?.site_msg === "Done") {
        send({
          status: "init",
          frontend: site.log.build.frontend,
          backend: site.log.build.backend,
          ts: Date.now(),
          server: site.log.server,
          server_status: site.server.process ? "started" : "stopped",
        });
      }
    }

    let type = arg?.site_msg;
    if (type === "server-start" || type === "server-stop") {
      send({
        status: type,
        ts: Date.now(),
      });
    }
    if (type === "server" || type === "frontend" || type === "backend") {
      if (site.ready) {
        let msg = site.log.build.frontend;
        if (type === "backend") {
          msg = site.log.build.backend;
        } else if (type === "server") {
          msg = site.log.server;
        }
        send({
          status: type,
          ts: Date.now(),
          message: msg,
        });
      }
    }
  } else if (loading) {
    send({ status: "site-loading", message: loading.status, ts: Date.now() });
  } else {
    if (validate(site_id)) {
      const site = Site.check(site_id);
      if (!site) {
        Site.load(site_id);
      }
      send({
        status: "site-loading",
        message: "Initializing...",
        ts: Date.now(),
      });
    } else {
      send({ status: "site-not-found", id: site_id, ts: Date.now() });
    }
  }
};

export const wsSiteLogger = {
  open: async (ws) => {
    const site_id = ws.data.site_id;
    if (site_id) {
      if (!siteLogListener[site_id]) {
        siteLogListener[site_id] = new Set();
      }
      siteLogListener[site_id].add(ws);
      broadcastSiteLog(site_id, { ws });
    }
  },
  message(ws, message) {},
  close(ws, code, reason) {
    const site_id = ws.data.site_id;
    if (site_id) {
      if (!siteLogListener[site_id]) {
        siteLogListener[site_id] = new Set();
      }
      siteLogListener[site_id].delete(ws);
    }
  },
} as const satisfies WSHandler;
