export default {
  init: async (id: string) => {
    console.log("init");
    return { id } as any;
  },
  update: async (id: string, data: any) => {
    return;
  },
};
