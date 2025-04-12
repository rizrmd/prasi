import { Button } from "@/components/ui/button";
import { editor } from "@/editor/state/editor";
import {
  getBackendOptions,
  MultiBackend,
  Tree,
} from "@minoru/react-dnd-treeview";
import { createId } from "@orama/cuid2";
import type { PNode } from "base/prasi/logic/types";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { ref, useSnapshot } from "valtio";
import { renderTreeItem } from "./parts/tree-item";
import { Placeholder } from "./parts/tree-item-drag";
import { treeCanDrop, treeOnDrop } from "./utils/tree-on-drop";

export const StructureDock = () => {
  const read = useSnapshot(editor.tree.current.get());
  const render = useState({})[1];
  const div = useRef<HTMLDivElement>(null);
  const TypedTree = Tree<PNode>;

  useEffect(() => {
    editor.tree.render = ref(() => render({}));
    render({});
  }, []);

  let tree = editor.tree.page.list;

  return (
    <div
      ref={div}
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
          {div.current && (
            <DndProvider
              backend={MultiBackend}
              options={getBackendOptions({
                html5: { rootElement: div.current },
              })}
            >
              <TypedTree
                tree={tree}
                classes={{
                  root: "absolute inset-0 flex flex-col items-stretch",
                }}
                rootId={"root"}
                onDrop={(tree, options) => treeOnDrop(tree, options)}
                canDrop={(_, args) => {
                  if (!args.dragSource?.data?.item) return false;
                  return treeCanDrop(args);
                }}
                initialOpen
                sort={false}
                canDrag={(node) => {
                  if (node) {
                    if (node.data?.parent?.component?.is_jsx_root) {
                      return false;
                    }
                  }

                  return true;
                }}
                dragPreviewRender={({ clientOffset, isDragging, item }) => {
                  const node = item;
                  return (
                    <div
                      className={cx(
                        "bg-primary text-primary-foreground px-4 py-[2px] text-sm inline-grid rounded-[3px]"
                      )}
                    >
                      <div>
                        {node.data?.item?.name || (node.data as any)?.name}
                      </div>
                    </div>
                  );
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
