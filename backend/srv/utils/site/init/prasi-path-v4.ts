import { fs } from "utils/files/fs";

export const prasiPathV4 = (site_id: string) => ({
  index: "index.tsx",
  internal: "internal.tsx",
  server: "server.ts",
  typings: "typings/generated.d.ts",
  dir: {
    nova: fs.path(`data:nova-static`),
    site: fs.path(`code:${site_id}/site`),
    frontend: fs.path(`code:${site_id}/site/build/frontend`),
    backend: fs.path(`code:${site_id}/site/build/backend`),
    upload: fs.path(`code:${site_id}/site/upload`),
    public: fs.path(`code:${site_id}/site/src/public`),
  },
});
