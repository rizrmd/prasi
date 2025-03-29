import { createRoot } from "react-dom/client";
import { initGlobal } from "./libs/init-global";

initGlobal((rootElement) => {
  let div = document.getElementById("app");
  if (!div) {
    div = document.createElement("div");
    div.id = "app";
    document.body.prepend(div);
  } 

  if (div) {
    const root = createRoot(div);
    root.render(rootElement);
  }
});
