import type { Subprocess } from "bun";
import { db, type site as DBSite } from "db/use";
import { backend } from "utils/build/backend";
import { bundleBun } from "utils/build/bundler-bun";
import { dir } from "utils/dir";
import { getFreePort } from "utils/port";
import { run } from "utils/run";
import { loadGitRepo } from "./git-repo";
import { rimraf } from "rimraf";
import { bundleEsbuild } from "utils/build/bundler-esbuild";
export const Site = {
  loaded: {} as Record<
    string,
    {
      site: DBSite;
      process: Subprocess;
      port: number;
      log: {
        server: string[];
        build: { frontend: string[]; backend: string[] };
      };
      files: {
        frontend: Set<string>;
        backend: Set<string>;
      };
    }
  >,
  loading: {} as Record<string, { status: string; promise: Promise<DBSite> }>,
  check(site_id: string) {
    if (this.loaded[site_id] && !this.loading[site_id]) {
      return this.loaded[site_id];
    }
  },
  async load(site_id: string) {
    if (this.loaded[site_id]) {
      return this.loaded[site_id];
    }

    if (this.loading[site_id]) {
      await this.loading[site_id].promise;
      return this.loaded[site_id];
    }

    this.loading[site_id] = {
      status: "Initializing Site " + site_id,
      promise: null as any,
    };

    const res = await db.site.findFirst({ where: { id: site_id } });
    if (res) {
      this.loading[site_id].status = "Loading git repo";
      this.loading[site_id].promise = new Promise<DBSite>(async (resolve) => {
        const loading = this.loading[site_id];
        if (res.git_repo && loading) {
          await loadGitRepo(res, loading);
        }

        resolve(res);
      });
      await this.loading[site_id].promise;
      const port = await getFreePort();
      this.loading[site_id].status = "Waiting site server on port " + port;

      this.loaded[site_id] = {
        site: res,
        process: null as any,
        port,
        log: {
          server: [],
          build: { frontend: [], backend: [] },
        },
        files: {
          frontend: new Set(),
          backend: new Set(),
        },
      };
      await this.startWatch(site_id);
      await this.startServer(site_id, port);
      delete this.loading[site_id];
      return this.loaded[site_id];
    }
  },
  async startWatch(site_id: string) {
    const site = this.loaded[site_id];
    if (site) {
      const input = {
        frontend: "index.tsx",
        backend: "server.ts",
      };

      if (dir.exists(`data:code/${site.site.id}/site/src/frontend/index.tsx`)) {
        input.frontend = `frontend/index.tsx`;
      }

      if (dir.exists(`data:code/${site.site.id}/site/src/backend/server.ts`)) {
        input.frontend = `backend/server.ts`;
      }

      const build = {
        frontend: async () => {
          let prasi = { exclude: [] };
          try {
            const prasi_file = Bun.file(
              dir.path(`data:code/${site.site.id}/site/src/prasi.json`)
            );
            prasi = await prasi_file.json();
          } catch (e) {}

          const outdir = dir.path(
            `data:code/${site.site.id}/site/dist/frontend`
          );
          const entryfile = dir.path(
            `data:code/${site.site.id}/site/src/${input.frontend}`
          );
          await rimraf(outdir);
          await bundleEsbuild({
            root: dir.path(`data:code/${site.site.id}/site/src`),
            entryfile,
            external: prasi.exclude,
            outdir,
            logs(log) {
              site.log.build.backend.push(log);
            },
          });
        },
        backend: async () => {
          await backend.dev({
            root: dir.path(`data:code/${site.site.id}/site/src`),
            entryfile: dir.path(
              `data:code/${site.site.id}/site/src/${input.backend}`
            ),
            outdir: dir.path(`data:code/${site.site.id}/site/dist/backend`),
            logs(log) {
              site.log.build.backend.push(log);
            },
          });
        },
      };
      await Promise.all([build.frontend(), await build.backend()]);
    }
  },
  async startServer(site_id: string, port: number) {
    let resolved = false;
    await new Promise<void>((resolve) => {
      run(
        `bun run --silent --hot ${dir.path(
          "backend:deploy/src/start.ts"
        )} --port=${port} --id=${site_id}`,
        {
          mode: "pipe",
          pipe: (output) => {
            if (output && !resolved) {
              resolved = true;
              resolve();
            }
            const log = this.loaded[site_id]?.log;
            if (log) log.server.push(output);
          },
          started: (proc) => {
            const site = this.loaded[site_id];
            if (site) {
              site.process = proc;
            }
          },
        }
      );
    });
  },
};
