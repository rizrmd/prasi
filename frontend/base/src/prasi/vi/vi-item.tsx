import type { FC } from "react";
import type { DeepReadonly, IItem } from "../logic/types";
import { viRead, viState } from "./vi-state";
import { ViScript } from "./vi-script";
import { viProps } from "./vi-props";

export const ViItem: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
}> = ({ item, is_layout }) => {
  const vi = viRead();
  if (item.adv?.jsBuilt) {
    return <ViScript item={item} is_layout={is_layout} />;
  }
  const props = viProps(item, { mode: vi.mode });
  return (
    <div {...props}>
      {item.childs.map((e, key) => (
        <ViItem item={e} key={key} is_layout={is_layout} />
      ))}
    </div>
  );
};
