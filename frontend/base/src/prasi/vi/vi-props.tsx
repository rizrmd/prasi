import type { DeepReadonly, IItem } from "../logic/types";
import { cssDimension } from "./css/dimension";
import { produceCSS } from "./css/gen";

export type DIV_PROPS = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

export const viProps = (
  item: DeepReadonly<IItem>,
  opt: { mode: "desktop" | "mobile"; div_props?: DIV_PROPS }
) => {
  const props: DIV_PROPS & {
    inherit?: { style: IItem; className: string };
    "node-name": string;
  } = {
    ...(opt?.div_props || {}),
    className: cx(
      produceCSS(item as any, {
        mode: opt.mode,
      }),
      item.type === "text" && !item.adv?.js ? "text-block" : "",
      opt?.div_props?.className
    ),
    "node-name": item.name,
  };

  return props;
};
