import Dock from "@/components/ui/dock";
import { Spinner } from "@/components/ui/spinner";
import { editorState, writeLayout } from "@/editor/state/layout";
import { type FC } from "react";
import { useSnapshot } from "valtio";
import { LeftDock } from "./dock/left";
import { EditorPreview } from "./preview";

export const EditorMain: FC = () => {
  const readLayout = useSnapshot(writeLayout);
  const read = useSnapshot(editorState.crdt.write);

  if (!read.id) return <Spinner size="lg" />;

  return (
    <>
      <Dock
        position="left"
        isVisible={true}
        dimMode="none"
        size={
          parseFloat(localStorage.getItem("prasi.editor.left.size") || "0") ||
          readLayout.left.size
        }
        onSizeChange={(size) => {
          if (size > 0.09) {
            writeLayout.left.size = size;
            localStorage.setItem("prasi.editor.left.size", size.toString());
          }
        }}
      >
        <LeftDock />
      </Dock>
      <div
        className={cn(
          "flex flex-1 w-full h-full bg-amber-100",
          css`
            padding-left: ${100 * readLayout.left.size}%;
            padding-right: ${100 * readLayout.right.size}%;
          `
        )}
      >
        <EditorPreview />
      </div>
      <Dock
        position="right"
        isVisible={true}
        dimMode="none"
        size={readLayout.right.size}
        onSizeChange={(size) => {
          writeLayout.right.size = size;
        }}
      ></Dock>
    </>
  );
};
