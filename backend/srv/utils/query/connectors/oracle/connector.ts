import OracleDB from "oracledb";

import { inspect } from "./inspect";
import { buildSql } from "./build-sql";
import { oracleConfig } from "./utils/config";

import type { QConnector, QConnectorParams } from "utils/query/types";
import { queryEager } from "./query-eager";
export type QOracleConnector = Awaited<ReturnType<typeof connectOracle>>;

export const connectOracle = async (conn: QConnectorParams) => {
  const config = oracleConfig(conn);
  config.conn = await OracleDB.getConnection(config.conn_params);

  const connector: QConnector = {
    async inspect() {
      return await inspect(config);
    },
    async destroy() {
      config.conn?.close();
    },
    async buildSql(i, pq) {
      return await buildSql(i, pq);
    },
    async queryEager(sql) {
      return await queryEager(config, sql)
    }
  };
  connector.inspected = await connector.inspect();

  return connector;
};