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
      <Button href="/page/94d7f72a-4184-4cb0-b6b9-c615ad4c60c9">Hello world</Button>
    </div>
  );
};
