import { Spinner } from "@/components/ui/spinner";
import { flattenTree } from "@/editor/dock/structure/utils/flatten-tree";
import { EditorMain } from "@/editor/main";
import { editor } from "@/editor/state/editor";
import { connectCRDT, type CRDT } from "@/lib/crdt";
import type { EBaseComp } from "base/prasi/logic/types";
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
      async onUpdate(data) {
        const comps = {} as Record<string, EBaseComp>;
        const promises = [] as Promise<void>[];
        for (const id of data.component_ids) {
          if (!editor.comp[id]) {
            const p = new Promise<void>((resolve) => {
              editor.comp[id] = connectCRDT({
                type: "comp",
                id,
                render: () => {
                  render({});
                },
                onUpdate(data) {
                  if (!comps[id]) {
                    comps[id] = data;
                    resolve();
                  }
                },
              });
            });
            promises.push(p);
          }
        }

        await Promise.all(promises);
        const tree = flattenTree(data.childs, comps, { root: { item: data } });
        editor.tree.page.list = tree.models;
        editor.tree.page.map = tree.map;
        editor.tree.render();
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
