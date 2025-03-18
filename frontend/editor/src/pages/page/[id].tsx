import { Button } from "@/components/ui/button";
import { connectCRDT, type CRDT } from "@/lib/crdt";
import { useEffect, useRef, useState, type FC } from "react";
import { useSnapshot } from "valtio";

export default () => {
  const ref = useRef({
    crdt: null as CRDT<{ A: string }> | null,
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

    render({});
  }, []);

  const crdt = ref.crdt;
  if (!crdt) return null;

  return (
    <div className="p-5 flex flex-col space-y-2 items-start">
      <Detail crdt={crdt} />
    </div>
  );
};

const Detail: FC<{ crdt: CRDT<any> }> = ({ crdt }) => {
  const can = useSnapshot(crdt.can);
  return (
    <>
      <Button href="/">Back</Button>
      <div className="flex space-x-2">
        <Button
          onClick={() => {
            crdt.write.A = "A";
          }}
        >
          Set A
        </Button>
        <Button
          onClick={() => {
            crdt.write.A = "B";
          }}
        >
          Set B
        </Button>
        <Button
          onClick={() => {
            crdt.write.A = "C";
          }}
        >
          Set C
        </Button>
        <Button
          onClick={() => {
            crdt.write.A = new Date().toISOString();
          }}
        >
          Set Date
        </Button>

        <Button
          onClick={() => {
            crdt.undo();
          }}
          disabled={!can.undo}
        >
          Undo
        </Button>

        <Button
          onClick={() => {
            crdt.redo();
          }}
          disabled={!can.redo}
        >
          Redo
        </Button>
      </div>
      {JSON.stringify(crdt.write)}
    </>
  );
};
