import type { Glob, TSConfig } from "bun";
import path from "node:path";

const USES_WIN32_SEP = path.sep === path.win32.sep;

const extRegex = /\.(js|jsx|ts|tsx)$/;

class PathsMap extends Map<string, Set<string>> {}

type ScanConfig = {
  findTSConfig(filePath: string): Promise<string | TSConfig | undefined>;
  excludeGlobs: readonly Glob[];
};

type ScanOptions = Readonly<{
  /**
   * Use this `tsconfig.json` for the given file when scanning for import paths.
   * If omitted, it will walk up the file system, looking for the nearest
   * `tsconfig.json` for each file.
   */
  findTSConfig?(filePath: string): Promise<string | TSConfig | undefined>;

  /** Don't watch these globs. Defaults to `[ "./node_modules/**" ]`. */
  exclude?: readonly string[];
}>;

async function findImportsOnce(
  filePaths: Set<string>,
  { findTSConfig, excludeGlobs }: ScanConfig
): Promise<PathsMap> {
  type ExtCapture = "js" | "jsx" | "ts" | "tsx";

  const childFiles = await Promise.all(
    filePaths
      .values()
      .map(async (parentPath): Promise<[string, Set<string>] | undefined> => {
        const match = parentPath.match(extRegex);
        if (match === null) return undefined;
        const loader = match[0] as ExtCapture;

        const parentFile = Bun.file(parentPath);
        const parentExists = await parentFile.exists();
        if (!parentExists) return undefined;

        const transpiler = new Bun.Transpiler({
          tsconfig: await findTSConfig(parentPath),
          loader,
        });

        const imports = transpiler.scanImports(await parentFile.bytes());
        const resolvedImports = await Promise.all(
          imports
            .values()
            .map(async ({ path: importPath }): Promise<string | undefined> => {
              // import.meta.resolve seems to take node_modules into account
              // and Bun.resolveSync resolves the URL to a file path
              let resolvedImportPath: string;
              try {
                resolvedImportPath = Bun.resolveSync(
                  import.meta.resolve(importPath, parentPath),
                  parentPath
                );
              } catch (err) {
                return undefined;
              }

              const resolvedFile = Bun.file(resolvedImportPath);

              if (
                excludeGlobs.every((glob) => !glob.match(resolvedImportPath)) &&
                (await resolvedFile.exists())
              ) {
                return resolvedImportPath;
              }
            })
        );

        return [
          parentPath,
          new Set<string>(resolvedImports.filter((str) => str !== undefined)),
        ];
      })
  );

  return new PathsMap(childFiles.filter((value) => value !== undefined));
}

function mergePaths(allPaths: PathsMap, foundPaths: PathsMap) {
  for (const [parentPath, childPaths] of foundPaths) {
    const allChildPaths = allPaths.get(parentPath);
    if (!allChildPaths) {
      allPaths.set(parentPath, childPaths);
      continue;
    }

    // If the same link `parent -> child` is found twice, there is a cyclic
    // import.
    if (!allChildPaths.isDisjointFrom(childPaths)) {
      const mergedPaths = allChildPaths.union(childPaths);
      allPaths.set(parentPath, mergedPaths);
      continue;
    }
    allPaths.set(parentPath, allChildPaths.union(childPaths));
  }
}

/** recursively scans the files specified by `paths` for import paths */
export async function findImports(
  paths: string[],
  scanConfig: ScanConfig
): Promise<Set<string>> {
  const allPaths = new PathsMap();
  let foundPaths = new PathsMap().set("", new Set(paths));
  let previousSize = 0;
  mergePaths(allPaths, foundPaths);

  while (foundPaths.size > 0 && foundPaths.size !== previousSize) {
    previousSize = foundPaths.size;

    const newPaths = new Set<string>();
    for (const childPaths of foundPaths.values()) {
      for (const childPath of childPaths) {
        newPaths.add(childPath);
      }
    }

    foundPaths = await findImportsOnce(newPaths, scanConfig);
    mergePaths(allPaths, foundPaths);
  }

  const result = new Set<string>();
  for (const childPaths of allPaths.values()) {
    for (const childPath of childPaths) {
      result.add(childPath);
    }
  }

  return result;
}
