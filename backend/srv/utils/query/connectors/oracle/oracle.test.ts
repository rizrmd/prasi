import { test, expect, describe } from "bun:test";
import { connectOracle, type QOracleConnector } from "./connector";
import type { QInspectResult } from "utils/query/types";

describe("oracle connector", () => {
  let conn = null as null | QOracleConnector;
  let inspect = undefined as undefined | QInspectResult;

  test("create instance oracleConnector", async () => {
    conn = await connectOracle({
      type: "oracle",
      url: "oracle://SYSTEM:Password123@prasi.avolut.com:1521/XEPDB1?schema=PRASI",
    });
  });

  test("inspect db", async () => {
    inspect = await conn?.inspect();
    if (inspect) {
      console.log(inspect);
    }
  });

  test("query with 2 level relationships", async () => {
    if (inspect) {
      const output = await conn?.buildSql(inspect, {
        action: "select",
        table: "user_table",
        select: [
          {
            col_name: "username",
            type: "column",
          },
          {
            type: "relation",
            rel_name: "role_table1",
            select: [
              {
                col_name: "description",
                type: "column",
              },
            ],
          },
          {
            type: "relation",
            rel_name: "comment_table",
            select: [
              {
                col_name: "comment_text",
                type: "column",
              },
            ],
          },
        ],
        where: [
          {
            column: "status",
            operator: "=",
            value: "active",
          },
        ],
      });
      expect(output).toEqual({
        columns_arr: [
          "USER_TABLE.USERNAME",
          "ROLE_TABLE1.DESCRIPTION",
          "COMMENT_TABLE.COMMENT_TEXT",
        ],
        joins_arr: [
          "JOIN ROLE_TABLE ROLE_TABLE1 ON USER_TABLE.ROLE_ID1 = ROLE_TABLE1.ROLE_ID",
          "JOIN COMMENT_TABLE COMMENT_TABLE ON USER_TABLE.USER_ID = COMMENT_TABLE.USER_ID",
        ],
      });
    }
  });

  test("query with 2 relation & 1 recursive relation", async () => {
    if (inspect) {
      const output = await conn?.buildSql(inspect, {
        action: "select",
        table: "user_table",
        select: [
          {
            col_name: "username",
            type: "column",
          },
          {
            type: "relation",
            rel_name: "role_table1",
            select: [
              {
                col_name: "description",
                type: "column",
              },
            ],
          },
          {
            type: "relation",
            rel_name: "comment_table",
            select: [
              {
                col_name: "comment_text",
                type: "column",
              },
              {
                type: "relation",
                rel_name: "photo",
                select: [
                  {
                    col_name: "photo_url",
                    type: "column",
                  },
                  {
                    col_name: "description",
                    type: "column",
                  },
                ],
                where: [
                  {
                    column: "photo_url",
                    operator: "ILIKE",
                    value: "picture.jpg",
                  },
                ],
              },
            ],
            where: [
              {
                column: "comment_text",
                operator: "LIKE",
                value: "good",
              },
            ],
            order_by: {
              comment_id: "asc",
            },
          },
        ],
        where: [
          {
            column: "user_id",
            operator: "=",
            value: 10,
          },
          {
            column: "username",
            operator: "=",
            value: "haped",
          },
        ],
        order_by: {
          user_id: "asc",
        },
      });
      expect(output).toEqual({
        columns_arr: [
          "USER_TABLE.USERNAME",
          "ROLE_TABLE1.DESCRIPTION",
          "COMMENT_TABLE.COMMENT_TEXT",
          "PHOTO.PHOTO_URL",
          "PHOTO.DESCRIPTION",
        ],
        joins_arr: [
          "JOIN ROLE_TABLE ROLE_TABLE1 ON USER_TABLE.ROLE_ID1 = ROLE_TABLE1.ROLE_ID",
          "JOIN COMMENT_TABLE COMMENT_TABLE ON USER_TABLE.USER_ID = COMMENT_TABLE.USER_ID",
          "JOIN PHOTO PHOTO ON COMMENT_TABLE.PHOTO_ID = PHOTO.PHOTO_ID",
        ],
        wheres_arr: [
          "USER_TABLE.USER_ID = 10",
          "USER_TABLE.USERNAME = 'haped'",
          "COMMENT_TABLE.COMMENT_TEXT LIKE '%good%'",
          "PHOTO.PHOTO_URL ILIKE '%picture.jpg%'",
        ],
        orders_by_arr: [
          "USER_TABLE.USER_ID ASC",
          "COMMENT_TABLE.COMMENT_ID ASC",
        ],
      });
    }
  });

  test("queries on tables that have more than 1FK on the same destination table", async () => {
    if (inspect) {
      const output = await conn?.buildSql(inspect, {
        action: "select",
        table: "user_table",
        select: [
          {
            col_name: "email",
            type: "column",
          },
          {
            type: "relation",
            rel_name: "role_table1",
            select: [
              {
                col_name: "description",
                type: "column",
              },
            ],
          },
          {
            type: "relation",
            rel_name: "role_table2",
            select: [
              {
                col_name: "description",
                type: "column",
              },
            ],
          },
        ],
        where: [
          {
            column: "status",
            operator: "=",
            value: "active",
          },
        ],
      });
      expect(output).toEqual({
        columns_arr: [
          "USER_TABLE.EMAIL",
          "ROLE_TABLE1.DESCRIPTION",
          "ROLE_TABLE2.DESCRIPTION",
        ],
        joins_arr: [
          "JOIN ROLE_TABLE ROLE_TABLE1 ON USER_TABLE.ROLE_ID1 = ROLE_TABLE1.ROLE_ID",
          "JOIN ROLE_TABLE ROLE_TABLE2 ON USER_TABLE.ROLE_ID2 = ROLE_TABLE2.ROLE_ID",
        ],
      });
    }
  });
});
