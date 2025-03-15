/**
 * bundler-bun cannot be used, because of this bug:
 * 
 * error: Multiple files share the same output path
  ./chunk-czanrzpa.css:
    from input ../data/code/bf706e40-2a3a-4148-9cdd-75d4483328d7/site/src/lib/comps/form/field/Field.tsx
    from input ../data/code/bf706e40-2a3a-4148-9cdd-75d4483328d7/site/src/lib/comps/filter/MasterFilter.tsx
  ./chunk-7fe2h2p1.css:
    from input ../data/code/bf706e40-2a3a-4148-9cdd-75d4483328d7/site/src/lib/comps/custom/Popover.tsx
 * 
 */
import type { BuildArtifact, BuildOutput } from "bun";
import fs from "node:fs";
import { dirname, join, resolve } from "node:path";

const cwd = process.cwd();

function absolute(path: string) {
  return resolve(cwd, path);
}

async function getArtifactSources(artifact: BuildArtifact) {
  const sourcemap = await artifact.sourcemap?.json();
  if (!sourcemap) return [];
  return (sourcemap.sources as string[]).map((source) =>
    join(dirname(artifact.path), source)
  );
}

async function getOutputSources(output: BuildOutput) {
  const sources = await Promise.all(output.outputs.map(getArtifactSources));
  return new Set(sources.flat().map(absolute));
}

type BuildConfig = Parameters<typeof Bun.build>[0] & {
  watch?: string;
  onBuild?: (output: BuildOutput) => void;
};

export async function bundleBun(config: BuildConfig) {
  let { watch, onBuild, sourcemap = "external", ...rest } = config;
  if (watch && config.sourcemap !== "external") {
    console.error("Watch requires external sourcemap, setting to external");
  }
  let output = await Bun.build({ ...rest, sourcemap });

  if (watch) {
    let sources = await getOutputSources(output);
    let debounce: Timer | null = null;
    let pending = false;

    const rebuild = async () => {
      if (pending) return;
      pending = true;
      output = await Bun.build({ ...rest, sourcemap });
      sources = await getOutputSources(output);
      onBuild && onBuild(output);
      pending = false;
    };

    fs.watch(watch, { recursive: true }, (event, filename) => {
      if (!filename) return;
      const source = absolute(join(watch, filename));
      if (!sources.has(source)) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(rebuild, 50);
    });
  }

  onBuild && onBuild(output);
  return output;
}
