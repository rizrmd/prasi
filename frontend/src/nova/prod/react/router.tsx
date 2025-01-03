import { memo } from "react";
import { ViRoot } from "vi/vi-root";
import { base } from "../loader/base";
import { loadPages } from "../loader/page";
import { w } from "../root/window";
import { useProdState } from "./store";
import { Loading } from "utils/ui/loading";
import { findRoute } from "rou3";

export const ProdRouter = memo(() => {
  const {
    router,
    pages,
    page,
    loadPage,
    update,
    comps,
    layout,
    mode,
    db,
    api,
    ref,
  } = useProdState(({ ref, state, action }) => ({
    pathname: state.pathname,
    mode: state.mode,
    router: ref.router,
    pages: ref.pages,
    loadPage: action.loadPage,
    page: ref.page,
    layout: ref.layout,
    comps: ref.comps,
    comp_status: state.status.comps,
    ts: state.ts,
    db: ref.db,
    api: ref.api,
    ref,
  }));

  const found = router
    ? findRoute(router, undefined, base.pathname)
    : undefined;

  const found_page = router
    ? pages?.find((e) => e.id === found?.data.id)
    : undefined;

  if (found_page) {
    if (found_page.id !== page?.id) {
      loadPage(found_page);
      return <></>;
    } else {
      if (page && page.root) {
        let loading_comps = false;
        for (const id of page.root.component_ids) {
          if (!comps[id]) {
            return <>{w.ContentLoading ? <w.ContentLoading /> : <Loading />}</>;
          }
        }
        return (
          <>
            <ViRoot
              mode={mode}
              comps={comps as any}
              page={page as any}
              layout={layout as any}
              db={db}
              api={api}
              vscode_exports={ref.vscode_exports}
              loader={{
                async comps() {},
                async pages(ids) {
                  loadPages(ids).then((result) => {
                    update((s) => {
                      for (const [k, v] of Object.entries(result) as any) {
                        if (pages[k]) {
                          pages[k].root = v;
                        }
                      }
                      s.ts = Date.now();
                    });
                  });
                },
              }}
              enable_preload
            />
          </>
        );
      }
    }
  } else {
    update((s) => {
      ref.page = null;
    });
  }

  if (w.ContentNotFound) {
    return <w.ContentNotFound />;
  }

  return (
    <div className="flex flex-1 items-center justify-center">Not Found</div>
  );
});
