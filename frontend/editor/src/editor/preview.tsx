import { type FC } from "react";
import { snapshot, useSnapshot } from "valtio";
import { editorState } from "./state/layout";

export const EditorPreview: FC<{}> = ({}) => {
  const read = useSnapshot(editorState.crdt!.write);
  return <>{JSON.stringify(snapshot(editorState.crdt!.write))}</>;
};
