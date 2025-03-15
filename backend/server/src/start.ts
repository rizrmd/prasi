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

const baseDir = dir.path(`data:frontend/base`);
const st = staticFile({
  basePath: baseDir,
});

g.server = Bun.serve({
  routes: {
    "/prod/:site_id": routeProd,
    "/prod/:site_id/*": routeProd,
  },
  fetch(request, server) {
    return st.serve(request);
  },
});

if (init) {
  console.log(
    `Server started at ${chalk.green.underline(
      `http://localhost:${g.server.port}`
    )} [0.0.0.0]`
  );
}
