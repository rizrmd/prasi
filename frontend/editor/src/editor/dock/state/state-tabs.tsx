import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";
import { PageStateIcon } from "./state-dock";
import type { PageState } from "base/site/router";
import { Badge } from "@/components/ui/badge";
import { RightClick } from "@/components/ui/right-click";
import { Picker } from "@/components/ui/picker";

const tabs = [
  {
    value: "value",
  },
  {
    value: "usage",
  },
] as const;

const current = { tab: "value" as any };

export default function StateTabs({
  children,
  read,
  write,
}: {
  children: (arg: { tab: string }) => ReactNode;
  onTypeChanged: () => void;
  read: PageState;
  write: PageState;
}) {
  return (
    <Tabs
      defaultValue={current.tab}
      className="w-full h-full flex flex-col items-stretch select-none"
      onValueChange={(value) => {
        current.tab = value;
      }}
    >
      <div className="border-b flex w-full border-b-primary justify-between items-stretch">
        <TabsList className="flex px-2 pt-1 pb-0 bg-background justify-start rounded-none">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "rounded-none bg-transparent h-full data-[state=active]:shadow-none border border-transparent border-b-primary data-[state=active]:border-primary -mb-[2px] rounded-t cursor-pointer",
                css`
                  border-bottom: 0;
                `
              )}
            >
              <div className="text-sm capitalize">{tab.value}</div>
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex items-center pr-2">
          <Picker
            menu={[
              {
                title: "Static",
                icon: <PageStateIcon type={"static"} />,
                onClick: () => {
                  write.type = "static";
                },
              },
              {
                title: "Promise",
                icon: <PageStateIcon type={"promise"} />,
                onClick: () => {
                  write.type = "promise";
                },
              },
              {
                title: "Computed",
                icon: <PageStateIcon type={"computed"} />,
                onClick: () => {
                  write.type = "computed";
                  console.log(write.type);
                },
              },
              {
                title: "Function",
                icon: <PageStateIcon type={"function"} />,
                onClick: () => {
                  write.type = "function";
                },
              },
            ]}
          >
            {({ open }) => {
              return (
                <Badge
                  variant={open ? "default" : "outline"}
                  className="py-0 px-2 rounded-sm cursor-pointer border-primary"
                >
                  <div
                    className={cn(
                      "flex items-center",
                      css`
                        > svg {
                          width: 14px;
                        }
                      `
                    )}
                  >
                    <PageStateIcon type={read.type} />
                  </div>
                  <div className="capitalize">{read.type}</div>
                </Badge>
              );
            }}
          </Picker>
        </div>
      </div>

      {tabs.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {children({ tab: item.value })}
        </TabsContent>
      ))}
    </Tabs>
  );
}
