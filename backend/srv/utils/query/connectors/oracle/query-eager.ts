import type { OracleConfig } from "./utils/config";

export const queryEager = async (c: OracleConfig, sql: string) => {
  let schema = c.schema;

  if (!schema) {
    throw new Error("Schema is not defined in OracleConfig");
  }

  const [_, query] = await Promise.all([
    c.conn?.execute<string>(`ALTER SESSION SET CURRENT_SCHEMA = ${schema}`),
    c.conn?.execute(sql),
  ]);

  return query?.rows;
};
