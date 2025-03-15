import { readFileSync } from "node:fs";
import { dir } from "utils/dir";
import { staticFile } from "utils/server/static";
import { argv } from "utils/src/argv";

const main = async () => {
  const port = argv.get("--port");
  const site_id = argv.get("--id");
  const standalone = argv.get("--standalone") ? true : false;

  if (!port) {
    console.error("Failed to get port");
    process.exit(1);
  }

  const basePath = dir.path(`data:code/${site_id}/site/dist/frontend`);
  const base = `/prod/${site_id}`;
  const st = staticFile({
    basePath,
    indexHtml: (req: Request) => {
      return `\
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body><script src="${base}/index.js"></script></body></html>`;
    },
  });

  Bun.serve({
    port,
    fetch(req) {
      return st.serve(req);
    },
  });

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    process.exit(0);
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
