import { context, type Loader } from "esbuild";
import { join } from "path";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactJSXDev from "react/jsx-dev-runtime";
import * as ReactJSX from "react/jsx-runtime";
import type { BundleArg } from "./typings";
export const bundleEsbuild = async (
  arg: BundleArg & {
    logs?: (log: string) => string | void;
    external?: string[];
    define?: Record<string, string>;
  }
) => {
  const files = new Set<string>();
  const ctx = await context({
    entryPoints: [arg.entryfile],
    outdir: arg.outdir,
    target: "esnext",
    format: "esm",
    bundle: true,
    splitting: true,
    define: arg.define,
    minify: true,
    sourcemap: "linked",
    external: [...(arg.external || []), "bun:sqlite", "fs"],
    tsconfig: join(arg.root, "tsconfig.json"),
    logLevel: "silent",
    plugins: [
      {
        name: "react-from-window",
        setup(build) {
          files.clear();
          build.onLoad({ filter: /.*/, namespace: undefined }, (e) => {
            if (e.path.includes("node_modules")) return null;
            const path = e.path.substring(arg.root.length + 1);
            files.add(path);
            return null;
          });
          const moduleToGlobal: Record<string, [string, any]> = {
            react: ["React", React],
            "react/jsx-dev-runtime": ["JSXDevRuntime", ReactJSXDev],
            "react/jsx-runtime": ["JSXRuntime", ReactJSX],
            "react-dom": ["ReactDOM", ReactDOM],
          };

          for (const module_name of Object.keys(moduleToGlobal)) {
            build.onResolve(
              { filter: new RegExp(`^${module_name}$`) },
              (args) => {
                return {
                  path: args.path,
                  namespace: "react-window-ns",
                };
              }
            );
          }

          build.onLoad(
            { filter: /.*/, namespace: "react-window-ns" },
            (args) => {
              const globalName = moduleToGlobal[args.path];

              if (!globalName) {
                throw new Error(`No global found for module: ${args.path}`);
              }

              let contents = ``;
              for (const [k, [name, obj]] of Object.entries(moduleToGlobal)) {
                if (k === args.path) {
                  contents = `
                export default window.${name};
                ${Object.keys(obj)
                  .filter((e) => e !== "default")
                  .map((e) => {
                    return `export const ${e} = window.${name}.${e};`;
                  })
                  .join("\n")}`;
                }
              }

              return {
                contents,
                loader: "js" as Loader,
              };
            }
          );
        },
      },
    ],
  });

  await ctx.rebuild();
  return {
    files,
    rebuild: async () => {
      return await ctx.rebuild();
    },
  };
};
