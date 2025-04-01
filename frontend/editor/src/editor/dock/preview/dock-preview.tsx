import { editor } from "@/editor/state/editor";
import { ViItem } from "base/prasi/vi/vi-item";
import { useEffect } from "react";
import { snapshot, subscribe } from "valtio";

export const PreviewDock = () => {
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

  return editor.page.write.childs.map((item, idx) => {
    return (
      <ViItem
        key={idx}
        item={item}
        is_layout={false}
        router={editor.router}
        paths={[]}
        error={(e) => {
          console.error(e);
        }}
      />
    );
  });
};
