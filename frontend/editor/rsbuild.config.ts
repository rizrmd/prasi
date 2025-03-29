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
      externals: {
        react: "window.React",
        "react-dom": "window.ReactDOM",
        "react/jsx-dev-runtime": "window.JSXDevRuntime",
        "react/jsx-runtime": "window.JSXRuntime",
      },
    },
  },
  output: {
    cleanDistPath: true,
    sourceMap: {
      js: "source-map",
    },
    distPath: { root: "../../../data/frontend/editor" },
    filename: { js: `[name].bundle.js` },
    assetPrefix: "/_dist/editor",
  },

  server: {
    middlewareMode: true,
  },
});
