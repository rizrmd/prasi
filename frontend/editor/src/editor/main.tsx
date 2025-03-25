import Dock from "@/components/ui/dock";
import { type CRDT } from "@/lib/crdt";
import { writeLayout } from "@/lib/editor-layout";
import type { PageContent } from "frontend/base/src/site/router";
import { type FC } from "react";
import { useSnapshot } from "valtio";

export const EditorMain: FC<{ crdt: CRDT<PageContent> }> = ({ crdt }) => {
  const readLayout = useSnapshot(writeLayout);
  return (
    <>
      <Dock
        position="left"
        isVisible={true}
        dimMode="none"
        size={readLayout.left.size}
        onSizeChange={(size) => {
          if (size > 0.05) writeLayout.left.size = size;
        }}
      ></Dock>
      <div
        className={cn(
          "flex flex-1 w-full h-full bg-amber-100",
          css`
            padding-left: ${100 * readLayout.left.size}%;
            padding-right: ${100 * readLayout.right.size}%;
          `
        )}
      >
        Halo world
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
