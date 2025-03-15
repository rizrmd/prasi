import { run } from "utils/run";
import type { BuilderArg } from "./bundler-main";
import { dir } from "utils/dir";

export const runBundler = async (
  arg: BuilderArg & {
    name: string;
    logs?: (log: string) => string | void;
  }
) => {
  let completed = false;
  await new Promise<void>((resolve) => {
    run(
      `bun run --silent ${dir.path(
        "backend:utils/src/build/bundler-main.ts"
      )} ${arg.name}`,
      {
        mode: "pipe",
        pipe(output) {
          if (output.includes("Complete!") && !completed) {
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
          delete props.logs;
          proc.send(props);
        },
      }
    );
  });
};
