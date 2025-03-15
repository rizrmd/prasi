import { createRoot } from "react-dom/client";
import { initGlobal } from "./global";

await initGlobal();

document.body.innerHTML = '<div id="app"></div>';
const div = document.getElementById("app");
if (div) {
  const root = createRoot(div);
  root.render(<h1>oaisnf</h1>);
}