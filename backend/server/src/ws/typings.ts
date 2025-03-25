export type WebSocketData = { route: string; url: string } & Record<
  string,
  any
>;

export type SiteLogMessage = (
  | { status: "site-loading"; message: string }
  | { status: "site-not-found"; id: string }
  | {
      status: "init";
      frontend: { ts: number; raw: string }[];
      backend: { ts: number; raw: string }[];
      server: { ts: number; raw: string }[];
      server_status: "started" | "stopped";
    }
  | { status: "frontend"; message: { ts: number; raw: string }[] }
  | { status: "backend"; message: { ts: number; raw: string }[] }
  | { status: "server"; message: { ts: number; raw: string }[] }
  | { status: "server-start" | "server-stop" }
) & { ts: number };
