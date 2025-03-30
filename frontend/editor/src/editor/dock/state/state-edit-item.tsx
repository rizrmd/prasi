import { Spinner } from "@/components/ui/spinner";
import { code } from "@/editor/code/init";
import StateTabs from "./state-tabs";
import type { FC } from "react";
import type { PageState } from "base/site/router";

code.init();
export const StateEditItem: FC<{
  read: PageState;
  write: PageState;
}> = ({ read, write }) => {
  const Editor = code.MonacoEditor;
  return (
    <StateTabs read={read} write={write} onTypeChanged={() => {}}>
      {({ tab }) => {
        return (
          <div className="w-[500px] h-[300px] flex flex-col">
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
                    value={read.initial_value}
                    onChange={(value) => {
                      write.initial_value = value || "";
                    }}
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
