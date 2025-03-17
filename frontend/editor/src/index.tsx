import { EditorRoot, root } from "./libs/root";

window.initSite({
  site_id: "a0170f25-a9d9-4646-a970-f1c2e5747971",
  site_url: "prasi.avolut.com",
  custom: {
    root: <EditorRoot />,
    route(path) {
      root.page = <>{path}</>;
      root.render();
    },
  },
});
