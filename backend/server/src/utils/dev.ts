import { watcher } from "utils/watcher";
import { g } from "./global";
import chalk from "chalk";
import { routeWatch } from "prasi/page/route-watch";
import { frontend } from "utils/src/build/frontend";
import { dir } from "utils/dir";

export const initDev = () => {
  if (!g.dev) {
    console.log(`Running in ${chalk.blue("DEV")} mode`);

    g.dev = {};
    watcher.add("frontend:src/pages", (file) => {
      console.log("pages changed");
    });
    routeWatch();
    frontend.dev({
      entryfile: dir.path("frontend:src/index.tsx"),
      outdir: dir.path("data:editor/frontend"),
    });
  }
};
