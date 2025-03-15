import { watcher } from "utils/watcher";
import { routeBuild } from "./route-build";

export const routeWatch = async () => {
  await routeBuild();

  watcher.add(`frontend:editor/src/pages`, async () => {
    await routeBuild();
  });
};
