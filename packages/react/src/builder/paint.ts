/**
 * What a text block's tool has no field for, drawn by the builder anyway: in the style of its own paragraph (a span
 * around a heading), which its editor draws, keeps through an edit (a new line's paragraph takes a copy) and exports.
 * Read back, each is what its hidden property would hold, so nothing after that knows the difference. Phone values
 * can't be in markup: those stay hidden properties. Styles a block's paragraphs don't share aren't read here: they're
 * left to read as its markup.
 */
import { closing, declarations, styleOf } from "./text";
import type { Values } from "./values";

const CSS: Record<string, string> = {
  fontStyle: "font-style",
  textTransform: "text-transform",
  textDecoration: "text-decoration",
  backgroundColor: "background-color",
  borderRadius: "border-radius",
  width: "width",
  maxWidth: "max-width",
  padding: "padding",
};
const KEYS = Object.fromEntries(Object.entries(CSS).map(([key, name]) => [name, key]));
const SIDES = ["Top", "Right", "Bottom", "Left"];
/** A tag's attributes, its quoted values whole. */
const PARAGRAPH = /<p\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
const STYLE = /\bstyle\s*=\s*(?:"[^"]*"|'[^']*')/i;

/** What of a text block's values its markup can draw, as a style, and its values without them. */
export function intoMarkup(values: Values): { style: string; values: Values } {
  const out: Values = { ...values };
  const css = Object.entries(CSS).flatMap(([key, name]) => {
    const value = out[key];
    delete out[key];
    return value === undefined ? [] : [`${name}:${value}`];
  });
  const border = (out.border ?? {}) as Values;
  delete out.border;
  for (const side of SIDES) {
    if (border[`border${side}Width`] !== undefined) css.push(`border-${side.toLowerCase()}:${border[`border${side}Width`]} ${border[`border${side}Style`]} ${border[`border${side}Color`]}`);
  }
  return { style: css.join(";"), values: out };
}

/** A border's one line as the builder's values (`1px solid #000`), or undefined where it isn't one. */
function line(value: string, side: string): Values | undefined {
  const match = /^(\d*\.?\d+px)\s+(solid|dashed|dotted|double)\s+(.+)$/.exec(value.trim());
  return match ? { [`border${side}Width`]: match[1], [`border${side}Style`]: match[2], [`border${side}Color`]: match[3] } : undefined;
}

/** What a style says that its tool has no field for, as values, and the rest of it as written. */
function painted(css: string): { values: Values; rest: string } {
  const values: Values = {};
  const rest: string[] = [];
  for (const piece of css.split(";")) {
    const [name, value] = Object.entries(declarations(piece))[0] ?? [];
    if (name === undefined) continue;
    const side = /^border(?:-(top|right|bottom|left))?$/.exec(name);
    const lines = side && (side[1] ? [side[1][0].toUpperCase() + side[1].slice(1)] : SIDES).map((s) => line(value, s));
    if (KEYS[name]) values[KEYS[name]] = value;
    else if (lines?.every(Boolean)) values.border = Object.assign({ ...values.border }, ...(lines as Values[]));
    else rest.push(piece.trim());
  }
  return { values, rest: rest.join(";") };
}

/** What a text block's markup draws (intoMarkup) as the values its hidden properties would hold, and its markup without it. */
export function outOfMarkup(html: string): { values: Values; html: string } {
  // A heading's: one span around all of it, a block.
  const open = /^\s*<span\b((?:[^>"']|"[^"]*"|'[^']*')*)>/i.exec(html);
  if (open && declarations(styleOf(open[1])).display === "block") {
    const end = closing(html, "span", open[0].length);
    const { values, rest } = painted(styleOf(open[1]));
    if (end && !html.slice(end.end).trim() && /^display\s*:\s*block$/i.test(rest.trim())) return { values, html: html.slice(open[0].length, end.start) };
  }
  // A Text's: each paragraph's the same, or they aren't read here.
  const read = [...html.matchAll(PARAGRAPH)].map((match) => painted(styleOf(match[1])).values);
  if (!read.length || !Object.keys(read[0]).length || read.some((one) => JSON.stringify(one) !== JSON.stringify(read[0]))) return { values: {}, html };
  const plain = html.replace(PARAGRAPH, (_, attrs: string) => {
    const { rest } = painted(styleOf(attrs));
    return `<p${attrs.replace(STYLE, rest ? `style="${rest.replace(/"/g, "'")}"` : "").trimEnd()}>`;
  });
  return { values: read[0], html: plain };
}
