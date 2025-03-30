import type { Editor as MonacoEditor } from "@monaco-editor/react";

export const code = {
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
