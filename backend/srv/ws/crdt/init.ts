export const initCRDT = async () => {
  const { bind } = await import(
    "prasi-frontend/src/nova/ed/crdt/lib/immer-yjs"
  );
  const { applyAwarenessUpdate, Awareness } = await import(
    "y-protocols/awareness.js"
  );
  const syncProtocol = await import("y-protocols/sync.js");
  const { readSyncMessage } = await import("y-protocols/sync.js");
  const yjs = await import("yjs");
  return {
    bind,
    applyAwarenessUpdate,
    Awareness,
    syncProtocol,
    readSyncMessage,
    yjs
  };
};
