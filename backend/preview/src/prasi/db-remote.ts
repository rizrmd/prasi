import { argv } from "utils/argv";
import { g } from "../global";
import { gzipSync } from "bun";
import { pack, unpack } from "msgpackr";
import { dbProxy } from "utils/db-proxy";
const schema_promise = {
  tables: {} as Record<string, any>,
  columns: {} as Record<string, any>,
  rels: {} as Record<string, any>,
};

export const prasiDB = async (url: string) => {
  const standalone = argv.get("--standalone") ? true : false;
  if (!standalone) {
    g.db = dbProxy({
      gzip: gzipSync,
      fetch: async ({ method, pathname, body, mode }) => {
        const target = new URL(url);
        target.pathname = pathname;
        if (mode === "msgpack") {
          const res = await fetch(target, {
            method: "POST",
            body: gzipSync(pack(body)),
          });
          const result = await res.json();
          return result;
        } else {
          const res = await fetch(target, {
            method,
            body,
          });
          return await res.json();
        }
      },
    });
  } else {
  }
};
