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
      <div
        className={cn(
          "border-b flex w-full border-b-primary justify-between items-stretch bg-primary",
          css`
            border-top-right-radius: var(--radius);
            background-image: repeating-linear-gradient(
              -45deg,
              #ffffff14 10px,
              #ffffff14 16px,
              transparent 12px,
              transparent 20px
            );
          `
        )}
      >
        <TabsList className="flex px-1 pt-1 pb-0 justify-start rounded-none bg-transparent text-primary-foreground">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:text-muted-foreground inline-flex  flex-1 items-center justify-center gap-1.5  px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 rounded-none bg-transparent h-full data-[state=active]:shadow-none border border-transparent border-b-primary data-[state=active]:border-primary -mb-[2px] rounded-t cursor-pointer data-[state=active]:text-foreground text-primary-foreground",
                css`
                  border-bottom: 0;
                `
              )}
            >
              <div className="text-sm capitalize">{tab.value}</div>
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex items-center pr-[5px]">
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
                  className="py-0 px-2 cursor-pointer text-secondary-foreground bg-secondary border-primary-foreground"
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
