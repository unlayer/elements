/**
 * Stories of today's components (their Storybook modules), each rendered both ways: both are the new engine's now, so
 * this and its comparison stories have nothing left to compare and are going. The comparison gate
 * (scripts/storybook-compare.mjs) checks each pair draws the same, at desktop and phone widths.
 *
 * A story is its template where it renders one (a root, a template component, a provider around one, a live preview
 * of one). A story of one block, or of blocks laid out in markup of the story's own (a gallery), has its blocks put in
 * a Column of an Email and of a Page (only the one its blocks' own `mode` says, where they all say one): the story's
 * own markup isn't a template's, and is left out.
 */
import type { StoryObj } from "@storybook/react-vite";
import React, { type ReactElement } from "react";
import { Column, Email, Page, Row } from "../index";
import { UNLAYER_CONFIG_KEY } from "../utils/create-component";
import { renderToHtml } from "../utils/render-to-html";
import { withRenderScope } from "../utils/render-scope";
import { renderThroughNewEngine } from "./render";
import { SideBySide, type Width } from "./SideBySide";

export type Args = { width: Width };
export const args: Args = { width: "desktop" };
export const argTypes = { width: { control: "inline-radio", options: ["desktop", "phone"] } } as const;
export const labels: [string, string] = ["main: today's components", "New engine: main's design, lowered"];

/** A Storybook module: its meta (default) and its stories. */
type StoryModule = Record<string, any>;

const ROOTS = new Set(["Body", "Email", "Page", "Document"]);
const nameOf = (element: ReactElement) => (element.type as { displayName?: string })?.displayName;
const isBlock = (element: ReactElement) => !!(element.type as Record<symbol, unknown>)?.[UNLAYER_CONFIG_KEY];

/** What a story renders, called as Storybook calls it (its args, its meta's). */
export function storyElement(module: StoryModule, name: string): ReactElement {
  const meta = module.default ?? {};
  const story = module[name];
  const args = { ...meta.args, ...story.args };
  const render = story.render ?? meta.render;
  return render ? render(args, { args, loaded: {}, argTypes: {}, globals: {}, parameters: {} }) : React.createElement(meta.component, args);
}

/** The blocks of today's components in a story's markup (a gallery's), in order. */
function blocksIn(node: React.ReactNode): ReactElement[] {
  return React.Children.toArray(node).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    if (isBlock(child)) return [child];
    return typeof child.type === "string" ? blocksIn((child.props as { children?: React.ReactNode }).children) : [];
  });
}

/**
 * The template a story renders, as `root` (Email or Page) where it's blocks without one; undefined where it renders
 * blocks only for the other root.
 */
export function storyTemplate(element: ReactElement, root: "email" | "web" | undefined): ReactElement | undefined {
  const props = element.props as { tree?: ReactElement; children?: React.ReactNode; config?: Record<string, unknown> };
  // A live preview of a template's parts.
  if (nameOf(element) === undefined && React.isValidElement(props.tree)) return storyTemplate(props.tree, root);
  // A provider: its config stays around the template.
  if (nameOf(element) === "UnlayerProvider") {
    const inside = React.Children.only(props.children) as ReactElement;
    const template = storyTemplate(inside, root);
    return template && React.cloneElement(element, undefined, template);
  }
  const blocks = isBlock(element) ? [element] : typeof element.type === "string" ? blocksIn(props.children) : undefined;
  if (!blocks) return root ? undefined : element;
  if (!root) throw new Error("A story of blocks is rendered in an Email or a Page");
  // Blocks that all say their mode (a story of an email's block) are put in that root only.
  const modes = new Set(blocks.map((block) => (block.props as { mode?: string }).mode));
  if (modes.size === 1 && !modes.has(undefined) && !modes.has(root)) return undefined;
  const Root = root === "email" ? Email : Page;
  return (
    <Root>
      <Row>
        <Column>{blocks.map((block, index) => React.cloneElement(block, { key: index }))}</Column>
      </Row>
    </Root>
  );
}

/**
 * Where a story's content may sit from main's, and why: only where main's own HTML, drawn in the second frame, isn't
 * drawn pixel for pixel as in the first (the gate's own variance, found by comparing main with itself).
 */
export interface Allowance {
  x?: number;
  y?: number;
  why: string;
}

/**
 * A fix accepted over legacy's drawing (RFC 0001, "Moving the existing components"): its CSS is drawn in main's frame
 * too, so a story it changes is still compared exactly everywhere else, whatever the fonts make of it.
 */
export interface AcceptedFix {
  css: string;
  why: string;
}

/**
 * A word too long for its column wraps inside it, where legacy's page lets it run out of the column. `anywhere`, not
 * `break-word`: legacy's column content is a flex item, at least as wide as its longest word unless that word may break.
 * On every element, over the `overflow-wrap:break-word` legacy writes inline on its blocks.
 */
export const LONG_WORDS_WRAP: AcceptedFix = { css: "*{overflow-wrap:anywhere!important}", why: "a word too long for its column wraps inside it (a legacy bug fixed on purpose)" };

/** Main's HTML with the fixes accepted for it drawn in: their rules at the end of its head. */
const withFixes = (html: string, fixes: AcceptedFix[]) => {
  if (!fixes.length) return html;
  const style = `<style>${fixes.map((fix) => fix.css).join("")}</style>`;
  return html.includes("</head>") ? html.replace("</head>", () => `${style}</head>`) : style + html;
};

/** A story of today's components (`module[name]`), rendered both ways; `root` puts a story of blocks in an Email or a Page. */
export const shadow = (module: StoryModule, name: string, root?: "email" | "web", allowance?: Allowance, fixes: AcceptedFix[] = []): StoryObj<Args> =>
  shadowOf(
    () => {
      const template = storyTemplate(storyElement(module, name), root);
      if (!template) throw new Error(`${name} has no template for ${root}`);
      return template;
    },
    allowance,
    fixes
  );

/** A template of today's components, rendered both ways. */
export const shadowOf = (template: () => ReactElement, allowance?: Allowance, fixes: AcceptedFix[] = []): StoryObj<Args> => ({
  loaders: [
    async () => {
      const next = withRenderScope(() => renderThroughNewEngine(template(), undefined, "renderToHtml"));
      const main = withFixes(renderToHtml(template()), fixes);
      const accepted = fixes.map((fix) => `Main drawn with a fix accepted over it: ${fix.why}`);
      return { main, next: next.html, notes: [...next.diagnostics.map((d) => `${d.code} at ${d.path}: ${d.message}`), ...accepted] };
    },
  ],
  render: ({ width }, { loaded }) => <SideBySide main={loaded.main} next={loaded.next} notes={allowance ? [...loaded.notes, `Allowance: ${allowance.why}`] : loaded.notes} width={width} labels={labels} allowance={allowance} />,
});
