import { argv } from "utils/argv";
import { dir } from "utils/dir";
import { prasiUrls } from "./prasi/urls";

export const staticInfo = (site_id: string) => {
  const standalone = argv.get("--standalone") ? true : false;

  const urls = prasiUrls(site_id);
  return {
    js_base: dir.path(`data:frontend/base`),
    js_site: dir.path(`data:code/${site_id}/site/dist/frontend`),
    public_file: dir.path(`data:code/${site_id}/site/src/public`),
    compression: {
      enabled: false,
    },
    index_html: (req: Request) => {
      return `\
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <link rel="icon" href="/prod/${site_id}/favicon.ico" type="image/x-icon" />
        <link rel="stylesheet" href="/js/base/main.css" />
      </head>
      <body>
        <script type="module" src="/js/base/index.js"></script>
        <script type="module">
          initSite(${JSON.stringify({ site_id, urls })});
        </script>
      </body>
    </html>
    `;
    },
  };
};
