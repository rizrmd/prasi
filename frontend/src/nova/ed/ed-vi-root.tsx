import { apiProxy } from "base/load/api/api-proxy";
import { dbProxy } from "base/load/db/db-proxy";
import { activateItem, active, getActiveTree } from "logic/active";
import { EDGlobal, PG } from "logic/ed-global";
import { waitUntil } from "prasi-utils";
import { memo, useEffect, useRef, useState } from "react";
import { StoreProvider } from "utils/react/define-store";
import { useGlobal } from "utils/react/use-global";
import { useLocal } from "utils/react/use-local";
import { Loading } from "utils/ui/loading";
import { ViComps, ViPage, ViWrapperType } from "vi/lib/types";
import { ViRoot } from "vi/vi-root";
import { EdTreeCtxMenu } from "./tree/parts/ctx-menu";
import { IItem } from "utils/types/item";

export const EdViRoot = memo(() => {
  const p = useGlobal(EDGlobal, "EDITOR");
  const ref = useRef({
    db: dbProxy(p.site.config.api_url),
    api: apiProxy(p.site.config.api_url),
    page: null as ViPage | null,
    comps: {} as ViComps,
    wrapper: ViWrapper({
      p,
      render: () => {
        p.render();
      },
    }),
  }).current;
  const [, _set] = useState({});
  const render = () => _set({});

  p.ui.editor.render = render;
  if (!p.page.cur) return <Loading />;
  if (ref.page?.root !== p.page.cur.content_tree || !ref.page) {
    ref.page = {
      id: p.page.cur.id,
      url: p.page.cur.url,
      root: p.page.cur.content_tree,
    };
  }

  if (!ref.page.root) {
    waitUntil(() => p.page.cur.content_tree).then(() => {
      render();
    });
  }

  for (const [k, v] of Object.entries(p.comp.loaded)) {
    ref.comps[k] = v.content_tree;
  }

  return (
    <>
      {!ref.page.root ? (
        <Loading />
      ) : (
        <StoreProvider>
          <ViRoot
            edit_comp_id={active.comp_id}
            api={ref.api}
            db={ref.db}
            page={ref.page}
            comps={ref.comps}
            loader={{ async comps(ids) {}, async pages(ids) {} }}
            mode={p.mode}
            enable_preload={false}
            wrapper={ref.wrapper}
            enable_cache_js={false}
            set_ref={(ref) => {
              p.viref = ref;
            }}
          />
        </StoreProvider>
      )}
    </>
  );
});

const ViWrapper = ({ p, render }: { p: PG; render: () => void }) =>
  (({ item, is_layout, ViRender, __idx, instance_id }) => {
    const local = useLocal({
      ctx_menu: null as any,
      item: null as null | IItem,
    });

    return (
      <>
        {/* @ts-ignore */}
        <ViRender
          item={item}
          is_layout={is_layout}
          __idx={__idx}
          instance_id={instance_id}
          div_props={({ item, ref, instance_id }) => ({
            contentEditable: item.type === "text" ? true : undefined,
            ref: (div) => {
              if (item.id === active.item_id && item.type === "text") {
                div?.focus();
              }
            },
            onPointerEnter(e) {
              if (instance_id) {
                //@ts-ignore
                const instance = ref.comp_props[instance_id];
                if (instance) {
                  //@ts-ignore
                  const cur = getActiveTree(p).nodes.map[item.id];
                  if (!cur) {
                    active.hover.id = instance_id;
                    render();
                    return;
                  }
                }
              }
              active.hover.id = item.id;
              render();
            },
            onPointerLeave(e) {
              if (instance_id) {
                const cur = getActiveTree(p).nodes.map[item.id];
                if (!cur) {
                  active.hover.id = "";
                  render();
                  return;
                }
              } else {
                active.hover.id = "";
                render();
              }
            },
            spellCheck: item.type === "text" ? false : undefined,
            onBlur:
              item.type === "text"
                ? (e) => {
                    const content = e.currentTarget.innerHTML || "";
                    getActiveTree(p).update("Update Text", ({ findNode }) => {
                      const n = findNode(item.id);
                      if (n) {
                        n.item.html = content;
                      }
                    });
                  }
                : undefined,
            onPointerDown(e) {
              if (active.item_id === item.id) {
                e.stopPropagation();
                return;
              }

              e.stopPropagation();
              e.preventDefault();
              p.ui.tree.prevent_tooltip = true;
              if (instance_id) {
                //@ts-ignore
                const instance = ref.comp_props[instance_id];
                if (instance) {
                  const cur = getActiveTree(p).nodes.map[item.id];
                  if (!cur) {
                    activateItem(p, instance_id);
                    render();
                    return;
                  }
                }
              }

              activateItem(p, item.id);
              render();
            },
            onContextMenu(e) {
              e.preventDefault();
              e.stopPropagation();
              if (item) {
                local.ctx_menu = e;
                local.item = JSON.parse(JSON.stringify(item));
                //@ts-ignore
                local.render();
              }
            },
          })}
        />
        {local.ctx_menu && local.item && (
          <EdTreeCtxMenu
            event={local.ctx_menu}
            onClose={() => {
              local.ctx_menu = null;
              local.render();
            }}
            raw={{ data: { item: local.item } } as any}
          />
        )}
      </>
    );
  }) as ViWrapperType;
