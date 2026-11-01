import { linkParts, type Json, type LinkValue } from "@unlayer-internal/elements-core";

/** A link's attributes, from its props: `href`, `target` with `rel` where it opens a new window, `title` and `aria-label`. */
export function link(props: Record<string, Json>): { href: string; target?: string; rel?: string; title?: string; "aria-label"?: string } {
  const { href, target } = linkParts(props.href as LinkValue);
  return {
    href,
    target,
    rel: target === "_blank" ? "noopener noreferrer" : undefined,
    title: props.title as string | undefined,
    "aria-label": props["aria-label"] as string | undefined,
  };
}
