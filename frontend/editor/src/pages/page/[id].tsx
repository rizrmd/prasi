import { Spinner } from "@/components/ui/spinner";
import { EditorMain } from "@/editor/main";
import { editor } from "@/editor/state/layout";
import { connectCRDT, type CRDT } from "@/lib/crdt";
import { createViWrite } from "base/prasi/vi/vi-state";
import type { PageContent } from "base/site/router";
import { useEffect, useRef, useState } from "react";

export default () => {
  const ref = useRef({
    crdt: null as CRDT<any> | null,
  }).current;
  const render = useState({})[1];

  useEffect(() => {
    window.viWrite = createViWrite();
    ref.crdt = connectCRDT<PageContent>({
      type: "page",
      id: params.id,
      render: () => {
        render({});
      },
      onUpdate(data) {
        for (const id of data.component_ids) {
          if (!editor.comp[id]) {
            editor.comp[id] = connectCRDT({
              type: "comp",
              id,
              render: () => {
                render({});
              },
              onUpdate(data) {},
            });
          }
        }
      },
    });

    // Wait for the WebSocket connection to be established before initial render
    if (ref.crdt.write) {
      render({});
    }
  }, []);

  const crdt = ref.crdt;
  if (!crdt) return <Spinner size="lg" />;

  if (editor.page !== crdt) {
    if (editor.page) {
      setTimeout(() => {
        render({});
      }, 0);
    }
    editor.page = crdt;
  }

  return <EditorMain />;
};
