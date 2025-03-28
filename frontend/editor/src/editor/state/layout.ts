import type { CRDT } from "@/lib/crdt";
import type { PageContent } from "base/site/router";
import { proxy } from "valtio";

export const writeLayout = proxy({
  left: {
    size: 0.15,
  },
  right: {
    size: 0.2,
  },
});
export const editorState = {
  crdt: null as unknown as CRDT<PageContent>,
};
