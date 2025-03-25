import { type CRDT } from "@/lib/crdt";
import type { PageContent } from "frontend/base/src/site/router";
import { type FC } from "react";
import { useSnapshot } from "valtio";

export const EditorPreview: FC<{ crdt: CRDT<PageContent> }> = ({ crdt }) => {
  const read = useSnapshot(crdt.write);
  return <>{JSON.stringify(read)}</>;
};
