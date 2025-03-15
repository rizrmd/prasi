import { createRoot } from "react-dom/client";

// Clear the existing HTML content
document.body.innerHTML = '<div id="app"></div>';

// Render your React component instead
const div = document.getElementById("app");
if (div) {
  const root = createRoot(div);
  const Marko = (await import("./marko")).Marko;
  root.render(
    <h1>
      Hello kun <Marko />
    </h1>
  );
}
