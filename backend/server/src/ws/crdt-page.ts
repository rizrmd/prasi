import type { WSHandler } from "server/utils/accept-ws";

export const wsCrdtPage = {
  open: async (ws) => {},
  message(ws, message) {},
  close(ws, code, reason) {},
} as const satisfies WSHandler;
