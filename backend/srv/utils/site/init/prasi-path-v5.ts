import { fs } from "utils/files/fs";

export const prasiPathV5 = (site_id: string) => ({
  index: "frontend/index.tsx",
  internal: "frontend/internal.tsx",
  server: "backend/server.ts",
  typings: "system/typings/generated.d.ts",
  dir: {
    nova: fs.path(`data:nova-static`),
    site: fs.path(`code:${site_id}/site`),
    build: fs.path(`code:${site_id}/site/build`),
    upload: fs.path(`code:${site_id}/site/upload`),
    public: fs.path(`code:${site_id}/site/src/frontend/public`),
  },
});
