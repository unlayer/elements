/**
 * The HTML react-dom wrote for a collecting render (collector.ts), read back as the content's parts (output.ts): text
 * as written, each element with its tags as written (open, close) and its content, and each of the render's markers as
 * the record, boundary or error it stands for.
 *
 * Nothing the template gives is read for a marker. Text and attribute values are escaped by React; HTML given whole
 * (`dangerouslySetInnerHTML`) never reaches react-dom's output: the collection keeps it and react-dom writes a
 * placeholder in its place, which is swapped back here; and a `<style>`'s or `<script>`'s text (which React 19 writes
 * as given) is taken whole, never read for markers (the collector puts none there). What a lazy component renders is
 * the exception: React renders it itself, unprepared (nothing public gives what React.lazy loads: see collector.ts's
 * prepLazy), so HTML given whole there is in react-dom's output as written. It's in a marker of its own (`l`), and
 * isn't read at all: it's kept as React wrote it, byte for byte, as markup of its own (`lazySection`), but for the
 * markers React wrote in it (Elements' components it renders, prepared as anywhere else), found by their exact text,
 * and the marker's end. So a marker or placeholder is only one the collection made and react-dom rendered, in a part
 * React kept, read once: anything else that looks like one (another render's, a number out of range, one never
 * rendered) is the markup it is, and one read twice, or one of a part React left out (a <Suspense>'s content where it
 * rendered the fallback, a fallback it didn't render: `kept`), fails the render, by name (FORGED). Each is read only in
 * the marker it was prepared in, as React writes it there (`inPlace`): one React rendered and left out in what a lazy
 * component renders, which HTML given whole there can stand for, stands nowhere else, so nothing of the template's own
 * is read inside it. Every marker React wrote is closed by its own end tag: so an end tag of a marker with none open,
 * or a marker never ended, is another's `</unlayer-mark>` (each forged one leaves one such end tag, React writing one
 * per marker), and fails the render too, as does a marker React rendered in a part it kept that's never read, and a
 * copy anywhere of one React wrote (see copies).
 */
import { ASYNC_IN_SYNC, positionOf, RenderError, SWALLOWED, threw, type Frame } from "./errors";
import { MARK, type Collection } from "./collector";
import type { BoundaryPart, ErrorPart, HostPart, Part, RecordPart } from "./output";
import { REACT_18 } from "./react-compat";
import { unrunAttributes } from "./attributes";
import { LAZY_ASYNC_18, lazyAsyncIn18 } from "./react-dom";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
/** What React writes its own way: a <style>'s and <script>'s text, as given in React 19 (the tag as React names it). */
const RAW = new Set(["script", "style"]);
/** The elements whose content a parser reads to their own end tag (see host.ts's headFormat). */
const TO_END_TAG = new Set(["style", "script", "title", "textarea", "noscript", "noembed", "noframes", "iframe", "xmp"]);

/** React's text escaping, undone where a <Head>'s style or script text is written as given (see host.ts). */
const unescaped = (s: string) => s.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;/g, (e) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" })[e]!);
const unescape18 = (s: string) => (REACT_18 ? unescaped(s) : s);

export const FORGED = "the template's markup holds a marker of Elements' own collecting render that React didn't write there (an `<unlayer-mark>`, `</unlayer-mark>` or `<!--u…-->` with this render's number, one React wrote elsewhere or left out: HTML given whole in what a lazy component renders can hold one): it can't be read as the template, so the render fails.";

interface Open {
  tag: string;
  parts: Part[];
  host?: HostPart;
  /** In a <Head>'s tags; in an <svg> or <math>; what it's in that runs to its end tag. */
  head?: boolean;
  foreign?: boolean;
  ends?: readonly string[];
  /**
   * A <style>'s or <script>'s content on React 18, which writes markup in it (a component's, a list's) and escapes its
   * text: read as markup, its text as given in a <Head> (`raw`), no marker read (`inert`), and no end tag in it closing
   * what it's in (`floor`).
   */
  raw?: boolean;
  inert?: boolean;
  floor?: boolean;
  /** In a <Head>'s style's or script's text rendered in a marker (collector.ts's headText): React's escaping undone. */
  unescape?: boolean;
  /** A marker of the render's: closed by its own end tag only, and no other end tag in it ends what it's in. Its number. */
  mark?: boolean;
  n?: number;
  /** What a lazy component renders (`l`): kept as React wrote it, but for the markers in it (see the top). */
  lazy?: boolean;
}

