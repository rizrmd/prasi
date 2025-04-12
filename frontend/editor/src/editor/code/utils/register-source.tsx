import type { Monaco } from "../init";

export const registerSource = (
  monaco: Monaco,
  source: string,
  uri: string,
  onChange?: (src: string, event: any) => void
) => {
  const model = monaco.editor.getModels().find((e) => {
    return e.uri.toString() === uri;
  });

  if (model) {
    model.setValue(source);
    return model;
  } else {
    const model = monaco.editor.createModel(
      source,
      "typescript",
      monaco.Uri.parse(uri)
    );
    if (onChange) {
      model.onDidChangeContent((e) => {
        onChange(model.getValue(), e);
      });
    }
    return model;
  }
};
