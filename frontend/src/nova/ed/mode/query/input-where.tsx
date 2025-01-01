import { ChevronDown, ChevronUp, CircleAlert, Plus, Trash } from "lucide-react";
import { QInspectColumn } from "prasi-srv/utils/query/types";
import { FC } from "react";

import { PQuerySelect, PQuerySelectWhereSingle } from "./types";

const InputWhereSingle: FC<{
  columns: Record<string, QInspectColumn>;
  value: PQuerySelectWhereSingle;
  onChange: (value: PQuerySelectWhereSingle) => void;
  onDelete: () => void;
}> = ({ columns, value, onChange, onDelete }) => {
  const column_options = Object.keys(columns).map((col) => ({
    label: col,
    value: col,
  }));

  return (
    <div className="w-full flex items-center justify-between">
      <div className="flex space-x-2 flex-1">
        <select
          className="border rounded-sm text-xs px-2 w-24 flex-1"
          value={value.column}
          onChange={(e) => onChange({ ...value, column: e.target.value })}
        >
          {column_options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          className="border rounded-sm text-xs px-2 w-12 flex-1"
          placeholder="Operator"
          value={value.operator}
          onChange={(e) => onChange({ ...value, operator: e.target.value })}
        />

        <input
          className="border rounded-sm text-xs px-2 w-24 flex-1"
          placeholder="Value"
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
        />
      </div>

      <div className="space-x-2 mx-2">
        <button className=" text-red-500 hover:text-red-700" onClick={onDelete}>
          <span>
            <Trash size={12} />
          </span>
        </button>
      </div>
    </div>
  );
};

const InputWhereGroup: FC<{
  columns: Record<string, QInspectColumn>;
  value: PQuerySelect["where"];
  onChange: (value: PQuerySelect["where"]) => void;
  onDelete?: () => void;
}> = ({ columns, value, onChange, onDelete }) => {
  const addCondition = () => {
    if (value.length > 0 && typeof value[value.length - 1] !== "string") {
      onChange([
        ...value,
        "and",
        { column: Object.keys(columns)[0], operator: "=", value: "" },
      ]);
    } else {
      onChange([
        ...value,
        { column: Object.keys(columns)[0], operator: "=", value: "" },
      ]);
    }
  };

  const addAndGroup = () => {
    if (value.length > 0 && typeof value[value.length - 1] !== "string") {
      // Tambahkan operator "and" sebelum new group
      onChange([
        ...value,
        "and",
        [{ column: Object.keys(columns)[0], operator: "=", value: "" }],
      ]);
    } else {
      onChange([
        ...value,
        [{ column: Object.keys(columns)[0], operator: "=", value: "" }],
      ]);
    }
  };

  const addOrGroup = () => {
    if (value.length > 0 && typeof value[value.length - 1] !== "string") {
      // Tambahkan operator "or" sebelum new group
      onChange([
        ...value,
        "or",
        [{ column: Object.keys(columns)[0], operator: "=", value: "" }],
      ]);
    } else {
      onChange([
        ...value,
        [{ column: Object.keys(columns)[0], operator: "=", value: "" }],
      ]);
    }
  };

  const setCondition = (
    index: number,
    new_condition: PQuerySelectWhereSingle | PQuerySelect["where"]
  ) => {
    const updated_conditions = [...value];
    updated_conditions[index] = new_condition;
    onChange(updated_conditions);
  };

  const toggleNotOperator = (index: number) => {
    const updated_conditions = [...value];

    if (updated_conditions[index + 1] === "not") {
      updated_conditions.splice(index + 1, 1);
    } else {
      updated_conditions.splice(index + 1, 0, "not");
    }
    onChange(updated_conditions);
  };

  const deleteCondition = (index: number) => {
    let updated_conditions = [...value];

    // Hapus elemen setelahnya jika ada dan bukan operator
    if (
      index < updated_conditions.length - 1 &&
      typeof updated_conditions[index + 1] !== "string"
    ) {
      updated_conditions.splice(index + 1, 1);
    }

    // Hapus elemen saat ini (dropdown AND/OR)
    updated_conditions.splice(index, 1);

    // Hapus operator sebelumnya jika ada dan relevan
    if (index > 0 && typeof updated_conditions[index - 1] === "string") {
      updated_conditions.splice(index - 1, 1);
    }

    // Jika hanya tersisa operator, kosongkan semuanya
    if (
      updated_conditions.length === 1 &&
      (updated_conditions[0] === "and" || updated_conditions[0] === "or")
    ) {
      onChange([]);
    } else {
      onChange(updated_conditions);
    }
  };

  const updateOperator = (index: number, operator: "and" | "or" | "not") => {
    const updated_conditions = [...value];
    updated_conditions[index] = operator;
    onChange(updated_conditions);
  };

  return (
    <div className="space-y-2 pl-2">
      {value.map((condition, index: number) => {
        if (Array.isArray(condition)) {
          // Nested group
          return (
            <div
              key={index}
              className={`ml-4 border-l border-b rounded-bl-sm pl-2 pb-2`}
            >
              <InputWhereGroup
                columns={columns}
                value={condition}
                onChange={(updatedGroup) => setCondition(index, updatedGroup)}
                onDelete={() => deleteCondition(index)}
              />
            </div>
          );
        } else if (typeof condition === "string") {
          return (
            <div
              key={index}
              className="flex justify-between items-center pr-2 space-x-2"
            >
              <select
                className="border rounded-sm text-xs font-bold cursor-pointer"
                value={condition}
                onChange={(e) =>
                  updateOperator(index, e.target.value as "and" | "or" | "not")
                }
                disabled={condition === "not" ? true : false}
              >
                <option value="and">AND</option>
                <option value="or">OR</option>
                <option value="not" disabled hidden>
                  NOT
                </option>
              </select>

              {condition !== "not" && (
                <div className="flex items-center space-x-2">
                  <button
                    className=" text-orange-500 hover:text-orange-700"
                    onClick={() => {
                      toggleNotOperator(index);
                    }}
                  >
                    <span className="flex items-center space-x-2">
                      <CircleAlert size={12} />
                    </span>
                  </button>

                  <button
                    className="text-xs text-red-500 flex items-center gap-1"
                    onClick={() => deleteCondition(index)}
                  >
                    <Trash size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        } else {
          // Single condition
          return (
            <div key={index} className="">
              <InputWhereSingle
                columns={columns}
                value={condition}
                onChange={(updatedCondition) =>
                  setCondition(index, updatedCondition)
                }
                onDelete={() => deleteCondition(index)}
              />
            </div>
          );
        }
      })}
      {/* Buttons */}
      <div className="flex justify-end mr-2">
        <div className="px-1 bg-white text-slate-400 flex items-center border border-r-0 border-slate-300">
          <Plus size={12} />
        </div>
        <button
          className="border text-xs hover:bg-blue-500 hover:text-white border-slate-300 border-r-0 rounded-l-none px-2"
          onClick={addCondition}
        >
          <span className="flex items-center gap-1">Where</span>
        </button>
        <button
          className="border text-xs hover:bg-blue-500 hover:text-white border-slate-300 rounded-none px-2"
          onClick={addAndGroup}
        >
          <span className="flex items-center gap-1">AND</span>
        </button>
        <button
          className="border text-xs hover:bg-blue-500 hover:text-white border-slate-300 border-l-0 rounded-r-sm px-2"
          onClick={addOrGroup}
        >
          <span className="flex items-center gap-1">OR</span>
        </button>
      </div>
    </div>
  );
};

export const InputWhere: FC<{
  columns: Record<string, QInspectColumn>;
  value: PQuerySelect["where"];
  is_open: boolean;
  onChangeWhere: (value: PQuerySelect["where"]) => void;
  onChangeCloseWhere: (is_open: boolean) => void;
}> = ({ columns, value, is_open, onChangeWhere, onChangeCloseWhere }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center bg-gray-100 border-b px-2 py-[2px]">
        <span className="text-xs font-bold">Where</span>
        <button
          className="border rounded-sm-sm px-1 py-1 rounded-sm bg-white hover:bg-blue-500 hover:text-white"
          onClick={() => {
            onChangeCloseWhere(!is_open);
          }}
        >
          <span className="text-xs">
            {is_open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </span>
        </button>
      </div>
      {is_open && (
        <div className="my-2">
          <InputWhereGroup
            columns={columns}
            value={value}
            onChange={onChangeWhere}
          />
        </div>
      )}
    </div>
  );
};
