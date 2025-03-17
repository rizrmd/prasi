import { pageModules } from "@/generated/pages";
import { createContext } from "react";

const config = {
  basePath: "/",
};

// Normalize basePath to ensure it has trailing slash only if it's not '/'
export const basePath =
  config.basePath === "/"
    ? "/"
    : config.basePath.endsWith("/")
    ? config.basePath
    : config.basePath + "/";

// Utility for consistent path building
export function buildPath(to: string): string {
  return to.startsWith("/")
    ? basePath === "/"
      ? to
      : `${basePath}${to.slice(1)}`
    : to;
}

export type Params = Record<string, string>;
export type RoutePattern = {
  pattern: string;
  regex: RegExp;
  paramNames: string[];
};

export const ParamsContext = createContext<Params>({});

export function parsePattern(pattern: string): RoutePattern {
  const paramNames: string[] = [];
  const patternParts = pattern.split("/");
  const regexParts = patternParts.map((part) => {
    // Find all parameter patterns like [id] in the part
    const matches = part.match(/\[([^\]]+)\]/g);
    if (matches) {
      let processedPart = part;
      matches.forEach((match) => {
        const paramName = match.slice(1, -1);
        paramNames.push(paramName);
        // Replace [param] with capture group, preserve surrounding text
        processedPart = processedPart.replace(match, "([^/]+)");
      });
      return processedPart;
    }
    return part;
  });

  return {
    pattern,
    regex: new RegExp(`^${regexParts.join("/")}$`),
    paramNames,
  };
}

export function matchRoute(
  path: string,
  routePattern: RoutePattern
): Params | null {
  const match = (path.split("#").shift() || "").match(routePattern.regex);
  if (!match) return null;

  const params: Params = {};
  routePattern.paramNames.forEach((name, index) => {
    const matched = match[index + 1];
    if (matched) {
      params[name] = matched;
    }
  });
  return params;
}

export function parseRouteParams(path: string): Params | null {
  for (let pattern in pageModules) {
    const params = matchRoute(path, parsePattern(pattern));
    if (params) {
      return params;
    }
  }
  return null;
}

export function Link({
  to,
  children,
  ...props
}: {
  to: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={buildPath(to)} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export const navigate = (to: string) => {
  const fullPath = buildPath(to);
  window.history.pushState({}, "", fullPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
