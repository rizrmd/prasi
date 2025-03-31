import { editor } from "@/editor/state/layout";
import { useSnapshot } from "valtio";
import {
  Tree,
  getBackendOptions,
  MultiBackend,
  type NodeModel,
} from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";
import type { PNode } from "base/prasi/logic/types";

export const StructureDock = () => {
  const read = useSnapshot(editor.page.write);
  const TypedTree = Tree<PNode>;
  
  return (
    <div className="relative overflow-auto">
      <div className="absolute inset-0">
        <DndProvider backend={MultiBackend} options={getBackendOptions()}>
          <TypedTree
            tree={[]}
            rootId={0}
            onDrop={() => {}}
            render={(node, { depth, isOpen, onToggle }) => (
              <div style={{ marginLeft: depth * 10 }}>
                {node.droppable && (
                  <span onClick={onToggle}>{isOpen ? "[-]" : "[+]"}</span>
                )}
                {node.text}
              </div>
            )}
          />
        </DndProvider>
      </div>
    </div>
  );
};
