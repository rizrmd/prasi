import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/global-alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { editorState } from "@/editor/state/layout";
import { useLocal } from "base/libs/use-local";
import type { PageContent, PageData } from "base/site/router";
import { Plus, Type } from "lucide-react";
import { useEffect, useRef, useState, type FC } from "react";
import { useSnapshot } from "valtio";
import { StateEditItem } from "./state-edit-item";
import { RightClick } from "@/components/ui/right-click";

const current = {
  focused: "",
  cursor: null as null | number,
  mode: "view" as "view" | "inline-edit",
  open: false,
  original_name: "",
  render: () => {},
};

export const StateAction = () => {
  return (
    <div className="flex">
      <Button
        size="xs"
        onClick={() => {
          current.focused = "_new_data";
          current.mode = "inline-edit";
          editorState.crdt.write.data = {
            ...editorState.crdt.write.data,
            ["_new_data"]: {
              name: "_new_data",
              type: "string",
              usage: {},
              initial_value: '""',
            },
          };
        }}
      >
        <Plus /> Add
      </Button>
    </div>
  );
};

export const StateDock = () => {
  const read = useSnapshot(editorState.crdt.write) as PageContent;
  const render = useState({})[1];
  current.render = () => render({});
  return (
    <div className="relative overflow-auto flex-1">
      <div className="absolute inset-0 text-sm">
        {Object.entries(read.data || {})
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([key, item], idx) => {
            return (
              <DataItem
                item={item}
                key={key}
                onDelete={async () => {
                  const confirmed = await Alert.confirm(
                    "Are you sure you want to delete?"
                  );

                  if (confirmed.confirm) {
                    const data = { ...read.data } as PageContent["data"];

                    delete data[key];
                    current.mode = "view";
                    editorState.crdt.write.data = data;
                  }
                }}
                onChange={async (value) => {
                  const data = { ...read.data } as PageContent["data"];
                  const existing = { ...data[key] } as PageData;

                  if (value === "" && existing.name !== "") {
                    current.original_name = existing.name;
                  }

                  if (value === "" && item.name === "") {
                    const confirmed = await Alert.confirm(
                      "Data with empty name will be deleted. Are you sure you want to delete it?"
                    );

                    if (confirmed.confirm) {
                      delete data[key];
                      current.mode = "view";
                    } else {
                      existing.name = current.original_name;
                      current.focused = current.original_name;
                      delete data[key];
                      data[current.original_name] = existing;
                    }
                  } else {
                    if (existing) {
                      existing.name = value;
                      delete data[key];
                      data[value] = existing;
                    }
                  }
                  editorState.crdt.write.data = data;
                }}
              />
            );
          })}
      </div>
    </div>
  );
};

const DataItem: FC<{
  item: PageData;
  onChange: (value: string) => void;
  onDelete: () => void;
}> = ({ item, onChange, onDelete }) => {
  const local = useLocal({
    value: item.name,
    timeout: null as any,
    cursor_pos: 0,
    animation: false,
  });

  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item.name !== local.value) {
      local.value = item.name;
      local.render();
    }
  }, [item.name]);

  return (
    <Popover
      data-side="right"
      open={current.open && current.focused === local.value}
      onOpenChange={(open) => {
        if (current.mode === "view" && current.focused === local.value) {
          current.open = true;
          local.render();
        }
        if (!open) {
          current.focused = "";
        }
      }}
    >
      <RightClick
        menu={[
          {
            title: "Rename",
            onClick: () => {
              current.mode = "inline-edit";
              current.render();
            },
          },
          { title: "Delete", onClick: onDelete },
        ]}
        onOpenChange={(open) => {
          if (open) {
            current.open = false;
            current.render();
            if (current.mode === "view") {
              current.focused = local.value;
              current.render();
            }
          }
        }}
      >
        <PopoverTrigger asChild>
          <div
            onClick={() => {
              if (!current.focused) {
                local.animation = true;
              } else {
                local.animation = false;
              }
              if (current.mode === "view") {
                current.focused = local.value;
                current.render();
              } else {
                if (current.focused !== local.value) {
                  current.focused = local.value;
                  current.mode = "view";
                  current.render();
                }
              }
            }}
            className={cn(
              "flex items-stretch border",
              local.value === current.focused
                ? cn(
                    current.mode === "view"
                      ? "border-primary bg-primary text-primary-foreground cursor-pointer"
                      : "border-primary"
                  )
                : "border-transparent border-b-border cursor-pointer"
            )}
          >
            {current.mode === "inline-edit" &&
            current.focused === local.value ? (
              <input
                ref={input}
                autoFocus
                className={cn(
                  "flex-1 flex items-center px-1 min-w-[50px] focus:outline-none "
                )}
                spellCheck={false}
                value={local.value}
                onChange={(e) => {
                  local.value = e.target.value
                    .toLowerCase()
                    .replace(/[\W_]+/g, "_");
                  current.focused = local.value;
                  current.cursor = e.target.selectionStart;

                  local.render();
                }}
                onKeyUp={(e) => {
                  if (e.key === "Escape") {
                    current.mode = "view";
                    current.render();
                  } else if (e.key === "Backspace" || e.key === "Delete") {
                    if (local.value === "") {
                      current.mode = "view";
                      onChange("");
                    }
                  } else if (e.key === "Enter") {
                    current.mode = "view";

                    if (local.value === "") {
                      onChange("");
                    } else {
                      onChange(local.value);
                      current.cursor = null;
                      local.render();
                    }
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.select();
                }}
                onBlur={() => {
                  if (local.value !== item.name) {
                    onChange(local.value);
                  }
                  current.mode = "view";
                  current.cursor = null;
                  local.render();
                }}
              />
            ) : (
              <div
                className={cn("flex-1 flex items-center px-1 min-w-[50px] ")}
              >
                {local.value}
              </div>
            )}

            <div
              className={cn(
                "flex items-center px-1",
                css`
                  > svg {
                    width: 14px;
                  }
                `
              )}
            >
              {item.type === "string" && <Type />}
            </div>
          </div>
        </PopoverTrigger>
      </RightClick>

      <PopoverContent
        animation={local.animation}
        className="z-10 text-sm p-0 rounded-none"
        side="right"
      >
        <StateEditItem name={local.value} />
      </PopoverContent>
    </Popover>
  );
};
