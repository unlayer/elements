import { useCallback, useEffect, useState } from "react";
import { STATIC } from "../api";

const PREFIX = "/preview/";

/**
 * The template in the URL: /preview/billing/receipt.tsx from the server, or
 * #/preview/billing/receipt.tsx in a static build (any host, any path).
 */
function currentTemplate(): string | undefined {
  const where = STATIC ? window.location.hash.replace(/^#/, "") : window.location.pathname;
  return where.startsWith(PREFIX) ? decodeURIComponent(where.slice(PREFIX.length)) : undefined;
}

/** The selected template, kept in the URL (/preview/billing/receipt.tsx) so reloads and links keep it. */
export function useSelectedTemplate(): [string | undefined, (path: string, replace?: boolean) => void] {
  const [selected, setSelected] = useState(currentTemplate);
  useEffect(() => {
    const onPop = () => setSelected(currentTemplate());
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);
  const select = useCallback((path: string, replace = false) => {
    const route = PREFIX + path.split("/").map(encodeURIComponent).join("/");
    const url = STATIC ? `#${route}` : route;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    setSelected(path);
  }, []);
  return [selected, select];
}
