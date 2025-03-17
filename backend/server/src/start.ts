import chalk from "chalk";
import { argv } from "utils/argv";
import { routeProd } from "./routes/prod";
import { g } from "./utils/global";
import { initServer } from "./utils/init";
import { initDev } from "./utils/init/dev";
import { initProd } from "./utils/init/prod";
import { dir } from "utils/dir";
import { staticFile } from "utils/server/static";
import { routePrasiLayout } from "./routes/prasi/layout";
import { routePrasiPages } from "./routes/prasi/pages";
import { routePrasiInfo } from "./routes/prasi/info";
import { routePrasiPage } from "./routes/prasi/page";
import type {
  ServerWebSocket,
  WebSocketHandler,
  WebSocketServeOptions,
} from "bun";
import { Site } from "prasi/site";
import { routePrasiComponents } from "./routes/prasi/components";

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
    <link rel="stylesheet" href="/js/base/index.css" />
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
  },
  websocket: {
    open(ws) {
      const pathname = ws.data.url.pathname;
      if (pathname.startsWith("/_prasi/") && pathname.endsWith("/loading")) {
        const site_id = pathname.split("/")[2];
        if (site_id) {
          if (!Site.ws_waiting[site_id]) {
            Site.ws_waiting[site_id] = new Set();
          }

          Site.ws_waiting[site_id].add(ws);
        }
      }
    },
    async message(ws, message) {},
    close(ws, code, reason) {
      const pathname = ws.data.url.pathname;
      if (pathname.startsWith("/_prasi/") && pathname.endsWith("/loading")) {
        const site_id = pathname.split("/")[2];
        if (site_id) {
          if (!Site.ws_waiting[site_id]) {
            Site.ws_waiting[site_id] = new Set();
          }
          Site.ws_waiting[site_id].delete(ws);
        }
      }
    },
  },
  fetch(request, server) {
    if (server.upgrade(request, { data: { url: new URL(request.url) } })) {
      return new Response(null, { status: 101 });
    }

    const editorResult = jsEditor.serve(request);
    if (editorResult.status !== 404) {
      return editorResult;
    }
    return jsBase.serve(request);
  },
} as WebSocketServeOptions<{ url: URL }>);

if (init) {
  console.log(
    `Server started at ${chalk.green.underline(
      `http://localhost:${g.server.port}`
    )} [0.0.0.0]`
  );
}
