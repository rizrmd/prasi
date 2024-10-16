import { createContext, useContext, useEffect, useRef, useState } from "react";
import { proxy, Snapshot, useSnapshot } from "valtio";

const default_ctx = { ctx: {} as any, render() {} };
const store_ctx = createContext<{
  ctx: Record<string, { ref: any; state: any }>;
  render: () => void;
}>(default_ctx);

export const StoreProvider = ({ children }: { children: any }) => {
  const [_, render] = useState({});

  return (
    <store_ctx.Provider
      value={{
        ...default_ctx,
        render() {
          render({});
        },
      }}
    >
      {children}
    </store_ctx.Provider>
  );
};

export const rawStore = function <T>(name: string) {
  return () => default_ctx.ctx[name] as { state: any; ref: any };
};

export const defineStore = function <
  R,
  T extends object,
  K extends { [V in string]: (...arg: any[]) => void | boolean },
  D,
>(init: {
  name: string;
  state: T;
  ref?: R;
  action: (arg: {
    ref: R;
    state: T;
    update: (fn: (state: T) => void) => void;
  }) => K;
  effect?: (arg: { state: Snapshot<T> }) => {
    deps: any[];
    effect: (arg: {
      state: Snapshot<T>;
      action: K;
      update: (fn: (state: T) => void) => void;
    }) => Promise<void>;
    cleanup?: () => void;
  }[];
}) {
  return <Z extends object>(
    selector: (arg: { ref: R; state: Snapshot<T>; action: K }) => Z
  ) => {
    const internal = useRef({
      mounted: true,
    });

    const store = useContext(store_ctx);
    const ctx = store.ctx;
    if (!ctx[init.name] && init.state) {
      ctx[init.name] = { state: proxy(init.state), ref: init.ref || {} };
    }

    const state = useSnapshot<T>(ctx[init.name].state);
    const ref = ctx[init.name].ref;

    const selection = selector({
      ref,
      state,
      action: createAction(ref, ctx[init.name].state, init),
    }) as Z & {
      update: (fn: (state: T) => void) => void;
    };
    selection.update = (fn) => {
      fn(ctx[init.name].state);
    };

    if (init.effect) {
      const effects = init.effect({ state: ctx[init.name].state });

      for (const e of effects) {
        useEffect(() => {
          internal.current.mounted = true;
          e.effect({
            action: createAction(ref, ctx[init.name].state, init),
            state,
            update(fn) {
              fn(ctx[init.name].state);
            },
          });
          return () => {
            internal.current.mounted = false;
            if (e.cleanup) {
              e.cleanup();
            }
          };
        }, e.deps);
      }
    }

    useEffect(() => {
      internal.current.mounted = true;
      return () => {
        internal.current.mounted = false;
      };
    }, Object.values(selection));

    return { ...selection };
  };
};

const createAction = (
  ref: any,
  state: any,
  init: {
    action: (arg: {
      state: any;
      ref: any;
      update: (fn: (state: any) => void) => void;
    }) => any;
  }
) => {
  return new Proxy(
    {},
    {
      get(target, p, receiver) {
        return function (...arg: any[]) {
          const actions = init.action({
            ref,
            state,
            update(fn) {
              fn(state);
            },
          });

          actions[p].bind(createAction(ref, state, init))(...arg);
        };
      },
    }
  ) as any;
};
