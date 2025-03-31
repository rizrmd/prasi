import type { FC } from "react";
import { router } from "base/site/router";
import { ViItem } from "./vi-item";

export const ViRoot: FC<{}> = ({}) => {
  const layout = router.layout;

  const layout_childs = layout?.childs;
  if (layout_childs) {
    return layout_childs.map((item) => (
      <ViItem
        key={item.id}
        item={item}
        is_layout={true}
        router={router}
        paths={[]}
      />
    ));
  }

  return <div className="bg-amber-500">No item</div>;
};
