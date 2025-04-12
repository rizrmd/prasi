import type { editor } from "@/editor/state/editor";
import type { NodeModel, RenderParams } from "@minoru/react-dnd-treeview";
import type { PNode } from "base/prasi/logic/types";

export const treeItemCss = (
  node: NodeModel<PNode>,
  params: RenderParams,
  read: (typeof editor)["tree"],
  ...arg: any[]
) => {
  const data = node.data;
  const item = data!.item;
  return cn(
    "relative border-b flex items-stretch outline-none min-h-[26px]",
    item.id === read.select.id && !read.renaming.id && !params.isDragging
      ? "border border-primary bg-primary text-primary-foreground"
      : "border border-transparent border-b border-b-border ",
    params.isDropTarget &&
      css`
        background: var(--primary) !important;
        color: var(--primary-foreground) !important;
        opacity: 0.8 !important;
      `,
    !params.isDragging &&
      css`
        &:active {
          opacity: 0.4;
          border-radius: 3px;
          border: 1px solid var(--primary) !important;

          ul {
            opacity: 0 !important;
          }
        }
      `,
    ...arg
  );
};
