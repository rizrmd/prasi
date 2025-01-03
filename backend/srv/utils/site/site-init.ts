import { editor } from "utils/editor";
import { fs } from "utils/files/fs";
import { validate } from "uuid";
import { siteLoadingData } from "./init/load-data";
import { siteLoadingMessage } from "./init/loading-msg";
import { detectPrasi } from "./init/prasi-detect";
import { siteRun } from "./init/site-run";
import { dirAsync } from "fs-jetpack";
import { $ } from "bun";

export const siteInit = async (site_id: string, conn_id?: string) => {
  if (!validate(site_id)) {
    console.log(`Warning, opening invalid site_id: ${site_id}`);
    return;
  }

  if (!g.site.loaded[site_id]) {
    let loading = g.site.loading[site_id];
    if (!loading) {
      g.site.loading[site_id] = {
        status: "",
        process: {},
      };

      loading = g.site.loading[site_id];
      siteLoadingMessage(site_id, "Site Initializing...");

      await siteLoadingData(site_id, loading);

      if (loading.data?.git_repo) {
        siteLoadingMessage(site_id, "Pulling Git: " + loading.data.git_repo);

        if (!fs.exists(`code:${site_id}/site/src`)) {
          const cwd = fs.path(`code:${site_id}/site/src`);
          await dirAsync(cwd);
          await $`git clone ${loading.data.git_repo} .`.cwd(cwd).quiet();
          await $`git submodule update --init --recursive`.cwd(cwd).quiet();
        }
      } else {
        siteLoadingMessage(site_id, "Loading files...");
        if (!fs.exists(`code:${site_id}/site/src`)) {
          await fs.copy(
            `root:backend/template/site`,
            `code:${site_id}/site/src`
          );
        }
      }

      await detectPrasi(site_id);

      await siteRun(site_id, loading);
    } else if (conn_id) {
      editor.send(conn_id, { action: "site-loading", status: loading.status });
      if (loading.process.build_frontend) {
        editor.send(conn_id, {
          action: "site-build-log",
          log: loading.process.build_frontend.log?.text || "",
        });
      }
    }
  } else if (conn_id) {
    const site = g.site.loaded[site_id];

    editor.send(conn_id, {
      action: "site-ready",
      site: site.data,
    });
  }
};
