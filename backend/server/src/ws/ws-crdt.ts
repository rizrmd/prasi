import type { Awareness } from "y-protocols/awareness.js";
import type { UndoManager as YUndoManager } from "yjs";

const g = global as any;
if (!g.yjs) {
  g.yjs = await import("yjs");
  g.yawareness = await import("y-protocols/awareness");
  g.ysync = await import("y-protocols/sync");
}

const awarenessProtocol = g.yawareness;
const syncProtocol = g.ysync;
const Y = g.yjs as any;
const UndoManager = Y.UndoManager;

const decoder = new TextDecoder();
type YDoc = InstanceType<typeof Y.Doc>;

import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import * as map from "lib0/map";

import type { ServerWebSocket } from "bun";
import type { WSHandler } from "server/utils/accept-ws";
import { crdtTypes } from "../crdt/crdt-types";
import type { WebSocketData } from "./typings";

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2; // eslint-disable-line
const wsReadyStateClosed = 3; // eslint-disable-line

type CallbackFn = (update: Uint8Array, origin: any, doc: YDoc) => void;

const updateTimeout = {} as Record<string, Timer>;

const gcEnabled = true;
const docs = new Map<string, WSSharedDoc>();

// Map to associate WebSocket connections with document names
const wsToDocMap = new Map<ServerWebSocket<any>, string>();

const messageSync = 0;
const messageAwareness = 1;
const messageUndoRedoSend = 3;

/**
 * Send current undo/redo status to client
 */
const sendUndoRedoStatus = (
  doc: WSSharedDoc,
  ws: ServerWebSocket<any>
): void => {
  if (!doc.undoManager) return;
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageUndoRedoSend);
  const canUndo = doc.undoManager.canUndo();
  const canRedo = doc.undoManager.canRedo();
  encoding.writeVarUint(encoder, canUndo ? 1 : 0);
  encoding.writeVarUint(encoder, canRedo ? 1 : 0);

  send(doc, ws, encoding.toUint8Array(encoder));
};

/**
 * @param {Uint8Array} update
 * @param {any} _origin
 * @param {WSSharedDoc} doc
 * @param {any} _tr
 */
const updateHandler = (
  update: Uint8Array,
  _origin: any,
  doc: WSSharedDoc,
  _tr: any
): void => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  const message = encoding.toUint8Array(encoder);
  doc.conns.forEach((_, conn) => {
    send(doc, conn, message);
    sendUndoRedoStatus(doc, conn);
  });
  // Call crdt.update immediately after applying the update
  const type = doc.name.split("/")[0];
  const crdt = crdtTypes[type as keyof typeof crdtTypes];
  if (crdt && crdt.update) {
    clearTimeout(updateTimeout[doc.name]);
    updateTimeout[doc.name] = setTimeout(() => {
      crdt.update(doc.name, doc.getMap("entry").toJSON());
    }, 1000);
  }
};

let contentInitializor: (ydoc: YDoc) => Promise<void> = async (ydoc: YDoc) => {
  if (ydoc instanceof WSSharedDoc && !ydoc.isInitialized) {
    const type = ydoc.name.split("/")[0];
    const crdt = crdtTypes[type as keyof typeof crdtTypes];
    if (crdt && crdt.init) {
      // Get initial data
      const data = await crdt.init(ydoc.name);

      // Apply id to the entry map to match frontend structure
      if (data && data.id) {
        ydoc.transact(() => {
          const ymap = ydoc.getMap("entry");
          for (const [k, v] of Object.entries(data)) {
            ymap.set(k, v);
          }
        });
      }

      ydoc.isInitialized = true;

      // Clear the undo stack after initialization
      if (ydoc.undoManager) {
        ydoc.undoManager.clear();
      }
    }
  }
};

/**
 * This function is called once every time a Yjs document is created. You can
 * use it to pull data from an external source or initialize content.
 *
 * @param {(ydoc: Y.Doc) => Promise<void>} f
 */
