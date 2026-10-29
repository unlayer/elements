/**
 * @unlayer/react-elements/head: `<Head>`, tags of your own for the document's head (meta, link, style, title).
 */
import type React from "react";
import { headEntry } from "./record";

export interface HeadProps {
  /** `<meta>`, `<link>`, `<style>` and `<title>` elements. */
  children?: React.ReactNode;
}

/**
 * Head - Tags of your own for the document's head: `<meta>`, `<link>`, `<style>`, `<title>`. Place it in an Email,
 * Page or Document (or a component of yours there); it renders nothing in the body. Components of yours in it render
 * as the template's do (its context, the async renderers waiting for them, `onError`). The HTML's head has them before
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
export function Head(_: HeadProps): React.ReactElement | null {
  // Its tags are recorded for the head where the template is collected; it renders nothing.
  return null;
}

Head.displayName = "Head";
headEntry(Head, ({ children }: HeadProps) => ({
  kind: "head",
  // Walked where the template is collected, as its content is: its tags are the HTML they render (a `<style>`'s and a
  // `<script>`'s text as written, but for what would end it, in every React: see src/engine/host.ts).
  children,
  json: "[Unlayer] <Head>'s tags are kept in HTML but not in the design for the visual editor.",
}));
