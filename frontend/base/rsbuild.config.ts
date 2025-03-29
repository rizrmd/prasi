import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact({ swcReactOptions: { development: false } })],
  source: {
    entry: {
      index: "./src/index.tsx",
    },
    transformImport: [
      {
        libraryName: "lodash",
        customName: "lodash/{{ member }}",
      },
    ],
  },
  dev: {
    progressBar: false,
    hmr: false,
  },

  tools: {
    rspack: {
      ignoreWarnings: [
        /require function is used in a way/,
        /the request of a dependency is an expression/,
      ],
    },
  },
  output: {
    cleanDistPath: true,
    sourceMap: {
      js: "source-map",
    },
    distPath: { root: "../../../data/frontend/base" },
    filename: { js: `[name].bundle.js` },
  },

  server: {
    middlewareMode: true,
  },
});
