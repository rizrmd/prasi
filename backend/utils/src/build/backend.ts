import { dirname } from "path";
import { rimraf } from "rimraf";
import { bundleBun } from "./bundler-bun";
import type { BundleArg } from "./typings";
export const backend = {
  dev: async (
    arg: BundleArg & {
      onBuild?:
        | ((type: "start" | "end", logs?: string[]) => void)
        | undefined;
    }
  ) => {
    await rimraf(arg.outdir);
    await bundleBun({
      entrypoints: [arg.entryfile],
      outdir: arg.outdir,
      target: "bun",
      watch: dirname(arg.entryfile),
      onBuildStart: () => {
        arg.onBuild?.("start");
      },
      onBuildEnd: (output) => {
        arg.onBuild?.("end", output);
      },
    });
  },
};
