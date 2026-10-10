/**
 * Whether a reader sees two documents differently, decided from Chromium's
 * readings (read.js) within what the check promises: the words (in order),
 * links and images, each word's size, weight, italics, letter case,
 * underline, color, background and link target, what shows on phones, and
 * where each line sits across the page. Written apart from the check (only
 * the word normalization and the tolerances are shared): it's the check's
 * ground truth. A difference smaller than twice a tolerance is "borderline":
 * not counted either way, so font rendering on another machine can't flip it.
 */
import { MOVED_PX, normalizeWord } from "@unlayer/convert-core";

export type Rgba = [number, number, number, number];
export interface ReadWord {
  w: string;
  preview: boolean;
  visible: boolean;
  size: number;
  weight: number;
  italic: boolean;
  transform: string;
  underline: boolean;
  color: Rgba;
  background: Rgba | "image";
  target: string | null;
  /** Where the word's line sits on screen: its left and right edges (null when it takes no space). */
  line: { left: number; right: number } | null;
}
export interface Reading {
  words: ReadWord[];
  links: string[];
  images: string[];
}

/** The words a reader gets, normalized, with their readings (the preview text counts as words, not as shown). */
function wordsOf(reading: Reading): Array<{ word: string; read: ReadWord }> {
  return reading.words
    .filter((w) => w.visible || w.preview)
    .map((read) => ({ word: normalizeWord(read.w), read }))
    .filter((x) => x.word);
}

const counts = (list: string[]) => list.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
function lost(a: string[], b: string[]): string[] {
  const left = counts(b);
  return a.filter((x) => {
    const n = left.get(x) ?? 0;
    if (n) left.set(x, n - 1);
    return !n;
  });
}

export interface Verdict {
  /** How a reader would see them differently (empty: the same). */
  differs: string[];
  /** Differences too close to a tolerance to count either way. */
  borderline: string[];
}

/** Desktop readings `a`, `b` (700px) and phone readings (375px). */
export function verdict(a: Reading, b: Reading, aPhone: Reading, bPhone: Reading): Verdict {
  const differs: string[] = [];
  const borderline: string[] = [];
  const wa = wordsOf(a);
  const wb = wordsOf(b);
  const textA = wa.map((x) => x.word);
  const textB = wb.map((x) => x.word);
  if (textA.join(" ") !== textB.join(" ")) differs.push(`words: ${diffWords(textA, textB)}`);
  for (const [kind, x, y] of [["links", a.links, b.links], ["images", a.images, b.images]] as const) {
    const missing = lost(x, y);
    const added = [...new Set(y)].filter((v) => !x.includes(v));
    if (missing.length) differs.push(`${kind} lost: ${missing.slice(0, 3).join(", ")}`);
    if (added.length) differs.push(`${kind} added: ${added.slice(0, 3).join(", ")}`);
  }
  const phoneA = wordsOf(aPhone).filter((x) => !x.read.preview).map((x) => x.word);
  const phoneB = wordsOf(bPhone).filter((x) => !x.read.preview).map((x) => x.word);
  if (lost(phoneA, phoneB).length || lost(phoneB, phoneA).length) differs.push(`phone: ${diffWords(phoneA, phoneB)}`);
  if (textA.join(" ") !== textB.join(" ")) return { differs, borderline };

  const note = (definite: boolean, close: boolean, what: string) => (definite ? differs : close ? borderline : undefined)?.push(what);
  const lines: Array<{ word: string; left: number; right: number }> = [];
  for (let i = 0; i < wa.length; i++) {
    const x = wa[i].read;
    const y = wb[i].read;
    const word = wa[i].word;
    if (x.preview !== y.preview) {
      differs.push(`"${word}" is the inbox preview on one side only`);
      continue;
    }
    if (x.preview) continue;
    const ds = Math.abs(x.size - y.size);
    note(ds >= 3, ds > 1, `"${word}" size ${x.size} → ${y.size}`);
    if (x.weight >= 600 !== y.weight >= 600) note(Math.abs(x.weight - y.weight) >= 200, true, `"${word}" weight ${x.weight} → ${y.weight}`);
    if (x.italic !== y.italic) differs.push(`"${word}" italic ${x.italic} → ${y.italic}`);
    if (x.transform !== y.transform) differs.push(`"${word}" text-transform ${x.transform} → ${y.transform}`);
    if (x.underline !== y.underline) differs.push(`"${word}" underline ${x.underline} → ${y.underline}`);
    const dc = colorDistance(x.color, y.color);
    note(dc.channel >= 8 || dc.alpha >= 0.1, dc.channel > 2 || dc.alpha > 0.02, `"${word}" color ${x.color} → ${y.color}`);
    if (x.background !== "image" && y.background !== "image") {
      const db = colorDistance(x.background, y.background);
      note(db.channel >= 8 || db.alpha >= 0.1, db.channel > 2 || db.alpha > 0.02, `"${word}" background ${x.background} → ${y.background}`);
    }
    if (x.target !== y.target) differs.push(`"${word}" link target ${x.target} → ${y.target}`);
    if (x.line && y.line) lines.push({ word, left: y.line.left - x.line.left, right: y.line.right - x.line.right });
  }
  // A line moved when both its edges sit elsewhere (one edge moving is the line wrapping otherwise),
  // after the whole email's own shift (the median).
  if (lines.length) {
    const centers = lines.map((l) => (l.left + l.right) / 2).sort((p, q) => p - q);
    const shift = centers[Math.floor(centers.length / 2)];
    for (const { word, left, right } of lines) {
      const by = Math.min(Math.abs(left - shift), Math.abs(right - shift));
      note(by > 2 * MOVED_PX, by > MOVED_PX, `"${word}" moved ${Math.round((left + right) / 2 - shift)}px`);
    }
  }
  return { differs, borderline };
}

function colorDistance(x: Rgba, y: Rgba): { channel: number; alpha: number } {
  return { channel: Math.max(...[0, 1, 2].map((i) => Math.abs(x[i] - y[i]))), alpha: Math.abs(x[3] - y[3]) };
}

function diffWords(a: string[], b: string[]): string {
  const missing = lost(a, b);
  const added = lost(b, a);
  if (!missing.length && !added.length) return "the same words in another order";
  return [missing.length ? `missing ${missing.slice(0, 5).join(" ")}` : "", added.length ? `added ${added.slice(0, 5).join(" ")}` : ""].filter(Boolean).join("; ");
}
