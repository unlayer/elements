/**
 * The generated module as text: a small JSX tree printed the way prettier prints it (80 columns, two spaces, double
 * quotes, trailing commas), so the code reads as written by hand and formatting it changes little or nothing.
 */
import { isIdentifier, isPlainObject } from "./values";

/** A JavaScript expression written as it is (`ColumnLayouts.TwoEqual`). */
export interface Code {
  code: string;
}

/** A value written as a type, whatever it holds (`{ … } as unknown as ParagraphProps["values"]`). */
export interface Cast {
  value: unknown;
  type: string;
}

export interface Attr {
  name: string;
  /** A JSON-like value, `Code` or `Cast`. `true` prints as the bare attribute. */
  value: unknown;
}

export interface JsxElement {
  tag: string;
  attrs: Attr[];
  children: JsxChild[];
}

/** An element, text (printed as JSX text: no markup or braces in it), or a `{/* comment *\/}`. */
export type JsxChild = JsxElement | { text: string } | { comment: string };

const isCode = (value: unknown): value is Code => isPlainObject(value) && typeof value.code === "string" && Object.keys(value).length === 1 && CODE.has(value);
const isCast = (value: unknown): value is Cast => isPlainObject(value) && CAST.has(value);
// Marked, so a design value shaped like one ({ code: "…" }) stays a value.
const CODE = new WeakSet<object>();
const CAST = new WeakSet<object>();
export function codeValue(text: string): Code {
  const value = { code: text };
  CODE.add(value);
  return value;
}
export function castValue(value: unknown, type: string): Cast {
  const cast = { value, type };
  CAST.add(cast);
  return cast;
}

// ── Documents (as prettier's: text, lines that break or not, indentation and groups) ───────────────────────────

type Doc =
  | string
  | Doc[]
  | { t: "line"; soft?: boolean; hard?: boolean }
  | { t: "indent"; doc: Doc }
  | { t: "group"; doc: Doc; broken?: boolean }
  | { t: "ifBreak"; broken: Doc; flat: Doc }
  /** Words, as many on a line as fit (prettier's `fill` of JSX text). */
  | { t: "fill"; words: string[] };

const line: Doc = { t: "line" };
const softline: Doc = { t: "line", soft: true };
const hardline: Doc = { t: "line", hard: true };
const indent = (doc: Doc): Doc => ({ t: "indent", doc });
const group = (doc: Doc, broken = false): Doc => ({ t: "group", doc, broken: broken || hasHardline(doc) });
const ifBreak = (broken: Doc, flat: Doc = ""): Doc => ({ t: "ifBreak", broken, flat });

function hasHardline(doc: Doc): boolean {
  if (typeof doc === "string") return false;
  if (Array.isArray(doc)) return doc.some(hasHardline);
  if (doc.t === "line") return !!doc.hard;
  if (doc.t === "group") return !!doc.broken;
  if (doc.t === "indent") return hasHardline(doc.doc);
  if (doc.t === "fill") return false;
  return hasHardline(doc.broken);
}

type Mode = "flat" | "break";
type Command = [number, Mode, Doc];

/** Whether `next`, flat, and what follows it up to the next line break, fit in `width`. */
function fits(next: Command, rest: Command[], width: number): boolean {
  const cmds: Command[] = [next];
  let restAt = rest.length - 1;
  let remaining = width;
  while (remaining >= 0) {
    if (!cmds.length) {
      if (restAt < 0) return true;
      cmds.push(rest[restAt--]);
      continue;
    }
    const [ind, mode, doc] = cmds.pop()!;
    if (typeof doc === "string") remaining -= doc.length;
    else if (Array.isArray(doc)) for (let i = doc.length - 1; i >= 0; i--) cmds.push([ind, mode, doc[i]]);
    else if (doc.t === "indent") cmds.push([ind + 2, mode, doc.doc]);
    else if (doc.t === "group") {
      if (doc.broken && mode === "flat") return false;
      cmds.push([ind, doc.broken ? "break" : mode, doc.doc]);
    } else if (doc.t === "ifBreak") cmds.push([ind, mode, mode === "break" ? doc.broken : doc.flat]);
    else if (doc.t === "fill") {
      if (mode === "break") return true;
      remaining -= doc.words.join(" ").length;
    } else if (mode === "break" || doc.hard) return true;
    else remaining -= doc.soft ? 0 : 1;
  }
  return false;
}

function render(doc: Doc, width = 80): string {
  let out = "";
  let column = 0;
  const cmds: Command[] = [[0, "break", doc]];
  while (cmds.length) {
    const [ind, mode, d] = cmds.pop()!;
    if (typeof d === "string") {
      out += d;
      column += d.length;
    } else if (Array.isArray(d)) for (let i = d.length - 1; i >= 0; i--) cmds.push([ind, mode, d[i]]);
    else if (d.t === "indent") cmds.push([ind + 2, mode, d.doc]);
    else if (d.t === "group") cmds.push([ind, !d.broken && fits([ind, "flat", d.doc], cmds, width - column) ? "flat" : "break", d.doc]);
    else if (d.t === "ifBreak") cmds.push([ind, mode, mode === "break" ? d.broken : d.flat]);
    else if (d.t === "fill") {
      d.words.forEach((word, i) => {
        if (i && (mode === "break" && column + 1 + word.length > width)) {
          out += "\n" + " ".repeat(ind);
          column = ind;
        } else if (i) {
          out += " ";
          column += 1;
        }
        out += word;
        column += word.length;
      });
    } else if (mode === "flat" && !d.hard) {
      if (!d.soft) {
        out += " ";
        column += 1;
      }
    } else {
      out = out.replace(/[ \t]+$/, "") + "\n" + " ".repeat(ind);
      column = ind;
    }
  }
  return out.replace(/[ \t]+$/gm, "");
}

