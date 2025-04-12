import { db } from "db/use";
import { g } from "./global";
import { readFileSync, writeFileSync } from "fs";
import { dir } from "utils/dir";

export const initServer = async () => {
  let is_startup = false;
  if (typeof g.is_restarted === "undefined") {
    is_startup = true;
  }
  g.is_restarted = false;
  process.on("exit", (e) => {
    writeFileSync(dir.path("data:prasi.pid"), "");
  });
  if (dir.exists("data:prasi.pid")) {
    const pid = parseInt(readFileSync(dir.path("data:prasi.pid"), "ascii"));
    writeFileSync(dir.path("data:prasi.pid"), process.pid.toString());
    if (!is_startup) {
      g.is_restarted = !!pid;
    }
  }

  if (!g.server) {
    await db.$connect();
  }
};
