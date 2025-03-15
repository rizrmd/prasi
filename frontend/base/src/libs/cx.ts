export const cx = (...classNames: any[]) => {
  const result: string[] = [];

  classNames
    .filter((e) => {
      if (e) {
        if (typeof e === "string" && e.trim()) return true;
        else return true;
      }
      return false;
    })
    .forEach((e) => {
      if (Array.isArray(e)) {
        for (const f of e) {
          if (typeof f === "string" && f.trim()) {
            result.push(f.trim());
          }
        }
      } else {
        if (typeof e === "string") {
          result.push(e.trim());
        }
      }
    });
  return result.join(" ");
};
