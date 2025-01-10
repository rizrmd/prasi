import type { ServerWebSocket } from "bun";
import { dirAsync } from "fs-jetpack";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import type { IItem } from "prasi-frontend/src/utils/types/item";
import { waitUntil } from "prasi-utils";
import { dir, isLocalPC } from "utils/files/dir";
import BunORM from "utils/files/sqlite";
import { validate } from "uuid";
import type { UndoManager } from "yjs";
import { editor } from "../../utils/editor";
import type { WSContext } from "../../utils/server/ctx";
import { initCRDT } from "./init";
import { crdt_comps, MAX_HISTORY_SIZE } from "./shared";

const crdt_loading = new Set<string>();
await dirAsync(dir.data(`/sqlite/crdt`));
const internal = {
  db: new BunORM(dir.data(`/sqlite/crdt/comp.db`), {
    tables: {
      comp_updates: {
        columns: {
          comp_id: { type: "TEXT" },
          action: { type: "TEXT" },
          update: { type: "BLOB" },
          checkpoint: { type: "INTEGER" },
          ts: { type: "INTEGER" },
        },
      },
    },
  }),
};

enum MessageType {
  Sync = 0,
  Awareness = 1,
}

export const wsCompClose = (ws: ServerWebSocket<WSContext>) => {
  const comp_id = ws.data.pathname.substring(`/crdt/comp-`.length);
  const comp = crdt_comps[comp_id];
  if (comp) {
    comp.ws.delete(ws);
  }
};

export const wsComp = async (ws: ServerWebSocket<WSContext>, raw: Buffer) => {
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

  const comp_id = ws.data.pathname.substring(`/crdt/comp-`.length);

  if (!validate(comp_id)) {
    console.warn("Invalid comp_id:" + comp_id);
    return;
  }

  if (isLocalPC() && crdt_comps[comp_id]) {
    const updated_at = crdt_comps[comp_id].updated_at;
    const res = await _db.page.findFirst({
      where: { id: comp_id },
      select: { updated_at: true },
    });
    if (res) {
      if (res && res.updated_at && updated_at !== res.updated_at.getTime()) {
        crdt_comps[comp_id].ws.forEach((w) => w.close());
        delete crdt_comps[comp_id];
        crdt_loading.delete(comp_id);
      }
    }
  }

  if (!crdt_comps[comp_id]) {
    if (crdt_loading.has(comp_id)) {
      await waitUntil(() => crdt_comps[comp_id]);
      crdt_loading.delete(comp_id);
    } else {
      const db_comp = await _db.component.findFirst({
        where: { id: comp_id },
        select: { content_tree: true, name: true, component_group: true },
      });
      if (!db_comp) return;

      const doc = new Doc();
      const data = doc.getMap("data");
      const immer = bind<any>(data);

      const actionHistory = {} as Record<number, string>;
      let undoManager: UndoManager | undefined;

      const checkpoint = internal.db.tables.comp_updates.find({
        select: ["ts"],
        where: { checkpoint: 1 },
        sort: { ts: "desc" },
        limit: 1,
      });

      const updates =
        checkpoint.length === 0
          ? []
          : internal.db.tables.comp_updates.find({
              where: {
                comp_id,
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
        immer.update(() => db_comp?.content_tree);
        const update = encodeStateAsUpdate(doc);
        internal.db.tables.comp_updates.save({
          action: "init",
          comp_id,
          update,
          checkpoint: 1,
          ts: Date.now(),
        });
        undoManager = new UndoManager(data);
      }

      undoManager.captureTimeout = 200;

      const save = async () => {
        const found = editor.cache.tables.comp.find({ where: { comp_id } });
        const comp = immer.get() as IItem;
        db_comp.name = comp.name;
        editor.cache.tables.comp.save({
          id: found?.[0]?.id,
          comp_id: comp_id,
          data: {
            id: comp_id,
            id_component_group: db_comp.component_group?.id,
            content_tree: comp,
          },
          ts: Date.now(),
        });

        const updated_at = new Date();
        crdt_comps[comp_id].updated_at = updated_at.getTime();

        // await _db.component.update({
        //   where: { id: comp_id },
        //   data: {
        //     name: db_comp.name,
        //     content_tree: comp,
        //     updated_at,
        //   },
        //   select: { id: true },
        // });
      };

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
              const action = editor.comp.pending_action[comp_id]?.pop() || "";
              editor.comp.timeout_action[comp_id] = setTimeout(() => {
                editor.comp.pending_action[comp_id] = [];
              }, 1000);
              const stack = opt.stackItem as any;
              stack.ts = Date.now();
              stack.action = action;
            } else {
            }
          }
        });

        crdt_comps[comp_id] = {
          undoManager,
          doc,
          awareness,
          actionHistory,
          timeout: null,
          ws: new Set(),
          updated_at: Date.now(),
        };
      }

      doc.on("update", (update, origin) => {
        const comp = crdt_comps[comp_id];

        if (comp) {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MessageType.Sync);
          syncProtocol.writeUpdate(encoder, update);
          const message = encoding.toUint8Array(encoder);
          comp.ws.forEach((w) => w.send(message));
          const ts = Date.now();

          if (origin === undoManager) {
            if (undoManager.undoing) {
              const count = internal.db.tables.comp_updates.count({
                where: { comp_id },
              });

              if (count > 1) {
                internal.db.tables.comp_updates.delete({
                  where: { comp_id },
                  sort: { ts: "desc" },
                  limit: 1,
                });
              }
            }

            if (undoManager.redoing) {
              internal.db.tables.comp_updates.save({
                action: "Redo",
                comp_id,
                checkpoint: 0,
                update: encodeStateAsUpdate(doc),
                ts: Date.now(),
              });
            }
          } else {
            const stack = undoManager.undoStack[
              undoManager.undoStack.length - 1
            ] as unknown as { id: number; action: string };
            const action_name = stack.action || "";

            const checkpoint = internal.db.tables.comp_updates.find({
              select: ["ts"],
              where: { checkpoint: 1 },
              limit: 1,
              sort: { ts: "desc" },
            });
            const checkpoint_counts = internal.db.tables.comp_updates.count({
              where: { ts: [`>=`, checkpoint[0].ts] },
            });

            if (checkpoint_counts >= MAX_HISTORY_SIZE) {
              const update = encodeStateAsUpdate(doc);
              const res = internal.db.tables.comp_updates.save({
                action: "init",
                comp_id,
                update,
                ts: Date.now(),
                checkpoint: 1,
              });

              stack.id = res[0].id;
              actionHistory[res[0].id] = action_name;
            } else {
              const res = internal.db.tables.comp_updates.save({
                action: action_name,
                comp_id,
                update,
                checkpoint: 0,
                ts,
              });
              stack.id = res[0].id;
              actionHistory[res[0].id] = action_name;
            }
          }
          save();
        }
      });
    }
  }

  const { doc, awareness, ws: comp_ws } = crdt_comps[comp_id];

  comp_ws.add(ws);
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
