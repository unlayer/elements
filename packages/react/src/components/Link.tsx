import React from "react";
import type { SizeInput } from "../types";

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
export function Link({ href, target = "_blank", rel = target === "_blank" ? "noopener" : undefined, title, style, className, children }: LinkProps): React.ReactElement {
  return <a href={href} target={target} rel={rel} title={title} style={style} className={className}>{children}</a>;
}

Link.displayName = "Link";

export default Link;
