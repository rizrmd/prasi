import type { Monaco } from "../init";

export const registerReact = async (monaco: Monaco) => {
  const m = monaco as any;
  if (m.prasiReactRegistered) return;
  m.prasiReactRegistered = true;
  monaco.languages.typescript.typescriptDefaults.setExtraLibs([
    {
      filePath: "file:///csstype.d.ts",
      content: `declare module "csstype" {
${await loadText("https://cdn.jsdelivr.net/npm/csstype@3.1.3/index.d.ts")}
}`,
    },
    {
      filePath: "file:///prop-types.d.ts",
      content: `declare module "prop-types" {
${await loadText(
  "https://cdn.jsdelivr.net/npm/@types/prop-types@15.7.12/index.d.ts"
)}
}`,
    },
    {
      filePath: "file:///react.d.ts",
      content: `
declare module "react" {
${await loadText("https://cdn.jsdelivr.net/npm/@types/react@18.3.3/index.d.ts")}
}
`,
    },
    {
      filePath: "file:///jsx-runtime.d.ts",
      content: `declare module "react/jsx-runtime" {
import * as React from "react";
export { Fragment } from "react";

export namespace JSX {
  type ElementType = React.JSX.ElementType;
}

/**
* Create a React element.
*
* You should not use this function directly. Use JSX and a transpiler instead.
*/
export function jsx(
  type: React.ElementType,
  props: unknown,
  key?: React.Key,
): React.ReactElement;

/**
* Create a React element.
*
* You should not use this function directly. Use JSX and a transpiler instead.
*/
export function jsxs(
  type: React.ElementType,
  props: unknown,
  key?: React.Key,
): React.ReactElement;
`,
    },
  ]);
};

const cached = {} as Record<string, string>;

const loadText = async (url: string) => {
  try {
    if (cached[url]) return cached[url];
    const res = await fetch(url);
    cached[url] = await res.text();
    return cached[url];
  } catch (e) {
    return "";
  }
};
