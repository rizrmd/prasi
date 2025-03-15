import react from "react";
import react_dom from "react-dom";
import { initSite } from "../site/init-site";
import { navigate } from "./navigate";
import { css } from "goober";
import { cx } from "./cx";
export const initGlobal = (siteReady: typeof window.siteReady) => {
  window.React = react;
  window.ReactDOM = react_dom;
  window.initSite = initSite;
  window.navigate = navigate;
  window.css = css;
  window.siteReady = siteReady;
  window.cx = cx;
  window.cn = cx;
};
