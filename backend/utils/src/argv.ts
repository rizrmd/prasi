export const argv = {
  get: (name: string) => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
  },
  has: (name: string) => {
    return process.argv.includes(name);
  },
};
