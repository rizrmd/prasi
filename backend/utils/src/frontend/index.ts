import { watcher } from "utils/watcher";
import { dirname } from "path";
type FrontendArg = { entryfile: string; outdir: string };

export const frontend = {
  async dev(arg: FrontendArg) {
    const config = { timeout: null as Timer | null, files: new Set<string>() };
    const { files } = await this.build(arg);
    config.files = files;
    const base = dirname(arg.entryfile);
    watcher.add(base, async (op, file) => {
      if (file) {
        if (files.has(file)) {
          config.timeout = setTimeout(async () => {
            const { files } = await this.build(arg);
            config.files = files;
          }, 10);
          clearTimeout(config.timeout);
        }
      }
    });
  },
  async build(arg: FrontendArg) {
    const files = new Set<string>();
    const base = dirname(arg.entryfile);

    const result = await Bun.build({
      entrypoints: [arg.entryfile],
      outdir: arg.outdir,
      splitting: true,
      plugins: [
        {
          name: "indexer",
          setup(build) {
            build.onLoad({ filter: /.*/gi }, async (args) => {
              files.add(args.path.substring(base.length + 1));
            });
          },
        },
      ],
    });
    return { result, files };
  },
};
