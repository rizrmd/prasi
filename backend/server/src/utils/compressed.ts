import { gzipSync } from "bun";

export const compressedResponse = (content: any) => {
  const body = gzipSync(JSON.stringify(content));
  return new Response(body, {
    headers: {
      "Content-Encoding": "gzip",
      "Content-Type": "application/json",
      "Content-Length": body.length.toString(),
    },
  });
};
