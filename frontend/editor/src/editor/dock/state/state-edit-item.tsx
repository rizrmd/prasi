import { Editor } from "@/editor/code/Editor";
import { code } from "@/editor/code/init";
import type { PageState } from "base/site/router";
import { Resizable } from "re-resizable";
import { useRef, type FC } from "react";
import StateTabs from "./state-tabs";

code.init();
export const StateEditItem: FC<{
  read: PageState;
  write: PageState;
}> = ({ read, write }) => {
  const ref = useRef({ w: 0, h: 0 }).current;
  const div = useRef<HTMLDivElement>(null);
  if (!ref.w) {
    const size = localStorage.getItem(`code.size`) || "500,400";
    const [w, h] = size.split(",").map((i) => parseInt(i));
    ref.w = w || 500;
    ref.h = h || 400;
  }

  return (
    <StateTabs read={read} write={write} onTypeChanged={() => {}}>
      {({ tab }) => {
        return (
          <Resizable
            defaultSize={{
              width: ref.w,
              height: ref.h,
            }}
            onResize={(e, dir, _, d) => {
              const w = ref.w + d.width;
              const h = ref.h + d.height;
              localStorage.setItem(`code.size`, `${w},${h}`);
            }}
          >
            {tab === "usage" && <>---</>}
            {tab === "value" && (
              <div className="flex flex-1 w-full h-full" ref={div}>
                <Editor
                  div={div}
                  source={{
                    uri: "file:///state.tsx",
                    content: read.initial_value,
                  }}
                  onChange={({ value }) => {
                    write.initial_value = value;
                  }}
                />
              </div>
            )}
          </Resizable>
        );
      }}
    </StateTabs>
  );
};
