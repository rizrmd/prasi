export const waitPort = (port: number, arg?: { onPortUsed: () => void }) => {
  const portAvailable = () => {
    return new Promise<boolean>(async (resolve) => {
      try {
        const conn = await Bun.connect({
          port,
          hostname: "localhost",
          socket: {
            data() {},
            open() {
              resolve(false);
              conn.end();
            },
            close() {},
            drain() {},
            error() {
              resolve(true);
            },
          },
        });
        if (conn.readyState === "open") {
          conn.end();
          resolve(false);
        }
      } catch (e) {
        resolve(true);
      }
    });
  };

  return new Promise<void>((resolve) => {
    let hasCalledPortUsed = false;
    const checkPort = async () => {
      const available = await portAvailable();
      if (available) {
        resolve();
      } else {
        if (arg?.onPortUsed && !hasCalledPortUsed) {
          arg.onPortUsed();
          hasCalledPortUsed = true;
        }
        setTimeout(checkPort, 500);
      }
    };
    checkPort();
  });
};
