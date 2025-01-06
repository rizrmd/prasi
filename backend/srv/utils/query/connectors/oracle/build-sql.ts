import type { PQuerySelect } from "prasi-frontend/src/nova/ed/mode/query/types";
import type { QInspectResult } from "utils/query/types";
import { getColumns } from "./utils/get-columns";
import { getJoins } from "./utils/get-joins";
import { getWheres } from "./utils/get-wheres";
import { getOrdersBy } from "./utils/get-orders-by";

export const buildSql = async (
  inspected_scheme: QInspectResult,
  pq: PQuerySelect
): Promise<string> => {
  const { action, select, table, where, order_by } = pq;

  const columns_arr = getColumns(inspected_scheme, table, select);
  const joins_arr = getJoins(inspected_scheme, table, select);
  const wheres_arr = getWheres(table, select, where);
  const orders_by_arr = getOrdersBy(table, select, order_by);

  return `
    ${action.toUpperCase()} 
    ${columns_arr.map((col) => col).join(", ")}
    FROM ${table.toUpperCase()}
    ${joins_arr.map((join) => join).join(" ")}
    WHERE ${wheres_arr.map((where) => where).join(" AND ")}
    ORDER BY ${orders_by_arr.map((order) => order).join(", ")}
  `;
};
