import { removeAsync } from "fs-jetpack";
import { copyFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "path";
import { PRASI_CORE_SITE_ID, waitUntil } from "prasi-utils";
import { addRoute, createRouter, findRoute } from "rou3";
import sync from "sync-directory";
import { c } from "utils/color";
import { editor } from "utils/editor";
import { fs } from "utils/files/fs";
import type { PrasiSite, PrasiVMInitArg } from "utils/global";
import { debounce } from "utils/server/debounce";
import { crdt_comps, crdt_pages } from "../../../ws/crdt/shared";
import { newSiteGlobalContext } from "./site-global-ctx";
import { newPrasiIpcArg } from "./prasi-ipc-arg";
import { basename } from "node:path";
import { newPrasiIpcContent } from "./prasi-ipc-content";
import { siteLoadingMessage } from "./loading-msg";
import { spawn } from "utils/spawn";

export const siteLoaded = async (
  site_id: string,
  prasi: PrasiSite["prasi"]
) => {
  if (!g.site.loading[site_id]) {
    await waitUntil(() => g.site.loading[site_id]);
  }

  if (site_id === PRASI_CORE_SITE_ID) {
    waitUntil(() => fs.exists(`code:${site_id}/site/build/frontend`), {
      interval: 300,
    }).then(async () => {
      await removeAsync(fs.path(`root:backend/srv/psc`));
      sync(
        fs.path(`code:${site_id}/site/build/frontend`),
        fs.path(`root:backend/srv/psc`),
        {
          watch: true,
          type: "copy",
          supportSymlink: false,
        }
      );
    });
  }

  const loading = g.site.loading[site_id];

  const raw_pages = await _db.page.findMany({
    where: { is_deleted: false, id_site: site_id },
    select: { id: true, url: true, name: true },
  });
  const pages = [] as typeof raw_pages;
  const layout = { id: "", root: undefined as any };
  for (const page of raw_pages) {
    if (page.name.startsWith("layout:")) {
      if (!layout.id) {
        layout.id = page.id;
        const found = await _db.page.findFirst({
          where: { id: page.id },
          select: { content_tree: true },
        });
        if (found) {
          layout.root = found.content_tree;
        }
      }
    } else {
      pages.push(page);
    }
  }

  const router = createRouter<{ page_id: string }>();
  for (const page of pages) {
    addRoute(router, undefined, page.url, { page_id: page.id });
  }

  let server_dir = fs.path(`code:${site_id}/site/build/backend`);

  g.site.loaded[site_id] = {
    build: loading.process,
    data: loading.data!,
    config: {},
    id: site_id,
    router_base: {
      urls: pages,
      layout,
    },
    last_msg: "Initializing",
    router,
    spawn: {
      reload: debounce(async () => {
        await g.site.loaded[site_id].spawn.reload_immediately();
      }, 100),
      async reload_immediately(mode?: "init") {
        const site = g.site.loaded[site_id];

        if (mode === "init") {
          delete site.spawn.handler;
          await removeAsync(join(server_dir, "app"));
          await siteLoadingMessage(site_id, "Initializing IPC...");
        }
 
        try {
          site.content = newPrasiIpcContent({ site_id, site });

          if (site.spawn.ipc && !site.spawn.ipc.process.killed) {
            site.spawn.ipc.process.kill();
            await site.spawn.ipc.exited;
          }

          if (existsSync(server_dir)) {
            const dirs = readdirSync(fs.path(`data:site-srv/main/internal/vm`));
            for (const file of dirs) {
              if (existsSync(join(server_dir, file))) {
                unlinkSync(join(server_dir, file));
              }

              copyFileSync(
                fs.path(`data:site-srv/main/internal/vm/${file}`),
                join(server_dir, file)
              );
            }
          }

          let action: PrasiVMInitArg["action"] =
            mode === "init" ? "init" : "start";

          site.spawn.ipc = spawn({
            cmd: "bun run ipc.ts",
            cwd: server_dir,
            ipc(message, subprocess) {},
            async onMessage(arg) {
              process.stdout.write(arg.raw);
              await siteLoadingMessage(site_id, arg.text);
            },
            restart_on_exit: action !== "init",
          });
 
          const settings = site.data.settings;
          site.spawn.ipc.process.send(
            newPrasiIpcArg({
              action,
              settings,
              prasi,
              site_id, 
            })
          );

          if (action === "init") {
            await site.spawn.ipc.process.exited;
            site.spawn.handler = {
              async http(req) {
                return new Response("hello");
              },
            };
          }
        } catch (e) {
          console.log(
            `${c.magenta}[SITE]${c.esc} ${site_id} Initialization Error.`
          );
          console.error(e);
        }
      },
    },
    process: {
      vsc_vars: {},
      log: {
        build_frontend: "",
        build_typings: "",
        build_backend: "",
        build_tailwind: "",
        run_server: "",
      },
      is_ready: { frontend: false, typings: false },
    },
    prasi,
  };
  await g.site.loaded[site_id].spawn.reload_immediately("init");
  delete g.site.loading[site_id];
  editor.broadcast(
    { site_id },
    { action: "site-ready", site: g.site.loaded[site_id].data }
  );
};
