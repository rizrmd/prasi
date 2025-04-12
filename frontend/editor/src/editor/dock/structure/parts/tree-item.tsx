import { RightClick } from "@/components/ui/right-click";
import { editor } from "@/editor/state/editor";
import { type NodeRender } from "@minoru/react-dnd-treeview";
import type { PNode } from "base/prasi/logic/types";
import { useSnapshot } from "valtio";
import { treeItemCss } from "./tree-item-css";
import { TreeItemIndent } from "./tree-item-indent";
import { treeItemMenu } from "./tree-item-menu";
import { TreeItemName } from "./tree-item-name";

export const renderTreeItem: NodeRender<PNode> = (node, render_params) => {
  const read = useSnapshot(editor.tree) as typeof editor.tree;

  const data = node.data;
  if (!data) {
    return <>ERROR: No Data</>;
  }
  const item = data.item;
  const isRenaming = read.renaming.id !== item.id;

  return (
    <RightClick
      menu={treeItemMenu(node)}
      onOpenChange={(open) => {
        if (open) {
          editor.tree.select.id = item.id;
        }
      }}
    >
      <div
        className={treeItemCss(node, render_params, read)}
        onClick={() => {
          if (item.id === read.select.id) {
            editor.tree.select.id = "";
          } else {
            editor.tree.select.id = item.id;
          }
        }}
      >
        <TreeItemIndent node={node} render_params={render_params} />
        <TreeItemName node={node} render_params={render_params} />
      </div>
    </RightClick>
  );
};
