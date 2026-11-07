import { site } from "./site";

/**
 * The repo's GitHub star count, as the header shows it ("1.2k"), read once per build: the module is
 * evaluated once, so every page shares this one request. Until the repository is public, or offline,
 * there's none, and the GitHub link shows without a number.
 */
export const stars: Promise<string | null> = (async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${site.repo}`, {
      signal: AbortSignal.timeout(3000),
      headers: { accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const n = (await res.json()).stargazers_count as number;
    return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
  } catch {
    return null;
  }
})();
