import type { WebSocketServeOptions } from "bun";
import chalk from "chalk";
import { argv } from "utils/argv";
import { dir } from "utils/dir";
import { staticFile } from "utils/server/static";
import { routePrasiComponents } from "./routes/prasi/components";
import { routePrasiInfo } from "./routes/prasi/info";
import { routePrasiLayout } from "./routes/prasi/layout";
import { routePrasiPage } from "./routes/prasi/page";
import { routePrasiPages } from "./routes/prasi/pages";
import { routeProd } from "./routes/prod";
import { acceptWS, routerWS } from "./utils/accept-ws";
import { g } from "./utils/global";
import { initServer } from "./utils/init";
import { initDev } from "./utils/init/dev";
import { initProd } from "./utils/init/prod";
import type { WebSocketData } from "./ws/typings";

initServer();

if (argv.has("--dev")) {
  initDev();
} else {
  initProd();
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
    "/log/:site_id": async (req: Request) => jsBase.serve(req),
    "/prod/:site_id": routeProd,
    "/prod/:site_id/*": routeProd,
    "/_prasi/:site_id/layout": routePrasiLayout,
    "/_prasi/:site_id/components": routePrasiComponents,
    "/_prasi/:site_id/pages": routePrasiPages,
    "/_prasi/:site_id/page/:page_id": routePrasiPage,
    "/_prasi/:site_id/info": routePrasiInfo,
    "/_crdt/:type/:id": acceptWS({ route: "crdt" }),
    "/_prasi/:site_id/logger": acceptWS({ route: "site-logger" }),
    "/_prasi/:site_id/loading": acceptWS({ route: "site-loading" }),
  },
  websocket: routerWS,
  fetch(request, server) {
    const editorResult = jsEditor.serve(request);
    if (editorResult.status !== 404) {
      return editorResult;
    }
    return jsBase.serve(request);
  },
} as WebSocketServeOptions<WebSocketData>);

if (!g.is_restarted) {
  console.log(
    `Server started at ${chalk.green.underline(
      `http://localhost:${g.server.port}`
    )} [0.0.0.0] PID: ${process.pid}`
  );
} else {
  console.log(
    `Server reloaded at ${chalk.green(new Date().toLocaleTimeString())}`
  );
}
