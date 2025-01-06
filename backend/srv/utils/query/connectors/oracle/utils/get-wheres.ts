import type {
  PQuerySelect,
  PQuerySelectCol,
  PQuerySelectRel,
  PQuerySelectWhereSingle,
} from "prasi-frontend/src/nova/ed/mode/query/types";
import type { NAME } from "utils/query/types";

export const getWheres = (
  table: NAME,
  select: (PQuerySelectCol | PQuerySelectRel)[],
  where: PQuerySelect["where"]
): string[] => {
  const result = [] as string[];

  let where_name = "" as string;
  if (where && where.length) {
    for (let i = 0; i < where.length; i++) {
      const w = where[i];
      if (typeof w === "object") {
        where_name += (i === 0 ? "" : " ") + whereName(table, w);
      } else if (typeof w === "string") {
        where_name += (i === 0 ? "" : " ") + w.toUpperCase();
      }
    }
    result.push(`(${where_name})`);
  }

  for (const c of select) {
    if (c.type === "relation") {
      // Recursive call to process nested relations
      if (c.select) {
        result.push(...getWheres(c.rel_name, c.select, c.where || []));
      }
    }
  }

  return result;
};

const whereName = (table: NAME, where: PQuerySelectWhereSingle) => {
  const db_table = table.toUpperCase();
  const w_col = where.column.toUpperCase();
  const w_opt = where.operator.toUpperCase();
  const w_val = where.value;

  let name: string = "";
  switch (w_opt) {
    case "LIKE":
    case "ILIKE":
      name = `${db_table}.${w_col} ${w_opt} '%${w_val}%'`;
      break;
    case "IN":
      name = `${db_table}.${w_col} ${w_opt} (${w_val.map((item: string | number) => quoteValue(item)).join(", ")})`;
      break;
    case "BETWEEN":
      // DO NOT KNOW DISPLAY & OUTPUT FROM FRONT (HANDLE IF FRONT READY)
      name = ``;
      break;
    default:
      name = `${db_table}.${w_col} ${w_opt} ${quoteValue(w_val)}`;
      break;
  }
  return name;
};

const quoteValue = (val: string | number): string | number => {
  switch (typeof val) {
    case "string":
      return `'${val}'`;
    case "number":
      return val;
  }
};