/** The placeholder react-dom writes for the collection's HTML number `n` (see the collector's `withRaw`). */
export const placeholderOf = (nonce: string, n: number) => `<!--u${nonce}.${n}-->`;

/** Whether `n` is HTML given whole (a <style>'s or <script>'s text: `text`) that the collection kept and React rendered. */
const given = (c: Collection, n: number, text: boolean) => n >= 0 && n < c.raw.length && !!c.raw[n].text === text && c.rawRendered.has(n);

/** `html` (react-dom's output, `c`'s), as parts. */
export function parse(html: string, c: Collection): Part[] {
  const root: Part[] = [];
  const stack: Open[] = [{ tag: "", parts: root }];
  const top = () => stack[stack.length - 1];
  const markOpen = new RegExp(`^<${MARK} data-n="([^"]*)" data-i="(\\d{1,9})">`);
  const placeholder = new RegExp(`^<!--u${c.nonce}\\.(\\d{1,9})-->`);
  // (Where each is next: the parse only goes on, so each is searched for once.)
  const next = finder(html);
  const commentEnd = next(/-->/g);
  const templateEnd = next(/<\/template>/g);
  /** In what a lazy component renders, where a marker of the render's starts next, and where one ends (see lazyStop). */
  const lazyOpen = next(new RegExp(`<${MARK} data-n="${c.nonce}" data-i="`, "g"));
  const lazyEnd = next(new RegExp(`</${MARK}>`, "g"));
  const endTags = new Map<string, (from: number) => number>();
  /** Where `name`'s end tag is next, as a browser ends what it reads as text (`</style` and then a space, `/` or `>`). */
  const endTagOf = (name: string) => {
    let find = endTags.get(name);
    if (!find) endTags.set(name, (find = next(new RegExp(`</${name}(?=[\\t\\n\\f\\r />])`, "gi"))));
    return find;
  };
  /** Where a boundary that failed renders its fallback (right after its <template>), and its error's digest. */
  let failedAt: { at: number; digest: string } | undefined;
  /** The marker end tags read as ones (see copies). */
  let endsRead = 0;
  /**
   * In what a lazy component renders, from `from`: where the next marker React wrote there starts (one the collection
   * made and React rendered: its exact start tag), or where the lazy component's own ends (`</unlayer-mark>`, exactly),
   * whichever is first (-1: neither). Nothing else is read there: what looks like a marker, but isn't one React
   * rendered, is the markup it is (and a copy of one it did fails the render: see copies).
   */
  const lazyStop = (from: number): number => {
    const end = lazyEnd(from);
    for (let open = lazyOpen(from); open >= 0 && (end < 0 || open < end); open = lazyOpen(open + 1)) {
      const n = Number(markOpen.exec(html.slice(open, open + 64))?.[2] ?? -1);
      if (n >= 0 && n < c.marks.length && c.rendered.has(n)) return open;
    }
    return end;
  };
  /**
   * Whether a marker or placeholder of the render's (prepared in `parent`, see collector.ts's Box) is where React wrote
   * it: in the marker it was prepared in, the innermost one open. Anything else is what HTML given whole in what a lazy
   * component renders forged, standing for one React rendered and left out (React writes none of those), around or
   * among the template's own.
   */
  const inPlace = (parent: { i: number } | undefined) => {
    let open = -1;
    for (let i = stack.length - 1; i > 0; i--) {
      if (stack[i].mark) {
        open = stack[i].n!;
        break;
      }
    }
    return (parent?.i ?? -1) === open;
  };
  let at = 0;
  const text = (s: string) => {
    if (!s) return;
    if (top().raw) s = unescape18(s);
    else if (top().unescape) s = unescaped(s);
    const parts = top().parts;
    const last = parts.length - 1;
    if (typeof parts[last] === "string") parts[last] += s;
    else parts.push(s);
  };
  while (at < html.length) {
    if (top().lazy) {
      // What a lazy component renders, up to the next marker React wrote there or its own end: as written.
      const stop = lazyStop(at);
      lazySection(top().parts, html.slice(at, stop < 0 ? html.length : stop), c.async);
      if (stop < 0) break;
      at = stop;
    }
    const lt = html.indexOf("<", at);
    if (lt < 0) {
      text(html.slice(at));
      break;
    }
    text(html.slice(at, lt));
    if (html.startsWith("<!--", lt)) {
      const raw = placeholder.exec(html.slice(lt, lt + 40));
      // (HTML given whole in what React 18 writes in a <style> or <script>: an element's there.)
      if (raw && top().inert && !given(c, Number(raw[1]), false)) {
        text(html.slice(lt, lt + 4));
        at = lt + 4;
        continue;
      }
      const n = raw ? Number(raw[1]) : -1;
      if (raw && given(c, n, false)) {
        if (c.rawRead.has(n) || !inPlace(c.raw[n].parent)) throw forged();
        c.rawRead.add(n);
        // HTML given whole: the element's own, as written (nothing in it read for a marker); a <Head>'s title's, what
        // its marker held.
        top().parts.push(...whole(c, n));
        at = lt + raw[0].length;
        continue;
      }
      if (top().inert) {
        // (No comment of the template's is there: its text's `<!--` is escaped, and HTML given whole is a placeholder.
        // React 18's stream writes its own: between two texts (18.0), and around a <Suspense>'s content.)
        const own = c.async ? REACT_COMMENTS.find((comment) => html.startsWith(comment, lt)) : undefined;
        if (!own) text(html.slice(lt, lt + 4));
        at = lt + (own ? own.length : 4);
        continue;
      }
      const end = commentEnd(lt + 4);
      // (React writes no comment it doesn't end.)
      if (end < 0) {
        text(html.slice(lt, lt + 4));
        at = lt + 4;
        continue;
      }
      let stop = html.indexOf(">", end) + 1;
      // (react-dom's stream writes its own comments, where its Suspense and <Activity> boundaries are and between texts: the
      // template's comments are only in HTML given whole, which isn't here.)
      const own = c.async && /^<!--(?:\$[?!]?|\/\$| |&|\/&)-->$/.test(html.slice(lt, stop));
      if (!own) text(html.slice(lt, stop));
      // (And after a boundary that failed, the <template> it writes with the error's digest: React's, not the template's.
      // The digest, the render's own, says which error it was, for the fallback's marker right after it.)
      else if (html.startsWith("<!--$!-->", lt) && html.startsWith("<template", stop)) {
        const close = templateEnd(stop);
        if (close >= 0) {
          const digest = DIGEST.exec(html.slice(stop, close))?.[1];
          stop = close + "</template>".length;
          if (digest !== undefined) failedAt = { at: stop, digest };
        }
      }
      at = stop;
      continue;
    }
    if (html[lt + 1] === "/") {
      const gt = html.indexOf(">", lt);
      const name = html.slice(lt + 2, gt < 0 ? html.length : gt).trim().toLowerCase();
      if (name === MARK && !top().inert) {
        // A marker's end: the last one open ends, with what's still open in it. With none open, it's another's.
        let depth = stack.length - 1;
        while (depth > 0 && !stack[depth].mark) depth--;
        if (!depth) throw forged();
        stack.length = depth;
        endsRead++;
        at = gt < 0 ? html.length : gt + 1;
        continue;
      }
      // An end tag of what's open, in a marker only of what's open in it, and inside a <style>'s or <script>'s content
      // only of what's open there (React 18 writes markup there: one that ends nothing is its text).
      let floor = stack.length - 1;
      while (floor > 0 && !stack[floor].floor && !stack[floor].mark) floor--;
      let depth = stack.length - 1;
      while (depth > floor && stack[depth].tag !== name) depth--;
      if (depth === floor && !(floor > 0 && stack[floor].floor && stack[floor].tag === name)) text(html.slice(lt, gt + 1));
      else {
        stack.length = depth + 1;
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
    const mark = !from.inert && name === MARK ? markOpen.exec(tagText) : null;
    if (mark && mark[1] === c.nonce && Number(mark[2]) < c.marks.length && c.rendered.has(Number(mark[2]))) {
      const n = Number(mark[2]);
      if (c.read.has(n) || !inPlace(c.marks[n].parent)) throw forged();
      c.read.add(n);
      const quiet = c.marks[n].k === "r" && (c.marks[n] as { quiet?: boolean }).quiet;
      const held = c.marks[n].k === "t" ? (c.marks[n] as { unescape: boolean; ends: readonly string[] }) : undefined;
      const digest = failedAt?.at === lt ? failedAt.digest : undefined;
      failedAt = undefined;
      stack.push({ tag: MARK, mark: true, n, lazy: c.marks[n].k === "l", parts: markPart(c, n, from.parts, digest), head: from.head || !!quiet, foreign: from.foreign, ends: held ? held.ends : quiet ? [] : from.ends, unescape: held ? held.unescape : from.unescape });
      at = gt + 1;
      continue;
    }
    const lower = name.toLowerCase();
    let endTag = -1;
    if (RAW.has(name)) {
      endTag = endTagOf(lower)(gt + 1);
      // (React writes none it doesn't end, and nothing in its text ends it.)
      if (endTag < 0) {
        text(tagText);
        at = gt + 1;
        continue;
      }
    }
    const host: HostPart = { t: "host", tag: lower, open: tagText, close: "", parts: [] };
    from.parts.push(host);
    at = gt + 1;
    if (VOID.has(lower)) continue;
    const foreign = from.foreign || (!!from.head && (lower === "svg" || lower === "math"));
    if (RAW.has(name)) {
      // Its text, whole, to its end tag as a browser reads it (`</script` and then a space, `/` or `>`): never read for
      // markers, and nothing in it (a `<!--`, an end tag) closes anything. HTML given whole is the collection's (its
      // placeholder all there is). A <Head>'s is written as given (output.ts writes it with rawText), but under an <svg>
      // or <math>, where it's escaped as any; React 18 escapes the text it writes there, which is undone.
      const raw = !!from.head && !foreign;
      if (raw) Object.assign(host, { raw: true, ends: from.ends ?? [] });
      const stop = endTag;
      const content = html.slice(at, stop);
      const only = placeholder.exec(content);
      const n = only && only[0].length === content.length ? Number(only[1]) : -1;
      if (given(c, n, true)) {
        if (c.rawRead.has(n) || !inPlace(c.raw[n].parent)) throw forged();
        c.rawRead.add(n);
        host.parts.push(...whole(c, n));
      } else if (REACT_18) {
        stack.push({ tag: lower, parts: host.parts, host, head: from.head, foreign, ends: from.ends, raw: raw || from.raw, inert: true, floor: true });
        continue;
      } else if (content) host.parts.push(content);
      const endGt = html.indexOf(">", stop);
      at = endGt < 0 ? html.length : endGt + 1;
      host.close = html.slice(stop, at);
      continue;
    }
    const ends = from.head && !foreign && TO_END_TAG.has(lower) ? [...(from.ends ?? []), lower] : from.ends;
    stack.push({ tag: lower, parts: host.parts, host, head: from.head, foreign, ends, raw: from.raw, inert: from.inert, unescape: from.unescape });
  }
  // (React ends every marker it writes.)
  if (stack.some((open) => open.mark)) throw forged();
  // A part of what a lazy component renders that React left out (a <Suspense> of its own that rendered its fallback):
  // an async render waits for what suspends, so it failed, as React told the stream (see the engine's collectAsync); a
  // synchronous render keeps no error React handled there, so it's said where the lazy component is, as a <Suspense> of
  // the template's own is (fallbackFailed).
  const left = kept(c);
  if (!c.async) for (const lazy of left) c.leftOut.push(swallowed("lazy", c.lazies[lazy].frame));
  // (Only what a lazy component renders has HTML given whole in react-dom's output, as written: see the top.)
  if (c.lazies.length) copies(html, c, endsRead);
  return root;
}

/**
 * The comments React's stream writes (where its Suspense and <Activity> boundaries are, between two texts, and after a
 * boundary that failed, the <template> with the error's digest, whose attributes React escapes), which a static render
 * doesn't: taken out of what a lazy component renders, in one pass, as from the rest of the template's markup.
 */
const STREAM_COMMENTS = /<!--\$!--><template[^>]*><\/template>|<!--(?:\$[?!]?|\/\$| |&|\/&)-->/g;

/**
 * What a lazy component renders, between the markers React wrote there (`html`), as markup of its own, as React wrote
 * it: the parse doesn't read it (see the top). A host part with no tags of its own, so the content has it whole. (React
 * 18's `javascript:` URLs there written as React 19 writes them: see attributes.ts's unrunAttributes.)
 */
function lazySection(into: Part[], html: string, async: boolean): void {
  const streamed = async ? html.replace(STREAM_COMMENTS, "") : html;
  const written = REACT_18 ? unrunAttributes(streamed) : streamed;
  if (written) into.push({ t: "host", tag: "", open: written, close: "", parts: [] });
}

/**
 * Where what `re` (global) matches is next in `html`, from `from` on (-1: nowhere): a search, kept while `from` hasn't
 * passed what it found (`from` only goes on), so `html` is searched once whatever asks.
 */
const finder =
  (html: string) =>
  (re: RegExp): ((from: number) => number) => {
    let searched = -1;
    let found = -1;
    return (from) => {
      if (searched >= 0 && from >= searched && (found < 0 || from <= found)) return found;
      re.lastIndex = searched = from;
      found = re.exec(html)?.index ?? -1;
      return found;
    };
  };

/**
 * Fails the render where a marker or placeholder read is of a part React left out: what's in a <Suspense> (or a
 * boundary's own) whose fallback's marker is in what React wrote, or a fallback whose marker isn't. React wrote nothing
 * in that part (it may have rendered it), so it's another's markup naming it (what a lazy component renders, which
 * isn't prepared: see collector.ts's prepLazy). And where one React rendered in a part it kept isn't read, outside what
 * a lazy component renders: React wrote it, and the parse reads every one it wrote. In what a lazy component renders,
 * one that isn't read is of a part React left out there, which the collection can't see (a <Suspense> of the lazy
 * component's own that rendered its fallback, or a fallback it didn't render: React wrote nothing of it, as every
 * marker React writes there is found by its text): what's returned is those lazy components (their numbers), whose
 * part that failed is said (see parse). (A fallback's own marker is the one that says which part React kept: React
 * rendered it, and wrote it or not.)
 */
function kept(c: Collection): Set<number> {
  const out = (scope: number | undefined): boolean => {
    for (let s = scope ?? -1, depth = 0; s >= 0 && depth <= c.scopes.length; s = c.scopes[s].parent, depth++) if (c.scopes[s].lazy === undefined && c.read.has(c.scopes[s].marker) !== !!c.scopes[s].fallback) return true;
    return false;
  };
  /** The lazy component a part is in (-1: none). */
  const lazyOf = (scope: number | undefined): number => {
    for (let s = scope ?? -1, depth = 0; s >= 0 && depth <= c.scopes.length; s = c.scopes[s].parent, depth++) if (c.scopes[s].lazy !== undefined) return c.scopes[s].lazy!;
    return -1;
  };
  if (c.scopes.length) {
    for (const n of c.read) if (out(c.marks[n].scope)) throw forged();
    for (const n of c.rawRead) if (out(c.raw[n].scope)) throw forged();
  }
  const left = new Set<number>();
  const unread = (scope: number | undefined) => {
    const lazy = lazyOf(scope);
    if (lazy < 0) throw forged();
    left.add(lazy);
  };
  for (const n of c.rendered) if (!c.read.has(n) && c.marks[n].k !== "fb" && c.marks[n].k !== "s" && !out(c.marks[n].scope)) unread(c.marks[n].scope);
  for (const n of c.rawRendered) if (!c.rawRead.has(n) && !out(c.raw[n].scope)) unread(c.raw[n].scope);
  return left;
}

/** The digest in the <template> React writes where a boundary that failed renders its fallback (escaped, as any value). */
const DIGEST = /^<template[^>]*?\sdata-dgst="([^"]*)"/;

