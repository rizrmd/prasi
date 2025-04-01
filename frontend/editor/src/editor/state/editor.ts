import type { CRDT } from "@/lib/crdt";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import type { EBaseComp, PNode } from "base/prasi/logic/types";
import type { PageContent, Router } from "base/site/router";
import { proxy, ref } from "valtio";

export const writeLayout = proxy({
  left: {
    size:
      parseFloat(localStorage.getItem("prasi.editor.left.size") || "0") || 0.15,
  },
  right: {
    size: 0.2,
  },
});
export const editor = {
  page: null as unknown as CRDT<PageContent>,
  comp: {} as Record<string, CRDT<EBaseComp>>,
  tree: proxy({
    current: {
      mode: "page" as "page" | "component",
      get: ref(() => {
        const { mode } = editor.tree.current;
        if (mode === "page") {
          return editor.tree.page;
        } else {
          if (editor.tree.comp[mode]) {
            return editor.tree.comp[mode];
          }
        }

        return editor.tree.page;
      }),
      update: ref(
        (
          fn: (arg: {
            tree: {
              list: NodeModel<PNode>[];
              map: Record<string, PNode>;
            };
            find: (id: string | number) => NodeModel<PNode> | null;
            childrenOf: (id: string | number) => NodeModel<PNode>[];
          }) => void
        ) => {
          const { mode } = editor.tree.current;
          let tree = null;
          if (mode === "page") {
            tree = editor.tree.page;
          } else {
            tree = editor.tree.comp[mode];
          }
          if (tree) {
            fn({
              tree,
              find: (id) => {
                const node = tree.list.find(
                  (i) => i.id === id
                ) as NodeModel<PNode>;
                if (node) {
                  return node;
                }
                return null;
              },
              childrenOf: (id) => {
                const node = tree.list.filter(
                  (i) => i.parent === id
                ) as NodeModel<PNode>[];
                return node;
              },
            });
          }
        }
      ),
    },
    page: { list: [] as NodeModel<PNode>[], map: {} as Record<string, PNode> },
    comp: {} as Record<
      string,
      { list: NodeModel<PNode>[]; map: Record<string, PNode> }
    >,
    select: "",
    renaming: {
      id: "",
      name: "",
    },
  }),
  bread: {
    list: [] as { id: string; component_id?: string; name: string }[],
  },
  router: {
    routes: [],
    current: null,
    components: {},
    pages: {},
    render: () => {},
    componentPendingRender: proxy({} as Record<string, boolean>),
    init(pages) {},
    layout: null,
    match(url) {
      return null;
    },
    async navigate() {},
    page: null,
  } as const satisfies Router,
};
