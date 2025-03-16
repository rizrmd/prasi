export const navigate = (path: string) => {};
export const baseurl = (path: string) => {
  return window.prasi_site.baseurl + (path.startsWith("/") ? path : "/" + path);
};

export const siteurl = (path: string) => {
  const url = new URL(window.prasi_site.siteurl || location.href);
  url.pathname = path;
  return url.toString();
};
export const preload = async (path: string[]) => {};
export const preloaded = () => {
  return false;
};
