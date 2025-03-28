import { type FC } from "react";
import { useSnapshot } from "valtio";
import { editorState } from "./state/layout";

export const EditorPreview: FC<{}> = ({}) => {
  const read = useSnapshot(editorState.crdt!.write);
  return <>{JSON.stringify(read)}</>;
};
