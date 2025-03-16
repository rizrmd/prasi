export const loadingJs = (site_id: string) => {
  const url = new URL(location.href);
  url.protocol.replace("http", "ws");
  url.pathname = `/_prasi/${site_id}/loading`;
  const ws = new WebSocket(url);

  const pre = document.getElementsByTagName("pre")[0];
  if (pre) {
    let timer: ReturnType<typeof setInterval>;
    let dots = 1;

    const animateEllipsis = () => {
      const ellipsis = ".".repeat(dots);
      pre.innerText = pre.innerText.replace(/\.+$/, "") + ellipsis;
      dots = dots >= 3 ? 1 : dots + 1;
    };

    ws.onmessage = (msg) => {
      if (timer) clearInterval(timer);
      
      if (msg.data === "Done") {
        clearInterval(timer);
        location.reload();
        return;
      }

      pre.innerText = msg.data;
      timer = setInterval(animateEllipsis, 300);
    };
  }
};
