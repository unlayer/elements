import { rewriteStaticUrls, staticPaths, staticUrl } from "./staticUrls";

// Files larger than this keep their URL instead of being copied into the design.
const MAX_INLINE_BYTES = 8 * 1024 * 1024;

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

async function dataUrl(url: string, fetcher: typeof fetch): Promise<string | undefined> {
  try {
    const res = await fetcher(url);
    if (!res.ok) return undefined;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > MAX_INLINE_BYTES) return undefined;
    const type = res.headers.get("content-type")?.split(";")[0].trim() || "application/octet-stream";
    return `data:${type};base64,${base64(bytes)}`;
  } catch {
    return undefined;
  }
}

/**
 * The design to load in the editor: its /static/ files copied in as data:
 * URLs, from the preview at `root`.
 *
 * Absolute URLs on the preview aren't enough: browsers don't let a site's page
 * (the editor, on editor.unlayer.com) load images from localhost (Chrome's
 * Local Network Access), and a hosted build's access protection doesn't apply
 * to another site's requests. A file that can't be read keeps its absolute URL.
 */
export async function prepareDesign<T>(design: T, root: string, fetcher: typeof fetch = fetch): Promise<T> {
  const paths = staticPaths(design);
  const inlined = new Map<string, string>();
  await Promise.all(
    paths.map(async (path) => {
      const url = await dataUrl(staticUrl(path, root), fetcher);
      if (url) inlined.set(path, url);
    })
  );
  return rewriteStaticUrls(design, (path) => inlined.get(path) ?? staticUrl(path, root));
}
