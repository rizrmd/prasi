import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy } from "lucide-react";
import type { ReactNode } from "react";

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
}: {
  children: (arg: { tab: string }) => ReactNode;
}) {
  return (
    <Tabs
      defaultValue={current.tab}
      className="w-full h-full flex flex-col items-stretch"
      onValueChange={(value) => {
        current.tab = value;
      }}
    >
      <div className="border-b flex w-full border-b-primary">
        <TabsList className="flex px-2 pt-1 pb-0 bg-background justify-start rounded-none">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none bg-background h-full data-[state=active]:shadow-none border border-transparent border-b-primary data-[state=active]:border-primary data-[state=active]:border-b-background -mb-[2px] rounded-t "
            >
              <code className="text-xs capitalize">{tab.value}</code>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabs.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {children({ tab: item.value })}
        </TabsContent>
      ))}
    </Tabs>
  );
}
