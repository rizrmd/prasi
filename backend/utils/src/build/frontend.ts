import chalk from "chalk";
import { pad } from "lodash";
import { dir } from "utils/dir";
import { run } from "utils/run";
import type { BundleArg } from "./typings";
export const frontend = {
  tailwind: async (arg: {
    root: string;
    input: string;
    output: string;
    mode: "dev" | "prod";
  }) => {
    if (arg.mode === "dev") {
      run(
        `bun run --silent ${dir.path(
          "root:node_modules/.bin/tailwindcss"
        )} -i ${arg.input} -o ${arg.output} -w -m`,
        {
          mode: "silent",
          cwd: arg.root,
          stdin: "inherit",
        }
      );
    } else {
      await run(
        `bun run --silent ${dir.path(
          "root:node_modules/.bin/tailwindcss"
        )} -i ${arg.input} -o ${arg.output} -m`,
        {
          mode: "silent",
          cwd: arg.root,
          stdin: "inherit",
        }
      );
    }
  },
  dev: async (
    arg: BundleArg & {
      logs?: (log: string) => string | void;
    }
  ) => {
    // const res = await bundleBun({
    //   entrypoints: [arg.entryfile],
    //   outdir: arg.outdir,
    //   splitting: true,
    //   // watch: arg.root,
    //   sourcemap: "external",
    //   onBuildEnd(output) {
    //     process.stdout.write(output?.join('\n'));
    //   },
    // });
    const build = {
      done: false,
    };
    const name = arg.root.split("/").pop();
    await new Promise<void>((resolve) => {
      run(`bun run --silent build --watch`, {
        mode: "pipe",
        cwd: arg.root,
        pipe(output) {
          if (!build.done) {
            if (output.includes("Total:")) {
              build.done = true;
              resolve();
            } else if (output.includes("error") || output.includes("ready")) {
              console.log(
                `[${chalk.red(pad(name, 8, " "))}] ${output.trim()}`
              );
            }
          } else {
            console.log(`[${chalk.red(pad(name, 8, " "))}] ${output.trim()}`);
          }
        },
      });
    });
  },
  build: async (arg: BundleArg & { logs?: (log: string) => string | void }) => {
    await run(`bun run --silent build`, { mode: "passthrough", cwd: arg.root });
  },
};
