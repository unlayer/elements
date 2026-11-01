import { linkParts, type Json, type LinkValue } from "@unlayer-internal/elements-core";

/** A link's attributes: `href`, and `target` with `rel` where it opens a new window. */
export function link(value: Json | undefined): { href: string; target?: string; rel?: string } {
  const { href, target } = linkParts(value as LinkValue);
  return { href, target, rel: target === "_blank" ? "noopener noreferrer" : undefined };
}
