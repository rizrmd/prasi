import { Spinner } from "@/components/ui/spinner";
import { useLocal } from "base/libs/use-local";
import { useEffect, type FC } from "react";
import { code, type Monaco, type MonacoEditor } from "./init";
import { jsxColorScheme } from "./utils/jsx-style";
import { registerReact } from "./utils/register-react";
import { registerSource } from "./utils/register-source";

export const Editor: FC<{
  onChange?: (arg: {
    value: string;
    editor: MonacoEditor;
    monaco: Monaco;
    event: any;
  }) => void;
  source: { uri: string; content: string };
  className?: string;
  div: React.RefObject<HTMLDivElement | null>;
}> = ({ className, onChange, div, source }) => {
  const local = useLocal({
    editor: null as null | MonacoEditor,
    width: undefined as undefined | number,
    height: undefined as undefined | number,
    loading: true,
  });
  const Editor = code.MonacoEditor;

  useEffect(() => {
    const preventCtrlP = function (event: any) {
      if (
        event.keyCode === 80 &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey
      ) {
        event.preventDefault();
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        } else {
          event.stopPropagation();
        }
        local.editor?.trigger(
          "ctrl-shift-p",
          "editor.action.quickCommand",
          null
        );
        return;
      }
    };
    window.addEventListener("keydown", preventCtrlP, true);
    return () => {
      window.removeEventListener("keydown", preventCtrlP, true);
    };
  }, []);

  useEffect(() => {
    const el = div?.current;
    if (el) {
      const observer = new ResizeObserver((entries) => {
        const rect = entries[0]?.contentRect;
        if (rect) {
          local.width = rect.width;
          local.height = rect.height;
        }
        local.render();
        local.editor?.layout();
      });
      observer.observe(el);

      return () => {
        observer.unobserve(el);
      };
    }
  }, [div?.current]);

  if (!Editor || (div && (!local.width || !local.height))) {
    return (
      <div className="relative w-full h-full items-center justify-center flex flex-1">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {local.loading && (
        <div className="absolute inset-0">
          <div className="relative w-full h-full items-center justify-center flex flex-1">
            <Spinner />
          </div>
        </div>
      )}
      <Editor
        className={cx(jsxColorScheme, className)}
        loading={
          <div className="relative w-full h-full items-center justify-center flex flex-1">
            <Spinner />
          </div>
        }
        width={local.width}
        height={local.height}
        language={"typescript"}
        defaultValue=""
        options={{
          minimap: { enabled: false },
          wordWrap: "wordWrapColumn",
          autoClosingBrackets: "always",
          autoIndent: "full",
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          useTabStops: true,
          automaticLayout: true,
          fontFamily: "'Liga Menlo', monospace",
          fontLigatures: true,
          lineNumbersMinChars: 2,
          suggest: {
            showWords: false,
            showKeywords: false,
          },
        }}
        onMount={async (editor, monaco) => {
          monaco.editor.getModels().forEach((model) => {
            model.dispose();
          });
          code.active.editor = editor;
          code.active.monaco = monaco;
          await registerReact(monaco);

          registerSource(monaco, source.uri, source.content, (src, event) => {
            onChange?.({
              value: src,
              editor,
              monaco,
              event,
            });
          });

          local.loading = false;
          local.render();
        }}
      />
    </>
  );
};
