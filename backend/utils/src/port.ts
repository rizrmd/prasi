import { createServer } from "net";

export const getFreePort = async () => {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    let port = 0;
    server.on("error", (err) => {
      reject(err);
    });

    server.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to get server address"));
        return;
      }

      port = address.port;
      server.close();
    });
    server.on("close", () => {
      resolve(port);
    });
  });
};
