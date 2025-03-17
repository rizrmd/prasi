import type { WebSocketServeOptions } from "bun";
import chalk from "chalk";
import { Site } from "prasi/site";
import { argv } from "utils/argv";
import { dir } from "utils/dir";
import { staticFile } from "utils/server/static";
import { routePrasiComponents } from "./routes/prasi/components";
import { routePrasiInfo } from "./routes/prasi/info";
import { routePrasiLayout } from "./routes/prasi/layout";
import { routePrasiPage } from "./routes/prasi/page";
import { routePrasiPages } from "./routes/prasi/pages";
import { routeProd } from "./routes/prod";
import { acceptWS } from "./utils/accept-ws";
import { g } from "./utils/global";
import { initServer } from "./utils/init";
import { initDev } from "./utils/init/dev";
import { initProd } from "./utils/init/prod";
import { wsSiteLoading } from "./ws/site-loading";
import { wsRouter } from "./ws";

initServer();

if (argv.has("--dev")) {
  initDev();
} else {
  initProd();
}

let init = false;
if (!g.server) {
  init = true;
}

const jsBase = staticFile({
  baseDir: dir.path(`data:frontend/base`),
  pathPrefix: "/js/base",
  indexHtml: (req: Request) => {
    return `\
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="/js/editor/main.css" />
  </head>
  <body>
    <script type="module" src="/js/base/index.js"></script>
    <script type="module" src="/js/editor/index.js"></script>
  </body>
</html>
`;
  },
  compression: {
    enabled: true,
  },
});

const jsEditor = staticFile({
  baseDir: dir.path(`data:frontend/editor`),
  pathPrefix: "/js/editor",
  compression: { enabled: true },
});

g.server = Bun.serve({
  port: 4550,
  routes: {
    "/prod/:site_id": routeProd,
    "/prod/:site_id/*": routeProd,
    "/_prasi/:site_id/layout": routePrasiLayout,
    "/_prasi/:site_id/components": routePrasiComponents,
    "/_prasi/:site_id/pages": routePrasiPages,
    "/_prasi/:site_id/page/:page_id": routePrasiPage,
    "/_prasi/:site_id/info": routePrasiInfo,
    "/_crdt/page/:page_id": acceptWS({ route: "crdt-page" }),
    "/_prasi/:site_id/loading": acceptWS({ route: "site-loading" }),
  },
  websocket: {
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
  },
  fetch(request, server) {
    const editorResult = jsEditor.serve(request);
    if (editorResult.status !== 404) {
      return editorResult;
    }
    return jsBase.serve(request);
  },
} as WebSocketServeOptions<{ page_id?: string; site_id?: string; route: string }>);

if (init) {
  console.log(
    `Server started at ${chalk.green.underline(
      `http://localhost:${g.server.port}`
    )} [0.0.0.0]`
  );
}
