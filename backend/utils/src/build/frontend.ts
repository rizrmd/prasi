import type { BuilderArg } from "./bundler-mako-process";
import { bundleMako } from "./bundler-mako";
import { dirname } from "path";
import trim from "lodash/trim";
import type { BuildParams } from "@umijs/mako";
import { run } from "utils/run";

const config: BuildParams["config"] = {
  platform: "browser",
  externals: {
    "react-dom": "ReactDOM",
    react: "React",
  },
};
export const frontend = {
  tailwind: async (arg: {
    root: string;
    input: string;
    output: string;
    mode: "dev" | "prod";
  }) => {
    if (arg.mode === "dev") {
      run(`bun tailwindcss -i ${arg.input} -o ${arg.output} -w -m`, {
        mode: "silent",
        cwd: arg.root,
        stdin: "inherit",
      });
    } else {
      await run(`bun tailwindcss -i ${arg.input} -o ${arg.output} -m`, {
        mode: "silent",
        cwd: arg.root,
        stdin: "inherit",
      });
    }
  },
  dev: async (arg: BuilderArg & { logs?: (log: string) => string | void }) => {
    await bundleMako({
      ...arg,
      watch: true,
      config: {
        devServer: false,
        hmr: false,
        ...config,
        ...arg.config,
      },
      name: `fe~${trim(
        dirname(arg.entryfile).substring(process.cwd().length),
        "/\\"
      )}`,
    });
  },
  build: async (
    arg: BuilderArg & { logs?: (log: string) => string | void }
  ) => {
    await bundleMako({
      ...arg,
      watch: false,
      config: {
        devServer: false,
        hmr: false,
        ...config,
        ...arg.config,
      },
      name: `fe~${trim(
        dirname(arg.entryfile).substring(process.cwd().length),
        "/\\"
      )}`,
    });
  },
};
