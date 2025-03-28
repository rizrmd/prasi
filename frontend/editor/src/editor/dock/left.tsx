import { DataAction, DataDock } from "./data/data-dock";
import VerticalBorderedTabs from "./tabs";

export const LeftDock = () => {
  return (
    <VerticalBorderedTabs>
      {({ tab, Icon }) => {
        return (
          <div className="flex flex-col items-stretch select-none flex-1 h-full">
            <div className="p-2 border-b border-b-border flex items-center min-h-[44px]">
              <div className="flex flex-1 space-x-1">
                <Icon size={16} />
                <div className="capitalize text-xs">{tab}</div>
              </div>
              <div className="flex items-center">
                {tab === "data" && <DataAction />}
              </div>
            </div>
            {tab === "data" && <DataDock />}
          </div>
        );
      }}
    </VerticalBorderedTabs>
  );
};