/**
 * What React told the stream failed where a boundary renders its fallback: the error with that digest (each error React
 * handles is told, and gets a digest, in the order it fails, not the tree's), or the next one told.
 */
function toldFor(c: Collection, digest: string | undefined) {
  const at = digest === undefined ? -1 : c.reactErrors.findIndex((t) => t.digest === digest);
  return at >= 0 ? c.reactErrors.splice(at, 1)[0] : c.reactErrors.shift();
}

/** The comments React 18's stream writes in a <style>'s or <script>'s text: between two texts, around a <Suspense>'s content. */
const REACT_COMMENTS = ["<!-- -->", "<!--$-->", "<!--/$-->"];

const forged = () => new RenderError(FORGED, "template", "");

/**
 * Fails the render where react-dom's output holds a copy of a marker or placeholder of the render's (one React rendered),
 * or more marker end tags than were read as ones: React writes each once, so another is what a lazy component's HTML
 * given whole made, ending a marker early or standing for one React wrote. Its patterns are looser than the parse's
 * (any case, any end of the tag, a marker's start with any end), so whatever the parse may have read as one is counted.
 * Every end tag counts, a `</unlayer-mark>` in a <style>'s or <script>'s text too: where HTML given whole ended what a
 * lazy component renders early, what the parse reads after it as the template's can be such text that hides one React
 * wrote, which an end tag counted but never read gives away. (In a template with no lazy component, there's nothing to
 * count: one in data, such as JSON-LD's, is that text's.)
 */
