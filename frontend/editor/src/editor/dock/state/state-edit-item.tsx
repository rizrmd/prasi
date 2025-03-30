import { Spinner } from "@/components/ui/spinner";
import { code } from "@/editor/code/init";
import StateTabs from "./state-tabs";
import type { FC } from "react";

code.init();
export const StateEditItem: FC<{ name: string }> = ({ name }) => {
  const Editor = code.MonacoEditor;
  return (
    <StateTabs>
      {({ tab }) => {
        return (
          <div className="w-[500px] h-[300px] flex flex-col">
            {name}
            {tab === "usage" && <>mokopang</>}
            {tab === "value" && (
              <>
                {!Editor ? (
                  <Spinner />
                ) : (
                  <Editor
                    width="500px"
                    height="300px"
                    language="typescript"
                    defaultValue=""
                    options={{
                      fontSize: 12,
                      minimap: {
                        enabled: false,
                      },
                      lineNumbers: "off",
                      folding: false,
                      scrollBeyondLastLine: false,
                    }}
                  />
                )}
              </>
            )}
          </div>
        );
      }}
    </StateTabs>
  );
};
