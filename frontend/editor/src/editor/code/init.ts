import type { Editor as MonacoEditor } from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
export type MonacoEditor = Parameters<OnMount>[0];
export type Monaco = Parameters<OnMount>[1];

export const code = {
  active: {
    editor: null as null | MonacoEditor,
    monaco: null as null | Monaco,
  },
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
        const import_code = (window as any).prasi_code;
        await import_code.init();
        for (const [k, v] of Object.entries(import_code)) {
          (code as any)[k] = v;
        }
      });

      this.loaded = true;
    }
  },
};
