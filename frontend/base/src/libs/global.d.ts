import * as ReactTypes from "react";
import * as ReactDomTypes from "react-dom";
import { initSite } from "../site/init-site";
import { navigate as import_navigate } from "./navigate";
import { css as import_css } from "goober";
import { cx as import_cx } from "./cx";
declare global {
  interface Window {
    React: typeof ReactTypes;
    ReactDOM: typeof ReactDomTypes;
    initSite: typeof initSite;
    navigate: typeof import_navigate;
    css: typeof import_css;
    cx: typeof import_cx;
    cn: typeof import_cx;
    prasi_site: {
      exports: Record<string, any>;
      urls: { pages: string; layout: string };
    };
    siteReady: (rootElement: ReactTypes.ReactComp) => void;
  }

  const navigate = import_navigate;
  const css = import_css;
  const cn = import_cx;
  const cx = import_cx;
}

export {};
