import { editor } from "@/editor/state/editor";
import { type DropOptions, type NodeModel } from "@minoru/react-dnd-treeview";
import type { IItem, PNode } from "base/prasi/logic/types";
import get from "lodash.get";

export const treeOnDrop: (
  tree: NodeModel<PNode>[],
  options: DropOptions<PNode>
) => void = (tree, options) => {
  const { dragSource, dropTarget, relativeIndex, dragSourceId, dropTargetId } =
    options;

  if (
    dragSource?.data &&
    dropTarget &&
    typeof dragSourceId === "string" &&
    typeof dropTargetId === "string"
  ) {
    editor.tree.current.update(({ find, findParent, tree }) => {
      const root = find("root")!.data!.item;
      const from = find(dragSourceId)?.data;
      const to = find(dropTargetId)?.data;

      if (from && typeof relativeIndex === "number") {
        let to_childs = null as null | IItem[];
        let from_childs = null as null | IItem[];

        if (from.parent) {
          from_childs = tree.map[from.parent.id]?.item.childs || null;
        } else {
          from_childs =
            tree.list.find((e) => e.id === "root")?.data?.item.childs || null;
        }

        if (to) {
          if (to.item.childs) {
            to_childs = to.item.childs;
          }
        } else if (from.item.type === "section") {
          to_childs = root.childs;
          from_childs = root.childs;
        }

        if (to_childs && from_childs) {
          if (from_childs === to_childs) {
            const from_idx = from_childs.findIndex(
              (e) => e.id === from.item.id
            );
            from_childs.splice(from_idx, 1, null as any);
            to_childs.splice(relativeIndex, 0, from.item);
            const idx = from_childs.findIndex((e) => e === null);
            from_childs.splice(idx, 1);
          } else {
            const from_idx = from_childs.findIndex(
              (e) => e.id === from.item.id
            );
            from_childs.splice(from_idx, 1);
            to_childs.splice(relativeIndex, 0, from.item);
          }
        }
      }
    });
  }
};

export const treeCanDrop = (arg: DropOptions<PNode>) => {
  const { dragSource, dragSourceId, dropTargetId, dropTarget } = arg;
  try {
    const parentSource: IItem | undefined = get(
      dragSource,
      "data.item.parent.parent"
    ) as any;

    if ((dropTarget?.data as any)?.id === "root") {
      return true;
    }

    if (dragSource?.data?.item && dropTarget?.data?.item) {
      const from = (dragSource.data.item as IItem).type;
      const to = (dropTarget.data.item as IItem).type as
        | "item"
        | "section"
        | "text"
        | "root";
      if (from === "item") {
        let parentMeta: PNode | undefined = dropTarget.data;
        while (parentMeta) {
          if (parentMeta.item.id === dragSource.data.item.id) {
            return false;
          }
          if (parentMeta.parent?.id) {
            parentMeta = editor.tree.current.get().map[parentMeta.parent.id];
          } else {
            break;
          }
        }
      }

      if (to === "item" && dropTarget.data.item.component?.id) {
        return false;
      }

      if (from === "item" || from === "section") {
        if (to === "section" || to === "item" || to === "root") {
          return true;
        } else {
          return false;
        }
      } else if (from === "text") {
        if (to === "item" || to === "section" || to === "root") {
          return true;
        }
      }
      return false;
    }
  } catch (e) {
    console.log(e);
    return false;
  }
};
