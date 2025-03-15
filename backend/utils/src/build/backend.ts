import { bundleBun } from "./bundler-bun";
import type { BuilderArg } from "./bundler-mako-process";
import { rimraf } from "rimraf";
export const backend = {
  dev: async (arg: BuilderArg & { logs?: (log: string) => string | void }) => {
    await rimraf(arg.outdir);
    await bundleBun({
      entrypoints: [arg.entryfile],
      outdir: arg.outdir,
      target: "bun",
    });
  },
};
