import Dock from "@/components/ui/dock";
import { Spinner } from "@/components/ui/spinner";
import { editor, writeLayout } from "@/editor/state/editor";
import hotkeys from "hotkeys-js";
import { useEffect, type FC } from "react";
import { useSnapshot } from "valtio";
import { CenterDock } from "./dock/center";
import { LeftDock } from "./dock/left";

export const EditorMain: FC = () => {
  const readLayout = useSnapshot(writeLayout);
  const read = useSnapshot(editor.page.write);
  useEffect(() => {
    hotkeys("ctrl+z, cmd+z", (event) => {
      editor.page.undo();
    });
    hotkeys("ctrl+shift+z, cmd+shift+z, ctrl+y", (event) => {
      editor.page.redo();
    });
    hotkeys("ctrl+s, cmd+s", (event) => {
      event.preventDefault();
    });
  }, []);

  if (!read.id) return <Spinner size="lg" />;

  return (
    <>
      <Dock
        position="left"
        isVisible={true}
        dimMode="none"
        size={readLayout.left.size}
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
          "flex flex-1 w-full h-full",
          css`
            padding-left: ${100 * readLayout.left.size}%;
            padding-right: ${100 * readLayout.right.size}%;
          `
        )}
      >
        <CenterDock />
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
