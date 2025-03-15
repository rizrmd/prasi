import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

interface StaticHandler {
  serve(req: Request): Response;
}

const generateETag = (stat: { size: number; mtime: Date }): string => {
  return `${stat.size.toString(16)}-${stat.mtime.getTime().toString(16)}`;
};

// Serve regular static file
const serveFile = (filePath: string, req: Request): Response | null => {
  if (!existsSync(filePath)) {
    return null;
  }

  const stat = statSync(filePath);
  if (stat.isDirectory()) {
    return null;
  }

  const file = Bun.file(filePath);
  const etag = generateETag(stat);

  const ifNoneMatch = req.headers.get("If-None-Match");
  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(file, {
    headers: {
      "Content-Type": file.type,
      ETag: etag,
    },
  });
};

// Serve HTML content with proper headers
const serveHtml = (content: string, req: Request): Response => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const stat = {
    size: bytes.length,
    mtime: new Date(),
  };
  const etag = generateETag(stat);

  const ifNoneMatch = req.headers.get("If-None-Match");
  if (ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  return new Response(content, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-cache",
      ETag: etag,
    },
  });
};

export const staticFile = (arg: {
  basePath: string;
  indexHtml?: (req: Request) => string;
}): StaticHandler => {
  const basePath = arg.basePath;
  // Ensure base path exists and is a directory
  if (!existsSync(basePath)) {
    throw new Error(`Static directory not found: ${basePath}`);
  }

  if (!statSync(basePath).isDirectory()) {
    throw new Error(`Path is not a directory: ${basePath}`);
  }

  return {
    serve(req: Request): Response {
      try {
        const url = new URL(req.url);
        const filePath = join(basePath, decodeURIComponent(url.pathname));

        // Prevent directory traversal
        if (!filePath.startsWith(basePath)) {
          return new Response("Forbidden", { status: 403 });
        }

        // Try serving the requested file first
        const fileResponse = serveFile(filePath, req);
        if (fileResponse) return fileResponse;

        // If file doesn't exist or is directory, try index handler for non-file URLs
        if (arg.indexHtml && !url.pathname.includes(".")) {
          const htmlContent = arg.indexHtml(req);
          return serveHtml(htmlContent, req);
        }

        // Nothing worked - return 404
        return new Response("Not Found", { status: 404 });
      } catch (error) {
        console.error("Error serving static file:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    },
  };
};
