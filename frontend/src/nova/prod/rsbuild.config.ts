import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./root/main.tsx" },
    alias: {
      crdt: ["../../nova/ed/crdt"],
      utils: ["../../utils"],
      base: ["../../base"],
      logic: ["../../nova/ed/logic"],
      expr: ["../../nova/ed/popup/script/expr"],
      popup: ["../../nova/ed/popup"],
      prod: ["../../nova/prod"],
      vi: ["../../nova/vi"],
    },
    aliasStrategy: "prefer-alias",
  },
  output: {
    cleanDistPath: true,
    sourceMap: {
      js: "source-map",
    },
    distPath: { root: "./../../../../../data/nova-static" },
    assetPrefix: "/nova",
  },
  dev: {
    liveReload: false,
    hmr: false,
    writeToDisk: true,
    progressBar: false,
    assetPrefix: "/nova",
    lazyCompilation: true,
  },
  server: {
    port: 14314,
  },
});
