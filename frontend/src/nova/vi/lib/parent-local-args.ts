export const local_name = Symbol("local_name");

export const parentLocalArgs = (
  local: Record<string, any>,
  parents: Record<string, string>,
  id: string
) => {
  let cur = id;
  const args: any = {};
  while (cur) {
    if (local[cur]) {
      const name = local[cur][local_name];
      if (name && !args[name]) {
        args[name] = local[cur];
      }
    }

    cur = parents[cur];
  }
  return args;
};
