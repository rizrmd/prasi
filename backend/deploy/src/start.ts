import { argv } from "utils/src/argv";

const main = async () => {
  const port = argv.get("--port");

  if (!port) {
    console.error("Failed to get port");
    process.exit(1);
  }

  Bun.serve({
    port,
    fetch() {
      return new Response("markijuno");
    },
  });

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    process.exit(0);
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
