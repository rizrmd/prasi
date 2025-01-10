import type { Server } from "bun";
import type { BunSqliteKeyValue } from "bun-sqlite-key-value";
import type { PrismaClient } from "prasi-db";
import type { ESite } from "prasi-frontend/src/nova/ed/logic/types";
import type { RouterContext } from "rou3";
import type * as yjs_import from "yjs";
import type { parseTypeDef } from "./parser/parse-type-def";
import type { prasiBuildFrontEnd } from "./site/init/build-frontend";
import type { prasiPathV5 } from "./site/init/prasi-path-v5";
import type { Spawn, spawn } from "./spawn";

import type { bind } from "prasi-frontend/src/nova/ed/crdt/lib/immer-yjs";
import type { applyAwarenessUpdate, Awareness } from "y-protocols/awareness.js";
import type * as syncProtocol from "y-protocols/sync.js";
import type { readSyncMessage } from "y-protocols/sync.js";

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

export type PrasiVMInitArg = {
  site_id: string;
  prasi: PrasiSite["prasi"];
  mode: "ipc" | "server";
  action?: "start" | "reload" | "init";
  dev?: boolean;
  db: { orm: "prisma" | "prasi"; url: string };
};

export type PrasiSite = {
  id: SITE_ID;
  config: {
    disable_lib?: boolean;
    api_url?: string;
  };
  data: ESite;
  last_msg: string;
  build: PrasiSiteLoading["process"];
  router: RouterContext<{ page_id: string }>;
  content?: PrasiContent;
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
  spawn: {
    handler?: { http: (req: Request) => Promise<Response> };
    ipc?: Spawn;
    reload: () => Promise<void>;
    reload_immediately: (mode?: "init") => Promise<void>;
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
  content: PrasiContent;
  rsbuild: {
    prasi_port: 0;
    site_port: 0;
  };
  server: Server;
  static_cache: { gz: BunSqliteKeyValue; zstd: BunSqliteKeyValue };
  crdt: {
    yjs: typeof yjs_import;
    bind: typeof bind;
    applyAwarenessUpdate: typeof applyAwarenessUpdate;
    Awareness: typeof Awareness;
    syncProtocol: typeof syncProtocol;
    readSyncMessage: typeof readSyncMessage;
  };
}

declare global {
  var g: PrasiGlobal;
  var _db: PrismaClient;
}
