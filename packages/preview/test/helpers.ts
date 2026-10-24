import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";
import { run } from "../src/cli";

export const FIXTURE = fileURLToPath(new URL("./fixtures/basic/", import.meta.url));
const TMP = fileURLToPath(new URL("./.tmp/", import.meta.url));

/**
 * A copy of the fixture project the test can change. It's inside this package,
 * so its imports of React and Elements resolve to this package's dependencies.
 */
export async function fixtureCopy(name: string): Promise<{ root: string; emails: string; cleanup(): Promise<void> }> {
  const root = path.join(TMP, `${name}-${process.pid}-${Date.now()}`);
  await mkdir(TMP, { recursive: true });
  await cp(FIXTURE, root, { recursive: true });
  return { root, emails: path.join(root, "emails"), cleanup: () => rm(root, { recursive: true, force: true }) };
}

/** Runs `elements-preview <args>` in-process: what it writes to stdout and stderr, and its exit code. */
export async function cli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  let stdout = "";
  let stderr = "";
  const out = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => ((stdout += String(chunk)), true));
  const err = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => ((stderr += String(chunk)), true));
  const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw Object.assign(new Error("exit"), { exitCode: code ?? 0 });
  }) as never);
  let code: number;
  try {
    await run(args);
    code = Number(process.exitCode ?? 0);
  } catch (error) {
    const exitCode = (error as { exitCode?: number }).exitCode;
    if (exitCode === undefined) throw error;
    code = exitCode;
  } finally {
    out.mockRestore();
    err.mockRestore();
    exit.mockRestore();
    process.exitCode = undefined;
  }
  return { stdout, stderr, code };
}