export const setContentInitializor = (
  f: (ydoc: YDoc) => Promise<void>
): void => {
  contentInitializor = f;
};

export class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<ServerWebSocket<any>, Set<number>>;
  awareness: Awareness;
  undoManager?: YUndoManager;
  whenInitialized: Promise<void>;
  isInitialized: boolean = false;
  declare gc: boolean;

  /**
   * @param {string} name
   */
  constructor(name: string) {
    super({ gc: gcEnabled });
    this.name = name;
    /**
     * Maps from conn to set of controlled user ids. Delete all user ids from awareness when this conn is closed
     * @type {Map<ServerWebSocket, Set<number>>}
     */
    this.conns = new Map<ServerWebSocket<any>, Set<number>>();
    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);
    /**
     * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
     * @param {ServerWebSocket | null} conn Origin is the connection that made the change
     */
    const awarenessChangeHandler = (
      {
        added,
        updated,
        removed,
      }: {
        added: Array<number>;
        updated: Array<number>;
        removed: Array<number>;
      },
      conn: ServerWebSocket<any> | null
    ): void => {
      const changedClients = added.concat(updated, removed);
      if (conn !== null) {
        const connControlledIDs = this.conns.get(conn);
        if (connControlledIDs !== undefined) {
          added.forEach((clientID) => {
            connControlledIDs.add(clientID);
          });
          removed.forEach((clientID) => {
            connControlledIDs.delete(clientID);
          });
        }
      }
      // broadcast awareness update
      this.transact(() => {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            this.awareness,
            changedClients
          )
        );
        const buff = encoding.toUint8Array(encoder);
        this.conns.forEach((_, c) => {
          send(this, c, buff);
        });
      });
    };
    this.awareness.on("update", awarenessChangeHandler);
    this.on("update", updateHandler as any);

    this.whenInitialized = contentInitializor(this).catch((err) => {
      console.error("Error initializing document:", err);
      throw err;
    });
  }
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @param {string} docname - the name of the Y.Doc to find or create
 * @param {boolean} gc - whether to allow gc on the doc (applies only when created)
 * @return {WSSharedDoc}
 */
export const getYDoc = (docname: string, gc: boolean = true): WSSharedDoc =>
  map.setIfUndefined(docs, docname, () => {
    const doc = new WSSharedDoc(docname);
    if (!doc.undoManager) {
      // Create UndoManager targeting the entry map to match frontend binding
      const entryMap = doc.getMap("entry");
      doc.undoManager = new UndoManager(entryMap, { captureTimeout: 300 });
    }
    doc.gc = gc;
    docs.set(docname, doc);
    return doc;
  });

/**
 * @param {ServerWebSocket} ws
 * @param {WSSharedDoc} doc
 * @param {Uint8Array} message
 */
const messageListener = (
  ws: ServerWebSocket<any>,
  doc: WSSharedDoc,
  message: Uint8Array
): void => {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        doc.transact(() => {
          syncProtocol.readSyncMessage(decoder, encoder, doc, ws);
        });

        // If the `encoder` only contains the type of reply message and no
        // message, there is no need to send the message. When `encoder` only
        // contains the type of reply, its length is 1.
        if (encoding.length(encoder) > 1) {
          send(doc, ws, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          ws
        );
        break;
      }
    }
  } catch (err) {
    console.error("Error in messageListener:", err);
  }
};

/**
 * @param {WSSharedDoc} doc
 * @param {ServerWebSocket} ws
 */
const closeConn = (doc: WSSharedDoc, ws: ServerWebSocket<any>): void => {
  if (doc.conns.has(ws)) {
    const controlledIds = doc.conns.get(ws)!;
    doc.conns.delete(ws);
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds),
      null
    );
    if (doc.conns.size === 0) {
      // if persisted, we store state and destroy ydocument
      doc.destroy();
      docs.delete(doc.name);
    }
  }
  wsToDocMap.delete(ws);
};

/**
 * @param {WSSharedDoc} doc
 * @param {ServerWebSocket} ws
 * @param {Uint8Array} m
 */
