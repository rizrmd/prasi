import { dir } from "utils/files/dir";
import { staticFile } from "utils/files/static";

export const asset = {
  prasi: await staticFile(dir.data("/prasi-static"), { index: "index.html" }),
  nova: await staticFile(dir.data("/nova-static"), {
    index: "index.html",
  }),
  psc: await staticFile(dir.root("/backend/srv/psc")),
};
