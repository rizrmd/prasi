import type { BuilderArg } from "./bundler-main";
import { runBundler } from "./bundler-runner";
import { dirname } from "path";
import trim from "lodash/trim";
import type { BuildParams } from "@umijs/mako";

const config: BuildParams["config"] = {
  platform: "browser",
  externals: {
    "react-dom": "ReactDOM",
    react: "React",
  },
};
export const frontend = {
  dev: async (arg: BuilderArg & { logs?: (log: string) => string | void }) => {
    await runBundler({
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
    await runBundler({
      ...arg,
      watch: false,
      name: `fe~${trim(
        dirname(arg.entryfile).substring(process.cwd().length),
        "/\\"
      )}`,
      config: {
        ...config,
        ...arg.config,
      },
    });
  },
};
