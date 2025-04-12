import type { OnMount } from "@monaco-editor/react";
import type { Monaco, MonacoEditor } from "../init";
import { getWorker, MonacoJsxSyntaxHighlight } from "../jsx-highlight";

type CompilerOptions = Parameters<
  Parameters<OnMount>[1]["languages"]["typescript"]["typescriptDefaults"]["setCompilerOptions"]
>[0];

export const monacoEnableJSX = async (
  editor: MonacoEditor,
  monaco: Monaco,
  arg?: {}
) => {
  monaco.languages.register({ id: "typescript" });
  if (editor.getModel()) {
    // jsx syntax highlight
    const jsxHgController = new MonacoJsxSyntaxHighlight(getWorker(), monaco);

    if (typeof editor.getModel === "function") {
      const { highlighter } = jsxHgController.highlighterBuilder({
        editor: editor,
      });
      highlighter();
    }
    editor.onDidChangeModelContent(() => {
      if (typeof editor.getModel === "function") {
        try {
          const { highlighter } = jsxHgController.highlighterBuilder({
            editor: editor,
          });
          highlighter();
        } catch (e) {}
      }
    });
  }

  const compilerOptions: CompilerOptions = {
    // note: ReactJSX ga bisa solve type buat <div> etc...
    // yg bisa solve cmn JsxEmit.React
    // tapi kalau JsxEmit.React itu misal mau ada export, kudu ada import React from "react"
    jsx: monaco.languages.typescript.JsxEmit.React,
    target: monaco.languages.typescript.ScriptTarget.ES2015,
    allowNonTsExtensions: true,
    lib: ["es6", "dom"],
    module: monaco.languages.typescript.ModuleKind.ESNext,
    esModuleInterop: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  };

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
    compilerOptions
  );
};

export const register = (monaco: Monaco, source: string, uri: string) => {
  const model = monaco.editor.getModels().find((e) => {
    return e.uri.toString() === uri;
  });

  if (model) {
    model.setValue(source);
  } else {
    monaco.editor.createModel(source, "typescript", monaco.Uri.parse(uri));
  }
};
