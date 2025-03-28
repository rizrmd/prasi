import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ListTree,
  TableProperties,
  type LucideProps
} from "lucide-react";
import type React from "react";
import type { FC, ReactNode, RefAttributes } from "react";

const tabs = [
  {
    value: "data",
    icon: TableProperties,
  },
  {
    value: "tree",
    icon: ListTree,
  },
  // {
  //   value: "settings",
  //   icon: Settings,
  // },
] as const;

const VerticalBorderedTabs: FC<{
  children: (arg: {
    tab: string;
    Icon: React.FC<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  }) => ReactNode;
}> = ({ children }) => {
  return (
    <Tabs
      defaultValue={
        localStorage.getItem("prasi.editor.selected.tab") || tabs[0].value
      }
      orientation="vertical"
      className="w-full h-full flex flex-1 flex-row items-start justify-center bg-muted"
    >
      <TabsList className="grid grid-cols-1 h-auto w-fit p-0 divide-y border-0 shrink-0 ml-1 mt-1">
        {tabs.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className={cn(
              "rounded-none first:rounded-tl-md last:rounded-bl-md bg-background h-10 w-11 p-0 border-b-border border-l-border first:border-t-border cursor-pointer",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            )}
            onClick={() => {
              localStorage.setItem("prasi.editor.selected.tab", item.value);
            }}
          >
            <item.icon className="h-5 w-5" />
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="grow flex-1 w-full  h-full flex border-l-border border-l bg-white">
        {tabs.map((item) => (
          <TabsContent key={item.value} value={item.value}>
            {children({ tab: item.value, Icon: item.icon })}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};

export default VerticalBorderedTabs;
