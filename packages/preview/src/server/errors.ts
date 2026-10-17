/**
 * Errors from loading or rendering a template, as the preview shows them: a
 * message, the file, line and column it points at, and the lines around it.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface TemplateError {
  message: string;
  /** Path relative to the project root. */
  file?: string;
  line?: number;
  column?: number;
  /** The source lines around the error, with a marker under the column. */
  frame?: string;
  stack?: string;
  /** Whether loading the module failed (a syntax or import error) rather than rendering it. */
  phase: "load" | "render";
}

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI, "");
}

function toPath(file: string): string {
  return file.startsWith("file://") ? fileURLToPath(file) : file;
}

/** The lines around `line` (1-based) of `file`, with a `^` under `column` (1-based). */
export function codeFrame(file: string, line: number, column?: number): string | undefined {
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
  const lines = source.split(/\r?\n/);
  const start = Math.max(1, line - 3);
  const end = Math.min(lines.length, line + 2);
  const width = String(end).length;
  const out: string[] = [];
  for (let n = start; n <= end; n++) {
    out.push(`${n === line ? ">" : " "} ${String(n).padStart(width)} | ${lines[n - 1]}`);
    if (n === line && column && column > 0) out.push(`  ${" ".repeat(width)} | ${" ".repeat(column - 1)}^`);
  }
  return out.join("\n");
}

/** The first stack frame in the project's own files (not node_modules, not the preview). */
function projectFrame(stack: string, root: string): { file: string; line: number; column: number } | undefined {
  for (const match of stack.matchAll(/\(?((?:file:\/\/)?\/[^():\s]+|[A-Za-z]:\\[^():]+):(\d+):(\d+)\)?/g)) {
    const file = toPath(match[1]);
    if (!file.startsWith(root + path.sep) || file.includes(`${path.sep}node_modules${path.sep}`)) continue;
    return { file, line: Number(match[2]), column: Number(match[3]) };
  }
  return undefined;
}

/**
 * A syntax error as Vite's compiler (Oxc) writes it: "Transform failed with 1
 * error:", then "[PARSE_ERROR] Expected …" and a drawing of the lines that
 * starts with ╭─[ emails/welcome.tsx:15:37 ] (the path relative to the root).
 */
const OXC_ERROR = /\[([A-Z_]+)\]\s*([^\n]+)\n(\s*╭─\[\s*([^\]]+?):(\d+):(\d+)\s*\][\s\S]*?)(?=\n\s*\n\[[A-Z_]+\]|\n*$)/;

export function formatError(error: unknown, root: string, phase: TemplateError["phase"]): TemplateError {
  const err = (error ?? {}) as { message?: unknown; stack?: unknown; loc?: { file?: string; line?: number; column?: number }; id?: string; frame?: string };
  const message = stripAnsi(String(err.message ?? error)).trim();
  const stack = typeof err.stack === "string" ? stripAnsi(err.stack) : undefined;
  let file: string | undefined;
  let line: number | undefined;
  let column: number | undefined;
  const oxc = OXC_ERROR.exec(message);
  if (oxc) {
    return {
      message: oxc[2].trim(),
      // Oxc writes the path relative to the working directory.
      file: path.relative(root, path.resolve(oxc[4])) || oxc[4],
      line: Number(oxc[5]),
      column: Number(oxc[6]),
      frame: oxc[3].replace(/^\n+|\s+$/g, ""),
      stack,
      phase,
    };
  }
  if (err.loc?.line) {
    file = toPath(err.loc.file ?? err.id ?? "");
    line = err.loc.line;
    // Vite reports 0-based columns for transform errors.
    column = (err.loc.column ?? 0) + 1;
  } else {
    const fromMessage = /(?:^|[\s(])((?:\/|[A-Za-z]:\\)[^\s:()]+\.(?:tsx|jsx|ts|js|mjs)):(\d+):(\d+)/.exec(message);
    // Elements wraps an error a template throws; the original (its cause) has the template's line.
    const causeStack = (err as { cause?: { stack?: unknown } }).cause?.stack;
    const found = fromMessage
      ? { file: fromMessage[1], line: Number(fromMessage[2]), column: Number(fromMessage[3]) }
      : (typeof causeStack === "string" ? projectFrame(stripAnsi(causeStack), root) : undefined) ?? (stack ? projectFrame(stack, root) : undefined);
    if (found) ({ file, line, column } = found);
  }
  const frame = file && line ? (err.frame ? stripAnsi(err.frame) : codeFrame(file, line, column)) : undefined;
  return {
    message,
    file: file ? path.relative(root, file) || file : undefined,
    line,
    column,
    frame,
    stack,
    phase,
  };
}

/**
 * A command that can't run as asked: a folder or template that isn't there, a
 * project without Elements, no browser for screenshots. The commands exit
 * with 2 for these, and 1 for what they found.
 */
export class UsageError extends Error {
  override name = "UsageError";
}
