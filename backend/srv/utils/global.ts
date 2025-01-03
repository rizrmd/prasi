import type { Server } from "bun";
import type { BunSqliteKeyValue } from "bun-sqlite-key-value";
import { type Context } from "node:vm";
import type { PrismaClient } from "prasi-db";
import type { ESite } from "prasi-frontend/src/nova/ed/logic/types";
import type { RouterContext } from "rou3";
import type { parseTypeDef } from "./parser/parse-type-def";
import type { prasiBuildFrontEnd } from "./site/init/build-frontend";
import type { prasiPathV5 } from "./site/init/prasi-path-v5";
import type { spawn } from "./spawn";

type SITE_ID = string;

export type PrasiContent = {
  pages: (ids: string[]) => Promise<Record<string, any>>;
  comps: (ids: string[]) => Promise<Record<string, any>>;
  route: (
    pathname: string
  ) => void | { params: Record<string, any>; data: { page_id: string } };
  all_routes: () => Promise<{
    site: { id: string; api_url: string };
    urls: { id: string; url: string }[];
    layout: { id: string; root: any };
  }>;
};

export type PrasiSite = {
  id: SITE_ID;
  config: {
    disable_lib?: boolean;
    api_url?: string;
  };
  data: ESite;
  build: PrasiSiteLoading["process"];
  router: RouterContext<{ page_id: string }>;
  router_base: {
    urls: { id: string; url: string }[];
    layout: { id: string; root: any };
  };
  process: {
    vsc_vars: Awaited<ReturnType<typeof parseTypeDef>>;
    log: {
      build_frontend: string;
      build_typings: string;
      build_backend: string;
      build_tailwind: string;
      run_server: string;
    };
    is_ready: {
      frontend: boolean;
      typings: boolean;
    };
  };
  vm: {
    ctx: Context;
    init?: (arg: {
      site_id: string;
      prasi: PrasiSite["prasi"];
      server: () => Server;
      mode: "vm" | "server";
      action?: "start" | "reload";
      dev?: boolean;
      content: PrasiContent;
    }) => Promise<void>; // defined in site-run.ts
    reload: () => Promise<void>;
    reload_immediately: () => Promise<void>;
  };
  prasi: {
    version: number;
    paths: ReturnType<typeof prasiPathV5>;
  };
};
export type PrasiSiteLoading = {
  status: string;
  data?: ESite;
  deps_install?: ReturnType<typeof spawn>;
  process: {
    build_frontend?: Awaited<ReturnType<typeof prasiBuildFrontEnd>>;
    build_backend?: {
      entries: Set<string>;
      rebuild: () => Promise<void>;
    };
    build_typings?: ReturnType<typeof spawn>;
  };
};

export interface PrasiGlobal {
  reloadCount: number;
  mode: "prod" | "dev";
  _db: PrismaClient;
  site: {
    loaded: Record<SITE_ID, PrasiSite>;
    loading: Record<SITE_ID, PrasiSiteLoading>;
  };
  rsbuild: {
    prasi_port: 0;
    site_port: 0;
  };
  server: Server;
  static_cache: { gz: BunSqliteKeyValue; zstd: BunSqliteKeyValue };
}

declare global {
  var g: PrasiGlobal;
  var _db: PrismaClient;
}
