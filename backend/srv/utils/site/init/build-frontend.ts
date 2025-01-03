import { removeAsync } from "fs-jetpack";
import { join } from "path";
import { waitUntil } from "prasi-utils";
import * as React from "react";
import * as ReactJSX from "react/jsx-runtime";
import * as ReactJSXDev from "react/jsx-dev-runtime";
import * as ReactDOM from "react-dom";
import { fs } from "utils/files/fs";
import { watchFiles } from "utils/files/watch";
import type { Loader } from "bun";

type BuildArg = {
  entrypoint: string[];
  ignore?: (file: string) => boolean;
  entrydir: string;
  outdir: string;
  onBuild?: (arg: {
    ts: number;
    status: "success" | "failed" | "building";
    log?: string;
  }) => void;
  onFileChanged?: (event: string, path: string) => void;
};

export const prasiBuildFrontEnd = async ({
  outdir,
  entrydir,
  entrypoint,
  onBuild,
  ignore,
  onFileChanged,
}: BuildArg) => {
  const internal = {
    building: false,
    watching: null as null | ReturnType<typeof watchFiles>,
    log: {
      add(text: string) {
        this.text += text + "\n";
      },
      text: "",
    },
    stop: async () => {
      if (internal.watching) {
        for (const v of Object.values(internal.watching)) {
          v.close();
        }
      }

      if (internal.building) {
        await waitUntil(() => internal.building === false);
      }
    },
  };

  for (const e of entrypoint) {
    if (!fs.exists(join(entrydir, e))) {
      await fs.write(join(entrydir, e), "");
    }
  }

  internal.watching = watchFiles({
    dir: entrydir,
    events: async (type, filename) => {
      if (onFileChanged && filename) {
        onFileChanged(type, filename);
      }

      if (!internal.building) {
        internal.building = true;
        if (filename) {
          if (filename === "FETCH_HEAD") return;
          try {
            const ts = Date.now();
            internal.log.add(`Building... [by: ${filename}]`);
            if (onBuild) onBuild({ ts, status: "building" });
            const result = await bunBuild({ outdir, entrypoint, entrydir });

            if (!result.success) {
              if (onBuild)
                onBuild({
                  ts: Date.now(),
                  status: "failed",
                  log: result.logs.join("\n"),
                });
              internal.log.add(
                `Build failed, reason: \n${result.logs.join("\n")}`
              );
            } else {
              if (onBuild) onBuild({ ts: Date.now(), status: "success" });
              internal.log.add(`Build completed in ${Date.now() - ts}ms`);
            }
          } catch (e: any) {
            console.log("bun build catching");

            if (onBuild)
              onBuild({ ts: Date.now(), status: "failed", log: e?.message });
            internal.log.add(`Build failed, reason: \n${e?.message}`);
          }

          internal.building = false;
        }
      }
    },
    exclude(pathname) {
      if (pathname.startsWith(".")) return true;
      if (pathname.startsWith("node_modules")) return true;
      if (ignore?.(pathname)) return true;

      return false;
    },
  });

  internal.building = true;
  try {
    const ts = Date.now();
    internal.log.add(`Building...`);
    if (onBuild) onBuild({ ts: Date.now(), status: "building" });
    const result = await bunBuild({ outdir, entrypoint, entrydir });

    if (!result.success) {
      if (onBuild)
        onBuild({
          ts: Date.now(),
          status: "failed",
          log: result.logs.join("\n"),
        });
      internal.log.add(`Build failed, reason: \n${result.logs.join("\n")}`);
    } else {
      if (onBuild) onBuild({ ts: Date.now(), status: "success" });
      internal.log.add(`Build completed in ${Date.now() - ts}ms`);
    }
  } catch (e: any) {
    if (onBuild) onBuild({ ts: Date.now(), status: "failed", log: e?.message });
    internal.log.add(`Build failed, reason: \n${e?.message}`);
  }
  internal.building = false;

  return internal;
};

const bunBuild = async ({ outdir, entrypoint, entrydir }: BuildArg) => {
  await removeAsync(outdir);

  return await Bun.build({
    entrypoints: entrypoint.map((e) => join(entrydir, e)),
    outdir: outdir,
    naming: {
      entry: "[dir]/[name].[ext]",
      chunk: "[name]-[hash].[ext]",
      asset: "[name]-[hash].[ext]",
    },
    format: "esm",
    experimentalCss: true,
    splitting: true,
    minify: true,

    define: { "process.env.NODE_ENV": '"production"' },
    // sourcemap: "linked",
    plugins: [
      {
        name: "react-from-window",
        setup(build) {
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
};
