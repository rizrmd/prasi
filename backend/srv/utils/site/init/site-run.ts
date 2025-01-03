import { $, gzipSync } from "bun";
import { platform } from "os";
import { dirname, join } from "path";
import { PRASI_CORE_SITE_ID, waitUntil } from "prasi-utils";
import { editor } from "utils/editor";
import { fs } from "utils/files/fs";
import type { PrasiSiteLoading } from "utils/global";
import { asset } from "utils/server/asset";
import { spawn } from "utils/spawn";
import { extractVscIndex } from "../utils/extract-vsc";
import { prasiBuildFrontEnd } from "./build-frontend";
import { findImports } from "./find-imports";
import { siteBroadcastBuildLog, siteLoadingMessage } from "./loading-msg";
import { detectPrasi } from "./prasi-detect";
import { siteLoaded } from "./site-loaded";

export const siteRun = async (site_id: string, loading: PrasiSiteLoading) => {
  await waitUntil(() => fs.exists(`code:${site_id}/site/src`), {
    interval: 1000,
  });

  siteLoadingMessage(site_id, "Installing dependencies...");
  if (!loading.deps_install) {
    loading.deps_install = spawn({
      cmd: `bun i`,
      cwd: fs.path(`code:${site_id}/site/src`),
      onMessage(arg) {
        siteBroadcastBuildLog(site_id, arg.text);
      },
    });
  }
  await loading.deps_install.exited;

  siteLoadingMessage(site_id, "Starting Frontend Build...");

  const prasi = await detectPrasi(site_id);
  const prasi_path = prasi.paths;

  if (!loading.process.build_frontend) {
    loading.process.build_frontend = await prasiBuildFrontEnd({
      outdir: fs.path(`code:${site_id}/site/build/frontend`),
      entrydir: fs.path(`code:${site_id}/site/src`),
      entrypoint: [prasi_path.index, prasi_path.internal],
      ignore: (path) => {
        if (path === prasi_path.index) return true;
        return false;
      },
      async onFileChanged(event, path) {
        if (path === "package.json") {
          let site = g.site.loaded[site_id];
          if (!site) {
            await waitUntil(() => g.site.loaded[site_id]);
            site = g.site.loaded[site_id];
          }
          site.build.build_backend?.rebuild();
        }
      },
      async onBuild({ status, log }) {
        const site = g.site.loaded[site_id];
        if (site) {
          site.process.log.build_frontend += log;
        }
        if (status === "building") {
          siteBroadcastBuildLog(site_id, "Building FrontEnd...");
        }

        if (status === "failed") {
          siteBroadcastBuildLog(site_id, `Build Failed: ${log}`);
        }

        if (status === "success") {
          siteBroadcastBuildLog(site_id, "Done");
          if (g.site.loading[site_id]) {
            await siteLoaded(site_id, prasi);
          }
          if (site_id === PRASI_CORE_SITE_ID) {
            asset.psc.rescan();
          }
          const site = g.site.loaded[site_id];
          if (site) {
            const is_ready = site.process.is_ready;
            is_ready.frontend = true;

            await waitUntil(() => !is_ready.typings);

            if (is_ready.typings) {
              const tsc = await fs.read(
                `code:${site_id}/site/src/${prasi_path.typings}`
              );
              editor.broadcast(
                { site_id },
                {
                  action: "vsc-update",
                  tsc: gzipSync(tsc),
                  vars: site.process.vsc_vars,
                }
              );
            }
          }
        } else {
          siteBroadcastBuildLog(site_id, log || "");
        }
      },
    });
  }

  siteLoadingMessage(site_id, "Starting Backend Build...");
  if (!loading.process.build_backend) {
    loading.process.build_backend = {
      entries: new Set(),
      async rebuild() {
        if (!fs.exists(`code:${site_id}/site/src/package.json`)) {
          await waitUntil(() =>
            fs.exists(`code:${site_id}/site/src/package.json`)
          );
        }

        const external = Object.keys(
          (await fs.read(`code:${site_id}/site/src/package.json`, "json"))
            .dependencies || {}
        );

        const entry = fs.path(`code:${site_id}/site/src/${prasi_path.server}`);

        this.entries = await findImports([entry], {
          excludeGlobs: [
            new Bun.Glob(fs.path(`code:${site_id}/site/src/node_modules/**`)),
          ],
          async findTSConfig() {
            return await fs.read(
              fs.path(`code:${site_id}/site/src/tsconfig.json`),
              "json"
            );
          },
        });

        const pkg_path = join(dirname(prasi_path.server), "package.json");
        if (!fs.exists(`code:${site_id}/site/build/${pkg_path}`)) {
          await fs.copy(
            `code:${site_id}/site/src/package.json`,
            `code:${site_id}/site/build/${pkg_path}`
          );

          siteLoadingMessage(site_id, "Installing Backend Dependencies...");
          await $`bun i`.cwd(fs.path(`code:${site_id}/site/build/`)).quiet();
        } else {
          try {
            const pkg = await fs.read(
              `code:${site_id}/site/src/package.json`,
              "json"
            );

            for (const k in pkg.dependencies) {
              if (!this.entries.has(k)) {
                await fs.copy(
                  `code:${site_id}/site/src/package.json`,
                  `code:${site_id}/site/build/${pkg_path}`,
                  { overwrite: true }
                );
                break;
              }
            }
          } catch (e) {}

          siteLoadingMessage(site_id, "Installing Backend Dependencies...");
          await $`bun i`.cwd(fs.path(`code:${site_id}/site/build/`)).quiet();
        }

        await Bun.build({
          entrypoints: [entry],
          target: "bun",
          format: "cjs",
          external,
          outdir: join(
            fs.path(`code:${site_id}/site/build/`),
            dirname(prasi_path.server)
          ),
        });

        let site = g.site.loaded[site_id];
        if (!site) {
          await waitUntil(() => g.site.loaded[site_id]);
          site = g.site.loaded[site_id];
        }

        site.vm.reload();
      },
    };
    loading.process.build_backend.rebuild();
  }

  siteLoadingMessage(site_id, "Starting Typings Builder...");
  if (!loading.process.build_typings) {
    const tsc =
      platform() === "win32"
        ? "node_modules/.bin/tsc.exe"
        : "node_modules/.bin/tsc";

    const tsc_arg = `--watch --moduleResolution node --emitDeclarationOnly --isolatedModules false --outFile ./${prasi_path.typings} --declaration --allowSyntheticDefaultImports true --noEmit false`;

    const typings = {
      done: () => {},
      promise: null as any,
    };
    typings.promise = new Promise<void>((resolve) => {
      typings.done = resolve;
    });

    loading.process.build_typings = spawn({
      cmd: `${fs.path(`root:${tsc}`)} ${tsc_arg}`,
      cwd: fs.path(`code:${site_id}/site/src`),
      async onMessage(arg) {
        const site = g.site.loaded[site_id];

        if (!site) {
          await waitUntil(() => site);
        }

        const log = site.process.log;
        log.build_typings += arg.text;

        if (site && arg.text.includes("Watching for file")) {
          site.process.is_ready.typings = true;
          typings.done();
          await extractVscIndex(site_id);

          const tsc = await fs.read(
            `code:${site_id}/site/src/${prasi_path.typings}`
          );

          editor.broadcast(
            { site_id },
            {
              action: "vsc-update",
              tsc: gzipSync(tsc),
              vars: site.process.vsc_vars,
            }
          );
        }
      },
    });

    if (site_id === PRASI_CORE_SITE_ID) {
      const cmd = [
        ...`${fs.path(
          platform() === "win32"
            ? "root:node_modules/.bin/tsc.exe"
            : "root:node_modules/.bin/tsc"
        )} --project tsconfig.prasi.json --watch --moduleResolution node --emitDeclarationOnly --outFile prasi-typings-generated.d.ts --declaration --noEmit false`.split(
          " "
        ),
      ];

      Bun.spawn({
        cmd,
        cwd: fs.path(`root:frontend/src/nova/ed/cprasi`),
        stdio: ["ignore", "ignore", "ignore"],
      });
    }

    await typings.promise;
  }
};
