/**
 * The HTML react-dom wrote for a collecting render (collector.ts), read back as the content's parts (output.ts): text
 * as written, each element with its tags as written (open, close) and its content, and each of the render's markers as
 * the record, boundary or error it stands for.
 *
 * Nothing the template gives is read for a marker. Text and attribute values are escaped by React; HTML given whole
 * (`dangerouslySetInnerHTML`, and what a lazy component renders) never reaches react-dom's output: the collection keeps
 * it and react-dom writes a placeholder in its place, which is swapped back here; and a `<style>`'s or `<script>`'s
 * text (which React 19 writes as given) is taken whole, never read for markers (the collector puts none there). A
 * marker or placeholder is only one the collection made and react-dom rendered, read once: anything else that looks
 * like one (another render's, a number out of range, one never rendered) is the markup it is, and one read twice
 * fails the render, by name (FORGED).
 */
import { ASYNC_IN_SYNC, positionOf, RenderError } from "./errors";
import { MARK, type Collection } from "./collector";
import type { BoundaryPart, ErrorPart, HostPart, Part, RecordPart } from "./output";
import { REACT_18 } from "./react-compat";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
/** What React writes its own way: a <style>'s and <script>'s text, as given in React 19 (the tag as React names it). */
const RAW = new Set(["script", "style"]);
/** The elements whose content a parser reads to their own end tag (see host.ts's headFormat). */
const TO_END_TAG = new Set(["style", "script", "title", "textarea", "noscript", "noembed", "noframes", "iframe", "xmp"]);

