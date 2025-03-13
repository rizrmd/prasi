import { argv } from "utils/argv";
import { initServer } from "./utils/init";
import { initDev } from "./utils/dev";

initServer();

if (argv.has("--dev")) {
  initDev();
}
