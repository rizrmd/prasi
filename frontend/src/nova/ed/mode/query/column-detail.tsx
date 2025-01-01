import { Asterisk, ChevronDown, ChevronUp, Square, SquareCheckBig } from 'lucide-react';
import { QInspectRelation, QInspectResult } from 'prasi-srv/utils/query/types';
import { FC } from 'react';

import { InputWhere } from './input-where';
import { PQuerySelect, PQuerySelectRel } from './types';

export const ColumnDetail: FC<{
  inspect: QInspectResult;
  select: PQuerySelect["select"];
  table_name: string;
  is_select_open: boolean;
  is_where_open: boolean;
  current_where: PQuerySelect["where"];
  mode_rel?: PQuerySelectRel["mode"];
  onSelectChanged: (new_select: PQuerySelect["select"]) => void;
  onExpandRelation: (relation_name: string) => void;
  onChangeCloseSelect: (is_open: boolean) => void;
  onChangeCloseWhere: (is_open: boolean) => void;
  onChangePQWhere: (new_where: any) => void;
  onChangeModeRel?: (new_mode_rel: PQuerySelectRel["mode"]) => void;
}> = ({
  inspect,
  select = [],
  table_name,
  is_select_open,
  is_where_open,
  current_where = [],
  mode_rel,
  onSelectChanged,
  onExpandRelation,
  onChangeCloseSelect,
  onChangeCloseWhere,
  onChangePQWhere,
  onChangeModeRel,
}) => {
  const table = inspect.tables[table_name];
  const columns = inspect.tables[table_name].columns;

  if (!table) return null;

  const selected_names = select.map((item) => {
    if (item.type === "column") {
      return item.col_name;
    } else {
      return item.rel_name;
    }
  });

  const convert_type_relation = (rel_type: QInspectRelation["type"]) => {
    switch (rel_type) {
      case "many-to-one":
        return "N-1";
      case "one-to-many":
        return "1-N";
      case "one-to-one":
        return "1-1";
      default:
        return rel_type;
    }
  };

  return (
    <div
      key={table.name}
      className="border-l border-r border-b bg-white inline-block items-stretch h-full"
    >
      <div className="flex justify-between items-center border-b px-2 py-[2px] min-w-[300px] bg-gray-100">
        <span className="text-xs font-bold">{table.name}</span>

        {!!mode_rel && (
          <span
            className="border text-xs rounded-sm cursor-pointer px-1 py-[2px] bg-white hover:bg-blue-500 hover:text-white"
            onClick={() => {
              if (typeof onChangeModeRel === "function") {
                let new_mode_rel = mode_rel as PQuerySelectRel["mode"];
                if (mode_rel === "eager") {
                  new_mode_rel = "lazy";
                } else {
                  new_mode_rel = "eager";
                }

                onChangeModeRel(new_mode_rel);
              }
            }}
          >
            mode:{mode_rel}
          </span>
        )}

        <button
          className="border rounded-sm px-1 py-1 bg-white hover:bg-blue-500 hover:text-white"
          onClick={() => {
            onChangeCloseSelect(!is_select_open);
          }}
        >
          <span className="text-xs">
            {is_select_open ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronUp size={12} />
            )}
          </span>
        </button>
      </div>
      {is_select_open && (
        <>
          {Object.entries(table.columns).map(([column_name, column]) => {
            let is_checked = selected_names.includes(column_name);

            // find relation
            const relation_found = Object.entries(table.relations).find(
              ([_, rel]) => rel.from.column === column_name
            );
            const relation = relation_found?.[1];
            const relation_name = relation_found?.[0];

            return (
              <div
                key={column_name}
                className="flex items-center cursor-pointer justify-between border-b px-2 h-[24px] hover:bg-blue-100"
                onClick={() => {
                  let new_select = [...select] as PQuerySelect["select"];

                  if (is_checked) {
                    new_select = new_select.filter((item) => {
                      if (item.type === "column") {
                        if (item.col_name === column_name) {
                          return false;
                        }
                      }

                      return true;
                    });
                  } else {
                    new_select.push({
                      col_name: column_name,
                      type: "column",
                    });
                  }

                  onSelectChanged(new_select);
                }}
              >
                <div className="flex flex-1 items-center">
                  <span className="mr-1">
                    {is_checked ? (
                      <SquareCheckBig size={12} />
                    ) : (
                      <Square size={12} />
                    )}
                  </span>
                  <span className="text-xs">{column_name}</span>
                  <span className="ml-1 text-sm font-bold text-red-400">
                    {column.nullable ? null : <Asterisk size={11} />}
                  </span>
                  {column.is_pk
                    ? null
                    : relation && (
                        <span className="ml-1 text-xs text-blue-400">
                          {relation_name}
                        </span>
                      )}
                </div>
                <div className="flex">
                  {column.is_pk && (
                    <span className="mr-1 text-blue-600 text-xs">🔑</span>
                  )}
                  <span className="text-xs text-gray-500">{column.type}</span>
                </div>
              </div>
            );
          })}

          {Object.keys(table.relations).length > 0 && (
            <div>
              {Object.entries(table.relations).map(
                ([relation_name, relation_inspect]) => {
                  const is_checked = selected_names.includes(relation_name);

                  return (
                    <div
                      key={relation_name}
                      className="w-full border-b h-[24px] flex items-center px-2 cursor-pointer text-left hover:bg-blue-100"
                      onClick={() => {
                        onExpandRelation(relation_name);
                      }}
                    >
                      <span className="mr-1">
                        {is_checked ? (
                          <SquareCheckBig size={12} />
                        ) : (
                          <Square size={12} />
                        )}
                      </span>
                      <span className="text-xs flex-1">{relation_name}</span>
                      <span className="text-xs text-gray-500">
                        {convert_type_relation(relation_inspect.type)}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </>
      )}

      <InputWhere
        columns={columns}
        value={current_where as PQuerySelect["where"]}
        is_open={is_where_open}
        onChangeWhere={onChangePQWhere}
        onChangeCloseWhere={onChangeCloseWhere}
      />
    </div>
  );
};
