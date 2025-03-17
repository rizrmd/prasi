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
  undoManager: Y.UndoManager;
};

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

  const ws = new WebsocketProvider(url.toString(), `${type}/${id}`, ydoc);
  const ymap = ydoc.getMap("entry");
  const write = proxy({}) as T;
  bind(write, ymap);

  subscribe(write, () => {
    render();
  });
  const destroy = () => {
    ws.disconnect();
    ydoc.destroy();
  };
  return { write, destroy } as CRDT<T>;
};
