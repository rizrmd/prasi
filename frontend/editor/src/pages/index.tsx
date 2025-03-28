import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default () => {
  useEffect(() => {
    (async () => {
      db.page.findFirst();
    })();
  }, []);

  return (
    <div className="p-4">
      <Button href="/page/mako">Hello world</Button>
    </div>
  );
};
