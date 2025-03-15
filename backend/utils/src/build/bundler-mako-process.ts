/**
 * bundler-mako cannot be used to build site frontend, because of it always output iife.
 * We need to output esm for the frontend.
 */
import { build, type BuildParams } from "@umijs/mako";
import { join } from "path";

export type BuilderArg = {
  root: string;
  entryfile: string;
  outdir: string;
  watch?: boolean;
  config?: BuildParams["config"];
};

const bundle = async (arg: BuilderArg) => {
  const tsconfig = {
    path: join(arg.root, "tsconfig.json"),
    exists: false,
    alias: [] as [string, string][],
  };

  if (await Bun.file(tsconfig.path).exists()) {
    tsconfig.exists = true;
    try {
      const tsconfig_file = await Bun.file(tsconfig.path).json();
      if (tsconfig_file.compilerOptions?.paths) {
        for (const [key, value] of Object.entries(
          tsconfig_file.compilerOptions.paths
        ) as any) {
          const alias = key.endsWith("/*") ? key.slice(0, -2) : key;
          const path = value[0].endsWith("/*")
            ? value[0].slice(0, -2)
            : value[0];
          tsconfig.alias.push([alias, path]);
        }
      }
    } catch (e) {
      console.log(`Failed to read ${tsconfig.path}`);
    }
  }

  await build({
    root: arg.root,
    watch: arg.watch || false,
    config: {
      //@ts-ignore
      progress: false,
      output: {
        path: arg.outdir,
        mode: "bundle",
        ...arg.config?.output,
      },
      mode: "production",
      codeSplitting: {
        strategy: "advanced",
        options: {
          //（optional）The minimum size of the split chunk, async chunks smaller than this size will be merged into the entry chunk
          minSize: 20000,
          // Split chunk grouping configuration
          groups: [
            {
              // The name of the chunk group, currently only string values are supported
              name: "common",
              //（optional）The chunk type that the chunk group contains modules belong to, enum values are "async" (default) | "entry" | "all"
              allowChunks: "async",
              //（optional）The minimum number of references to modules contained in the chunk group
              minChunks: 1,
              //（optional）The minimum size of the chunk group to take effect
              minSize: 20000,
              //（optional）The maximum size of the chunk group, exceeding this size will be automatically split again
              maxSize: 5000000,
              //（optional）The matching priority of the chunk group, the larger the value, the higher the priority
              priority: 0,
              //（optional）The matching regular expression of the chunk group
              test: "(?:)",
            },
          ],
        },
      },
      resolve: {
        alias: tsconfig.alias,
        extensions: ["js", "jsx", "ts", "tsx"],
      },
      clean: true,
      devtool: "source-map",
      platform: "browser",
      entry: {
        index: arg.entryfile,
      },
      ...(arg.config || {}),
    },
  });
};

if (import.meta.main) {
  process.on("message", async (arg: BuilderArg) => {
    await bundle(arg);
  });
}
