import { readFileSync } from "node:fs";
import { dir } from "utils/dir";
import { staticFile } from "utils/server/static";
import { argv } from "utils/src/argv";
import { staticInfo } from "./static";
import { routePrasiPage } from "./prasi/pages";
import { site } from "./site";
import { routePrasiLayout } from "./prasi/layout";

const main = async () => {
  const port = argv.get("--port");
  const site_id = argv.get("--id");

  if (!port) {
    console.error("Failed to get port");
    process.exit(1);
  }

  if (!site_id) {
    console.error("Failed to get site_id");
    process.exit(1);
  }

  site.id = site_id;

  const sinfo = staticInfo(site_id);
  const staticBase = staticFile({
    baseDir: sinfo.js_base,
    indexHtml: sinfo.index_html,
    compression: sinfo.compression,
  });
  const staticSite = staticFile({
    baseDir: sinfo.js_site,
    compression: sinfo.compression,
  });
  const staticPublic = staticFile({
    baseDir: sinfo.public_file,
    compression: sinfo.compression,
  });

  Bun.serve({
    port,
    routes: {
      "/_prasi/pages": routePrasiPage,
      "/_prasi/layout": routePrasiLayout,
    },
    fetch(req) {
      const static_public = staticPublic.serve(req);
      if (static_public.status !== 404) return static_public;

      const static_site = staticSite.serve(req);
      if (static_site.status !== 404) return static_site;

      return staticBase.serve(req);
    },
  });

  console.log(`Site ${site.id} ~> http://localhost:${port}`);

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    process.exit(0);
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
