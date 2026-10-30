import React from "react";
import type { SizeInput } from "../types";
import { collectedHere, NOT_COLLECTED } from "../engine/root-capture";

/**
 * On <Link> (of every copy of Elements): a collecting render records where one renders (engine/collector.ts), so the
 * markup of a component of the template's own that a Link rendered in is cleaned as a Link's (src/model/elements.ts).
 */
export const LINK = Symbol.for("@unlayer/react-elements/link");
/** Whether a component is a <Link>, of any copy. */
export const isLinkType = (type: unknown): boolean => typeof type === "function" && !!(type as unknown as Record<symbol, unknown>)[LINK];

export interface LinkProps {
  href: string;
  /** Where it opens (default: a new tab, `_blank`). */
  target?: string;
  /** Default `noopener` for a new tab. */
  rel?: string;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  /** On its own in a Column (a Paragraph holding it): the spacing around it, and where it's hidden. */
  containerPadding?: SizeInput;
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}

/**
 * Link - A link in text (`<Paragraph>Read <Link href="…">the guide</Link></Paragraph>`), or on its own in a Column,
 * where it's a Paragraph holding it (so the design can edit it).
 */
export function Link(props: LinkProps): React.ReactElement {
  // (Rendered by react-dom in what a lazy component renders, in a collecting render: it gives its element to the
  // collection, which records it there, and renders it, `_own`: see engine/collector.ts.)
  const collected = collectedHere(Link, props, (props as { _own?: boolean })._own === true);
  if (collected !== NOT_COLLECTED) return collected as React.ReactElement;
  const { href, target = "_blank", rel = target === "_blank" ? "noopener" : undefined, title, style, className, children } = props;
  return <a href={href} target={target} rel={rel} title={title} style={style} className={className}>{children}</a>;
}

Link.displayName = "Link";
(Link as unknown as Record<symbol, unknown>)[LINK] = true;

export default Link;
