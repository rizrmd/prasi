import { run } from "utils/run";
import type { BuilderArg } from "./bundler-mako-process";
import { dir } from "utils/dir";

export const bundleMako = async (
  arg: BuilderArg & {
    name: string;
    logs?: (log: string) => string | void;
  }
) => {
  let completed = false;
  await new Promise<void>((resolve) => {
    run(
      `bun run --silent ${dir.path(
        "backend:utils/src/build/bundler-mako-process.ts"
      )} ${arg.name}`,
      {
        mode: "pipe",
        pipe(output) {
          if (output.includes("Built in") && !completed) {
            completed = true;
            resolve();
          }
          if (arg.logs) {
            const log = arg.logs(output);
            if (log) {
              process.stdout.write(log);
            }
          }
        },
        ipc: { onMessage(message) {} },
        started(proc) {
          const props = { ...arg };
          if (props.config) {
            for (const [k, v] of Object.entries(props.config)) {
              if (typeof v === "undefined") {
                delete (props.config as any)[k];
              }
            }
          }
          delete props.logs;
          proc.send(props);
        },
      }
    );
  });
};
