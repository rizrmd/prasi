import { watch, type FSWatcher, type WatchListener } from "fs";
import { dir } from "./dir";
export const watcher = {
  current: {} as Record<string, FSWatcher>,
  add(path: string, callback: WatchListener<string>) {
    if (this.current[path]) {
      this.remove(path);
    }

    const resolvedPath = dir.path(path);
    dir.ensure(path);
    try {
      const watcher = watch(resolvedPath, { recursive: true }, callback);
      this.current[path] = watcher;
      return watcher;
    } catch (err) {
      console.error(err);
    }
  },
  remove(path: string) {
    if (this.current[path]) {
      try {
        this.current[path].close();
        delete this.current[path];
      } catch (err) {
        console.error(`Failed to remove watcher for ${path}:`, err);
      }
    }
  },
};
