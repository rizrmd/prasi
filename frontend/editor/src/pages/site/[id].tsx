import { Button } from "@/components/ui/button";
import { DataTable } from "@/essentials/list/data-table";

export default () => {
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
