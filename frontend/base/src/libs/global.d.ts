import * as ReactTypes from "react";
import * as ReactDomTypes from "react-dom";
import * as ReactJSX from "react/jsx-runtime";
import * as ReactJSXDev from "react/jsx-dev-runtime";
import { initSite } from "../site/init-site";
import { navigate as import_navigate } from "./navigate";
import { css as import_css } from "goober";
import { cx as import_cx } from "./cx";
import type { createViWrite } from "src/prasi/vi/vi-state";
import type { db as import_db } from "backend/db/use";
import type { enhancePrisma } from "utils/prisma";
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
    db: ReturnType<typeof enhancePrisma>;
    preload: typeof import_navigate.preload;
    siteurl: typeof import_navigate.siteurl;
    preloaded: typeof import_navigate.preloaded;
    prasi_site: {
      id: string;
      siteurl: string;
      baseurl: string;
      exports: Record<string, any>;
      urls?: {
        pages: string;
        layout: string;
        page: string;
        components: string;
      };
      custom?: { page: ReactTypes.ReactElement };
    };
    siteReady: (rootElement: ReactTypes.ReactComp) => void;
    navigateOverride: (href: string) => string;
    isEditor: boolean;
    params: Record<string, any>;
    viWrite: ReturnType<typeof createViWrite>;
  }

  const navigate = import_navigate;
  const css = import_css;
  const cn = import_cx;
  const cx = import_cx;
  const db = enhancePrisma(new PrismaClient());
  const baseurl = import_navigate.baseurl;
  const siteurl = import_navigate.siteurl;
  const preload = import_navigate.preload;
  const preloaded = import_navigate.preloaded;
  const siteReady = (rootElement: ReactTypes.ReactComp) => {};
  const params = Record<string, any>;
}

export {};
