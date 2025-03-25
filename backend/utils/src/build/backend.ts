import type { BuildOutput } from "bun";
import { bundleBun } from "./bundler-bun";
import type { BuilderArg } from "./bundler-mako-process";
import { rimraf } from "rimraf";
import { dirname } from "path";
export const backend = {
  dev: async (
    arg: BuilderArg & {
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
