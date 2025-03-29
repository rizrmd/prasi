import { type ServerWebSocket, type Subprocess } from "bun";
import { db, type site as DBSite } from "db/use";
import { rimraf } from "rimraf";
import { backend } from "utils/build/backend";
import { bundleEsbuild } from "utils/build/bundler-esbuild";
import { dir } from "utils/dir";
import { getFreePort } from "utils/port";
import { run } from "utils/run";
import { loadGitRepo } from "./git-repo";
import { watcher } from "utils/watcher";
import { broadcastSiteLog } from "server/ws/ws-site-logger";
import { inspect } from "node:util";
import { formatMessagesSync } from "esbuild";
 
export const Site = { 
  loaded: {} as Record<
    string,
    {
      ready: boolean;
      site: DBSite;
      server: {
        process?: Subprocess;
        exit_code?: number;
      };
      port: number;
      log: {
        server: { ts: number; raw: string }[];
        build: {
          frontend: { ts: number; raw: string }[];
          backend: { ts: number; raw: string }[];
        };
      };
      files: {
        frontend: Set<string>;
        backend: Set<string>;
      };
    }
  >,
  loading: {} as Record<string, { status: string; promise: Promise<DBSite> }>,
  ws_waiting: {} as Record<string, Set<ServerWebSocket<{ route: string }>>>,
  ws_broadcast(site_id: string, msg: string) {
    const conns = this.ws_waiting[site_id];
    if (conns) {
      conns.forEach((ws) => {
        ws.send(msg);
      });
    }
    if (msg === "Done") broadcastSiteLog(site_id, { site_msg: msg });
  },
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
    this.ws_broadcast(site_id, this.loading[site_id].status);

    const res = await db.site.findFirst({ where: { id: site_id } });
    if (res) {
      this.loading[site_id].status = "Loading git repo";
      this.ws_broadcast(site_id, this.loading[site_id].status);

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
      this.ws_broadcast(site_id, this.loading[site_id].status);

      this.loaded[site_id] = {
        ready: false,
        site: res,
        server: {},
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
      await this.startServer(site_id, (res.config as any).api_url, port);
      this.ws_broadcast(site_id, "Done");
      this.loaded[site_id].ready = true;

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

          const replacePath = (str: string) => {
            return str.replaceAll(`../data/code/${site_id}/site/src/`, "");
          };

          const outdir = dir.path(
            `data:code/${site.site.id}/site/dist/frontend`
          );
          const entryfile = dir.path(
            `data:code/${site.site.id}/site/src/${input.frontend}`
          );
          await rimraf(outdir);
          const source = {
            files: new Set<string>(),
            rebuilding: false,
            ctx: null as null | Awaited<ReturnType<typeof bundleEsbuild>>,
          };
          const rebuild = async () => {
            source.rebuilding = true;
            const now = Date.now();
            site.log.build.frontend = [{ ts: now, raw: "Rebuilding frontend" }];
            broadcastSiteLog(site.site.id, { site_msg: "frontend" });

            if (!source.ctx) {
              try {
                source.ctx = await bundleEsbuild({
                  root: dir.path(`data:code/${site.site.id}/site/src`),
                  entryfile,
                  external: [...(prasi.exclude || []), "react", "react-dom"],
                  outdir,
                  logs(log) {
                    site.log.build.frontend.push({
                      ts: Date.now(),
                      raw: log,
                    });
                  },
                });
              } catch (e: any) {
                formatMessagesSync(e.errors, { kind: "error" }).forEach((e) => {
                  site.log.build.frontend.push({
                    ts: Date.now(),
                    raw: replacePath(e),
                  });
                });
              }
            }

            try {
              if (source.ctx) {
                const result = await source.ctx.rebuild();
                if (result.errors.length > 0) {
                  formatMessagesSync(result.errors, {
                    kind: "error",
                  }).forEach((e) => {
                    site.log.build.frontend.push({
                      ts: Date.now(),
                      raw: replacePath(e),
                    });
                  });
                } else {
                  source.files = source.ctx.files;

                  if (
                    !site.server.process &&
                    typeof site.server.exit_code === "number"
                  ) {
                    await this.startServer(
                      site.site.id,
                      (site.site.config as any).api_url,
                      site.port
                    );
                  }
                }
              } else {
                console.log("no ctx");
              }
            } catch (e: any) {
              source.files = new Set();
              formatMessagesSync(e.errors, { kind: "error" }).forEach((e) => {
                site.log.build.frontend.push({
                  ts: Date.now(),
                  raw: replacePath(e),
                });
              });
            }
            source.rebuilding = false;

            site.log.build.frontend.push({
              ts: Date.now(),
              raw: "Finished in " + (Date.now() - now) + "ms",
            });
            broadcastSiteLog(site.site.id, { site_msg: "frontend" });
            source.rebuilding = false;
          };
          await rebuild();

          watcher.add(
            dir.path(`data:code/${site.site.id}/site/src`),
            (op, file) => {
              if (file && (source.files.has(file) || source.files.size === 0)) {
                if (!source.rebuilding) {
                  rebuild();
                }
              }
            }
          );

          run(
            `bun run --silent ${dir.path(
              `data:code/${site.site.id}/site/src/node_modules/.bin/tailwindcss`
            )} -i ${dir.path(
              `data:code/${site.site.id}/site/src/app/css/global.css`
            )} -o ${dir.path(
              `data:code/${site.site.id}/site/src/app/css/build.css`
            )} -w -m`,
            {
              mode: "silent",
              cwd: dir.path(`data:code/${site.site.id}/site/src`),
              stdin: "inherit",
            }
          );
        },
        backend: async () => {
          let ts = { start: Date.now() };

          const base = dir.path(`data:code/${site.site.id}/site/src/`) + "/";
          const replacePath = (str: string) => {
            return str.replaceAll(base, "");
          };
          await backend.dev({
            root: dir.path(`data:code/${site.site.id}/site/src`),
            entryfile: dir.path(
              `data:code/${site.site.id}/site/src/${input.backend}`
            ),
            outdir: dir.path(`data:code/${site.site.id}/site/dist/backend`),
            onBuild: (type, logs) => {
              if (type === "start") {
                ts.start = Date.now();
                site.log.build.backend = [
                  { ts: Date.now(), raw: "Rebuilding backend" },
                ];
                broadcastSiteLog(site.site.id, { site_msg: "backend" });
              } else {
                logs?.forEach((e) => {
                  site.log.build.backend.push({
                    ts: Date.now(),
                    raw: replacePath(e),
                  });
                });

                if ((logs?.length || 0) === 0) {
                  const ellapsed = Date.now() - ts.start;
                  site.log.build.backend.push({
                    ts: Date.now(),
                    raw: ellapsed
                      ? "Finished in " + ellapsed + "ms"
                      : "Build success", // @ts-ignore
                  });

                  if (
                    !site.server.process &&
                    typeof site.server.exit_code === "number"
                  ) {
                    this.startServer(
                      site.site.id,
                      (site.site.config as any).api_url,
                      site.port
                    );
                  }
                }
                broadcastSiteLog(site.site.id, { site_msg: "backend" });
              }
            },
          });
        },
      };
      await Promise.all([build.frontend(), await build.backend()]);
    }
  },
  async startServer(site_id: string, site_url: string, port: number) {
    let resolved = false;
    await new Promise<void>((resolve) => {
      const path = dir.path("backend:preview/src/start.ts");
      const cwd = dir.path(`data:code/${site_id}/site/dist/backend`);
      if (!dir.exists(path) || !dir.exists(cwd)) {
        delete this.loading[site_id];
        resolved = true;

        const site = this.loaded[site_id];
        if (site) {
          site.server.exit_code = 1;
          if (site.log)
            site.log.server = [
              { ts: Date.now(), raw: "Failed to build server.ts" },
            ];
        }
        resolve();
        return;
      }

      const base = dir.path(`data:code/${site_id}/site/src/`) + "/";
      const replacePath = (str: string) => {
        return str.replaceAll(base, "");
      };
      run(
        `bun run --silent --hot ${path} --port=${port} --id=${site_id} --url=${site_url}`,
        {
          mode: "pipe",
          cwd,
          pipe: (output) => {
            const site = this.loaded[site_id];
            let broadcast = true;
            if (output.includes(`▒▒▒`)) {
              if (site?.log && site.ready) site.log.server = [];
              broadcast = false;
            }

            if (site?.log && broadcast) {
              site.log.server.push({
                ts: Date.now(),
                raw: replacePath(output),
              });
              broadcastSiteLog(site_id, { site_msg: "server" });
            }
            if (output.includes("🚀")) {
              if (!resolved) {
                delete this.loading[site_id];
                resolved = true;
                resolve();
              }
            }
          },
          started: (proc) => {
            const site = this.loaded[site_id];
            if (site) {
              site.server.exit_code = undefined;
              site.server.process = proc;

              broadcastSiteLog(site_id, {
                site_msg: "server-start",
              });
            }
          },
          exited: (code) => {
            const site = this.loaded[site_id];
            if (site) {
              site.server.exit_code = code;
              site.server.process = undefined;

              site.log.server.push({
                ts: Date.now(),
                raw: `Server crashed with exit code: ${code} - ${exitCodeToString(
                  code
                )}`,
              });

              broadcastSiteLog(site_id, {
                site_msg: "server-stop",
              });
              broadcastSiteLog(site_id, {
                site_msg: "server",
              });
            }
            if (!resolved) {
              delete this.loading[site_id];
              resolved = true;
              resolve();
            }
          },
        }
      );
    });
  },
};

