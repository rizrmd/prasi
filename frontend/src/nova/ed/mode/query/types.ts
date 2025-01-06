export type TABLE_NAME = string;
type QUERY_NAME = string;
type COL_NAME = string;
type REL_NAME = string;
type WHERE_OPERATOR = string;
export type ORDER_BY = "asc" | "desc";
export type JOIN_MODE = "lazy" | "eager";

type PQuery = {
  name: QUERY_NAME;
  source: string;
  wizard: PQuerySelect | PQueryInsert;
};

export type PQuerySelect = {
  action: "select";
  table: TABLE_NAME;
  select: (PQuerySelectCol | PQuerySelectRel)[];
  where: PQuerySelectWhere;
  order_by?: Record<COL_NAME, ORDER_BY>;
};

export type PQuerySelectCol = {
  col_name: COL_NAME;
  type: "column";
  as?: string;
};

export type PQuerySelectRel = {
  rel_name: REL_NAME;
  type: "relation";
  mode?: JOIN_MODE; // default: "lazy"
  as?: string;
} & Partial<Omit<PQuerySelect, "table" | "action">>;

export type PQuerySelectWhere = (
  | PQuerySelectWhereSingle
  | "and"
  | "or"
  | "not"
)[];
// | PQuerySelectWhere // g perlu rekursi dulu

export type PQuerySelectWhereSingle = {
  column: COL_NAME;
  operator: WHERE_OPERATOR;
  value?: any;
};

const a: PQuerySelect = {
  action: "select",
  table: "user",
  select: [
    {
      col_name: "username",
      type: "column",
    },
    {
      rel_name: "m_role",
      type: "relation",
      select: [
        {
          col_name: "role_name",
          type: "column",
        },
        {
          rel_name: "role_relation",
          type: "relation",
          select: [
            {
              col_name: "role_name",
              type: "column",
            },
            {
              rel_name: "m_client_relation",
              type: "relation",
              select: [
                {
                  col_name: "client_name",
                  type: "column",
                },
              ],
            },
          ],
          where: [{ column: "name", operator: "=", value: "admin" }],
        },
      ],
      where: [{ column: "name", operator: "=", value: "admin" }],
    },
  ],
  where: [
    {
      column: "status",
      operator: "=",
      value: "active",
    },
  ],
};

type PQueryInsert = {
  action: "select";
  table: TABLE_NAME;
};
