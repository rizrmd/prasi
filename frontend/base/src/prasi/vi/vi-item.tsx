import type { FC } from "react";
import type { DeepReadonly, IItem } from "../logic/types";
import { viRead, viState } from "./vi-state";
import { ViScript } from "./vi-script";
import { viProps } from "./vi-props";
import { router } from "src/site/router";
import { ErrorBox } from "../utils/error-box";

export const ViItem: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
}> = ({ item, is_layout }) => {
  const vi = viRead();

  if (item.name === "children" && is_layout) {
    if (typeof router.page === "object" && !!router.page) {
      return router.page.childs.map((e, idx) => (
        <ErrorBox key={idx}>
          <ViItem item={e} is_layout={false} />
        </ErrorBox>
      ));
    }
    return <>Loading...</>;
  }

  if (item.adv?.js && item.adv?.jsBuilt) {
    return (
      <ErrorBox>
        <ViScript item={item} is_layout={is_layout} />
      </ErrorBox>
    );
  }
  const props = viProps(item, { mode: vi.mode });

  return (
    <div {...props}>
      {item.childs.map((e, key) => (
        <ErrorBox key={key}>
          <ViItem item={e} is_layout={is_layout} />
        </ErrorBox>
      ))}
    </div>
  );
};
