import type { Editor as MonacoEditor } from "@monaco-editor/react";

const code = {
  MonacoEditor: null as typeof MonacoEditor | null,
  getTailwindStyles: null as null | ((contents: string[]) => Promise<string>),
  pending: null as null | Promise<void>,
  loaded: false,
  async init() {
    if (this.pending) {
      await this.pending;
    }
    if (!this.pending) {
      this.pending = new Promise<void>(async (resolve) => {
        await Promise.all([
          (async () => {
            const monaco = await import("monaco-editor");
            const monaco_react = await import("@monaco-editor/react");
            const { configureMonacoTailwindcss, tailwindcssData } =
              await import("monaco-tailwindcss");

            monaco_react.loader.config({
              monaco,
            });

            self.MonacoEnvironment = {
              getWorker(_, label: any) {
                switch (label) {
                  case "editorWorkerService":
                    return new Worker(
                      new URL(
                        "monaco-editor/esm/vs/editor/editor.worker",
                        import.meta.url
                      )
                    );
                  case "css":
                  case "less":
                  case "scss":
                    return new Worker(
                      new URL(
                        "monaco-editor/esm/vs/language/css/css.worker",
                        import.meta.url
                      )
                    );
                  case "handlebars":
                  case "html":
                  case "razor":
                    return new Worker(
                      new URL(
                        "monaco-editor/esm/vs/language/html/html.worker",
                        import.meta.url
                      )
                    );
                  case "json":
                    return new Worker(
                      new URL(
                        "monaco-editor/esm/vs/language/json/json.worker",
                        import.meta.url
                      )
                    );
                  case "javascript":
                  case "typescript":
                    return new Worker(
                      new URL(
                        "monaco-editor/esm/vs/language/typescript/ts.worker",
                        import.meta.url
                      )
                    );
                  case "tailwindcss":
                    return new Worker(
                      new URL(
                        "monaco-tailwindcss/tailwindcss.worker",
                        import.meta.url
                      )
                    );
                  default:
                    throw new Error(`Unknown label ${label}`);
                }
              },
            };
            monaco.languages.css.cssDefaults.setOptions({
              data: {
                dataProviders: {
                  tailwindcssData,
                },
              },
            });
            await monaco_react.loader.init();

            const res = configureMonacoTailwindcss(monaco, {
              tailwindConfig: {
                blocklist: [
                  "absolute",
                  "flex",
                  "relative",
                  "inset-0",
                  "overflow-auto",
                  "block",
                  "flex",
                  "flex-row",
                  "border",
                  "px-1",
                  "p-1",
                  "m-1",
                  "space-x-1",
                  "flex-col",
                  "align-items",
                ],
              },
            });
            this.getTailwindStyles = async (contents: string[]) => {
              return await res.generateStylesFromContent(
                `@tailwind utilities;`,
                contents.map((e) => ({ content: e, extension: "tsx" }))
              );
            };
            code.MonacoEditor = monaco_react.Editor;
          })(),
        ]);
        resolve();
      });
      await this.pending;
      this.loaded = true;
    }
  },
};
(window as any).prasi_code = code;
