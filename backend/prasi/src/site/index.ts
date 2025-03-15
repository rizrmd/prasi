import type { Subprocess } from "bun";
import { db, type site as DBSite } from "db/use";
import { dir } from "utils/dir";
import { getFreePort } from "utils/port";
import { run } from "utils/run";
import { frontend } from "utils/src/build/frontend";
import { loadGitRepo } from "./git-repo";
import { backend } from "utils/build/backend";

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
    return this.loaded[site_id];
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
      this.loading[site_id].status = "Starting site server on port " + port;

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
      await Promise.all([
        this.startServer(site_id, port),
        this.startWatch(site_id),
      ]);
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

          await frontend.dev({
            entryfile: dir.path(
              `data:code/${site.site.id}/site/src/${input.frontend}`
            ),
            outdir: dir.path(`data:code/${site.site.id}/site/dist/frontend`),
            external: prasi.exclude,
            logs(log) {
              site.log.build.frontend.push(log);
            },
          });
        },
        backend: async () => {
          await backend.dev({
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
      await Promise.all([build.frontend(), build.backend()]);
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
            console.log(output);
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
