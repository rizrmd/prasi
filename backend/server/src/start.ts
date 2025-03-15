import { argv } from "utils/argv";
import { routeProd } from "./routes/prod";
import { initDev } from "./utils/dev";
import { initServer } from "./utils/init";
import { g } from "./utils/global";
import chalk from "chalk";

initServer();

if (argv.has("--dev")) {
  initDev();
}

let init = false;
if (!g.server) {
  init = true;
}
g.server = Bun.serve({
  routes: {
    "/prod/:site_id": routeProd,
    "/prod/:site_id/*": routeProd,
  },
  fetch(request, server) {
    return new Response("okedeh");
  },
});

if (init) {
  console.log(
    `Server started at ${chalk.green.underline(
      `http://localhost:${g.server.port}`
    )} [0.0.0.0]`
  );
}
