import type { BuilderArg } from "./bundler-main";
import { runBundler } from "./bundler-runner";
import { dirname } from "path";

export const backend = {
  dev: async (arg: BuilderArg & { logs?: (log: string) => string | void }) => {
    await runBundler({
      name: `be~${dirname(arg.entryfile).substring(process.cwd().length)}`,
      ...arg,
      external: ["bun"],
      watch: true,
      config: {
        ...arg.config,
        devServer: false,
        platform: "node",
        hmr: false,
        devtool: "source-map",
        minify: false,
        codeSplitting: false,
        optimization: { skipModules: false, concatenateModules: false },
      },
    });
  },
};
