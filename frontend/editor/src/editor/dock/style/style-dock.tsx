import { PanelAutoLayout } from "./panel/panel-auto-layout";
import { SideBox } from "./ui/side-box";

export const StyleDock = () => {
  return (
    <>
      <SideBox>
        <PanelAutoLayout />
      </SideBox>
    </>
  );
};
