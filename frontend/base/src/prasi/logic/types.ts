export type IItem = {
  layout?: FNLayout;
  linktag?: FNLinkTag;
  mobile?: IItem;
  adv?: FNAdv;
  type: "item" | "section" | "text";
  component?: FNComponent;
  tree_hidden?: boolean;
  text?: string;
  html?: string;
  childs: IItem[];
} & MetaItem &
  BasicItem;

export type MetaItem = {
  id: string;
  originalId?: string;
  type: "text" | "section" | "item";
  name: string;
  field?: string;
  html?: string;
  text?: string;
  hidden?: "only-editor" | "all" | false;
};

export type BasicItem = {
  padding?: FNPadding;
  bg?: FNBackground;
  font?: FNFont;
  dim?: FNDimension;
  border?: FNBorder;
  typings?: string;
};

export type FNLayout = {
  dir: "row" | "col" | "row-reverse" | "col-reverse";
  align: FNAlign;
  gap: number | "auto";
  wrap?: "flex-wrap" | "flex-nowrap";
};

export type FNAdv = {
  scriptMode?: "script" | "flow";
  js?: string;
  jsBuilt?: string;
  css?: string;
  html?: string;
  tailwind?: string;
};

export type FNComponent = {
  id: string;
  props: Record<string, FNCompDef>;
  instances?: Record<string, Record<string, string>>;
  useStyle?: boolean;
  typings?: string;
  style?: IItem;
};

export type FNCompDef = {
  idx?: number;
  typings?: string;
  type?: string;
  label?: string;
  value?: any;
  valueBuilt?: any;
  gen?: string;
  genBuilt?: string;
  is_name?: boolean;
  onChange?: string;
  onChangeBuilt?: string;
  jsxPass?: {
    hash: string;
    exports: Record<string, any & { item_id: string }>;
  };
  content?: IItem;
  visible?: string;
  meta?: FNCompMeta;
};

export type DeepReadonly<T> = T extends Function
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

type FNCompMeta = {
  type: "file" | "text" | "option" | "content-element" | "list";
  options?: string;
  optionsBuilt?: string;
  option_mode?: "dropdown" | "button" | "checkbox";
  text_mode?: "string" | "code" | "var-picker";
};

export type FNAlign =
  | "top-left"
  | "top-center"
  | "top-right"
  | "top"
  | "left"
  | "center"
  | "right"
  | "bottom"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "stretch";

export type FNPadding = {
  t?: number;
  b?: number;
  l?: number;
  r?: number;
};

export type FNDimension = {
  w?: number | "fit" | "full";
  h?: number | "fit" | "full";
  wUnit?: "px" | "%";
  hUnit?: "px" | "%";
  proportion?: boolean;
};

export type FNBackground = {
  color?: string;
  url?: string;
  size?: "cover" | "contain" | "full" | "auto" | "%" | "px";
  repeat?: "repeat" | "repeat-x" | "repeat-y" | "space" | "round" | "no-repeat";
  pos?: "top" | "left" | "center" | "bottom" | "right";
};

export type FNBorder = {
  style?: "solid" | "dash";
  stroke?: FNBorderCorner;
  rounded?: FNRounded;
  color?: string;
};
export type FNBorderCorner = {
  t?: number;
  b?: number;
  l?: number;
  r?: number;
};
export type FNRounded = {
  tr?: number;
  tl?: number;
  bl?: number;
  br?: number;
};
export type FNFont = {
  color?: string;
  size?: number;
  family?: string;
  height?: number | "auto";
  align?: "center" | "left" | "right";
  whitespace?:
    | "whitespace-normal"
    | "whitespace-nowrap"
    | "whitespace-pre"
    | "whitespace-pre-line"
    | "whitespace-pre-wrap"
    | "whitespace-break-spaces";
  wordBreak?: "break-normal" | "break-words" | "break-all" | "break-keep";
};
export type FNLinkTag = {
  tag?: string;
  link?: string;
  class?: string;
};

export type PNode = {
  item: IItem;
  path_ids: string[];
  path_names: string[];
  parent?: {
    id: string;
    component?: {
      is_jsx_root?: boolean;
      comp_id: string;
      instance_id: string;
      prop_name: string;
    };
  };
};

export type EBaseComp = {
  id: string;
  content_tree: IItem;
  id_component_group: string | null;
  color: string | null;
};
export type EComp = EBaseComp & {
  tree: {
    find: (
      fn: (node: { item: IItem; parent?: string }) => boolean
    ) => IItem | null;
  };
};