const send = (
  doc: WSSharedDoc,
  ws: ServerWebSocket<any>,
  m: Uint8Array
): void => {
  if (
    ws.readyState !== wsReadyStateConnecting &&
    ws.readyState !== wsReadyStateOpen
  ) {
    closeConn(doc, ws);
    return;
  }
  try {
    ws.send(m);
  } catch (e) {
    closeConn(doc, ws);
  }
};

/**
 * Helper to get document name from WebSocket data
 */
const getDocNameFromUrl = (wsData: WebSocketData): string => {
  return `${wsData.type}/${wsData.id}`;
};

// Create a ping interval map to track ping intervals for each connection
const pingIntervals = new Map<ServerWebSocket<any>, NodeJS.Timer>();
const pongReceivedFlags = new Map<ServerWebSocket<any>, boolean>();
const pingTimeout = 30000;

// Implement the WSHandler interface
export const wsCrdt = {
  open: async (ws: ServerWebSocket<WebSocketData>) => {
    // Get document name from WebSocket data
    const docName = getDocNameFromUrl(ws.data);
    wsToDocMap.set(ws, docName);

    ws.binaryType = "arraybuffer";
    // Get or create document
    const doc = getYDoc(docName, true);
    doc.conns.set(ws, new Set());

    // Setup ping-pong to check connection liveness
    pongReceivedFlags.set(ws, true);
    const pingInterval = setInterval(() => {
      if (!pongReceivedFlags.get(ws)) {
        if (doc.conns.has(ws)) {
          closeConn(doc, ws);
        }
        clearInterval(pingInterval);
        pingIntervals.delete(ws);
      } else if (doc.conns.has(ws)) {
        pongReceivedFlags.set(ws, false);
        try {
          ws.ping();
        } catch (e) {
          closeConn(doc, ws);
          clearInterval(pingInterval);
          pingIntervals.delete(ws);
        }
      }
    }, pingTimeout);
    pingIntervals.set(ws, pingInterval);

    // Send initial sync message
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    send(doc, ws, encoding.toUint8Array(encoder));

    // Send initial awareness states if available
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, messageAwareness);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      send(doc, ws, encoding.toUint8Array(awarenessEncoder));
    }

    // Send initial undo/redo status
    doc.whenInitialized.then(() => {
      sendUndoRedoStatus(doc, ws);
    });
  },

  message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
    let str = message;
    if ((message as any).byteLength === 12 && message instanceof ArrayBuffer) {
      str = decoder.decode(message);
    }

    if (typeof str === "string") {
      if (str === "undo" || str === "redo") {
        const docName = wsToDocMap.get(ws);
        if (docName) {
          const doc = docs.get(docName);
          if (doc) {
            // Handle undo/redo commands
            if (str === "undo") {
              doc.undoManager?.undo();
            } else if (str === "redo") {
              doc.undoManager?.redo();
            }
            doc.conns.forEach((_, conn) => sendUndoRedoStatus(doc, conn));
            return;
          }
        }
      }
      if (str === "pong") {
        pongReceivedFlags.set(ws, true);
        return;
      }
    }

    // Handle binary messages for Yjs protocol
    if (message instanceof ArrayBuffer) {
      const docName = wsToDocMap.get(ws);
      if (docName) {
        const doc = docs.get(docName);
        if (doc) {
          messageListener(ws, doc, new Uint8Array(message));
        }
      }
    }
  },

  close(ws: ServerWebSocket<WebSocketData>) {
    // Clean up when connection closes
    const docName = wsToDocMap.get(ws);
    if (docName) {
      const doc = docs.get(docName);
      if (doc) {
        closeConn(doc, ws);
      }
    }

    // Clear ping interval
    const pingInterval = pingIntervals.get(ws);
    if (pingInterval) {
      clearInterval(pingInterval);
      pingIntervals.delete(ws);
    }
    pongReceivedFlags.delete(ws);
    wsToDocMap.delete(ws);
  },
} as const satisfies WSHandler;
