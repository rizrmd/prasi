import { activateItem, active } from "logic/active";
import { Monaco, MonacoEditor } from "./enable-jsx";
import { ScriptModel } from "crdt/node/load-script-models";
import { PG } from "logic/ed-global";

export const registerEditorOpener = (
  editor: MonacoEditor,
  monaco: Monaco,
  p: PG
) => {
  const editorService = (editor as any)._codeEditorService;
  const openEditorBase = editorService.openCodeEditor.bind(editorService);
  editorService.openCodeEditor = async (input: any, source: any) => {
    const result = await openEditorBase(input, source);
    if (result === null) {
      const model = monaco.editor.getModel(input.resource);
      const prasi_model = (model as any).prasi_model as ScriptModel;
      if (model && prasi_model.id) {
        p.script.monaco_selection = input.options.selection;

        // active.item_id = prasi_model.id;
        // editor.setModel(model);
        // editor.setSelection(input.options.selection);

        activateItem(p, prasi_model.id);

      }
    }
    return result; // always return the base result
  };
};
