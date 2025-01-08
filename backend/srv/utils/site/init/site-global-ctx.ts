import { createContext } from "node:vm";
import type { ESite } from "prasi-frontend/src/nova/ed/logic/types";
import { fs } from "utils/files/fs";
import { join } from "path";
export const newSiteGlobalContext = (site: ESite, server_path: string) => {
  const exports = {};
  const db_config = { orm: "", url: "" };
  let db = undefined;

  const prasi_db = site.settings?.prasi.db;
  if (prasi_db?.use === "db_url") {
    if (prasi_db.orm === "prisma") {
      db_config.orm = "prisma";
      db_config.url = prasi_db.db_url;
      db = require(
        join(server_path, "app/db/node_modules/.prisma/client/index.js")
      );
    }
  }

  const ctx = {
    module: { exports },
    exports,
    AbortController,
    AbortSignal,
    alert,
    Blob,
    Buffer,
    Bun,
    ByteLengthQueuingStrategy,
    confirm,
    atob,
    btoa,
    BuildMessage,
    clearImmediate,
    db_config,
    db,
    clearInterval,
    clearTimeout,
    console,
    CountQueuingStrategy,
    Crypto,
    crypto,
    CryptoKey,
    CustomEvent,
    Event,
    EventTarget,
    fetch,
    FormData,
    Headers,
    HTMLRewriter,
    JSON,
    MessageEvent,
    performance,
    prompt,
    process: {
      ...process,
      cwd() {
        return this._cwd;
      },
      chdir(cwd: string) {
        this._cwd = cwd;
      },
      _cwd: "",
    },
    queueMicrotask,
    ReadableByteStreamController,
    ReadableStream,
    ReadableStreamDefaultController,
    ReadableStreamDefaultReader,
    reportError,
    require,
    ResolveMessage,
    Response,
    Request,
    setImmediate,
    setInterval,
    setTimeout,
    ShadowRealm,
    SubtleCrypto,
    DOMException,
    TextDecoder,
    TextEncoder,
    TransformStream,
    TransformStreamDefaultController,
    URL,
    URLSearchParams,
    WebAssembly,
    WritableStream,
    WritableStreamDefaultController,
    WritableStreamDefaultWriter,
  } as any;
  ctx.global = ctx;
  ctx.globalThis = ctx;
  return createContext(ctx);
};