/** React 18's text escaping, undone where a <Head>'s style or script text is written as given (see host.ts). */
const unescape18 = (s: string) => (REACT_18 ? s.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;/g, (e) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" })[e]!) : s);

export const FORGED = "the template's markup holds a marker of Elements' own collecting render twice (an `<unlayer-mark>` or `<!--u…-->` with this render's number): it can't be read as the template, so the render fails";

interface Open {
  tag: string;
  parts: Part[];
  host?: HostPart;
  /** In a <Head>'s tags; in an <svg> or <math>; what it's in that runs to its end tag. */
  head?: boolean;
  foreign?: boolean;
  ends?: readonly string[];
  /** A <style>'s or <script>'s content (React 18 writes markup in it, its text escaped): its text as given in a <Head>; no marker read. */
  raw?: boolean;
  inert?: boolean;
}

/** The placeholder react-dom writes for the collection's HTML number `n` (see the collector's `rawPlaceholder`). */
export const placeholderOf = (nonce: string, n: number) => `<!--u${nonce}.${n}-->`;

/** `html` (react-dom's output, `c`'s), as parts; `inert`: HTML given whole (a lazy component's), with no markers or placeholders to read. */
export function parse(html: string, c: Collection, inert = false): Part[] {
  const root: Part[] = [];
  const stack: Open[] = [{ tag: "", parts: root }];
  const top = () => stack[stack.length - 1];
  const markOpen = new RegExp(`^<${MARK} data-n="([^"]*)" data-i="(\\d{1,9})">`);
  const placeholder = new RegExp(`^<!--u${c.nonce}\\.(\\d{1,9})-->`);
  let at = 0;
  const text = (s: string) => {
    if (!s) return;
    if (top().raw) s = unescape18(s);
    const parts = top().parts;
    const last = parts.length - 1;
    if (typeof parts[last] === "string") parts[last] += s;
    else parts.push(s);
  };
  while (at < html.length) {
    const lt = html.indexOf("<", at);
    if (lt < 0) {
      text(html.slice(at));
      break;
    }
    text(html.slice(at, lt));
    if (html.startsWith("<!--", lt)) {
      const raw = inert || top().inert ? null : placeholder.exec(html.slice(lt, lt + 40));
      const n = raw ? Number(raw[1]) : -1;
      if (raw && n < c.raw.length && !c.raw[n].markup) {
        if (c.rawRead.has(n)) throw forged();
        c.rawRead.add(n);
        // HTML given whole: the element's own, as written (nothing in it read for a marker).
        top().parts.push(c.raw[n].html);
        at = lt + raw[0].length;
        continue;
      }
      const end = html.indexOf("-->", lt + 4);
      const stop = end < 0 ? html.length : end + 3;
      // (react-dom's stream writes its own comments, where its Suspense boundaries are and between texts: the
      // template's comments are only in HTML given whole, which isn't here.)
      if (!(c.async && /^<!--(?:\$[?!]?|\/\$| |&)-->$/.test(html.slice(lt, stop)))) text(html.slice(lt, stop));
      at = stop;
      continue;
    }
    if (html[lt + 1] === "/") {
      const gt = html.indexOf(">", lt);
      const name = html.slice(lt + 2, gt < 0 ? html.length : gt).trim().toLowerCase();
      // An end tag of what's open (a stray one, in HTML given whole, is text).
      let depth = stack.length - 1;
      while (depth > 0 && stack[depth].tag !== name) depth--;
      if (depth === 0) text(html.slice(lt, gt + 1));
      else {
        while (stack.length - 1 > depth) stack.pop();
        const done = stack.pop()!;
        if (done.host) done.host.close = html.slice(lt, gt + 1);
      }
      at = gt < 0 ? html.length : gt + 1;
      continue;
    }
    const gt = html.indexOf(">", lt);
    const tagText = html.slice(lt, gt < 0 ? html.length : gt + 1);
    const name = /^<([^\s/>]+)/.exec(tagText)?.[1];
    if (!name || gt < 0) {
      text(html.slice(lt, gt < 0 ? html.length : lt + 1));
      at = gt < 0 ? html.length : lt + 1;
      continue;
    }
    const from = top();
    const mark = !inert && !from.inert && name === MARK ? markOpen.exec(tagText) : null;
    if (mark && mark[1] === c.nonce && Number(mark[2]) < c.marks.length && c.rendered.has(Number(mark[2]))) {
      const n = Number(mark[2]);
      if (c.read.has(n)) throw forged();
      c.read.add(n);
      const quiet = c.marks[n].k === "r" && (c.marks[n] as { quiet?: boolean }).quiet;
      stack.push({ tag: MARK, parts: markPart(c, n, from.parts), head: from.head || !!quiet, foreign: from.foreign, ends: quiet ? (c.headEnds ?? []) : from.ends });
      at = gt + 1;
      continue;
    }
    const lower = name.toLowerCase();
    const host: HostPart = { t: "host", tag: lower, open: tagText, close: "", parts: [] };
    from.parts.push(host);
    at = gt + 1;
    if (VOID.has(lower)) continue;
    const foreign = from.foreign || (!!from.head && (lower === "svg" || lower === "math"));
    if (RAW.has(name)) {
      // Its text, whole, to its end tag (React escapes what would end it): never read for markers. A <Head>'s is
      // written as given (output.ts writes it with rawText), but under an <svg> or <math>, where it's escaped as any.
      const raw = !!from.head && !foreign;
      if (raw) Object.assign(host, { raw: true, ends: from.ends ?? [] });
      // (React 18 escapes its text, so a tag in it is one React wrote, a component's or a list's: read as markup, no
      // marker in it.)
      if (REACT_18) {
        stack.push({ tag: lower, parts: host.parts, host, head: from.head, foreign, ends: from.ends, raw: raw || from.raw, inert: true });
        continue;
      }
      const end = html.toLowerCase().indexOf(`</${lower}`, at);
      const stop = end < 0 ? html.length : end;
      if (stop > at) host.parts.push(raw ? unescape18(html.slice(at, stop)) : html.slice(at, stop));
      const endGt = end < 0 ? html.length - 1 : html.indexOf(">", end);
      host.close = html.slice(stop, endGt + 1);
      at = endGt + 1;
      continue;
    }
    const ends = from.head && !foreign && TO_END_TAG.has(lower) ? [...(from.ends ?? []), lower] : from.ends;
    stack.push({ tag: lower, parts: host.parts, host, head: from.head, foreign, ends, raw: from.raw, inert: from.inert });
  }
  return root;
}

const forged = () => new RenderError(FORGED, "template", "");

/** The part a marker stands for, added to `into`: where what's inside the marker goes. */
function markPart(c: Collection, n: number, into: Part[]): Part[] {
  const mark = c.marks[n];
  switch (mark.k) {
    case "r": {
      const part: RecordPart = { t: "record", record: mark.record, parts: [], quiet: mark.quiet };
      into.push(part);
      return part.parts;
    }
    case "b": {
      const part: BoundaryPart = { t: "boundary", parts: [] };
      into.push(part);
      c.boundaryParts.set(n, part.parts);
      if (!mark.record) return part.parts;
      const record: RecordPart = { t: "record", record: mark.record, parts: [] };
      part.parts.push(record);
      return record.parts;
    }
    case "f": {
      const part: ErrorPart = { t: "error", error: mark.error as RenderError, fatal: mark.fatal };
      into.push(part);
      return [];
    }
    case "h": {
      // What a lazy component rendered, kept by the collection: the markup it is, nothing in it read for a marker.
      if (c.rawRead.has(mark.raw)) throw forged();
      c.rawRead.add(mark.raw);
      for (const part of parse(c.raw[mark.raw].html, c, true)) into.push(part);
      return [];
    }
    case "s": {
      // A boundary whose content suspended: the boundary, failed with what suspended in it.
      const s = c.suspended.find((x) => x.boundary === mark.boundary);
      const error = new RenderError(ASYNC_IN_SYNC, s?.name ?? "component", s ? positionOf(s.frame) : "");
      const part: BoundaryPart = { t: "boundary", parts: [{ t: "error", error, fatal: false }] };
      into.push(part);
      return [];
    }
  }
}
