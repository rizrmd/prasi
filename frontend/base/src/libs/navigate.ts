export const navigate = (path: string) => {};
export const baseurl = (path: string) => {
  return window.prasi_site.baseurl + (path.startsWith("/") ? path : "/" + path);
};
export const preload = async (path: string[]) => {};
export const preloaded = () => {
  return false;
};
