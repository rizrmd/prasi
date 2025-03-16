import * as ReactTypes from "react";
import * as ReactDomTypes from "react-dom";
import * as ReactJSX from "react/jsx-runtime";
import * as ReactJSXDev from "react/jsx-dev-runtime";
import { initSite } from "../site/init-site";
import { navigate as import_navigate } from "./navigate";
import { css as import_css } from "goober";
import { cx as import_cx } from "./cx";
declare global {
  interface Window {
    React: typeof ReactTypes;
    Fragment: typeof ReactTypes.Fragment;
    ReactDOM: typeof ReactDomTypes;
    JSXRuntime: typeof ReactJSX;
    JSXDevRuntime: typeof ReactJSXDev;
    initSite: typeof initSite;
    navigate: typeof import_navigate;
    baseurl: typeof import_navigate.baseurl;
    css: typeof import_css;
    cx: typeof import_cx;
    cn: typeof import_cx;
    db: ReturnType<typeof import_dbInstance>;
    preload: typeof import_navigate.preload;
    preloaded: typeof import_navigate.preloaded;
    prasi_site: {
      id: string;
      serverurl: string;
      baseurl: string;
      exports: Record<string, any>;
      urls: { pages: string; layout: string; page: string };
    };
    siteReady: (rootElement: ReactTypes.ReactComp) => void;
  }

  const navigate = import_navigate;
  const css = import_css;
  const cn = import_cx;
  const cx = import_cx;
  const db = import_dbInstance();
  const baseurl = import_navigate.baseurl;
  const preload = import_navigate.preload;
  const preloaded = import_navigate.preloaded;
  const siteReady = (rootElement: ReactTypes.ReactComp) => {};
}

export {};
