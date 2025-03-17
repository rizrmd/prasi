import { routeBuild } from "prasi/page/route-build";
import { frontend } from "utils/build/frontend";
import { dir } from "utils/dir";

export const initProd = async () => {
  await routeBuild();
  await frontend.build({
    root: dir.path("frontend:base"),
    entryfile: dir.path("frontend:base/src/index.tsx"),
    outdir: dir.path("data:frontend/base"),
    config: {
      externals: undefined,
    },
  });
  await frontend.tailwind({
    root: dir.path("frontend:base/src"),
    input: dir.path("frontend:base/src/index.css"),
    output: dir.path("data:frontend/base/index.css"),
    mode: "prod",
  });
  await frontend.build({
    root: dir.path("frontend:editor"),
    entryfile: dir.path("frontend:editor/src/index.tsx"),
    outdir: dir.path("data:frontend/editor"),
  });
  await frontend.tailwind({
    root: dir.path("frontend:editor/src/"),
    input: dir.path("frontend:editor/src/index.css"),
    output: dir.path("data:frontend/editor/main.css"),
    mode: "prod",
  });
};
