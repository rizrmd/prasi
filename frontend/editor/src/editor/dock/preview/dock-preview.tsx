import { editor } from "@/editor/state/layout";
import { subscribe, useSnapshot } from "valtio";
import { ViItem } from "base/prasi/vi/vi-item";
import type { PageContent } from "base/site/router";
import { useEffect } from "react";

export const PreviewDock = () => {
  const read = useSnapshot(editor.page.write) as PageContent;

  useEffect(() => {
    const router = editor.router;
    const unsub = subscribe(router.componentPendingRender, async (op) => {
      if (op.find((e) => e[0] === "set")) {
        console.log(op);
      }
    });
    return () => {
      unsub();
    };
  }, []);

  return read.childs.map((item, idx) => {
    return (
      <ViItem
        key={idx}
        item={item}
        is_layout={false}
        router={editor.router}
        paths={[]}
      />
    );
  });
};
