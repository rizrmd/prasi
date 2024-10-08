import { ReactElement } from "react";
import { allNodeDefinitions } from "./nodes";

export type PFNodeID = string;

export type PFNodeBranch = {
  code?: string;
  name?: string;
  flow: PFNodeID[];
  mode?: "async-only" | "sync-only" | "normal";
  idx?: number;
  meta?: { condition_id: string };
};

export type PFNodePosition = { x: number; y: number };
export type PFNodeSize = { w?: number; h?: number };

export type PFNodeType = keyof typeof allNodeDefinitions;
export type DeepReadonly<T> = T extends Function
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export type PFNode<T = Record<string, any>> = T & {
  id: string;
  name?: string;
  type: string;
  vars?: Record<string, any>;
  branches?: PFNodeBranch[];
  position?: PFNodePosition;
  size?: PFNodeSize;
  _codeBuild?: Record<string, string>;
  _codeError?: Record<string, string>;
};

export type RPFlow = DeepReadonly<PFlow>;

export type PFlow = {
  id: string;
  name: string;
  path?: string;
  nodes: Record<PFNodeID, PFNode>;
  flow: Record<string, PFNodeID[]>;
};

export type PFNodeRuntime<
  T extends Record<string, any>,
  K extends Record<string, any> = Record<string, any>,
> = {
  node: DeepReadonly<PFNode<K>> & T;
  prev?: DeepReadonly<PFNode<K>>;
  first: DeepReadonly<PFNode<K>>;
  visited: { node: DeepReadonly<PFNode<K>>; branch?: PFNodeBranch }[];
};

export type PFRuntime = {
  nodes: DeepReadonly<PFNode>[];
};

export type PFNodeDefinition<
  F extends Record<string, PFField>,
  G extends Record<string, any> = Record<string, any>,
> = {
  type: string;
  className?: string;
  vars?: Record<string, any>;
  is_async?: boolean;
  icon: string;
  width?: number,
  default?: G;
  render_edge_label?: (arg: {
    node: DeepReadonly<PFNode<G>>;
    branch?: PFNodeBranch;
  }) => ReactElement;
  node_picker?: (def: PFNodeDefinition<any>) => void | { hidden: boolean };
  on_before_connect?: (arg: {
    node: PFNode<G>;
    is_new: boolean;
    pflow: PFlow;
  }) => void;
  has_branches: boolean;
  on_after_connect?: (arg: { from: PFNode<G>; to: PFNode<G> }) => void;
  on_before_disconnect?: (arg: {
    from: PFNode<G>;
    to: PFNode<G>;
    flow: PFNodeID[];
  }) => void;
  on_after_disconnect?: (arg: { from: PFNode<G>; to: PFNode<G> }) => void;
  on_init?: (arg: { node: PFNode<G>; pflow: PFlow }) => void;
  on_fields_changed?: (arg: {
    pflow: PFlow;
    node: PFNode<G>;
    path: string;
    action: string;
  }) => void;
  process: (arg: {
    vars: Record<string, any>;
    runtime: PFNodeRuntime<{ [K in keyof F]: F[K] }, G>;
    processBranch: (branch: DeepReadonly<PFNodeBranch>) => Promise<void>;
    next: () => void;
    console: typeof console;
    state: {
      react?: {
        effects: () => Promise<void>;
        render: () => Promise<void>;
        status?: "rendering" | "rendered" | "init";
      };
    };
  }) => void | Promise<void>;
  fields?: F;
};

export type PFField = (
  | {
      type: "string";
      placeholder?: (arg: {
        node: DeepReadonly<PFNode>;
        path: string;
      }) => string;
    }
  | {
      type: "array";
      fields: Record<string, PFField>;
      render?: (arg: { node: DeepReadonly<PFNode> }) => ReactElement;
    }
  | { type: "code" }
  | {
      type: "options" | "buttons";
      multiple?: boolean;
      options: () => Promise<
        (string | { value: string; label: string; el?: ReactElement })[]
      >;
    }
) & { idx?: number; label: string; optional?: boolean; className?: string };
