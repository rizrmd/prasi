import { modifyQueryParamsToMatchModel, storeModelResult } from "./db-model";

export type TABLE_NAME = string;
export type ID = string;
export type ROW = Record<string, any>;

export type Model = {
  cache: Record<TABLE_NAME, Record<ID, ROW>>;
};

export const dbProxy = ({
  fetch,
  model,
  gzip,
}: {
  gzip: (data: any) => Uint8Array;
  model?: Model;
  fetch: (arg: {
    pathname: string;
    method: "GET" | "POST";
    body?: any;
    mode?: "msgpack" | "json";
  }) => Promise<any>;
}) => {
  const config = {
    status: "init" as "init" | "loading" | "ready",
    mode: "json" as "msgpack" | "json",
  };

  const check = async () => {
    if (config.status === "init") {
      config.status = "loading";
      try {
        const res = await fetch({ pathname: "/_dbs/check", method: "GET" });
        if (res.mode === "encrypted") {
          config.mode = "msgpack";
        }
      } catch (e) {
        config.mode = "json";
      }
      config.status = "ready";
    } else if (config.status === "loading") {
      await new Promise<void>((done) => {
        const ival = setInterval(() => {
          if (config.status === "ready") {
            clearInterval(ival);
            done();
          }
        }, 300);
      });
    }
  };

  return new Proxy(
    {},
    {
      get(_, table: string) {
        if (table === "_batch") {
          return {
            update: async (batch: any) => {
              await check();
              return await fetch({
                pathname: `/_dbs/${table}.update`,
                mode: config.mode,
                method: "POST",
                body: {
                  action: "batch_update",
                  table: "",
                  params: { batch },
                },
              });
            },
            upsert: async (arg: any) => {
              await check();
              return await fetch({
                pathname: `/_dbs/${table}.update`,
                mode: config.mode,
                method: "POST",
                body: {
                  action: "batch_upsert",
                  table: arg.table,
                  params: { arg },
                },
              });
            },
          };
        }
        if (table === "_schema") {
          return {
            tables: async () => {
              await check();
              return await fetch({
                pathname: `/_dbs/${table}.schema`,
                mode: config.mode,
                method: "POST",
                body: {
                  action: "schema_tables",
                  table,
                  params: [],
                },
              });
            },
            columns: async (table: string) => {
              await check();
              return await fetch({
                pathname: `/_dbs/${table}.columns`,
                mode: config.mode,
                method: "POST",
                body: {
                  action: "schema_columns",
                  table,
                  params: [],
                },
              });
            },
            rels: async (table: string) => {
              await check();
              return await fetch({
                pathname: `/_dbs/${table}.rels`,
                mode: config.mode,
                method: "POST",
                body: {
                  action: "schema_rels",
                  table,
                  params: [],
                },
              });
            },
          };
        }
        if (table.startsWith("$")) {
          return async (...params: any[]) => {
            const bytes = gzip(JSON.stringify(params));
            await check();
            return await fetch({
              pathname: `/_dbs/${table}.query`,
              mode: config.mode,
              method: "POST",
              body: {
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
            });
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
                await check();

                let finalParams = params;
                if (model) {
                  finalParams = modifyQueryParamsToMatchModel({
                    action,
                    table,
                    params,
                  });
                }

                const result = await fetch({
                  pathname: `/_dbs/${table}.${action}`,
                  mode: config.mode,
                  method: "POST",
                  body: {
                    action,
                    table,
                    params: finalParams,
                  },
                });

                if (model) {
                  storeModelResult({
                    action,
                    table,
                    params: finalParams,
                    result,
                  });
                }

                return result;
              };
            },
          }
        );
      },
    }
  );
};
