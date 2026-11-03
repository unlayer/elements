/**
 * A TTF file packed as WOFF and as WOFF2, for tests: a real compressed font file a PDF is given, with no binary
 * fixture in the repo. Each table is kept as it is (WOFF2's null transform, glyf and loca included), compressed with
 * zlib (WOFF) or Brotli (WOFF2).
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

export function toWoff2(ttf: Buffer): Buffer {
  const tables = tablesOf(ttf);
  // Each entry: flags (an arbitrary tag, 63, and the transform: 3 is none for glyf and loca, 0 for the rest), the tag, the length.
  const directory = Buffer.concat(tables.map((table) => Buffer.concat([Buffer.from([(table.tag === "glyf" || table.tag === "loca" ? 3 << 6 : 0) | 63]), Buffer.from(table.tag, "latin1"), base128(table.data.length)])));
  const stream = brotliCompressSync(Buffer.concat(tables.map((table) => table.data)));
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
