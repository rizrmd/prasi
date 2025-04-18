import { resolve } from "path";
import * as fs from "fs";
import * as Path from "path";

const cwd = Path.resolve(import.meta.dir, "../../..");
export const dir = {
  path: (input: string) => {
    const paths = {
      "data:": "../data",
      "frontend:": "./frontend",
      "backend:": "./backend",
      "root:": "./",
    };

    // Check if input starts with any of the defined prefixes
    for (const [prefix, path] of Object.entries(paths)) {
      if (input.startsWith(prefix)) {
        // Remove the prefix and resolve the remaining path
        const relativePath = input.slice(prefix.length);
        return resolve(cwd, path, relativePath);
      }
    }

    // If no prefix matches, return the original input resolved from current directory
    return resolve(cwd, input);
  },
  exists: (path: string) => {
    const fullPath = dir.path(path);
    return fs.existsSync(fullPath);
  },
  ensure: (path: string) => {
    const fullPath = dir.path(path);
    const parts = fullPath.split("/");
    let currentPath = "";

    for (const part of parts) {
      currentPath += part + "/";
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath);
      }
    }
  },
  list(path: string) {
    const fullPath = dir.path(path);

    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []) => {
      const files = fs.readdirSync(dirPath);

      files.forEach((file: string) => {
        const fullFilePath = Path.join(dirPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
          arrayOfFiles.push(fullFilePath + "/");
          getAllFiles(fullFilePath, arrayOfFiles);
        } else {
          arrayOfFiles.push(fullFilePath);
        }
      });

      return arrayOfFiles;
    };

    return getAllFiles(fullPath).map((file) =>
      file.replace(fullPath + "/", "")
    );
  },
};
