import type { BuilderArg } from "./bundler-main";
import { runBundler } from "./bundler-runner";
import { dirname } from "path";
import trim from "lodash/trim";
export const frontend = {
  dev: async (arg: BuilderArg & { logs?: (log: string) => string | void }) => {
    await runBundler({
      ...arg,
      watch: true,
      config: {
        ...arg.config,
        devServer: false,
        hmr: false,
        platform: "browser",
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
    });
  },
};
