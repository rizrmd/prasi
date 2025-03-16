import { $ } from "bun";
import type { site } from "db/use";
import { dir } from "utils/dir";

export const loadGitRepo = async (site: site, loading: { status: string }) => {
  const prefix = `data:code/${site.id}/site/src`;
  if (!dir.exists(`${prefix}`)) {
    loading.status = "Cloning git repo";
    await $`git clone ${site.git_repo} ${dir.path(`${prefix}`)}`.quiet();
  }
  if (!dir.exists(`${prefix}/node_modules`)) {
    loading.status = "Installing dependencies";
    try {
      await $`bun i`.cwd(dir.path(`${prefix}`)).quiet();
      await $`bun pm trust --all`.cwd(dir.path(`${prefix}`)).quiet();
    } catch (e) {
      loading.status = `Error installing dependencies: ${e}`;
    }
  }

  if (dir.exists(`${prefix}/lib`) && dir.list(`${prefix}/lib`).length === 0) {
    loading.status = "Cloning lib";
    await $`git clone https://github.com/avolut/prasi-lib ${dir.path(
      `${prefix}/lib`
    )} --depth=2`
      .cwd(dir.path(`${prefix}`))
      .quiet();
  }
};
