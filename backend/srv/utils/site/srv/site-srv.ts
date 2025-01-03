import { $ } from "bun";
import { dirAsync } from "fs-jetpack";
import { fs } from "utils/files/fs";
import { watch } from "fs";
export const site_srv = {
  async init() {
    const cwd = fs.path("data:site-srv/main");
    await dirAsync(fs.path("data:site-srv"));

    if (!fs.exists("data:site-srv/main")) {
      await $`git clone https://github.com/rizrmd/prasi-srv main --depth=1`
        .cwd(fs.path("data:site-srv"))
        .quiet()
        .nothrow();
    } else {
      // await $`git reset --hard`.cwd(cwd).quiet().nothrow();
      // await $`git pull`.cwd(cwd).quiet().nothrow();
    }

    if (!fs.exists("data:site-srv/main")) {
      console.error(
        "ERROR: git command not found, please install git and try again."
      );
      process.exit(1);
    } else {
      await $`bun i`.cwd(cwd).quiet().nothrow();
    }

    watch(fs.path("data:site-srv/main/internal/vm/init.js"), (e) => {
      for (const [k, site] of Object.entries(g.site.loaded)) {
        site.vm.reload_immediately();
      }
    });
  },
};
