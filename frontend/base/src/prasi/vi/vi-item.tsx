import { useState, type FC } from "react";
import { router, type Router } from "../../site/router";
import type { DeepReadonly, IItem } from "../logic/types";
import { ErrorBox } from "../utils/error-box";
import { ViComponent } from "./vi-component";
import { viProps } from "./vi-props";
import { ViScript } from "./vi-script";
import { viState, type ItemPaths } from "./vi-state";

export const ViItem: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
  paths: ItemPaths;
  router: Router;
  passprop?: { idx: any } & Record<string, any>;
  error?: (e: Error) => void;
}> = ({ item, is_layout, paths, passprop, error }) => {
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
            router={router}
            error={error}
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
          <ViItem
            item={e}
            router={router}
            is_layout={false}
            paths={[]}
            passprop={passprop}
            error={error}
          />
        </ErrorBox>
      ));
    }
    return <>Loading...</>;
  }

  if (item.adv?.js && item.adv?.jsBuilt) {
    return (
      <ErrorBox>
        <ViScript
          router={router}
          item={item}
          is_layout={is_layout}
          paths={paths}
          passprop={passprop}
          error={error}
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
  try {
    return (
      <div {...props}>
        {item.childs.map((e, key) => (
          <ErrorBox key={key}>
            <ViItem
              router={router}
              item={e}
              is_layout={is_layout}
              paths={[...paths, { id: item.id }]}
              passprop={passprop}
            />
          </ErrorBox>
        ))}
      </div>
    );
  } catch (e: any) {
    error?.(e);
    return null;
  }
};
