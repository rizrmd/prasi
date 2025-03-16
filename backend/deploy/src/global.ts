import type { Server } from "bun";

export const g = global as unknown as {
  server: Server;
  shutting_down: boolean;
  backend?:
    | {
        server?: {
          init: () => Promise<void>;
          http: (arg: {
            url: { raw: URL; pathname: string };
            req: Request;
            server: Server;
            mode: "dev" | "prod";
            handle: (
              req: Request,
              opt?: {
                rewrite?: (arg: {
                  body: Bun.BodyInit;
                  headers: Headers | any;
                }) => Bun.BodyInit;
              }
            ) => Promise<Response>;
            serveStatic?: any;
            serveAPI?: any;
            index: { head: string[]; body: string[]; render: () => string };
            prasi: { page_id?: string; params?: Record<string, any> };
          }) => Promise<Response>;
        };
      }
    | undefined;
  db: any;
};
