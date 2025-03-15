import { watcher } from "utils/watcher";
import { g } from "../global";
import chalk from "chalk";
import { routeWatch } from "prasi/page/route-watch";
import { frontend } from "utils/src/build/frontend";
import { dir } from "utils/dir";

export const initDev = async () => {
  if (!g.dev) {
    console.log(`Running in ${chalk.blue("DEV")} mode`);

    g.dev = {};
    watcher.add("frontend:editor/src/pages", (file) => {
      console.log("pages changed");
    });
    routeWatch();
    await frontend.dev({
      root: dir.path("frontend:base"),
      entryfile: dir.path("frontend:base/src/index.tsx"),
      outdir: dir.path("data:frontend/base"),
    });
    await frontend.dev({
      root: dir.path("frontend:editor"),
      entryfile: dir.path("frontend:editor/src/index.tsx"),
      outdir: dir.path("data:frontend/editor"),
    });
  }
};
