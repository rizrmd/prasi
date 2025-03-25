import { EditorMain } from "@/editor/main";
import { connectCRDT, type CRDT } from "@/lib/crdt";
import { useEffect, useRef, useState } from "react";

export default () => {
  const ref = useRef({
    crdt: null as CRDT<any> | null,
  }).current;
  const render = useState({})[1];

  useEffect(() => {
    ref.crdt = connectCRDT({
      type: "page",
      id: params.id,
      render: () => {
        render({});
      },
    });

    // Wait for the WebSocket connection to be established before initial render
    if (ref.crdt.write) {
      render({});
    }
  }, []);

  const crdt = ref.crdt;
  if (!crdt) return null;

  return <EditorMain crdt={crdt} />;
};
