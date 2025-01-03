import { $, argv } from "bun";

if (!argv.includes("skip-rebuild")) {
  await $`rm -rf ../data/prasi-static`;
  await $`rm -rf ../data/nova-static`;
  await $`bunx rsbuild build`.cwd(`frontend/src/nova/prod`);
  await $`bunx rsbuild build`.cwd(`frontend`);
}
await $`bun run --silent --no-clear-screen backend/srv/server.ts prod`;
