import { watcher } from "utils/watcher";
import { g } from "./global";
import chalk from "chalk";

export const initDev = () => {
  if (!g.dev) {
    console.log(`Running in ${chalk.blue("DEV")} mode`);

    g.dev = {};
    watcher.add("frontend:pages", (file) => {
      console.log("pages changed");
    });
  }
}; 
 