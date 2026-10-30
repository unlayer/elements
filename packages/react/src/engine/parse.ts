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
 * prepLazy), so HTML given whole there is in react-dom's output as written, and can name this render's markers. So a
 * marker or placeholder is only one the collection made and react-dom rendered, in a part React kept, read once:
 * anything else that looks like one (another render's, a number out of range, one never rendered) is the markup it is,
 * and one read twice, or one of a part React left out (a <Suspense>'s content where it rendered the fallback, a
 * fallback it didn't render: `kept`), fails the render, by name (FORGED).
 */
import { ASYNC_IN_SYNC, positionOf, RenderError, SWALLOWED, threw, type Frame } from "./errors";
import { MARK, type Collection } from "./collector";
import type { BoundaryPart, ErrorPart, HostPart, Part, RecordPart } from "./output";
import { REACT_18 } from "./react-compat";

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"]);
/** What React writes its own way: a <style>'s and <script>'s text, as given in React 19 (the tag as React names it). */
const RAW = new Set(["script", "style"]);
/** The elements whose content a parser reads to their own end tag (see host.ts's headFormat). */
const TO_END_TAG = new Set(["style", "script", "title", "textarea", "noscript", "noembed", "noframes", "iframe", "xmp"]);

/** React's text escaping, undone where a <Head>'s style or script text is written as given (see host.ts). */
const unescaped = (s: string) => s.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;/g, (e) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#x27;": "'" })[e]!);
const unescape18 = (s: string) => (REACT_18 ? unescaped(s) : s);

export const FORGED = "the template's markup holds a marker of Elements' own collecting render that React didn't write there (an `<unlayer-mark>` or `<!--u…-->` with this render's number, one React wrote elsewhere or left out): it can't be read as the template, so the render fails";

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
        if (c.rawRead.has(n)) throw forged();
        c.rawRead.add(n);
        // HTML given whole: the element's own, as written (nothing in it read for a marker); a <Head>'s title's, what
        // its marker held.
        top().parts.push(...whole(c, n));
        at = lt + raw[0].length;
        continue;
      }
      if (top().inert) {
        // (No comment of the template's is there: its text's `<!--` is escaped, and HTML given whole is a placeholder.
        // React 18.0's stream writes its own between two texts.)
        const own = c.async && html.startsWith("<!-- -->", lt);
        if (!own) text(html.slice(lt, lt + 4));
        at = lt + (own ? 8 : 4);
        continue;
      }
      const end = html.indexOf("-->", lt + 4);
      if (end < 0) {
        // (React writes no comment it doesn't end: one that runs on is in HTML given whole in what a lazy component
        // renders, and the rest of the template's markup isn't a comment.)
        text(html.slice(lt, lt + 4));
        at = lt + 4;
        continue;
      }
      let stop = end + 3;
      // (react-dom's stream writes its own comments, where its Suspense and <Activity> boundaries are and between texts: the
      // template's comments are only in HTML given whole, which isn't here.)
      const own = c.async && /^<!--(?:\$[?!]?|\/\$| |&|\/&)-->$/.test(html.slice(lt, stop));
      if (!own) text(html.slice(lt, stop));
      // (And after a boundary that failed, the <template> it writes with the error's digest: React's, not the template's.)
      else if (html.startsWith("<!--$!-->", lt) && html.startsWith("<template", stop)) {
        const close = html.indexOf("</template>", stop);
        if (close >= 0) stop = close + "</template>".length;
      }
      at = stop;
      continue;
    }
    if (html[lt + 1] === "/") {
      const gt = html.indexOf(">", lt);
      const name = html.slice(lt + 2, gt < 0 ? html.length : gt).trim().toLowerCase();
      // An end tag of what's open (a stray one, in HTML given whole, is text), and inside a <style>'s or <script>'s
      // content only of what's open there.
      let floor = stack.length - 1;
      while (floor > 0 && !stack[floor].floor) floor--;
      let depth = stack.length - 1;
      while (depth > floor && stack[depth].tag !== name) depth--;
      if (depth === floor && !(floor > 0 && stack[floor].tag === name)) text(html.slice(lt, gt + 1));
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
    const mark = !from.inert && name === MARK ? markOpen.exec(tagText) : null;
    if (mark && mark[1] === c.nonce && Number(mark[2]) < c.marks.length && c.rendered.has(Number(mark[2]))) {
      const n = Number(mark[2]);
      if (c.read.has(n)) throw forged();
      c.read.add(n);
      const quiet = c.marks[n].k === "r" && (c.marks[n] as { quiet?: boolean }).quiet;
      const held = c.marks[n].k === "t" ? (c.marks[n] as { unescape: boolean; ends: readonly string[] }) : undefined;
      stack.push({ tag: MARK, parts: markPart(c, n, from.parts), head: from.head || !!quiet, foreign: from.foreign, ends: held ? held.ends : quiet ? [] : from.ends, unescape: held ? held.unescape : from.unescape });
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
      // Its text, whole, to its end tag as a browser reads it (`</script` and then a space, `/` or `>`): never read for
      // markers, and nothing in it (a `<!--`, an end tag) closes anything. HTML given whole is the collection's (its
      // placeholder all there is). A <Head>'s is written as given (output.ts writes it with rawText), but under an <svg>
      // or <math>, where it's escaped as any; React 18 escapes the text it writes there, which is undone.
      const raw = !!from.head && !foreign;
      if (raw) Object.assign(host, { raw: true, ends: from.ends ?? [] });
      const endTag = new RegExp(`</${lower}(?=[\\s/>])`, "gi");
      endTag.lastIndex = at;
      const found = endTag.exec(html);
      const stop = found ? found.index : html.length;
      const content = html.slice(at, stop);
      const only = placeholder.exec(content);
      const n = only && only[0].length === content.length ? Number(only[1]) : -1;
      if (given(c, n, true)) {
        if (c.rawRead.has(n)) throw forged();
        c.rawRead.add(n);
        host.parts.push(...whole(c, n));
      } else if (REACT_18) {
        stack.push({ tag: lower, parts: host.parts, host, head: from.head, foreign, ends: from.ends, raw: raw || from.raw, inert: true, floor: true });
        continue;
      } else if (content) host.parts.push(content);
      const endGt = found ? html.indexOf(">", stop) : html.length - 1;
      host.close = html.slice(stop, endGt + 1);
      at = endGt + 1;
      continue;
    }
    const ends = from.head && !foreign && TO_END_TAG.has(lower) ? [...(from.ends ?? []), lower] : from.ends;
    stack.push({ tag: lower, parts: host.parts, host, head: from.head, foreign, ends, raw: from.raw, inert: from.inert, unescape: from.unescape });
  }
  kept(c);
  return root;
}

