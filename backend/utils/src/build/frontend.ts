import type { BuilderArg } from "./bundler-main";
import { runBundler } from "./bundler-runner";
import { dirname } from "path";
import trim from "lodash/trim";
export const frontend = {
  dev: async (arg: BuilderArg & { logs?: (log: string) => string | void }) => {
    await runBundler({
      ...arg,
      name: `fe~${trim(
        dirname(arg.entryfile).substring(process.cwd().length),
        "/\\"
      )}`,
    });
  },
};
