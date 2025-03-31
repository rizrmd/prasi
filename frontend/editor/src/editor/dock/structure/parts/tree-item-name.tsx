import type { NodeModel, RenderParams } from "@minoru/react-dnd-treeview";
import type { PNode } from "base/prasi/logic/types";
import { ComponentIcon } from "lucide-react";
import { type FC, type ReactNode } from "react";

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
  const isRenaming = false;

  return (
    <div className="text-[14px] relative flex flex-col justify-center cursor-pointer flex-1">
      {!node.data ? (
        <>ERROR: No Data</>
      ) : (
        <div className="flex flex-row">
          <NodeName node={node.data} render_params={params} />
        </div>
      )}
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