/**
 * Fails the render where a marker or placeholder read is of a part React left out: what's in a <Suspense> (or a
 * boundary's own) whose fallback's marker is in what React wrote, or a fallback whose marker isn't. React wrote nothing
 * in that part (it may have rendered it), so it's another's markup naming it (what a lazy component renders, which
 * isn't prepared: see collector.ts's prepLazy).
 */
function kept(c: Collection): void {
  if (!c.scopes.length) return;
  const out = (scope: number | undefined): boolean => {
    for (let s = scope ?? -1, depth = 0; s >= 0 && depth <= c.scopes.length; s = c.scopes[s].parent, depth++) if (c.read.has(c.scopes[s].marker) !== !!c.scopes[s].fallback) return true;
    return false;
  };
  for (const n of c.read) if (out(c.marks[n].scope)) throw forged();
  for (const n of c.rawRead) if (out(c.raw[n].scope)) throw forged();
}

const forged = () => new RenderError(FORGED, "template", "");

/** What HTML given whole `n` is: as written, or what the marker of a <Head>'s text it's from held (read before it). */
const whole = (c: Collection, n: number): Part[] => {
  const from = c.raw[n].from;
  return from === undefined ? [c.raw[n].html] : (c.texts.get(from) ?? []);
};

/**
 * What failed inside a <Suspense> whose fallback React rendered (its marker `n`, at `frame`), or undefined where
 * what's in it suspended (a synchronous render renders the fallback, as React's server renderer does). An async render
 * waits for what suspends: there, a fallback is what failed, as React told its stream (in order). A synchronous one
 * keeps no error React handled there: what's said is where, and what to do.
 */
function fallbackFailed(c: Collection, n: number, frame: Frame): RenderError | undefined {
  const lazy = c.lazies.find((x) => x.suspenseAt === n);
  if (c.async) {
    const told = c.reactErrors.shift();
    if (!told) return swallowed(lazy ? "lazy" : "Suspense", lazy?.frame ?? frame);
    return new RenderError(threw(told.error), told.name ?? (lazy ? "lazy" : "Suspense"), positionOf(lazy?.frame ?? frame), told.error);
  }
  if (c.suspended.some((x) => x.suspenseAt === n) || c.lazies.some((x) => x.suspenseAt === n && x.done)) return undefined;
  return swallowed(lazy ? "lazy" : "Suspense", lazy?.frame ?? frame);
}

const swallowed = (name: string, frame: Frame | null) => new RenderError(SWALLOWED, name, positionOf(frame));

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
    case "t": {
      // What a <Head>'s style, script or title holds: kept for the element's HTML given whole (see whole), not here.
      const parts: Part[] = [];
      c.texts.set(n, parts);
      return parts;
    }
    case "fb": {
      // A <Suspense>'s fallback React rendered: what's in it suspended (a synchronous render), or failed.
      const failed = fallbackFailed(c, n, mark.frame);
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
        const told = c.reactErrors.shift();
        const error = told ? new RenderError(threw(told.error), told.name ?? (lazy ? "lazy" : "component"), positionOf(lazy?.frame ?? null), told.error) : swallowed(lazy ? "lazy" : "component", lazy?.frame ?? null);
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