function copies(html: string, c: Collection, endsRead: number): void {
  const seen = new Set<string>();
  for (const [, marker, raw] of html.matchAll(new RegExp(`<${MARK} data-n="${c.nonce}" data-i="(\\d{1,9})"|<!--u${c.nonce}\\.(\\d{1,9})-->`, "g"))) {
    const key = marker !== undefined ? `m${marker}` : `u${raw}`;
    if (!(marker !== undefined ? c.rendered.has(Number(marker)) : c.rawRendered.has(Number(raw)))) continue;
    if (seen.has(key)) throw forged();
    seen.add(key);
  }
  if ([...html.matchAll(new RegExp(`</${MARK}(?=[\\t\\n\\f\\r />])`, "gi"))].length > endsRead) throw forged();
}

/** What HTML given whole `n` is: as written, or what the marker of a <Head>'s text it's from held (read before it). */
const whole = (c: Collection, n: number): Part[] => {
  const from = c.raw[n].from;
  return from === undefined ? [c.raw[n].html] : (c.texts.get(from) ?? []);
};

/**
 * What failed inside a <Suspense> whose fallback React rendered (its marker `n`, at `frame`), or undefined where
 * what's in it suspended (a synchronous render renders the fallback, as React's server renderer does). An async render
 * waits for what suspends: there, a fallback is what failed, as React told its stream (the error its digest names, see
 * toldFor). A synchronous one keeps no error React handled there: what's said is where, and what to do.
 */
