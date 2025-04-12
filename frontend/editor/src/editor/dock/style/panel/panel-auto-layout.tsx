import { Tooltip } from "@/components/ui/tooltip-simple";
import { FieldBtnRadio } from "../field/field-btn-radio";
import { BoxSep } from "../ui/box-sep";
import { Down, TapDown, TapRight } from "../ui/icons";
import { Popover } from "@/components/ui/popover-simple";
import { Button } from "../ui/button";

export const PanelAutoLayout = () => {
  return (
    <>
      <div className="flex items-stretch justify-between">
        <div className="flex flex-col items-stretch justify-around w-[125px] space-y-[5px]">
          <div
            className={cx(
              "flex flex-row space-x-1 items-stretch"
              // css`
              //   .fg:hover .other {
              //     opacity: 1 !important;
              //   }
              // `
            )}
          >
            <div
              className={cx(
                `flex flex-row space-x-1 border items-stretch ${
                  false
                    ? "border-transparent hover:border-slate-300"
                    : "border-slate-300"
                } fg`,
                css`
                  padding-left: 1px;
                `
              )}
            >
              <BoxSep
                className={cx(
                  "justify-between my-0.5 mx-[1px]",
                  css`
                    padding: 0px;
                    & > button {
                      min-width: 0px;
                      flex: 1;
                      padding: 2px 4px;
                    }
                  `
                )}
              >
                <FieldBtnRadio
                  items={{
                    col: (
                      <Tooltip content="Direction: Column">
                        <div>
                          <TapDown />
                        </div>
                      </Tooltip>
                    ),
                    row: (
                      <Tooltip content="Direction: Row">
                        <div>
                          <TapRight />
                        </div>
                      </Tooltip>
                    ),
                    // wrap: (
                    //   <Tooltip content="Wrap">
                    //     <div>
                    //       <Wrap />
                    //     </div>
                    //   </Tooltip>
                    // ),
                  }}
                  value={""}
                  disabled={false}
                  update={(dir) => {}}
                />
              </BoxSep>
              <Popover
                content={
                  <div className="flex flex-col">
                    <p>Direction</p>
                    <BoxSep
                      className={cx(
                        "justify-between",
                        css`
                          padding: 0px;
                          & > button {
                            min-width: 0px;
                            flex: 1;
                            padding: 2px 4px;
                          }
                        `
                      )}
                    >
                      <FieldBtnRadio
                        items={{
                          col: (
                            <Tooltip content="Direction: Column">
                              <div>
                                <TapDown />
                              </div>
                            </Tooltip>
                          ),
                          "col-reverse": (
                            <Tooltip content="Direction: Column Reverse">
                              <div className="rotate-180">
                                <TapDown />
                              </div>
                            </Tooltip>
                          ),
                          row: (
                            <Tooltip content="Direction: Row">
                              <div>
                                <TapRight />
                              </div>
                            </Tooltip>
                          ),
                          "row-reverse": (
                            <Tooltip content="Direction: Row Reverse">
                              <div className="rotate-180">
                                <TapRight />
                              </div>
                            </Tooltip>
                          ),
                        }}
                        value={""}
                        disabled={false}
                        update={(dir) => {}}
                      />
                    </BoxSep>
                  </div>
                }
              >
                <div
                  onClick={() => {}}
                  className={cn(
                    `px-1 flex flew-row items-center justify-center border-l border-l-slate-300 hover:bg-blue-100 bg-white other cursor-pointer`
                  )}
                >
                  <Down />
                </div>
              </Popover>
            </div>
            <Tooltip content={"No Wrap"}>
              <Button className={cx("flex-1")} onClick={() => {}}>
                {true ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 436 128"
                  >
                    <path
                      fill={"currentColor"}
                      d="M38.4 0A38.4 38.4 0 000 38.4v51.2A38.4 38.4 0 0038.4 128h51.2A38.401 38.401 0 00128 89.6V38.4A38.402 38.402 0 0089.6 0H38.4zM25.6 38.4a12.8 12.8 0 0112.8-12.8h51.2a12.8 12.8 0 0112.8 12.8v51.2a12.802 12.802 0 01-12.8 12.8H38.4a12.802 12.802 0 01-12.8-12.8V38.4zm128 0A38.402 38.402 0 01192 0h51.2a38.4 38.4 0 0138.4 38.4v51.2a38.401 38.401 0 01-38.4 38.4H192a38.402 38.402 0 01-38.4-38.4V38.4zM192 25.6a12.8 12.8 0 00-12.8 12.8v51.2a12.802 12.802 0 0012.8 12.8h51.2A12.8 12.8 0 00256 89.6V38.4a12.802 12.802 0 00-12.8-12.8H192zm115.2 12.8A38.402 38.402 0 01345.6 0h51.2a38.402 38.402 0 0138.4 38.4v51.2a38.401 38.401 0 01-38.4 38.4h-51.2a38.403 38.403 0 01-38.4-38.4V38.4zm38.4-12.8a12.8 12.8 0 00-12.8 12.8v51.2a12.802 12.802 0 0012.8 12.8h51.2a12.8 12.8 0 0012.8-12.8V38.4a12.802 12.802 0 00-12.8-12.8h-51.2z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill={"currentColor"}
                      d="M3 4a1.5 1.5 0 00-1.5 1.5v2A1.5 1.5 0 003 9h2a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 005 4H3zm-.5 1.5A.5.5 0 013 5h2a.5.5 0 01.5.5v2A.5.5 0 015 8H3a.5.5 0 01-.5-.5v-2zM3 10a1.5 1.5 0 00-1.5 1.5v2A1.5 1.5 0 003 15h2a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 005 10H3zm-.5 1.5A.5.5 0 013 11h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5v-2zm5-6A1.5 1.5 0 019 4h2a1.5 1.5 0 011.5 1.5v2A1.5 1.5 0 0111 9H9a1.5 1.5 0 01-1.5-1.5v-2zM9 5a.5.5 0 00-.5.5v2A.5.5 0 009 8h2a.5.5 0 00.5-.5v-2A.5.5 0 0011 5H9zm0 5a1.5 1.5 0 00-1.5 1.5v2A1.5 1.5 0 009 15h2a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 0011 10H9zm-.5 1.5A.5.5 0 019 11h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H9a.5.5 0 01-.5-.5v-2zm5-6A1.5 1.5 0 0115 4h2a1.5 1.5 0 011.5 1.5v2A1.5 1.5 0 0117 9h-2a1.5 1.5 0 01-1.5-1.5v-2zM15 5a.5.5 0 00-.5.5v2a.5.5 0 00.5.5h2a.5.5 0 00.5-.5v-2A.5.5 0 0017 5h-2zm0 5a1.5 1.5 0 00-1.5 1.5v2A1.5 1.5 0 0015 15h2a1.5 1.5 0 001.5-1.5v-2A1.5 1.5 0 0017 10h-2zm-.5 1.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v2a.5.5 0 01-.5.5h-2a.5.5 0 01-.5-.5v-2z"
                    ></path>
                  </svg>
                )}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
};
