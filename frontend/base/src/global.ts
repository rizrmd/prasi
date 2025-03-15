import react from "react";
import react_dom from "react-dom";

export const initGlobal = async () => {
  window.React = react;
  window.ReactDOM = react_dom;
};
