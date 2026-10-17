/**
 * `mj-social` → a Social block. Its links and images are read from what MJML compiles it to (a network's share URL,
 * its default icon), so they're the ones the original shows:
 *
 * - an icon of the template's own (`src`) keeps its image (`imgUrl`);
 * - MJML's own icons are white glyphs MJML draws on a colored square, which a Social block can't draw: they become
 *   the editor's icon for the network, and that image swap is declared;
 * - the editor writes every icon's alt text as "<network> icon": that's declared too.
 *
 * Declared differences are what the check expects instead of the original's (and lists); anything else still fails.
 * Icons with labels, or MJML icons for a network the editor has no icon for, keep the block as MJML's HTML.
 */

import { decodeHtmlEntities } from "@unlayer/convert-core";
import type { Resolved } from "./attributes";
import { fallbackBlock, type Context } from "./context";
import { boxValue, padding, px } from "./css";
import { blockHtml } from "./fallback";
import type { DesignContent } from "./types";

/** MJML's built-in network icons (white glyphs for its colored squares). */
const MJML_ICONS = "https://www.mailjet.com/images/theme/v1/icons/ico-social/";
/** The editor's icons, by type and network (its Social exporter's default CDN). */
const EDITOR_ICONS = "https://cdn.tools.unlayer.com/social/icons/circle/";

/** MJML's network names → the editor's, for the networks the editor has an icon for. */
const EDITOR_NAMES: Record<string, string> = {
  facebook: "Facebook",
  twitter: "Twitter",
  x: "X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  pinterest: "Pinterest",
  youtube: "YouTube",
  vimeo: "Vimeo",
  tumblr: "Tumblr",
  snapchat: "Snapchat",
  medium: "Medium",
  soundcloud: "SoundCloud",
  dribbble: "Dribbble",
  github: "GitHub",
};

export const SOCIAL_ALT = "social icon alt text is “<network> icon” (the editor's Social block writes it this way)";
export const SOCIAL_IMAGE = "MJML's own social icon (white, on a colored square the Social block can't draw) is the editor's icon for the network";

/** Each icon's link and image as MJML compiles them: `<a href><img alt src></a>`, in order. */
function compiledIcons(html: string): Array<{ href: string; src: string; alt: string }> {
  const out: Array<{ href: string; src: string; alt: string }> = [];
  const body = html.replace(/<!--[\s\S]*?-->/g, "");
  for (const match of body.matchAll(/<a\b([^>]*)>\s*<img\b([^>]*)>/gi)) {
    const get = (attributes: string, name: string) => decodeHtmlEntities(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i").exec(attributes)?.[1] ?? "");
    out.push({ href: get(match[1], "href"), src: get(match[2], "src"), alt: get(match[2], "alt") });
  }
  return out;
}

const KEPT = "mj-social: icons with labels or without links, or MJML's own icon for a network the editor has none for";

export function social(node: Resolved, width: number, ctx: Context): DesignContent {
  const a = node.attrs;
  const elements = node.children.filter((c) => c.tag === "mj-social-element");
  const network = (element: Resolved) => (element.attrs.name ?? "").toLowerCase().replace(/-noshare$/, "");
  // Labels are words the Social block can't show; MJML's icons for networks the editor lacks have no image to swap in.
  const keep = elements.some((e) => e.content.trim() !== "") || node.children.some((c) => c.tag !== "mj-social-element") || elements.some((e) => !e.attrs.src && !EDITOR_NAMES[network(e)]) || !elements.length;
  if (keep) return fallbackBlock(ctx, node.tag, KEPT, () => blockHtml(node, width, ctx));

  const size = px(a["icon-size"]);
  // The space around each icon: mj-social's inner-padding (which MJML gives its icons), else the icon's own.
  const first = a["inner-padding"] ? padding({ padding: a["inner-padding"] }) : padding(elements[0].attrs);
  const block: DesignContent = {
    type: "social",
    values: {
      icons: { iconType: "circle", icons: [] },
      iconSize: Number.isFinite(size) ? size : 20,
      spacing: Math.round(first[1] + first[3]),
      align: a.align || "center",
      containerPadding: boxValue(padding(a)),
    },
  };
  // The links and images MJML writes (share URLs, default icons) come from its compile: filled in when it's done.
  ctx.jobs.push(
    blockHtml(node, width, ctx)
      .then((html) => {
        const compiled = compiledIcons(html);
        // An icon without a link (no href) isn't a Social block's: the block stays MJML's HTML.
        if (compiled.length !== elements.length) throw new Error(`MJML wrote ${compiled.length} linked icons for ${elements.length} elements`);
        const icons = compiled.map((icon, i) => {
          const id = network(elements[i]);
          const builtIn = icon.src.startsWith(MJML_ICONS) && !elements[i].attrs.src;
          // An icon of the template's own is named by its network, else by its alt text or title (its alt is "<name> icon").
          const own = (elements[i].attrs.alt || elements[i].attrs.title || "").trim();
          const name = EDITOR_NAMES[id] ?? (own || (id ? id[0].toUpperCase() + id.slice(1) : "Link"));
          if (builtIn) ctx.declared.push({ kind: "src", from: icon.src, to: `${EDITOR_ICONS}${name.toLowerCase()}.png`, reason: SOCIAL_IMAGE });
          if (icon.alt !== `${name} icon`) ctx.declared.push({ kind: "alt", src: icon.src, from: icon.alt, to: `${name} icon`, reason: SOCIAL_ALT });
          return { name, url: icon.href, ...(builtIn ? {} : { imgUrl: icon.src }) };
        });
        (block.values.icons as { icons: unknown[] }).icons = icons;
        if ((a.mode ?? "horizontal") === "vertical") ctx.warnings.push({ reason: "mj-social icons in a column shown in a row (a Social block's icons are in a row)" });
        ctx.warnings.push({ reason: "mj-social became a Social block: its icons' colors, corners and sizes are the block's" });
      })
      .catch((error) => {
        // Not readable as icons: kept as MJML's HTML after all.
        ctx.warnings.push({ reason: "couldn't read mj-social's icons", detail: (error as Error).message });
        ctx.fallbacks.push({ tag: node.tag, reason: KEPT });
        block.type = "html";
        block.values = { html: "", containerPadding: "0px" };
        ctx.jobs.push(blockHtml(node, width, ctx).then((html) => void (block.values.html = html)));
      }),
  );
  return block;
}
