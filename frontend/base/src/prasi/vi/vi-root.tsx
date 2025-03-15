import { router } from "src/site/router";
import { ViItem } from "./vi-item";

export const ViRoot = () => {
  const layout = router.layout;

  const layout_childs = layout?.content_tree?.childs;
  if (layout_childs) {
    return layout_childs.map((item) => (
      <ViItem key={item.id} item={item} is_layout={true} />
    ));
  }

  return <div className="bg-amber-500">Tokotok</div>;
};
