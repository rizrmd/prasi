import type { ServerWebSocket } from "bun";
import { dirAsync } from "fs-jetpack";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import { waitUntil } from "prasi-utils";
import { validate } from "uuid";
import type { UndoManager } from "yjs";
import { editor } from "../../utils/editor";
import type { WSContext } from "../../utils/server/ctx";
import {
  crdt_pages,
  crdt_site,
  createSiteCrdt,
  MAX_HISTORY_SIZE,
} from "./shared";
import { dir, isLocalPC } from "utils/files/dir";
import { initCRDT } from "./init";

const crdt_loading = new Set<string>();

enum MessageType {
  Sync = 0,
  Awareness = 1,
}

export const wsPageClose = (ws: ServerWebSocket<WSContext>) => {
  const page_id = ws.data.pathname.substring(`/crdt/page-`.length);
  const page = crdt_pages[page_id];
  if (page) {
    page.ws.delete(ws);
  }
};

export const wsPage = async (ws: ServerWebSocket<WSContext>, raw: Buffer) => {
  if (!g.crdt) {
    g.crdt = await initCRDT();
  }
  const { applyUpdate, Doc, encodeStateAsUpdate, UndoManager } = g.crdt.yjs;
  const {
    bind,
    Awareness,
    syncProtocol,
    applyAwarenessUpdate,
    readSyncMessage,
  } = g.crdt;

  const page_id = ws.data.pathname.substring(`/crdt/page-`.length);

  if (!validate(page_id)) {
    console.warn("Invalid page_id:" + page_id);
    return;
  }

  if (isLocalPC() && crdt_pages[page_id]) {
    const updated_at = crdt_pages[page_id].updated_at;
    const res = await _db.page.findFirst({
      where: { id: page_id },
      select: { updated_at: true },
    });
    if (
      crdt_pages[page_id] &&
      res &&
      res.updated_at &&
      updated_at !== res.updated_at.getTime()
    ) {
      crdt_pages[page_id].ws.forEach((w) => w.close());
      delete crdt_pages[page_id];
      crdt_loading.delete(page_id);
    }
  }

  if (!crdt_pages[page_id]) {
    if (crdt_loading.has(page_id)) {
      await waitUntil(() => crdt_pages[page_id]);
      crdt_loading.delete(page_id);
    } else {
      crdt_loading.add(page_id);

      const db_page = await _db.page.findFirst({
        where: { id: page_id },
        select: {
          updated_at: true,
          content_tree: true,
          id_site: true,
          url: true,
        },
      });
      if (!db_page) return;

      const site_id = db_page!.id_site;
      if (site_id && !crdt_site[site_id]) {
        await dirAsync(dir.data(`/crdt`));
        crdt_site[site_id] = await createSiteCrdt(site_id);
      }
      const site = crdt_site[site_id];

      const doc = new Doc();
      const data = doc.getMap("data");
      const immer = bind<any>(data);

      const actionHistory = {} as Record<number, string>;
      let undoManager: UndoManager | undefined;

      const checkpoint = site.page.tables.page_updates.find({
        select: ["ts"],
        where: { checkpoint: 1 },
        sort: { ts: "desc" },
        limit: 1,
      });

      const updates =
        checkpoint.length === 0
          ? []
          : site.page.tables.page_updates.find({
              where: {
                page_id,
                ts: [`>=`, checkpoint[0].ts],
              },
              sort: { ts: "asc" },
            });

      if (updates.length > 0) {
        undoManager = new UndoManager(data, { captureTimeout: 0 });
        const pending_ids: number[] = [];

        undoManager.on("stack-item-added", (opt) => {
          const stack = opt.stackItem as any;
          stack.id = pending_ids.pop();
        });

        for (const d of updates) {
          pending_ids.push(d.id);
          actionHistory[d.id] = d.action;
          applyUpdate(doc, d.update);
        }
      } else {
        immer.update(() => db_page?.content_tree);
        const update = encodeStateAsUpdate(doc);
        site.page.tables.page_updates.save({
          action: "init",
          page_id,
          update,
          ts: Date.now(),
          checkpoint: 1,
        });
        undoManager = new UndoManager(data);
      }
      undoManager.captureTimeout = 200;

      if (undoManager) {
        const awareness = new Awareness(doc);
        awareness.setLocalState(null);

        undoManager.on("stack-item-popped", (opt) => {
          const stack = opt.stackItem as unknown as { id: number; ts: number };
          if (opt.type === "undo" && undoManager.redoStack.length > 0) {
            const last = undoManager.redoStack[
              undoManager.redoStack.length - 1
            ] as unknown as { id: number; ts: number };
            if (last && stack) {
              last.id = stack.id;
              last.ts = stack.ts;
            }
          } else {
            const last = undoManager.undoStack[
              undoManager.undoStack.length - 1
            ] as unknown as { id: number; ts: number };
            if (last && stack) {
              last.id = stack.id;
              last.ts = stack.ts;
            }
          }
        });
        undoManager.on("stack-item-added", (opt) => {
          if (opt.type === "undo") {
            if (undoManager.redoStack.length === 0) {
              const action = editor.page.pending_action[page_id]?.pop() || "";
              editor.page.timeout_action[page_id] = setTimeout(() => {
                editor.page.pending_action[page_id] = [];
              }, 1000);
              const stack = opt.stackItem as any;
              stack.ts = Date.now();
              stack.action = action;
            } else {
            }
          }
        });

        crdt_pages[page_id] = {
          undoManager,
          doc,
          awareness,
          url: db_page.url,
          actionHistory,
          timeout: null,
          ws: new Set(),
          updated_at: db_page.updated_at?.getTime() || Date.now(),
        };
      }

      doc.on("update", (update, origin) => {
        const page = crdt_pages[page_id];
        if (page) {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MessageType.Sync);
          syncProtocol.writeUpdate(encoder, update);
          const message = encoding.toUint8Array(encoder);
          page.ws.forEach((w) => w.send(message));
          const ts = Date.now();

          if (origin === undoManager) {
            if (undoManager.undoing) {
              const count = site.page.tables.page_updates.count({
                where: { page_id },
              });

              if (count > 1) {
                site.page.tables.page_updates.delete({
                  where: { page_id },
                  sort: { ts: "desc" },
                  limit: 1,
                });
              }
            }

            if (undoManager.redoing) {
              site.page.tables.page_updates.save({
                action: "Redo",
                page_id,
                update: encodeStateAsUpdate(doc),
                checkpoint: 0,
                ts,
              });
            }
          } else {
            const stack = undoManager.undoStack[
              undoManager.undoStack.length - 1
            ] as unknown as { id: number; action: string };
            const action_name = stack.action || "";

            const checkpoint = site.page.tables.page_updates.find({
              select: ["ts"],
              where: { checkpoint: 1 },
              limit: 1,
              sort: { ts: "desc" },
            });

            const checkpoint_counts = site.page.tables.page_updates.count({
              where: { ts: [`>=`, checkpoint[0].ts] },
            });

            if (checkpoint_counts >= MAX_HISTORY_SIZE) {
              const update = encodeStateAsUpdate(doc);
              const res = site.page.tables.page_updates.save({
                action: "init",
                page_id,
                update,
                ts: Date.now(),
                checkpoint: 1,
              });

              stack.id = res[0].id;
              actionHistory[res[0].id] = action_name;
            } else {
              const res = site.page.tables.page_updates.save({
                action: action_name,
                page_id,
                update,
                checkpoint: 0,
                ts,
              });
              stack.id = res[0].id;
              actionHistory[res[0].id] = action_name;
            }
          }

          const updated_at = new Date();
          crdt_pages[page_id].updated_at = updated_at.getTime();

          // _db.page
          //   .update({
          //     where: { id: page_id },
          //     data: {
          //       content_tree: doc.getMap("data").toJSON(),
          //       updated_at,
          //     },
          //     select: { id: true },
          //   })
          //   .then((res) => {});
        }
      });
    }
  }

  const { doc, awareness, ws: page_ws } = crdt_pages[page_id];

  page_ws.add(ws);
  const encoder = encoding.createEncoder();
  const decoder = decoding.createDecoder(new Uint8Array(raw));
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case MessageType.Sync:
      encoding.writeVarUint(encoder, MessageType.Sync);
      readSyncMessage(decoder, encoder, doc, null);

      if (encoding.length(encoder) > 1) {
        ws.send(encoding.toUint8Array(encoder));
      }

      break;

    case MessageType.Awareness: {
      const update = decoding.readVarUint8Array(decoder);
      applyAwarenessUpdate(awareness, update, ws);
      break;
    }
  }
};
