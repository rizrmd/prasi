import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/global-alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RightClick } from "@/components/ui/right-click";
import { editor } from "@/editor/state/editor";
import { useLocal } from "base/libs/use-local";
import type { PageContent, PageState } from "base/site/router";
import {
  FunctionSquare,
  HardDriveDownload,
  Plus,
  RectangleEllipsis,
  Variable,
} from "lucide-react";
import { useEffect, useRef, useState, type FC } from "react";
import { useSnapshot } from "valtio";
import { StateEditItem } from "./state-edit-item";

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
          const new_name = "_new_";
          current.focused = new_name;
          current.mode = "inline-edit";
          editor.page.write.state = {
            ...editor.page.write.state,
            [new_name]: {
              name: new_name,
              type: "static",
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

const sortType = {
  static: 0,
  promise: 1,
  computed: 2,
  function: 3,
};

export const StateDock = () => {
  const read = useSnapshot(editor.page.write) as PageContent;
  const render = useState({})[1];
  current.render = () => render({});
  return (
    <div className="relative overflow-auto flex-1">
      <div className="absolute inset-0 text-sm">
        {[...Object.entries(read.state || {})]
          .sort((a, b) =>
            `${sortType[a[1].type]}-${a[0]}`.localeCompare(
              `${sortType[b[1].type]}-${b[0]}`
            )
          )
          .map(([key, item], idx) => {
            return (
              <DataItem
                read={item}
                key={key}
                onDelete={async () => {
                  const confirmed = await Alert.confirm(
                    "Are you sure you want to delete?"
                  );

                  if (confirmed.confirm) {
                    const data = { ...read.state } as PageContent["state"];

                    delete data[key];
                    current.mode = "view";
                    editor.page.write.state = data;
                  }
                }}
                onChange={async (value) => {
                  const data = { ...read.state } as PageContent["state"];
                  const existing = { ...data[key] } as PageState;

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
                  editor.page.write.state = data;
                }}
              />
            );
          })}
      </div>
    </div>
  );
};

const DataItem: FC<{
  read: PageState;
  onChange: (value: string) => void;
  onDelete: () => void;
}> = ({ read, onChange, onDelete }) => {
  const local = useLocal({
    value: read.name,
    timeout: null as any,
    cursor_pos: 0,
    animation: false,
  });

  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (read.name !== local.value) {
      local.value = read.name;
      local.render();
    }
  }, [read.name]);

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
      modal={false}
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
                  if (local.value !== read.name) {
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
              <PageStateIcon type={read.type} />
            </div>
          </div>
        </PopoverTrigger>
      </RightClick>

      <PopoverContent
        animation={false}
        className={cn(
          "z-10 text-sm p-0 shadow-none",
          css`
            border-radius: 0;
            border-bottom-right-radius: var(--radius);
            border-top-right-radius: var(--radius);
            border-left: 0px;
            border-top: 0;
            margin-top: 10px;
          `
        )}
        side="right"
        sideOffset={1}
      >
        <StateEditItem
          read={read}
          write={editor.page.write.state[read.name]!}
        />
      </PopoverContent>
    </Popover>
  );
};

export const PageStateIcon = ({ type }: { type: PageState["type"] }) => {
  return (
    <>
      {type === "static" && <RectangleEllipsis />}
      {type === "promise" && <HardDriveDownload />}
      {type === "computed" && <Variable />}
      {type === "function" && <FunctionSquare />}
    </>
  );
};
