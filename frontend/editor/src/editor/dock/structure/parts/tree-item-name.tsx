import { editor } from "@/editor/state/editor";
import type { NodeModel, RenderParams } from "@minoru/react-dnd-treeview";
import type { IItem, PNode } from "base/prasi/logic/types";
import { ComponentIcon } from "lucide-react";
import { type FC, type ReactNode } from "react";
import { useSnapshot } from "valtio";

export const formatItemName = (name: string) => {
  return (name || "")
    .replace(/[^a-zA-Z0-9:]+/g, " ")
    .split(" ")
    .map((e) => (e[0] || "").toUpperCase() + e.slice(1))
    .join(" ");
};

export const TreeItemName: FC<{
  node: NodeModel<PNode>;
  params: RenderParams;
}> = ({ node, params }) => {
  const read = useSnapshot(editor.tree);
  const isRenaming = read.renaming.id === node.data?.item.id;

  const data = node.data!;
  const item = data.item;
  if (!item) {
    return <>ERROR: No Data</>;
  }

  return (
    <div
      className={cn(
        "text-[14px] relative flex flex-col justify-center cursor-pointer flex-1"
      )}
    >
      <div className="flex flex-row">
        {isRenaming ? (
          <input
            className={cx(
              "rename-item absolute inset-0 outline-none bg-background text-primary my-[2px] -mx-1 px-1 border border-primary"
            )}
            autoFocus
            spellCheck={false}
            value={read.renaming.name}
            onFocus={(e) => {
              if (data.parent?.component?.is_jsx_root) {
                editor.tree.renaming.id = "";
              } else {
                e.currentTarget.select();
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onBlur={() => {
              editor.tree.renaming.id = "";
              item.name = read.renaming.name;
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" || e.key === "Escape") {
                e.currentTarget.blur();
              }
            }}
            onChange={(e) => {
              editor.tree.renaming.name = formatItemName(e.currentTarget.value);
            }}
          />
        ) : (
          <NodeName node={data} render_params={params} />
        )}
      </div>
    </div>
  );
};

const NodeName: FC<{
  node: PNode;
  render_params: RenderParams;
}> = ({ node, render_params }) => {
  let name: ReactNode = formatItemName(node.item.name);
  let comp_label = "";
  if (node?.item.component?.id) {
    for (const prop of Object.values(node?.item.component?.props || {})) {
      if (prop.is_name) {
        try {
          eval(`comp_label = ${prop.valueBuilt}`);
        } catch (e) {}
        if (typeof comp_label !== "string" && typeof comp_label !== "number") {
          comp_label = "";
        }
      }
    }
  }

  return (
    <div
      className={cn(
        "flex items-center space-x-1",
        render_params.isDragging && "rounded-md"
      )}
      onPointerDown={() => {}}
    >
      {node.item.component?.id && render_params.hasChild && (
        <div className="node-text text-purple-600 mt-[1px]">
          <ComponentIcon />
        </div>
      )}
      <div className="flex leading-none">
        {name}
        {comp_label && `: ${comp_label}`}
      </div>
    </div>
  );
};
