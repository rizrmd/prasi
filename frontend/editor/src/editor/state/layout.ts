import type { CRDT } from "@/lib/crdt";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import type { EBaseComp, PNode } from "base/prasi/logic/types";
import type { PageContent, Router } from "base/site/router";
import { proxy } from "valtio";

export const writeLayout = proxy({
  left: {
    size: 0.15,
  },
  right: {
    size: 0.2,
  },
});
export const editor = {
  page: null as unknown as CRDT<PageContent>,
  comp: {} as Record<string, CRDT<EBaseComp>>,
  tree: {
    current: {
      mode: "page" as "page" | "component",
    },
    page: { list: [] as NodeModel<PNode>[], map: {} as Record<string, PNode> },
    comp: {} as Record<
      string,
      { list: NodeModel<PNode>[]; map: Record<string, PNode> }
    >,
  },
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
