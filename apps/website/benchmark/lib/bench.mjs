// Runs a coding agent (Claude Code, headless) on each brief with each kit, and records what it cost to
// reach the shared quality bar (tools/check.mjs): wall time, turns, tokens, dollars, and whether it got there.
//
//   node lib/bench.mjs --kits he,react-email,html --briefs reset,launch --reps 2 --model sonnet --concurrency 3
//
// Each run gets a fresh directory (runs/<stamp>/<kit>__<brief>__<rep>/) and the same prompt. The agent's
// whole transcript is kept there (transcript.jsonl), and one row per run is appended to results/<stamp>.jsonl.
import { spawn } from "node:child_process";
import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getEncoding } from "js-tiktoken";
import { makeRun } from "./make-run.mjs";

const bench = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const allBriefs = (await readdir(join(bench, "briefs"))).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
const kits = arg("kits", "he,react-email,html").split(",");
const briefs = arg("briefs", "all") === "all" ? allBriefs : arg("briefs").split(",");
const reps = Number(arg("reps", "1"));
const model = arg("model", "sonnet");
const concurrency = Number(arg("concurrency", "3"));
const timeoutMin = Number(arg("timeout", "20"));
const stamp = arg("stamp", new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19));
const runsDir = join(bench, "runs", stamp);
const resultsFile = join(bench, "results", `${stamp}.jsonl`);
await mkdir(dirname(resultsFile), { recursive: true });

export const PROMPT = "Build the email described in BRIEF.md, following CLAUDE.md. It's done when `node tools/check.mjs` passes.";

const enc = getEncoding("o200k_base");

function sh(cmd, args, opts) {
  return new Promise((done) => {
    const p = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    const t = opts.timeout ? setTimeout(() => p.kill("SIGTERM"), opts.timeout) : null;
    p.on("close", (code, signal) => (t && clearTimeout(t), done({ code, signal, out, err })));
  });
}

async function one(kit, brief, rep) {
  const dir = await makeRun(kit, brief, rep, runsDir);
  const t0 = Date.now();
  const r = await sh(
    "claude",
    [
      "-p", PROMPT,
      "--model", model,
      "--output-format", "stream-json", "--verbose",
      "--no-session-persistence",
      "--setting-sources", "project",
      "--permission-mode", "acceptEdits",
      "--allowedTools", "Read", "Write", "Edit", "Glob", "Grep", "Bash(node:*)", "Bash(npx tsc:*)", "Bash(ls:*)", "Bash(cat:*)",
      "--disallowedTools", "WebFetch", "WebSearch", "Agent", "Task", "Skill",
    ],
    { cwd: dir, timeout: timeoutMin * 60_000, env: { ...process.env } },
  );
  const wall = Date.now() - t0;
  await writeFile(join(dir, "transcript.jsonl"), r.out);
  if (r.err) await writeFile(join(dir, "stderr.txt"), r.err);

  const events = r.out.split("\n").filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const final = events.findLast((e) => e.type === "result") ?? {};
  // Every Bash command the agent ran, and how the first check went.
  const commands = events.flatMap((e) => (e.type === "assistant" ? e.message.content : []))
    .filter((c) => c.type === "tool_use").map((c) => ({ id: c.id, name: c.name, cmd: c.input?.command ?? "" }));
  const toolResults = new Map(events.flatMap((e) => (e.type === "user" && Array.isArray(e.message?.content) ? e.message.content : []))
    .filter((c) => c.type === "tool_result").map((c) => [c.tool_use_id, c]));
  const checks = commands.filter((c) => c.name === "Bash" && c.cmd.includes("tools/check.mjs"));
  const firstCheck = checks[0] ? toolResults.get(checks[0].id) : null;
  const firstCheckPassed = firstCheck ? !firstCheck.is_error && /All \d+ checks passed/.test(JSON.stringify(firstCheck.content)) : null;

  const verdict = await sh("node", ["tools/check.mjs", "--json"], { cwd: dir, timeout: 120_000 });
  let check = {};
  try { check = JSON.parse(verdict.out.trim().split("\n").pop()); } catch { check = { pass: false, error: verdict.err.slice(0, 400) }; }

  const src = kit === "html" ? join(dir, "out/email.html") : join(dir, "emails/email.tsx");
  const source = existsSync(src) ? await readFile(src, "utf8") : "";
  const u = final.usage ?? {};
  const row = {
    stamp, kit, brief, rep, model,
    pass: !!check.pass, failed: check.results?.filter((x) => !x.ok).map((x) => `${x.name}: ${x.detail}`) ?? [check.error],
    exit: r.code, signal: r.signal, isError: !!final.is_error, result: String(final.result ?? "").slice(0, 300),
    wallMs: wall, durationMs: final.duration_ms, apiMs: final.duration_api_ms, turns: final.num_turns, costUsd: final.total_cost_usd,
    inputTokens: u.input_tokens ?? 0, cacheWriteTokens: u.cache_creation_input_tokens ?? 0, cacheReadTokens: u.cache_read_input_tokens ?? 0, outputTokens: u.output_tokens ?? 0,
    toolCalls: commands.length, checkRuns: checks.length, firstCheckPassed,
    renderRuns: commands.filter((c) => c.name === "Bash" && c.cmd.includes("tools/render.mjs")).length,
    sourceTokens: enc.encode(source).length, sourceChars: source.length,
    modelUsage: final.modelUsage,
  };
  await appendFile(resultsFile, JSON.stringify(row) + "\n");
  console.log(`${row.pass ? "PASS" : "FAIL"} ${kit} ${brief} #${rep}  ${(wall / 1000).toFixed(0)}s  ${row.turns} turns  ${row.outputTokens} out  $${(row.costUsd ?? 0).toFixed(3)}${row.pass ? "" : "  " + row.failed.slice(0, 2).join(" / ")}`);
  return row;
}

// Interleave the kits so a slow patch of the API doesn't land on one of them.
const jobs = [];
for (let rep = 0; rep < reps; rep++) for (const brief of briefs) for (const kit of kits) jobs.push([kit, brief, rep]);
console.log(`${jobs.length} runs, ${concurrency} at a time, model ${model}. Results: ${resultsFile}`);
let next = 0;
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (next < jobs.length) {
    const job = jobs[next++];
    try { await one(...job); } catch (e) { console.error(`ERROR ${job.join(" ")}: ${e.message}`); }
  }
}));
console.log("Done.", resultsFile);
