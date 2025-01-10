import type { ServerWebSocket } from "bun";
import { dirAsync } from "fs-jetpack";
import { dir } from "utils/files/dir";
import BunORM from "utils/files/sqlite";
import { Awareness } from "y-protocols/awareness.js";
import type { Doc, UndoManager } from "yjs";
import type { WSContext } from "utils/server/ctx";

export const MAX_HISTORY_SIZE = 750;

const createPageDb = async (site_id: string) => {
  await dirAsync(dir.data(`/sqlite/crdt/site/${site_id}`));
  return new BunORM(dir.data(`/sqlite/crdt/site/${site_id}/page.db`), {
    tables: {
      page_updates: {
        columns: {
          page_id: { type: "TEXT" },
          action: { type: "TEXT" },
          update: { type: "BLOB" },
          checkpoint: { type: "INTEGER" },
          ts: { type: "INTEGER" },
        },
      },
    }, 
  });
};

export const codeHistory = {
  async site(id: string) {
    if (!this._sites[id]) {
      this._sites[id] = await createSiteCodeHistoryDb(id);
    }
    return this._sites[id];
  },
  timeout: {} as Record<string, any>,
  _sites: {} as Record<
    string,
    Awaited<ReturnType<typeof createSiteCodeHistoryDb>>
  >,
  _comp: null as null | ReturnType<typeof createCompCodeHistoryDb>,
  comp(id: string) {
    if (!this._comp) {
      this._comp = createCompCodeHistoryDb();
    }
    return this._comp;
  },
};

const createCompCodeHistoryDb = () => {
  return new BunORM(dir.data(`/sqlite/crdt/comp-code-history.db`), {
    tables: {
      comp_code: {
        columns: {
          comp_id: { type: "TEXT" },
          item_id: { type: "TEXT" },
          type: { type: "TEXT" }, // js, css, html, prop, comp
          prop_name: { type: "TEXT" },
          text: { type: "TEXT" },
          ts: { type: "INTEGER" },
        },
      },
    },
  });
};
const createSiteCodeHistoryDb = async (site_id: string) => {
  await dirAsync(dir.data(`/sqlite/crdt/site/${site_id}`));
  return new BunORM(dir.data(`/sqlite/crdt/site/${site_id}/code-history.db`), {
    tables: {
      page_code: {
        columns: {
          page_id: { type: "TEXT" },
          item_id: { type: "TEXT" },
          type: { type: "TEXT" }, // js, css, html, prop, comp
          prop_name: { type: "TEXT" },
          text: { type: "TEXT" },
          ts: { type: "INTEGER" },
        },
      },
    },
  });
};

export const createSiteCrdt = async (site_id: string) => {
  await dirAsync(dir.data(`/crdt/site/${site_id}`));

  return {
    page: await createPageDb(site_id),
  };
};

export const crdt_pages = {} as Record<
  string,
  {
    doc: Doc;
    url: string;
    awareness: Awareness;
    undoManager: UndoManager;
    actionHistory: Record<number, string>;
    timeout: any;
    ws: Set<ServerWebSocket<WSContext>>;
    updated_at: number;
  }
>;

export const crdt_comps = {} as Record<
  string,
  {
    doc: Doc;
    awareness: Awareness;
    undoManager: UndoManager;
    actionHistory: Record<number, string>;
    timeout: any;
    ws: Set<ServerWebSocket<WSContext>>;
    updated_at: number;
  }
>;

export const crdt_site = {} as Record<
  string,
  Awaited<ReturnType<typeof createSiteCrdt>>
>;
