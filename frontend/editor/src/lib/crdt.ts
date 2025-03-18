import { proxy, subscribe } from "valtio";
import { bind } from "valtio-yjs";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

export type DeepReadonly<T> = T extends Function
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export type CRDT<T extends Record<string, unknown>> = {
  write: T;
  destroy: () => void;
  undo: () => void;
  redo: () => void;
  can: {
    undo: boolean;
    redo: boolean;
  };
};

const CRDT_MESSAGE = {
  SYNC: 0,
  AWARENESS: 1,
  UNDO: 2,
  REDO: 3,
  HISTORY_INFO: 3
} as const;

export const connectCRDT = <T extends Record<string, unknown>>({
  type,
  id,
  render,
}: {
  type: string;
  id: string;
  render: () => void;
}) => {
  const ydoc = new Y.Doc();

  const url = new URL(location.href);
  url.protocol = url.protocol.replace("http", "ws");
  url.pathname = `/_crdt`;

  const sync = new WebsocketProvider(url.toString(), `${type}/${id}`, ydoc);
  const ymap = ydoc.getMap("entry");
  const write = proxy({}) as T;
  const undoCan = proxy({ undo: true, redo: true });
  bind(write, ymap);

  subscribe(write, () => {
    render();
  });

  // Setup WebSocket handlers when connection is ready
  if (sync.ws) {
    sync.ws.binaryType = "arraybuffer";
    const socket = sync.ws;
    const messageHandler = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        const message = new Uint8Array(event.data);
        const decoder = new DataView(message.buffer);
        const messageType = decoder.getUint8(0);

        if (messageType === CRDT_MESSAGE.HISTORY_INFO) {
          undoCan.undo = decoder.getUint8(1) === 1;
          undoCan.redo = decoder.getUint8(2) === 1;
        }
      }
    };
    socket.addEventListener("message", messageHandler);
  }

  const destroy = () => {
    sync.disconnect();
    ydoc.destroy();
  };

  const sendWebSocketMessage = (message: string) => {
    if (sync.ws && sync.ws.readyState === WebSocket.OPEN) {
      sync.ws.send(message);
    }
  };

  return {
    write,
    destroy,
    undo: () => {
      sendWebSocketMessage("undo");
    },
    can: undoCan,
    redo: () => {
      sendWebSocketMessage("redo");
    },
  } as CRDT<T>;
};
