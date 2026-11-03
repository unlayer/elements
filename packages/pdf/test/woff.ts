/**
 * A TTF file packed as WOFF and as WOFF2, for tests: a real compressed font file a PDF is given, with no binary
 * fixture in the repo. WOFF keeps each table as it is, compressed with zlib. WOFF2 is written as Google's encoder and
 * most WOFF2 files (Google Fonts') write it: its glyf and loca tables transformed (the glyphs' outlines split into
 * streams, loca left to the decoder to rebuild), every table compressed with Brotli as one stream.
 */
import { brotliCompressSync, deflateSync } from "node:zlib";

interface Table {
  tag: string;
  checksum: number;
  data: Buffer;
}

/** The sfnt's tables, by tag, as the WOFF formats order them. */
function tablesOf(ttf: Buffer): Table[] {
  return Array.from({ length: ttf.readUInt16BE(4) }, (_, i) => {
    const entry = 12 + i * 16;
    const offset = ttf.readUInt32BE(entry + 8);
    return { tag: ttf.toString("latin1", entry, entry + 4), checksum: ttf.readUInt32BE(entry + 4), data: ttf.subarray(offset, offset + ttf.readUInt32BE(entry + 12)) };
  }).sort((a, b) => (a.tag < b.tag ? -1 : 1));
}

const padded = (length: number) => (length + 3) & ~3;
const sfntSize = (tables: Table[]) => 12 + tables.length * 16 + tables.reduce((sum, table) => sum + padded(table.data.length), 0);

export function toWoff(ttf: Buffer): Buffer {
  const tables = tablesOf(ttf).map((table) => {
    const packed = deflateSync(table.data);
    return { ...table, packed: packed.length < table.data.length ? packed : table.data };
  });
  const directory = Buffer.alloc(tables.length * 20);
  const data: Buffer[] = [];
  let offset = 44 + directory.length;
  tables.forEach((table, i) => {
    directory.write(table.tag, i * 20, "latin1");
    directory.writeUInt32BE(offset, i * 20 + 4);
    directory.writeUInt32BE(table.packed.length, i * 20 + 8);
    directory.writeUInt32BE(table.data.length, i * 20 + 12);
    directory.writeUInt32BE(table.checksum, i * 20 + 16);
    const block = Buffer.alloc(padded(table.packed.length));
    table.packed.copy(block);
    data.push(block);
    offset += block.length;
  });
  const header = Buffer.alloc(44);
  header.write("wOFF", 0, "latin1");
  header.writeUInt32BE(ttf.readUInt32BE(0), 4);
  header.writeUInt32BE(offset, 8);
  header.writeUInt16BE(tables.length, 12);
  header.writeUInt32BE(sfntSize(tables), 16);
  header.writeUInt16BE(1, 20);
  return Buffer.concat([header, directory, ...data]);
}

/** A number as WOFF2's UIntBase128: seven bits a byte, the high bit set on all but the last. */
function base128(value: number): Buffer {
  const bytes: number[] = [];
  do {
    bytes.unshift(value & 0x7f);
    value >>>= 7;
  } while (value);
  return Buffer.from(bytes.map((byte, i) => (i < bytes.length - 1 ? byte | 0x80 : byte)));
}

/** A number as WOFF2's 255UInt16. */
function u255(value: number): number[] {
  if (value < 253) return [value];
  if (value < 506) return [255, value - 253];
  if (value < 762) return [254, value - 506];
  return [253, value >> 8, value & 0xff];
}

const int16 = (value: number) => [(value >> 8) & 0xff, value & 0xff];

/** A point's move from the last as WOFF2's triplet: its flag (off the curve, the form, the signs) and its bytes. */
function triplet(dx: number, dy: number, on: boolean): [number, number[]] {
  const x = Math.abs(dx);
  const y = Math.abs(dy);
  const signs = (dx >= 0 ? 1 : 0) | (dy >= 0 ? 2 : 0);
  const off = on ? 0 : 0x80;
  if (dx === 0 && y < 1280) return [off | ((y >> 8) << 1) | (dy >= 0 ? 1 : 0), [y & 0xff]];
  if (dy === 0 && x < 1280) return [off | (10 + ((x >> 8) << 1) + (dx >= 0 ? 1 : 0)), [x & 0xff]];
  if (x >= 1 && x <= 64 && y >= 1 && y <= 64) return [off | (20 + ((x - 1) & 0x30) + (((y - 1) & 0x30) >> 2) + signs), [(((x - 1) & 0x0f) << 4) | ((y - 1) & 0x0f)]];
  if (x >= 1 && x <= 768 && y >= 1 && y <= 768) return [off | (84 + 12 * ((x - 1) >> 8) + 4 * ((y - 1) >> 8) + signs), [(x - 1) & 0xff, (y - 1) & 0xff]];
  if (x < 4096 && y < 4096) return [off | (120 + signs), [x >> 4, ((x & 0x0f) << 4) | (y >> 8), y & 0xff]];
  return [off | (124 + signs), [...int16(x), ...int16(y)]];
}

