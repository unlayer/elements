/**
 * @unlayer/react-elements/head: `<Head>`, tags of your own for the document's head (meta, link, style, title).
 */
import React from "react";
import { renderToHtml } from "@unlayer/react-elements";

export interface HeadProps {
  /** `<meta>`, `<link>`, `<style>` and `<title>` elements. */
  children?: React.ReactNode;
}

// The render that collects a template (Elements' main entry): a stack shared by every copy of Elements a process loads.
const COLLECTING = Symbol.for("@unlayer/react-elements/collecting");
/** The main entry's React render (the one it renders templates with: see src/utils/internals.ts). */
const render = (node: React.ReactNode): string =>
  (renderToHtml as unknown as Record<symbol, { render: (node: React.ReactElement) => string }>)[Symbol.for("@unlayer/react-elements/internals")].render(<>{node}</>);

/** Tags as written: a `<style>`'s CSS isn't escaped (React 18 would write `a > b` as `a &gt; b`), and can't end it. */
function asWritten(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return child;
    if (child.type === React.Fragment) return asWritten(child.props.children);
    const text = React.Children.toArray(child.props.children);
    if (child.type !== "style" || !text.length || !text.every((t) => typeof t === "string" || typeof t === "number")) return child;
    return React.cloneElement(child, { children: undefined, dangerouslySetInnerHTML: { __html: text.join("").replace(/<\/(style)/gi, "<\\/$1") } } as object);
  });
}

/**
 * Head - Tags of your own for the document's head: `<meta>`, `<link>`, `<style>`, `<title>`. Place it in an Email,
 * Page or Document (or a component of yours there); it renders nothing in the body. The HTML's head has them before
 * Elements' styles (a rule of yours that overrides one of them needs `!important`, as in most email CSS); the design
 * for the visual editor can't hold them (`renderToJson` says so).
 *
 * @example
 * ```tsx
 * <Email>
 *   <Head>
 *     <meta name="color-scheme" content="light dark" />
 *     <style>{`@media (prefers-color-scheme: dark) { .brand { color: #fff !important; } }`}</style>
 *   </Head>
 *   <Row>…</Row>
 * </Email>
 * ```
 */
export function Head({ children }: HeadProps): null {
  // While a template is collected, its tags are recorded for the head; it renders nothing.
  const frames = (globalThis as Record<symbol, Array<{ recorded: unknown[] } | null> | undefined>)[COLLECTING];
  frames?.[frames.length - 1]?.recorded.push({
    kind: "head",
    tags: () => [render(asWritten(children))],
    json: "[Unlayer] <Head>'s tags are kept in HTML but not in the design for the visual editor.",
  });
  return null;
}

Head.displayName = "Head";
