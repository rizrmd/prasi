import type { NodeModel, RenderParams } from "@minoru/react-dnd-treeview";
import type { PNode } from "base/prasi/logic/types";

export const treeItemCss = (
  node: NodeModel<PNode>,
  params: RenderParams,
  ...arg: string[]
) => {
  return cn(
    "relative border-b flex items-stretch outline-none min-h-[26px] px-1",
    !params.isDragging &&
      css`
        &:active {
          border-radius: 3px;
          border: 1px solid var(--primary) !important;
        }
      `,
    ...arg
  );
};
