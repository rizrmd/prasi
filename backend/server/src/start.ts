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
import { routeDb } from "./routes/route-db";
import { acceptWS, routerWS } from "./utils/accept-ws";
import { g } from "./utils/global";
import { initServer } from "./utils/init";
import { initDev } from "./utils/init/dev";
import { initProd } from "./utils/init/prod";
import type { WebSocketData } from "./ws/typings";
import { parseScriptSrcFromHtml } from "utils/server/parse-html";

initServer();

if (argv.has("--dev")) {
  await initDev();
} else {
  console.log(`Building ${chalk.blue("production")} bundle...`);
  await initProd();
}

const generateJSTag = async () => {
  const baseSrc = await parseScriptSrcFromHtml(
    dir.path(`data:frontend/base/index.html`)
  );
  const editorSrc = await parseScriptSrcFromHtml(
    dir.path(`data:frontend/editor/index.html`)
  );
  return `
${baseSrc.map((src) => `    <script defer src="${src}"></script>`).join("\n")}
${editorSrc
  .map((src) => `    <script defer src="${src}"></script>`)
  .join("\n")}`;
};
const jsTag = await generateJSTag();

const staticBase = staticFile({
  baseDir: dir.path(`data:frontend/base`),
  pathPrefix: "/_dist/base",
  indexHtml: async (req: Request) => {
    return `\
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="/_dist/css/base.css" />
    <link rel="stylesheet" href="/_dist/css/editor.css" />
  </head>
  <body>
    ${g.is_restarted ? await generateJSTag() : jsTag}
  </body>
</html>
`;
  },
  compression: {
    enabled: true,
  },
});

const staticEditor = staticFile({
  baseDir: dir.path(`data:frontend/editor`),
  pathPrefix: "/_dist/editor",
  compression: { enabled: true },
});

const staticTailwind = staticFile({
  baseDir: dir.path(`data:frontend/css`),
  pathPrefix: "/_dist/css",
  compression: { enabled: true },
});

const staticPublic = staticFile({
  baseDir: dir.path(`frontend:public`),
  pathPrefix: "/",
  compression: { enabled: true },
});

g.server = Bun.serve({
  port: 4550,
  routes: {
    "/log/:site_id": async (req: Request) => staticBase.serve(req),
    "/prod/:site_id": routeProd,
    "/prod/:site_id/*": routeProd,
    "/_dbs/*": routeDb,
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
  async fetch(req, server) {
    const editorResult = await staticEditor.serve(req);
    if (editorResult.status !== 404) return editorResult;

    const base = await staticBase.serve(req);
    if (base.status !== 404) return base;

    const tailwind = await staticTailwind.serve(req);
    if (tailwind.status !== 404) return tailwind;

    return await staticPublic.serve(req);
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
