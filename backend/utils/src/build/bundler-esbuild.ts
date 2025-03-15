import { context } from "esbuild";
import type { BuilderArg } from "./bundler-mako-process";
import { join } from "path";
export const bundleEsbuild = async (
  arg: Omit<BuilderArg, "config"> & {
    logs?: (log: string) => string | void;
    external?: string[];
  }
) => {
  const ctx = await context({
    entryPoints: [arg.entryfile],
    outdir: arg.outdir,
    target: "esnext",
    format: "esm",
    bundle: true,
    splitting: true,
    minify: true,
    sourcemap: "linked",
    external: [...(arg.external || []), "bun:sqlite", "fs"],
    tsconfig: join(arg.root, "tsconfig.json"),
    logLevel: "silent",
  });

  await ctx.rebuild();
};
