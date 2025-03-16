import { router } from "src/site/router";
import { ViItem } from "./vi-item";
import type { FC } from "react";
import { write } from "./vi-state";

export const ViRoot: FC<{}> = ({}) => {
  const layout = router.layout;

  const layout_childs = layout?.childs;
  if (layout_childs) {
    return layout_childs.map((item) => (
      <ViItem key={item.id} item={item} is_layout={true} paths={[]} />
    ));
  }

  return <div className="bg-amber-500">Tokotok</div>;
};
