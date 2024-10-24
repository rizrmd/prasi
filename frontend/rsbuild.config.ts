import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: "./public/index.html",
  },
  source: {
    entry: {
      index: "./src/index.tsx",
    },
  },
  dev: {
    progressBar: false,
  },

  tools: {
    rspack: {
      ignoreWarnings: [/require function is used in a way/],
    },
  },
  output: {
    cleanDistPath: true,
    sourceMap: {
      js: "source-map",
    },
    distPath: { root: "../../data/prasi-static" },
    filename: { js: `[name].bundle.js` },
  },
});
