export const dbInstance = () => {
  return new Proxy(
    {},
    {
      get: function (target, tableName, receiver) {
        return new Proxy(
          {},
          {
            get: function (target, methodName, receiver) {
              return () => {
                if (typeof methodName === "string") {
                  if (methodName.includes("Many")) return [];
                  else return null;
                }
              };
            },
          }
        );
      },
    }
  ) as any;
};
