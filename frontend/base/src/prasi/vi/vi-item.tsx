import type { FC } from "react";
import { router } from "src/site/router";
import type { DeepReadonly, IItem } from "../logic/types";
import { ErrorBox } from "../utils/error-box";
import { ViComponent } from "./vi-component";
import { viProps } from "./vi-props";
import { ViScript } from "./vi-script";
import { viRead, viState, type ItemPaths } from "./vi-state";

export const ViItem: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
  paths: ItemPaths;
  passprop?: { idx: any } & Record<string, any>;
}> = ({ item, is_layout, paths, passprop }) => {
  viState({ is_layout, item, paths });

  if (item.hidden) return null;

  if (item.component?.id) {
    const component = router.components?.[item.component.id];
    if (component) {
      return (
        <ErrorBox>
          <ViComponent
            item={item}
            is_layout={is_layout}
            paths={paths}
            passprop={passprop}
          />
        </ErrorBox>
      );
    } else {
      router.componentPendingRender[item.component.id] = true;
      return null;
    }
  }

  if (item.name === "children" && is_layout) {
    if (typeof router.page === "object" && !!router.page) {
      return router.page.childs.map((e, idx) => (
        <ErrorBox key={idx}>
          <ViItem item={e} is_layout={false} paths={[]} passprop={passprop} />
        </ErrorBox>
      ));
    }
    return <>Loading...</>;
  }

  if (item.adv?.js && item.adv?.jsBuilt) {
    return (
      <ErrorBox>
        <ViScript
          item={item}
          is_layout={is_layout}
          paths={paths}
          passprop={passprop}
        />
      </ErrorBox>
    );
  }

  const props = viProps(item, { mode: window.viWrite.mode });
  if (item.html) {
    return (
      <div {...props} dangerouslySetInnerHTML={{ __html: item.html }}></div>
    );
  }
  return (
    <div {...props}>
      {item.childs.map((e, key) => (
        <ErrorBox key={key}>
          <ViItem
            item={e}
            is_layout={is_layout}
            paths={[...paths, { id: item.id }]}
            passprop={passprop}
          />
        </ErrorBox>
      ))}
    </div>
  );
};
