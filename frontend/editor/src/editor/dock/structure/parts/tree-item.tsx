import type { NodeRender } from "@minoru/react-dnd-treeview";
import type { PNode } from "base/prasi/logic/types";
import { treeItemCss } from "./tree-item-css";
import { TreeItemName } from "./tree-item-name";
import { RightClick } from "@/components/ui/right-click";

export const renderTreeItem: NodeRender<PNode> = (node, render_params) => {
  return (
    <RightClick
      menu={[
        {
          title: "Add",
          children: [
            { title: "Add Child" },
            { title: "Add After" },
            { title: "Add Before" },
          ],
        },
        "---",
        { title: "Delete" },
      ]}
    >
      <div className={treeItemCss(node, render_params)}>
        <TreeItemName node={node} params={render_params} />
      </div>
    </RightClick>
  );
};
