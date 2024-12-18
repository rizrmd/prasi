import type {
  PQuerySelect,
  PQuerySelectCol,
  PQuerySelectRel,
  PQuerySelectWhere,
} from "prasi-frontend/src/nova/ed/mode/query/types";
import type { NAME } from "utils/query/types";

export const getWheres = (
  table: NAME,
  select: (PQuerySelectCol | PQuerySelectRel)[],
  where: PQuerySelect["where"]
): string[] => {
  const result = [] as string[];

  for (const w of where) {
    const where_name = whereName(table, w);
    result.push(where_name);
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

const whereName = (table: NAME, where: PQuerySelectWhere) => {
  const db_table = table.toUpperCase();
  const w_col = where.column.toUpperCase();
  const w_opt = where.operator;
  const w_val = where.value;

  let name: string = "";
  switch (typeof w_val) {
    case "string":
      switch (w_opt) {
        case "LIKE":
        case "ILIKE":
          name = `${db_table}.${w_col} ${w_opt} '%${w_val}%'`;
          break;
        default:
          name = `${db_table}.${w_col} ${w_opt} '${w_val}'`;
          break;
      }
      break;
    case "number":
      name = `${db_table}.${w_col} ${w_opt} ${w_val}`;
      break;
  }

  return name;
};