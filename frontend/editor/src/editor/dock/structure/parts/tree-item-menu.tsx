import type { MenuItem } from "@/components/ui/right-click";
import { editor } from "@/editor/state/editor";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import { createId } from "@orama/cuid2";
import type { PNode } from "base/prasi/logic/types";

export const treeItemMenu = (node: NodeModel<PNode>) => {
  const data = node.data;
  const item = data!.item;
  return [
    {
      title: "Add",
      children: [
        {
          title: "Add Child",
          onClick: () => {
            editor.tree.current.update(({ tree, find, childrenOf }) => {
              const parent = find(node.id);
              const item = parent?.data?.item;

              if (item) {
                item.childs.push({
                  id: createId(),
                  name: "New Item",
                  type: "item",
                  childs: [],
                });
              }
            });
          },
        },
        {
          title: "Add After",
          onClick: () => {
            editor.tree.current.update(({ tree, find, childrenOf }) => {
              const parent = find(node.parent);
              const item = parent?.data?.item;

              if (item) {
                const idx = item.childs.findIndex(
                  (child) => child.id === node.id
                );
                item.childs.splice(idx + 1, 0, {
                  id: createId(),
                  name: "New Item",
                  type: "item",
                  childs: [],
                });
              }
            });
          },
        },
        {
          title: "Add Before",
          onClick: () => {
            editor.tree.current.update(({ tree, find, childrenOf }) => {
              const parent = find(node.parent);
              const item = parent?.data?.item;

              if (item) {
                const idx = item.childs.findIndex(
                  (child) => child.id === node.id
                );
                item.childs.splice(idx, 0, {
                  id: createId(),
                  name: "New Item",
                  type: "item",
                  childs: [],
                });
              }
            });
          },
        },
      ],
    },
    "---",
    {
      title: "Delete",
      onClick: () => {
        editor.tree.current.update(({ tree, find, childrenOf }) => {
          const parent = find(node.parent);
          const item = parent?.data?.item;

          if (item) {
            item.childs = item.childs.filter((child) => child.id !== node.id);
          }
        });
      },
    },
    "---",
    {
      title: "Rename",
      onClick: () => {
        editor.tree.renaming.id = item.id;
        editor.tree.renaming.name = item.name;
      },
    },
  ] as MenuItem[];
};