export const exitCodeToString = (code: number) => {
  switch (code) {
    case 0:
      return "Success";
    case 1:
      return "Uncaught exception";
    case 2:
      return "Misuse of shell builtins";
    case 3:
      return "Internal JavaScript parse error";
    case 4:
      return "Internal JavaScript evaluation error";
    case 5:
      return "Fatal error";
    case 6:
      return "Non-function internal exception handler";
    case 7:
      return "Internal exception handler runtime failure";
    case 8:
      return "Uncaught exception";
    case 9:
      return "Invalid argument";
    case 10:
      return "Internal JavaScript runtime failure";
    case 12:
      return "Invalid debug argument";
    case 126:
      return "Command invoked cannot execute";
    case 127:
      return "Command not found";
    case 128:
      return "Invalid exit argument";
    case 129:
      return "Hangup (SIGHUP)";
    case 130:
      return "Script terminated by Control-C (SIGINT)";
    case 131:
      return "Quit (SIGQUIT)";
    case 132:
      return "Illegal instruction (SIGILL)";
    case 133:
      return "Trace/breakpoint trap (SIGTRAP)";
    case 134:
      return "Abort (SIGABRT)";
    case 135:
      return "Bus error (SIGBUS)";
    case 136:
      return "Floating point exception (SIGFPE)";
    case 137:
      return "Process killed (SIGKILL)";
    case 138:
      return "User defined signal 1 (SIGUSR1)";
    case 139:
      return "Segmentation fault (SIGSEGV)";
    case 140:
      return "User defined signal 2 (SIGUSR2)";
    case 141:
      return "Broken pipe (SIGPIPE)";
    case 142:
      return "Alarm clock (SIGALRM)";
    case 143:
      return "Process terminated (SIGTERM)";
    case 144:
      return "Stack fault";
    case 145:
      return "Child process exited or stopped";
    case 146:
      return "Continue if stopped (SIGCONT)";
    case 147:
      return "Stop process (SIGSTOP)";
    case 148:
      return "Terminal stop (SIGTSTP)";
    case 149:
      return "Background read from tty (SIGTTIN)";
    case 150:
      return "Background write to tty (SIGTTOU)";
    case 151:
      return "Urgent condition on socket (SIGURG)";
    case 152:
      return "CPU time limit exceeded (SIGXCPU)";
    case 153:
      return "File size limit exceeded (SIGXFSZ)";
    case 154:
      return "Virtual alarm clock (SIGVTALRM)";
    case 155:
      return "Profiling alarm clock (SIGPROF)";
    case 156:
      return "Window size change (SIGWINCH)";
    case 157:
      return "I/O now possible (SIGIO)";
    case 158:
      return "Power failure (SIGPWR)";
    case 159:
      return "Bad system call (SIGSYS)";
    default:
      if (code > 128 && code < 165) {
        return `Signal ${code - 128} received`;
      }
      return `Unknown exit code ${code}`;
  }
};
