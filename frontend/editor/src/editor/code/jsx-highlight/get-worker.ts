export const getWorker = () => {
  return new Worker(new URL("./worker/index.ts", import.meta.url));
};
