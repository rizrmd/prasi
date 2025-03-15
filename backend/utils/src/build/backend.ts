import type { BuilderArg } from "./bundler-mako-process";
import { bundleMako } from "./bundler-mako";
import { dirname } from "path";

export const backend = {
  dev: async (arg: BuilderArg & { logs?: (log: string) => string | void }) => {
    await bundleMako({
      name: `be~${dirname(arg.entryfile).substring(process.cwd().length)}`,
      ...arg,
      watch: true,
      config: {
        ...arg.config,
        devServer: false,
        platform: "node",
        hmr: false,
        ignores: ["bun"],
        devtool: "source-map",
        minify: false,
        codeSplitting: false,
        optimization: { skipModules: false, concatenateModules: false },
      },
    });
  },
};
