import chalk from "chalk";
import { argv } from "utils/argv";
import { routeProd } from "./routes/prod";
import { g } from "./utils/global";
import { initServer } from "./utils/init";
import { initDev } from "./utils/init/dev";
import { initProd } from "./utils/init/prod";
import { dir } from "utils/dir";
import { staticFile } from "utils/server/static";

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
  routes: {
    "/prod/:site_id": routeProd,
    "/prod/:site_id/*": routeProd,
  },
  fetch(request) {
    const editorResult = jsEditor.serve(request);
    if (editorResult.status !== 404) {
      return editorResult;
    }
    return jsBase.serve(request);
  },
});

if (init) {
  console.log(
    `Server started at ${chalk.green.underline(
      `http://localhost:${g.server.port}`
    )} [0.0.0.0]`
  );
}
