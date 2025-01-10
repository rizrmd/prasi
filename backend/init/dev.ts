import { argv } from "bun";
import { fs } from "utils/files/fs";
import { spawn } from "utils/spawn";
import { c } from "../srv/utils/color";

const is_debug = argv.includes("debug");

declare global {
  var reloadCount: number;
}

globalThis.reloadCount ??= 0;
globalThis.reloadCount++;
process.env.FORCE_COLOR = "1";

const dev = {
  backend: spawn({
    cmd: `bun run --silent --hot --no-clear-screen backend/srv/server.ts dev`,
    mode: "passthrough",
  }),
  rsbuild_print: false,
  prasi_port: 0,
  site_port: 0,
};

const updatePort = () => {
  return fs.write("port.json", {
    prasi_port: dev.prasi_port,
    site_port: dev.site_port,
  });
};

if (!fs.exists("data:static-site")) {
  dev.rsbuild_print = true;
}

const getPort = (text: string) => {
  return parseInt(
    text.split("http://localhost:").pop()?.split("/").shift() || "0"
  );
};

const run = (cmd: string, cwd: string, prefix: string) => {
  let is_ready = false;

  return spawn({
    cmd,
    cwd,
    onMessage({ raw, text }) {
      if (cwd === "frontend") {
        if (dev.prasi_port === 0 && text.includes("http://localhost:")) {
          dev.prasi_port = getPort(text);

          updatePort();
        }
      }

      if (cwd === "frontend/src/nova/prod") {
        if (dev.site_port === 0 && text.includes("http://localhost:")) {
          dev.site_port = getPort(text);
          updatePort();
        }
      }

      if (text.includes("start")) {
        is_ready = true;
      }
      if (is_ready || is_debug) {
        if (!dev.rsbuild_print) return;

        process.stdout.write(prefix);
        process.stdout.write(raw);
      }
    },
  }).exited;
};

if (globalThis.reloadCount === 1) {
  const rsbuild = {
    frontend: run(
      `bun run --silent dev`,
      `frontend`,
      `${c.red}PRASI ▷  ${c.esc}`
    ).then(() => {
      "rsbuild: frontend exited";
    }),
    frontsite: run(
      `bunx rsbuild dev -m production`,
      `frontend/src/nova/prod`,
      `${c.magenta}SITES ▷  ${c.esc}`
    ).then(() => {
      "rsbuild: site exited";
    }),
  };

  await Promise.all([dev.backend.exited, rsbuild.frontend, rsbuild.frontsite]);
}