// ── Values ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** A string literal, quoted as prettier quotes it: double quotes unless that needs more escapes than single. */
export function stringLiteral(text: string): string {
  const doubles = (text.match(/"/g) ?? []).length;
  const singles = (text.match(/'/g) ?? []).length;
  const quote = doubles > singles ? "'" : '"';
  const escaped = text.replace(/[\\\n\r\t\u0000-\u001f\u2028\u2029]/g, (c) => ESCAPES[c] ?? `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  return quote + escaped.split(quote).join(`\\${quote}`) + quote;
}
const ESCAPES: Record<string, string> = { "\\": "\\\\", "\n": "\\n", "\r": "\\r", "\t": "\\t" };

const propertyKey = (key: string) => (isIdentifier(key) ? key : /^(0|[1-9]\d*)$/.test(key) ? key : stringLiteral(key));

function valueDoc(value: unknown): Doc {
  if (isCode(value)) return value.code;
  // (`as unknown` first: a value that isn't comparable to the type compiles too.)
  if (isCast(value)) return [valueDoc(value.value), " as unknown as ", value.type];
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return stringLiteral(value);
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    // A list of objects, or of lists, each with more than one item, is one per line (as prettier writes it).
    const items = value as unknown[];
    const rows = items.length > 1 && (items.every((item) => isPlainObject(item) && Object.keys(item).length > 1) || items.every((item) => Array.isArray(item) && item.length > 1));
    return group(["[", indent([softline, join([",", line], items.map(valueDoc))]), ifBreak(","), softline, "]"], rows);
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    if (!entries.length) return "{}";
    // A string that doesn't fit beside its key goes on the next line, unless the key is short (prettier's rule).
    const property = ([key, item]: [string, unknown]): Doc => {
      const name = propertyKey(key);
      return typeof item === "string" && name.length >= 5 ? group([name, ":", indent([line, valueDoc(item)])]) : [name, ": ", valueDoc(item)];
    };
    return group(["{", indent([line, join([",", line], entries.map(property))]), ifBreak(","), line, "}"]);
  }
  return stringLiteral(String(value));
}

function join(separator: Doc, docs: Doc[]): Doc[] {
  return docs.flatMap((doc, i) => (i ? [separator, doc] : [doc]));
}

// ── JSX ─────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Whether a string can be a JSX attribute string as it is (JSX decodes entities there, and has no escapes). */
const attributeSafe = (text: string) => !/[&\n\r\u0000-\u001f\u2028\u2029]/.test(text) && !(text.includes('"') && text.includes("'"));

function attrDoc({ name, value }: Attr): Doc {
  if (value === true) return name;
  if (typeof value === "string" && attributeSafe(value)) {
    const quote = (value.match(/"/g) ?? []).length > (value.match(/'/g) ?? []).length ? "'" : '"';
    return `${name}=${quote}${value}${quote}`;
  }
  // Objects and arrays hug the braces; anything else (a cast) goes on a line of its own when it doesn't fit.
  if ((isPlainObject(value) && !isCast(value)) || Array.isArray(value)) return [name, "={", valueDoc(value), "}"];
  return group([name, "={", indent([softline, valueDoc(value)]), softline, "}"]);
}

function elementDoc(element: JsxElement): Doc {
  const { tag, attrs, children } = element;
  // One string attribute stays beside the tag whatever its length, as prettier keeps it.
  const single = attrs.length === 1 && typeof attrs[0].value === "string" && attributeSafe(attrs[0].value);
  const attrsDoc: Doc = attrs.length ? (single ? [" ", attrDoc(attrs[0])] : [indent([line, join(line, attrs.map(attrDoc))])]) : "";
  if (!children.length) return single ? ["<", tag, attrsDoc, " />"] : group(["<", tag, attrsDoc, line, "/>"]);
  const open = group(["<", tag, attrsDoc, single || !attrs.length ? "" : softline, ">"]);
  const body = children.map(childDoc);
  // Elements inside, or more than one attribute, put the children on lines of their own (as prettier does).
  const broken = attrs.length > 1 || children.some((child) => !("text" in child));
  return group([open, indent([softline, join(hardline, body)]), softline, "</", tag, ">"], broken);
}

function childDoc(child: JsxChild): Doc {
  if ("text" in child) return { t: "fill", words: child.text.split(" ") };
  // On one line, and unable to end itself.
  if ("comment" in child) return `{/* ${child.comment.replace(/[\u0000-\u001f\u2028\u2029]+/g, " ").replace(/\*\//g, "* /")} */}`;
  return elementDoc(child);
}

export interface ModuleSource {
  imports: Array<{ from: string; names: string[] }>;
  componentName: string;
  root: JsxElement;
}

/** The module: imports and `export default function Name() { return (…); }`. */
export function printModule({ imports, componentName, root }: ModuleSource): string {
  const importDocs: Doc[] = imports.map(({ from, names }) => group(["import {", indent([line, join([",", line], names)]), ifBreak(","), line, "} from ", stringLiteral(from), ";"]));
  const returned = group(["return ", ifBreak("("), indent([softline, elementDoc(root)]), softline, ifBreak(")"), ";"]);
  const body: Doc = ["export default function ", componentName, "() {", indent([hardline, returned]), hardline, "}"];
  const parts: Doc[] = [join(hardline, importDocs)];
  parts.push(body);
  return render(join([hardline, hardline], parts)) + "\n";
}
