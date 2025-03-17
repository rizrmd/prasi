import { proxy } from "valtio";
import { bind } from "valtio-yjs";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

export type DeepReadonly<T> = T extends Function
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export type CRDT<T extends Record<string, unknown> | unknown[]> = {
  write: T;
  destroy: () => void;
};

export const connectCRDT = <T extends Record<string, unknown> | unknown[]>({
  path,
  map,
  room,
}: {
  path: string;
  map: string;
  room: string;
}) => {
  const ydoc = new Y.Doc();

  const url = new URL(location.href);
  url.protocol = url.protocol.replace("http", "ws");
  url.pathname = path;
  const ws = new WebsocketProvider(path, room, ydoc);
  const ymap = ydoc.getMap(map);
  const write = proxy({}) as T;
  bind(write, ymap);
  const destroy = () => {
    ws.disconnect();
    ydoc.destroy();
  };
  return { write, destroy } as CRDT<T>;
};
