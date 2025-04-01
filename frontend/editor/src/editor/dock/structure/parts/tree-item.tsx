import { RightClick } from "@/components/ui/right-click";
import { editor } from "@/editor/state/editor";
import type { NodeRender } from "@minoru/react-dnd-treeview";
import type { PNode } from "base/prasi/logic/types";
import { useSnapshot } from "valtio";
import { treeItemCss } from "./tree-item-css";
import { TreeItemName } from "./tree-item-name";
import { treeItemMenu } from "./tree-item-menu";

export const renderTreeItem: NodeRender<PNode> = (node, render_params) => {
  const read = useSnapshot(editor.tree);

  const data = node.data;
  if (!data) {
    return <>ERROR: No Data</>;
  }
  const item = data.item;

  return (
    <RightClick
      menu={treeItemMenu(node)}
      onOpenChange={(open) => {
        if (open) {
          editor.tree.select = item.id;
        }
      }}
    >
      <div
        className={treeItemCss(
          node,
          render_params,
          item.id === read.select && !read.renaming.id
            ? "border border-primary bg-primary text-primary-foreground"
            : "border border-transparent border-b border-b-border "
        )}
        onClick={() => {
          if (item.id === read.select) {
            editor.tree.select = "";
          } else {
            editor.tree.select = item.id;
          }
        }}
      >
        <TreeItemName node={node} params={render_params} />
      </div>
    </RightClick>
  );
};
