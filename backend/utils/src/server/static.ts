import { file, gzipSync } from "bun";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

interface StaticHandler {
  serve(req: Request): Promise<Response>;
}
export const compressableTypes = [
  "text/plain",
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/xml",
  "image/svg+xml",
];
interface CompressionOptions {
  enabled?: boolean; // Whether compression is enabled
  minSize?: number; // Minimum size in bytes before compression is applied
  types?: string[]; // Content types to compress
}

// Extend ResponseInit to include Bun's compression option
interface BunResponseInit extends ResponseInit {
  compress?: boolean;
}

const generateETag = (stat: { size: number; mtime: Date }): string => {
  return `${stat.size.toString(16)}-${stat.mtime.getTime().toString(16)}`;
};

const shouldCompress = (
  size: number,
  type: string,
  options: Required<CompressionOptions>
): boolean => {
  // Extract base content type without parameters
  const baseType = type.split(";").shift() || type;

  return (
    options.enabled &&
    size >= options.minSize &&
    options.types.includes(baseType.trim())
  );
};

// Serve regular static file
const serveFile = (
  filePath: string,
  req: Request,
  compress: Required<CompressionOptions>
): Response | null => {
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

  const headers = new Headers({
    "Content-Type": file.type,
    ETag: etag,
  });

  // Check if we should compress this response
  if (shouldCompress(stat.size, file.type, compress)) {
    if (req.headers.get("accept-encoding")?.includes("gzip")) {
      const compressed = gzipSync(readFileSync(filePath));
      headers.set("content-encoding", "gzip");
      headers.set("content-length", compressed.length.toString());
      return new Response(compressed, {
        headers,
      });
    }
  }

  return new Response(file, { headers });
};

// Serve HTML content with proper headers
const serveHtml = (
  content: string,
  req: Request,
  compress: Required<CompressionOptions>
): Response => {
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

  const headers = new Headers({
    "Content-Type": "text/html",
    "Cache-Control": "no-cache",
    ETag: etag,
  });

  // Check if we should compress this response
  if (shouldCompress(stat.size, "text/html", compress)) {
    if (req.headers.get("accept-encoding")?.includes("gzip")) {
      const compressed = gzipSync(content);
      headers.set("content-encoding", "gzip");
      headers.set("content-length", compressed.length.toString());
      return new Response(compressed, {
        headers,
      });
    }
  }

  return new Response(content, { headers });
};

export const staticFile = (arg: {
  baseDir: string;
  pathPrefix?: string;
  indexHtml?: (req: Request) => Promise<string>;
  compression?: CompressionOptions;
}): StaticHandler => {
  const basePath = arg.baseDir;
  // Ensure base path exists and is a directory
  if (!existsSync(basePath)) {
    throw new Error(`Static directory not found: ${basePath}`);
  }

  if (!statSync(basePath).isDirectory()) {
    throw new Error(`Path is not a directory: ${basePath}`);
  }

  // Setup compression options with defaults
  const compress: Required<CompressionOptions> = {
    enabled: true,
    minSize: 1024, // 1KB
    types: compressableTypes,
    ...arg.compression,
  };

  return {
    async serve(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        let pathname = decodeURIComponent(url.pathname);

        // Handle pathPrefix if specified
        if (arg.pathPrefix && pathname.startsWith(arg.pathPrefix)) {
          pathname = pathname.slice(arg.pathPrefix.length);
        }

        const filePath = join(basePath, pathname);

        // Prevent directory traversal
        if (!filePath.startsWith(basePath)) {
          return new Response("Forbidden", { status: 403 });
        }

        // Try serving the requested file first
        const fileResponse = serveFile(filePath, req, compress);
        if (fileResponse) return fileResponse;

        // If file doesn't exist or is directory, try index handler for non-file URLs
        if (arg.indexHtml && !url.pathname.includes(".")) {
          const htmlContent = await arg.indexHtml(req);
          return serveHtml(htmlContent, req, compress);
        }

        // If no file match and no indexHtml, return 404 with special header
        return new Response("Not Found", {
          status: 404,
          headers: {
            "X-Static-Handler": "no-match",
          },
        });
      } catch (error) {
        console.error("Error serving static file:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    },
  };
};
