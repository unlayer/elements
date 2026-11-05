/**
 * Web fonts for the Unlayer editor. A design's fontFamily values name fonts
 * but don't load them: the editor loads and exports a web font only when it
 * is registered with it (`fonts.customFonts` when the editor is created).
 */

/** A font as the editor's `fonts.customFonts` takes it. */
export interface EditorFont {
  label: string;
  value: string;
  url: string;
}

/**
 * The web fonts a design uses, from the stylesheets the template links
 * (`fonts` on the Elements root): one entry per family, with the design's own
 * font stack as its value. Google Fonts and @font-face data stylesheets are
 * matched to their families; other stylesheets can't be without fetching them.
 */
export function editorFonts(design: unknown, stylesheets: Array<{ url: string }> = []): EditorFont[] {
  const urls = familyStylesheets(stylesheets.map((s) => s.url));
  if (!urls.size) return [];
  const stacks = new Map<string, { label?: string; value: string }>();
  const texts: string[] = [];
  const walk = (node: unknown, key?: string): void => {
    if (Array.isArray(node)) return node.forEach((child) => walk(child));
    if (!node || typeof node !== "object") {
      if (typeof node === "string" && key === "text") texts.push(node);
      return;
    }
    const font = node as { label?: unknown; value?: unknown };
    if (key === "fontFamily" && typeof font.value === "string") {
      const family = firstFamily(font.value);
      if (!stacks.has(family)) stacks.set(family, { label: typeof font.label === "string" ? font.label : undefined, value: font.value });
    }
    for (const [k, v] of Object.entries(node)) walk(v, k);
  };
  walk(design);
  const inText = texts.join("\n").toLowerCase();
  const fonts: EditorFont[] = [];
  for (const [family, url] of urls) {
    const stack = stacks.get(family.toLowerCase());
    if (stack) fonts.push({ label: stack.label ?? family, value: stack.value, url });
    else if (inText.includes(family.toLowerCase())) fonts.push({ label: family, value: `'${family}'`, url });
  }
  return fonts;
}

/**
 * The same lists with one stylesheet per family across all of them, covering
 * every style any list loads. An editor registers each family once, so fonts
 * gathered from several templates must each load what all of them use.
 */
export function shareEditorFonts(lists: EditorFont[][]): EditorFont[][] {
  const urls = new Map<string, string[]>();
  for (const font of lists.flat()) {
    const family = firstFamily(font.value);
    urls.set(family, [...(urls.get(family) ?? []), font.url]);
  }
  const shared = new Map<string, string>();
  for (const [family, list] of urls) {
    const merged = [...familyStylesheets(list)].find(([name]) => name.toLowerCase() === family);
    shared.set(family, merged?.[1] ?? list[0]);
  }
  return lists.map((fonts) => fonts.map((font) => ({ ...font, url: shared.get(firstFamily(font.value)) ?? font.url })));
}

/** A stack's first family, unquoted and lowercased: how the editor matches fonts. */
function firstFamily(stack: string): string {
  return stack.split(",")[0].replace(/['"]/g, "").trim().toLowerCase();
}

/** Each family a stylesheet loads, with one stylesheet URL for it. */
function familyStylesheets(urls: string[]): Map<string, string> {
  const google = new Map<string, string[]>();
  const css = new Map<string, string[]>();
  const other = new Map<string, string>();
  for (const url of urls) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    if (parsed.protocol === "data:") {
      const comma = url.indexOf(",");
      let text: string;
      try {
        text = decodeURIComponent(url.slice(comma + 1));
      } catch {
        continue;
      }
      for (const m of text.matchAll(/@font-face\s*\{[^}]*?font-family:\s*(['"]?)([^;'"}]+)\1/g)) {
        const family = m[2].trim();
        const list = css.get(family) ?? [];
        if (!list.includes(text)) list.push(text);
        css.set(family, list);
      }
    } else if (parsed.hostname === "fonts.googleapis.com") {
      const families = parsed.pathname === "/css2" ? parsed.searchParams.getAll("family") : (parsed.searchParams.get("family") ?? "").split("|");
      for (const spec of families) {
        const family = spec.split(":")[0].trim();
        if (!family) continue;
        if (parsed.pathname === "/css2") google.set(family, [...(google.get(family) ?? []), spec]);
        else if (!other.has(family)) other.set(family, url);
      }
    }
  }
  const out = new Map<string, string>(other);
  for (const [family, specs] of google) out.set(family, googleStylesheet(family, specs));
  for (const [family, texts] of css) out.set(family, `data:text/css,${encodeURIComponent(texts.join(""))}`);
  return out;
}

/**
 * One Google Fonts css2 URL with every weight and style the specs ask for
 * (`Inter:wght@400` and `Inter:wght@600` become `Inter:wght@400;600`).
 * Specs with other axes or ranges are kept as the first one given.
 */
function googleStylesheet(family: string, specs: string[]): string {
  const name = family.replace(/ /g, "+");
  const url = (spec: string) => `https://fonts.googleapis.com/css2?family=${spec.replace(/ /g, "+")}&display=swap`;
  const styles = new Set<string>();
  for (const spec of specs) {
    const axes = spec.slice(family.length + 1);
    if (!axes) {
      styles.add("0,400");
      continue;
    }
    const [names, values] = axes.split("@");
    const keys = names.split(",");
    if (!values || keys.some((k) => k !== "ital" && k !== "wght")) return url(specs[0]);
    for (const tuple of values.split(";")) {
      const parts = tuple.split(",");
      if (parts.length !== keys.length || parts.some((p) => !/^\d+$/.test(p))) return url(specs[0]);
      const ital = keys.includes("ital") ? parts[keys.indexOf("ital")] : "0";
      const wght = keys.includes("wght") ? parts[keys.indexOf("wght")] : "400";
      styles.add(`${ital},${wght}`);
    }
  }
  const sorted = [...styles].map((s) => s.split(",").map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.some(([ital]) => ital === 1)) return url(`${name}:ital,wght@${sorted.map((s) => s.join(",")).join(";")}`);
  return url(`${name}:wght@${sorted.map((s) => s[1]).join(";")}`);
}
