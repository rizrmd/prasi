import { watcher } from "utils/watcher";
import { g } from "../global";
import chalk from "chalk";
import { routeWatch } from "prasi/page/route-watch";
import { frontend } from "utils/src/build/frontend";
import { dir } from "utils/dir";

export const initDev = async () => {
  if (!g.dev) {
    if (!g.is_restarted) {
      console.log(`Running in ${chalk.blue("DEV")} mode`);
    }

    g.dev = {};
    watcher.add("frontend:editor/src/pages", (file) => {
      console.log("pages changed");
    });
    routeWatch();
    dir.ensure("data:frontend/base");
    dir.ensure("data:frontend/editor");

    const building = Promise.all([
      frontend.dev({
        root: dir.path("frontend:base"),
        entryfile: dir.path("frontend:base/src/index.tsx"),
        outdir: dir.path("data:frontend/base"),
        config: {
          externals: undefined,
        },
      }),
      frontend.tailwind({
        root: dir.path("frontend:base/src/"),
        input: dir.path("frontend:base/src/index.css"),
        output: dir.path("data:frontend/base/main.css"),
        mode: "dev",
      }),
      frontend.dev({
        root: dir.path("frontend:editor"),
        entryfile: dir.path("frontend:editor/src/index.tsx"),
        outdir: dir.path("data:frontend/editor"),
      }),
      frontend.tailwind({
        root: dir.path("frontend:editor/src/"),
        input: dir.path("frontend:editor/src/index.css"),
        output: dir.path("data:frontend/editor/main.css"),
        mode: "dev",
      }),
    ]);

    if (!g.is_restarted) {
      await building;
    }
  }
};
