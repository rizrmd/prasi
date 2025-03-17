import { Button } from "@/components/ui/button";
import { DataTable } from "@/essentials/list/data-table";
import { connectCRDT, type CRDT } from "@/lib/crdt";
import { useEffect, useRef, useState } from "react";

export default () => {
  const ref = useRef({
    crdt: null as CRDT<{ mantap: string }> | null,
  }).current;
  const render = useState({})[1];

  useEffect(() => {
    ref.crdt = connectCRDT({
      path: "/crdt/page/" + params.id,
      map: "entry",
      room: "page-" + params.id,
    });
    render({});
  }, []);

  return (
    <div className="p-5 flex flex-col space-y-2 items-start">
      <Button href="/">Back</Button>
      <Button href={`/site/${Date.now()}`}>
        makopang{JSON.stringify(window.params)}
      </Button>
      <DataTable data={[{ id: "123" }]} />
    </div>
  );
};
