export const navigate = (path: string) => {};
export const baseurl = (path: string) => {
  return window.prasi_site.baseurl + (path.startsWith("/") ? path : "/" + path);
};
