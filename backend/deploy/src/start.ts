import { join } from "node:path";
import { staticFile } from "utils/server/static";
import { argv } from "utils/src/argv";
import { g } from "./global";
import { site } from "./site";
import { staticInfo } from "./static";
import { prasiDB } from "./prasi/db-remote";
import chalk from "chalk";
import { proxy } from "./prasi/proxy";

const main = async () => {
  const port = argv.get("--port");
  const site_id = argv.get("--id");
  const site_url = argv.get("--url");

  if (!port) {
    console.error("Failed to get port");
    process.exit(1);
  }

  if (!site_id || !site_url) {
    console.error("Failed to get site_id or site_url");
    process.exit(1);
  }

  site.id = site_id;
  site.url = site_url;
  const sinfo = staticInfo(site_id, site_url);
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

  try {
    await prasiDB(site.url);

    g.backend = await import(join(sinfo.backend, "server.js"));
    if (g.backend?.server?.init) {
      await g.backend.server.init();
    }
  } catch (e) {
    console.error(e);
  }

  const http = g.backend?.server?.http.bind(g.backend.server);
  g.server = Bun.serve({
    port,
    routes: {
      "/_proxy/*": proxy,
    },
    async fetch(req) {
      const handle = async function (req: Request, opt?: any) {
        const static_public = staticPublic.serve(req);
        if (static_public.status !== 404) return static_public;

        const static_site = staticSite.serve(req);
        if (static_site.status !== 404) return static_site;

        return staticBase.serve(req);
      };

      if (!http) return handle(req);

      const url = new URL(req.url);
      return await http({
        url: { raw: url, pathname: url.pathname },
        req,
        server: g.server,
        mode: "dev",
        handle,
        index: { head: [], body: [], render: () => "" },
        prasi: {},
      });
    },
  });

  console.log(`🚀 Started ${chalk.green(site.id)} ~> http://localhost:${port}`);

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    process.exit(0);
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
