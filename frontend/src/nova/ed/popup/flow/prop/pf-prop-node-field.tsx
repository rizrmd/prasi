import capitalize from "lodash.capitalize";
import get from "lodash.get";
import set from "lodash.set";
import { ChevronDown, Trash2, TriangleAlert } from "lucide-react";
import { FC, useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useLocal } from "utils/react/use-local";
import { Popover } from "utils/ui/popover";
import { Tooltip } from "utils/ui/tooltip";
import { DeepReadonly, PFField, PFNode, RPFlow } from "../runtime/types";
import { fg } from "../utils/flow-global";
import { getNodeDef } from "../utils/get-node-def";
import { PFDropdown } from "../utils/type-picker";
import { PFPropCode } from "./pf-prop-code";
import { Combobox } from "utils/shadcn/comps/ui/combobox";

export type FieldChangedAction =
  | "text-changed"
  | "option-picked"
  | "buttons-checked"
  | "array-added"
  | "array-deleted"
  | "field-cleared"
  | "code-changed";

export const PFPropNodeField: FC<{
  field: PFField;
  node: DeepReadonly<PFNode>;
  name: string;
  value: any;
  path?: string[];
  pflow: RPFlow;
}> = ({ field, node, name, value, pflow, path }) => {
  const label = field.label || name;
  const ref = useRef<HTMLTextAreaElement>(null);
  const def = getNodeDef(node.type);

  if (!def) {
    return null;
  }

  const local = useLocal(
    {
      value: null as any,
      ready: false,
      options: [] as {
        value: string;
        label: string;
        el?: React.ReactElement;
      }[],
    },
    async () => {
      local.options =
        field.type === "options" || field.type === "buttons"
          ? (await field.options()).map((e) => {
              if (typeof e === "string") return { value: e, label: e };
              return e;
            })
          : [];
      local.render();
    }
  );

  const update = (
    action: FieldChangedAction,
    path: string[],
    value: any,
    modifyNode?: (node: PFNode) => void
  ) => {
    clearTimeout(fg.update_timeout);
    fg.update_timeout = setTimeout(() => {
      fg.update(
        `Flow [${name}]: ${capitalize(action.split("-").join(" "))}  `,
        ({ pflow }) => {
          const n = pflow.nodes[node.id];
          if (n) {
            const obj = path && path.length > 0 ? get(n, path?.join(".")) : n;
            if (modifyNode) {
              modifyNode(n);
            } else {
              if (value === undefined) {
                delete obj[name];
              } else {
                obj[name] = value;
              }
            }

            if (def.on_fields_changed) {
              def.on_fields_changed({
                action,
                node: n,
                path: [...(path || []), name].join("."),
                pflow,
              });
            }
          }
        }
      );
    }, 300);
  };

  useEffect(() => {
    local.value = value;
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        local.value = [...value];
      } else {
        local.value = { ...value };
      }
    }
    local.ready = true;
    local.render();
  }, [name, value]);

  if (!local.ready) return null;

  const varpath = [...(path || []), name].join(".");
  return (
    <>
      <div
        className={cx(
          "border-b flex text-xs",
          css`
            min-height: 24px;
          `,
          field.className
        )}
      >
        <Tooltip content={label} placement="left" asChild>
          <div
            className={cx(
              " px-1 flex items-center",
              css`
                width: 80px;
                overflow: hidden;
              `
            )}
            onClick={() => {
              ref.current?.focus();
            }}
          >
            {label}
          </div>
        </Tooltip>
        {field.type === "string" && (
          <TextareaAutosize
            className={cx(
              "flex-1 outline-none p-1 border-l resize-none min-w-0 w-full bg-transparent"
            )}
            value={local.value || ""}
            spellCheck={false}
            onChange={(e) => {
              const value = e.currentTarget.value;
              local.value = value;
              local.render();
              update("text-changed", path || [], value || undefined);
            }}
          />
        )}
        {field.type === "options" && (
          <Combobox
            options={local.options}
            defaultValue={field.multiple ? local.value || [] : local.value}
            onChange={(value) => {
              update("option-picked", path || [], value);
            }}
          >
            <div className="flex flex-1 border-l items-stretch cursor-pointer hover:bg-blue-50">
              <div className="flex-1 flex px-1 items-center"></div>
              <div className="flex w-[25px] items-center justify-center">
                <ChevronDown size={12} />
              </div>
            </div>
          </Combobox>
        )}
        {field.type === "buttons" && (
          <div
            className={cx(
              "flex flex-wrap space-x-1 px-1 flex-1 border-l items-center"
            )}
          >
            {local.options.map((e, idx) => {
              let is_checked = false;

              if (field.multiple) {
                if (Array.isArray(value) && value.includes(e.value)) {
                  is_checked = true;
                }
              } else {
                if (e.value === value) is_checked = true;
              }

              return (
                <div
                  key={idx}
                  className={cx(
                    "border flex items-center justify-center  border-blue-500 px-2 rounded cursor-pointer  select-none",
                    is_checked ? "bg-blue-500 text-white" : "hover:bg-blue-50"
                  )}
                  onClick={() => {
                    if (field.multiple) {
                      if (!Array.isArray(local.value)) {
                        local.value = [];
                      }
                      const idx = local.value.findIndex(
                        (val: any) => val === e.value
                      );
                      if (idx >= 0) {
                        local.value.splice(idx, 1);
                      } else {
                        local.value.push(e.value);
                      }
                    } else {
                      local.value = e.value;
                    }
                    local.render();
                    update("buttons-checked", path || [], local.value);
                  }}
                >
                  {e.el || e.label}
                </div>
              );
            })}
          </div>
        )}
        {field.type === "code" && (
          <div
            className={cx(
              "flex-1 border-l justify-between items-center flex",
              node._codeError && node._codeError[varpath] && "bg-red-500"
            )}
          >
            <Popover
              placement="left"
              popoverClassName={cx(
                node._codeError && node._codeError[varpath]
                  ? css`
                      border: 1px solid red;
                      .arrow {
                        border: 1px solid red;
                      }
                    `
                  : css`
                      border: 1px solid black;
                      .arrow {
                        border: 1px solid black;
                      }
                    `,
                css`
                  background: white;
                `
              )}
              asChild
              backdrop={false}
              content={
                <PFPropCode
                  node={node}
                  field={field}
                  value={local.value}
                  error={node._codeError && node._codeError[varpath]}
                  update={(value, built, errors) => {
                    local.value = value;
                    local.render();
                    update("code-changed", path || [], value, (node) => {
                      if (!node._codeBuild) node._codeBuild = {};
                      if (!node._codeError) node._codeError = {};
                      if (errors) {
                        node._codeError[varpath] = errors;
                      } else {
                        delete node._codeError[varpath];
                      }
                      set(node, varpath, value);
                      node._codeBuild[varpath] = built;
                    });
                  }}
                />
              }
            >
              <div className="border bg-white border-slate-500 px-2 text-[11px] mx-[2px] cursor-pointer hover:bg-blue-600 hover:border-blue-600 hover:text-white">
                Edit Code
              </div>
            </Popover>

            {node._codeError && node._codeError[varpath] && (
              <Popover
                popoverClassName={css`
                  border: 1px solid red;
                  border-radius: 5px;
                  padding: 5px 0px;
                  background: white;
                  .arrow {
                    border: 1px solid red;
                  }
                `}
                content={
                  <div
                    className={cx(
                      "text-xs text-red-500 flex items-center space-x-1 mx-2",
                      css`
                        font-family: "Liga Menlo", monospace;
                        white-space: pre-wrap;
                        line-height: 130%;
                        font-size: 0.7em;
                      `
                    )}
                  >
                    {node._codeError[varpath]}
                  </div>
                }
                asChild
              >
                <div className="text-xs cursor-pointer text-white flex items-center mr-2">
                  <TriangleAlert size={12} />{" "}
                  <div className="pl-[2px]">ERROR</div>
                </div>
              </Popover>
            )}
          </div>
        )}
        {field.type === "array" && (
          <div className="flex-1 justify-end items-center flex">
            <div
              className={cx(
                "border select-none px-2 text-[11px] mr-[2px] cursor-pointer hover:bg-blue-600 hover:border-blue-600 hover:text-white"
              )}
              onClick={() => {
                const item = {} as any;
                if (field.fields) {
                  for (const [k, v] of Object.entries(field.fields)) {
                    item[k] = "";
                  }
                  if (!Array.isArray(local.value)) {
                    local.value = [];
                  }
                  local.value.push(item);
                  local.render();
                  update("array-added", path || [], local.value);
                }
              }}
            >
              + Add
            </div>
          </div>
        )}
        {field.optional && local.value && (
          <div
            className="del flex items-center justify-center w-[25px] border-l cursor-pointer hover:bg-red-100"
            onClick={() => {
              update("field-cleared", path || [], undefined);
            }}
          >
            <Trash2 size={14} />
          </div>
        )}
      </div>

      {field.type === "array" && (
        <div className={cx("flex flex-col items-stretch", field.className)}>
          {Array.isArray(local.value) &&
            local.value.map((data, idx) => {
              return (
                <div
                  key={idx}
                  className={cx(
                    "flex items-stretch array-item",
                    idx % 2 ? "even" : "odd"
                  )}
                >
                  {field.render ? (
                    field.render({
                      node,
                    })
                  ) : (
                    <>
                      <div className="num select-none flex items-center justify-center w-[15px] border-r border-b bg-slate-100 text-[9px]">
                        {idx + 1}
                      </div>
                      <div className="flex flex-col flex-1 ">
                        {Object.entries(field.fields)
                          .sort((a, b) => a[1].idx! - b[1].idx!)
                          .map(([key, field]) => {
                            return (
                              <PFPropNodeField
                                pflow={pflow}
                                key={key}
                                field={field}
                                name={key}
                                node={node}
                                path={[...(path || []), name, idx.toString()]}
                                value={data[key]}
                              />
                            );
                          })}
                      </div>
                      <div
                        className="del flex items-center justify-center w-[25px] border-l border-b cursor-pointer hover:bg-red-100"
                        onClick={() => {
                          local.value.splice(idx, 1);
                          local.render();
                          update(
                            "array-deleted",
                            path || [],
                            local.value,
                            (node) => {
                              set(node, varpath, local.value);
                              const idxpath = varpath + "." + idx;
                              if (node._codeBuild) {
                                for (const [i, e] of Object.entries(
                                  node._codeBuild
                                )) {
                                  if (i.startsWith(idxpath)) {
                                    delete node._codeBuild[i];
                                  }
                                }
                              }
                              if (node._codeError) {
                                for (const [i, e] of Object.entries(
                                  node._codeError
                                )) {
                                  if (i.startsWith(idxpath)) {
                                    delete node._codeError[i];
                                  }
                                }
                              }
                            }
                          );
                        }}
                      >
                        <Trash2 size={14} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </>
  );
};