function fallbackFailed(c: Collection, n: number, frame: Frame, digest?: string): RenderError | undefined {
  const lazy = c.lazies.find((x) => x.suspenseAt === n);
  if (c.async) {
    const told = toldFor(c, digest);
    if (!told) return swallowed(lazy ? "lazy" : "Suspense", lazy?.frame ?? frame);
    return toldError(told, lazy ? "lazy" : "Suspense", lazy?.frame ?? frame);
  }
  if (c.suspended.some((x) => x.suspenseAt === n) || c.lazies.some((x) => x.suspenseAt === n && x.done)) return undefined;
  return swallowed(lazy ? "lazy" : "Suspense", lazy?.frame ?? frame);
}

const swallowed = (name: string, frame: Frame | null) => new RenderError(SWALLOWED, name, positionOf(frame));

/**
 * What React told the stream failed, at `frame` (named `name` where React's report doesn't name it): on React 18, an
 * async component a lazy component loaded is said as such (LAZY_ASYNC_18), not with React's own message.
 */
function toldError(told: { error: unknown; name?: string }, name: string, frame: Frame | null): RenderError {
  if (lazyAsyncIn18(told.error)) return new RenderError(LAZY_ASYNC_18, "lazy", positionOf(frame), told.error);
  return new RenderError(threw(told.error), told.name ?? name, positionOf(frame), told.error);
}

