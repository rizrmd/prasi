import { editor } from "@/editor/state/editor";
import {
  getBackendOptions,
  MultiBackend,
  Tree,
} from "@minoru/react-dnd-treeview";
import type { PNode } from "base/prasi/logic/types";
import { DndProvider } from "react-dnd";
import { useSnapshot } from "valtio";
import { renderTreeItem } from "./parts/tree-item";
import { Placeholder } from "./parts/tree-item-drag";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createId } from "@orama/cuid2";

export const StructureDock = () => {
  const read = useSnapshot(editor.tree.current.get());
  const render = useState({})[1];
  const ref = useRef<HTMLDivElement>(null);
  const TypedTree = Tree<PNode>;

  useEffect(() => {
    render({});
  }, []);

  let tree = editor.tree.page.list;

  return (
    <div
      ref={ref}
      className={cn("relative overflow-auto flex-1 h-full w-full")}
    >
      {read.list.length === 1 ? (
        <div className="flex flex-1 items-center justify-center h-[200px]">
          <Button
            className="cursor-pointer"
            size="sm"
            onClick={() => {
              editor.tree.current.update(({ tree, find }) => {
                const parent = find("root");
                if (parent) {
                  const data = parent.data;
                  if (data)
                    data.item.childs.push({
                      id: createId(),
                      name: "New Item",
                      childs: [],
                      type: "item",
                    });
                }
              });
            }}
          >
            <Plus /> Add
          </Button>
        </div>
      ) : (
        <>
          {ref.current && (
            <DndProvider
              backend={MultiBackend}
              options={getBackendOptions({
                html5: { rootElement: ref.current },
              })}
            >
              <TypedTree
                tree={tree}
                classes={{
                  root: "absolute inset-0 flex flex-col items-stretch",
                }}
                rootId={"root"}
                onDrop={() => {}}
                sort={false}
                canDrag={(node) => {
                  if (node) {
                    if (node.data?.parent?.component?.is_jsx_root) {
                      return false;
                    }
                  }

                  return true;
                }}
                insertDroppableFirst={false}
                dropTargetOffset={10}
                render={renderTreeItem}
                placeholderRender={(node, params) => (
                  <Placeholder node={node} params={params} />
                )}
              />
            </DndProvider>
          )}
        </>
      )}
    </div>
  );
};
