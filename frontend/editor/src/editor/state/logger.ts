import { proxy } from "valtio";

export const writeLogger = proxy({
  ws: null as null | WebSocket,
  status: "init" as "init" | "loading" | "ready" | "not-found",
  server: {
    startup: "",
    status: "stopped" as "started" | "stopped",
    logs: [] as { ts: number; raw: string }[],
  },
  frontend: {
    logs: [] as { ts: number; raw: string }[],
  },
  backend: {
    logs: [] as { ts: number; raw: string }[],
  },
});