/**
 * The first part that failed in what a <Suspense> (its fallback's marker `n`) holds, in a synchronous render that
 * rendered its fallback for what suspended there: React left the failed part out with the rest, which said nothing of
 * it. (Its marker was rendered, in that part of the tree: see Collection's scopes.)
 */
function failedIn(c: Collection, n: number): { error: unknown; fatal: boolean } | undefined {
  const inside = (scope: number | undefined): boolean => {
    for (let s = scope ?? -1, depth = 0; s >= 0 && depth <= c.scopes.length; s = c.scopes[s].parent, depth++) if (c.scopes[s].marker === n) return !c.scopes[s].fallback;
    return false;
  };
  for (let i = n + 1; i < c.marks.length; i++) {
    const mark = c.marks[i];
    if (mark.k === "f" && c.rendered.has(i) && inside(mark.scope)) return mark;
  }
  return undefined;
}

/** The part a marker stands for, added to `into`: where what's inside the marker goes. */
function markPart(c: Collection, n: number, into: Part[], digest?: string): Part[] {
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
    case "t": {
      // What a <Head>'s style, script or title holds: kept for the element's HTML given whole (see whole), not here.
      const parts: Part[] = [];
      c.texts.set(n, parts);
      return parts;
    }
    case "l": {
      // What a lazy component renders: the markup of a component of the template's own, the lazy one (see lazySection).
      const part: RecordPart = { t: "record", record: mark.record, parts: [] };
      into.push(part);
      return part.parts;
    }
    case "fb": {
      // A <Suspense>'s fallback React rendered: what's in it suspended (a synchronous render), or failed. A part that
      // failed beside what suspended fails the render all the same (or is left out, said), as anywhere else.
      const lost = c.async ? undefined : failedIn(c, n);
      if (lost) {
        into.push({ t: "error", error: lost.error as RenderError, fatal: lost.fatal });
        return [];
      }
      const failed = fallbackFailed(c, n, mark.frame, digest);
      if (!failed) return into;
      into.push({ t: "error", error: failed, fatal: false });
      return [];
    }
    case "s": {
      // A boundary whose content suspended (or failed, React saying nothing): the boundary, failed with what did.
      const s = c.suspended.find((x) => x.boundary === mark.boundary);
      const lazy = s ? undefined : c.lazies.find((x) => x.boundary === mark.boundary);
      if (c.async) {
        // (An async render waits for what suspends: what React handled itself failed, as it told the stream.)
        const told = toldFor(c, digest);
        const error = told ? toldError(told, lazy ? "lazy" : "component", lazy?.frame ?? null) : swallowed(lazy ? "lazy" : "component", lazy?.frame ?? null);
        into.push({ t: "boundary", parts: [{ t: "error", error, fatal: false }] });
        return [];
      }
      if (!s && !lazy?.done) {
        into.push({ t: "boundary", parts: [{ t: "error", error: swallowed(lazy ? "lazy" : "component", lazy?.frame ?? null), fatal: false }] });
        return [];
      }
      const error = new RenderError(ASYNC_IN_SYNC, s?.name ?? (lazy ? "lazy" : "component"), positionOf(s?.frame ?? lazy?.frame ?? null));
      const part: BoundaryPart = { t: "boundary", parts: [{ t: "error", error, fatal: false }] };
      into.push(part);
      return [];
    }
  }
}
