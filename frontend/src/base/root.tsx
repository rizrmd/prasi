import { addRoute, createRouter, findRoute } from "rou3";
import { FC, Suspense, lazy, useEffect } from "react";
import { w } from "../utils/types/general";
import { Loading } from "../utils/ui/loading";
import * as pages from "./pages";
import { GlobalContext } from "../utils/react/use-global";
import { useLocal } from "../utils/react/use-local";

export const Root: FC<{}> = ({}) => {
  const local = useLocal(
    {
      router: createRouter<{ url: string; Page: FC<any> }>(),
      Page: null as any,
      rendering: false,
      should_rerender: false,
    },
    async () => {
      local.rendering = true;
      for (const [_, v] of Object.entries(pages)) {
        addRoute(local.router, undefined, v.url, {
          url: v.url,
          Page: lazy(async () => {
            return { default: (await v.page()).default.component as any };
          }),
        });
      }
      local.render();
    }
  );

  local.rendering = true;
  useEffect(() => {
    local.rendering = false;
    if (local.should_rerender) {
      local.should_rerender = false;
      local.render();
    }
  });

  prasiContext.render = () => {
    if (!local.rendering) local.render();
    else {
      local.should_rerender = true;
    }
  };

  const Provider = GlobalContext.Provider as FC<{ value: any; children: any }>;
  const found = findRoute(local.router, undefined, location.pathname);

  if (found) {
    w.params = found.params;
    local.Page = found.data.Page;
  }

  if (!local.Page) {
    return <Loading />;
  }

  return (
    <Provider value={prasiContext}>
      <Suspense>
        <local.Page />
      </Suspense>
    </Provider>
  );
};
