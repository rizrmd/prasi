import { argv } from "utils/argv";
import { g } from "../global";
import { gzipSync } from "bun";
import { pack, unpack } from "msgpackr";
const schema_promise = {
  tables: {} as Record<string, any>,
  columns: {} as Record<string, any>,
  rels: {} as Record<string, any>,
};

export const prasiDB = async (url: string) => {
  const standalone = argv.get("--standalone") ? true : false;
  if (!standalone) {
    const { dburl, mode } = await init(url);

    g.db = new Proxy(
      {},
      {
        get(_, table: string) {
          if (table === "_batch") {
            return {
              update: async (batch: any) => {
                return fetchSendDb(
                  {
                    name,
                    action: "batch_update",
                    table: "",
                    params: { batch },
                  },
                  dburl,
                  mode
                );
              },
              upsert: async (arg: any) => {
                return fetchSendDb(
                  {
                    name,
                    action: "batch_upsert",
                    table: arg.table,
                    params: { arg },
                  },
                  dburl,
                  mode
                );
              },
            };
          }
          if (table === "_schema") {
            return {
              tables: async () => {
                if (!schema_promise.tables[dburl]) {
                  schema_promise.tables[dburl] = fetchSendDb(
                    {
                      name,
                      action: "schema_tables",
                      table: "",
                      params: [],
                    },
                    dburl,
                    mode
                  );
                }

                return await schema_promise.tables[dburl];
              },
              columns: async (table: string) => {
                if (!schema_promise.columns[dburl + "_" + table]) {
                  schema_promise.columns[dburl + "_" + table] = fetchSendDb(
                    {
                      name,
                      action: "schema_columns",
                      table,
                      params: [],
                    },
                    dburl,
                    mode
                  );
                }

                return await schema_promise.columns[dburl + "_" + table];
              },
              rels: async (table: string) => {
                if (!schema_promise.rels[dburl + "_" + table]) {
                  schema_promise.rels[dburl + "_" + table] = fetchSendDb(
                    {
                      name,
                      action: "schema_rels",
                      table,
                      params: [],
                    },
                    dburl,
                    mode
                  );
                }

                return await schema_promise.rels[dburl + "_" + table];
              },
            };
          }

          if (table.startsWith("$")) {
            return (...params: any[]) => {
              const bytes = gzipSync(JSON.stringify(params));

              return fetchSendDb(
                {
                  name,
                  action: "query",
                  table,
                  params: btoa(
                    bytes.reduce(
                      (acc: any, current: any) =>
                        acc + String.fromCharCode(current),
                      ""
                    )
                  ),
                },
                dburl,
                mode
              );
            };
          }

          return new Proxy(
            {},
            {
              get(_, action: string) {
                return async (...params: any[]) => {
                  if (table === "query") {
                    table = action;
                    action = "query";
                  }
                  return await fetchSendDb(
                    {
                      action,
                      table,
                      params,
                    },
                    dburl,
                    mode
                  );
                };
              },
            }
          );
        },
      }
    );
  }
};

export const fetchSendDb = async (
  params: Record<string, any>,
  dburl: string,
  mode: "msgpack" | "json"
) => {
  if (mode === "msgpack") {
    const body = gzipSync(new Uint8Array(pack(params)), {});
    const res = await fetch(dburl, { method: "POST", body });
    return await res.json();
  } else {
    const res = await fetch(dburl, {
      method: "POST",
      body: JSON.stringify(params),
    });
    return await res.json();
  }
};

const init = async (dburl: string) => {
  const base = new URL(dburl);
  base.pathname = `/_dbs`;
  const url = base.toString();
  let mode = "json" as "msgpack" | "json";

  try {
    const check = await (
      await fetch(url + "/check", {
        method: "POST",
        body: JSON.stringify({
          table: "check",
          action: "check",
        }),
      })
    ).json();
    if (check?.mode === "encrypted") {
      mode = "msgpack";
    }
  } catch (e) {
    console.error(e);
  }

  return { dburl: url, mode };
};