/** The glyf table transformed (WOFF2 5.1): each glyph's contours, points, flags, moves, components and bounds in streams. */
function transformGlyf(glyf: Buffer, loca: Buffer, numGlyphs: number, longOffsets: boolean): Buffer {
  const offset = (i: number) => (longOffsets ? loca.readUInt32BE(i * 4) : loca.readUInt16BE(i * 2) * 2);
  const streams = { contours: [] as number[], points: [] as number[], flags: [] as number[], glyphs: [] as number[], composites: [] as number[], instructions: [] as number[] };
  const bitmap = Buffer.alloc(((numGlyphs + 31) >> 5) << 2);
  const boxes: number[] = [];
  for (let i = 0; i < numGlyphs; i++) {
    const glyph = glyf.subarray(offset(i), offset(i + 1));
    if (!glyph.length) {
      streams.contours.push(...int16(0));
      continue;
    }
    const contours = glyph.readInt16BE(0);
    streams.contours.push(...int16(contours));
    // Every glyph's bounds given, not worked out from its points (an encoder may).
    bitmap[i >> 3] |= 0x80 >> (i & 7);
    boxes.push(...glyph.subarray(2, 10));
    let at = 10;
    if (contours > 0) {
      const ends = Array.from({ length: contours }, (_, c) => glyph.readUInt16BE(10 + c * 2));
      at = 10 + contours * 2;
      const instructions = glyph.subarray(at + 2, at + 2 + glyph.readUInt16BE(at));
      at += 2 + instructions.length;
      const count = ends[contours - 1] + 1;
      const flags: number[] = [];
      while (flags.length < count) {
        const flag = glyph[at++];
        flags.push(flag);
        if (flag & 0x08) for (let repeat = glyph[at++]; repeat > 0; repeat--) flags.push(flag);
      }
      const coordinates = (short: number, same: number) =>
        flags.map((flag) => {
          if (flag & short) return glyph[at++] * (flag & same ? 1 : -1);
          if (flag & same) return 0;
          const value = glyph.readInt16BE(at);
          at += 2;
          return value;
        });
      const xs = coordinates(0x02, 0x10);
      const ys = coordinates(0x04, 0x20);
      ends.forEach((end, c) => streams.points.push(...u255(end - (c ? ends[c - 1] : -1))));
      flags.forEach((flag, p) => {
        const [code, bytes] = triplet(xs[p], ys[p], (flag & 0x01) !== 0);
        streams.flags.push(code);
        streams.glyphs.push(...bytes);
      });
      streams.glyphs.push(...u255(instructions.length));
      streams.instructions.push(...instructions);
    } else {
      // A composite: its components as they are; its instructions, if any, in their stream.
      let flags = 0x20;
      while (flags & 0x20) {
        flags = glyph.readUInt16BE(at);
        at += 4 + (flags & 0x01 ? 4 : 2) + (flags & 0x08 ? 2 : flags & 0x40 ? 4 : flags & 0x80 ? 8 : 0);
      }
      streams.composites.push(...glyph.subarray(10, at));
      if (flags & 0x100) {
        const instructions = glyph.subarray(at + 2, at + 2 + glyph.readUInt16BE(at));
        streams.glyphs.push(...u255(instructions.length));
        streams.instructions.push(...instructions);
      }
    }
  }
  const parts = [streams.contours, streams.points, streams.flags, streams.glyphs, streams.composites, [...bitmap, ...boxes], streams.instructions].map((part) => Buffer.from(part));
  const header = Buffer.alloc(36);
  header.writeUInt16BE(numGlyphs, 4);
  header.writeUInt16BE(longOffsets ? 1 : 0, 6);
  parts.forEach((part, i) => header.writeUInt32BE(part.length, 8 + i * 4));
  return Buffer.concat([header, ...parts]);
}

export function toWoff2(ttf: Buffer): Buffer {
  const tables = tablesOf(ttf);
  const table = (tag: string) => tables.find((t) => t.tag === tag)!.data;
  const glyf = transformGlyf(table("glyf"), table("loca"), table("maxp").readUInt16BE(4), table("head").readInt16BE(50) === 1);
  // loca follows glyf, as the format asks of the two transformed.
  const ordered = tables.filter((t) => t.tag !== "loca").flatMap((t) => (t.tag === "glyf" ? [t, tables.find((l) => l.tag === "loca")!] : [t]));
  // Each entry: flags (an arbitrary tag, 63, and the transform: 0 is glyf's and loca's, and none for the rest), the
  // tag, the length, and a transformed table's length.
  const stored = (t: Table) => (t.tag === "glyf" ? glyf : t.tag === "loca" ? Buffer.alloc(0) : t.data);
  const directory = Buffer.concat(
    ordered.map((t) => {
      const transformed = t.tag === "glyf" || t.tag === "loca";
      return Buffer.concat([Buffer.from([63]), Buffer.from(t.tag, "latin1"), base128(t.data.length), transformed ? base128(stored(t).length) : Buffer.alloc(0)]);
    })
  );
  const stream = brotliCompressSync(Buffer.concat(ordered.map(stored)));
  const length = 48 + directory.length + stream.length;
  const header = Buffer.alloc(48);
  header.write("wOF2", 0, "latin1");
  header.writeUInt32BE(ttf.readUInt32BE(0), 4);
  header.writeUInt32BE(padded(length), 8);
  header.writeUInt16BE(tables.length, 12);
  header.writeUInt32BE(sfntSize(tables), 16);
  header.writeUInt32BE(stream.length, 20);
  header.writeUInt16BE(1, 24);
  return Buffer.concat([header, directory, stream, Buffer.alloc(padded(length) - length)]);
}
