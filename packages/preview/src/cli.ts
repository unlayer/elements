/**
 * `elements-preview dev`, `export`, `build`, `start`, `check`, `screenshot`
 * and `render`. The Unlayer CLI runs these as `unlayer elements dev`,
 * `unlayer elements check` and so on (`render` for `unlayer elements push`).
 */

import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildPreview, startStaticServer } from "./server/build.js";
import { checkTemplates, formatCheckReport } from "./server/check.js";
import { startDevServer } from "./server/dev-server.js";
import { UsageError, type TemplateError } from "./server/errors.js";
import { exportTemplates } from "./server/export.js";
import { loadVitePlugins, rendersStillRunning } from "./server/loader.js";
import { shown } from "./server/paths.js";
import { renderTemplates } from "./server/render.js";
import { screenshotVariants, takeScreenshots } from "./server/screenshot.js";

const VITE_PLUGINS_HELP = `  --vite-plugins <path> A module whose default export is an array of Vite plugins
                        (or a function returning one) to load templates with`;

const RENDER_TIMEOUT_HELP = `  --render-timeout <s>  Seconds a template may take to render before it fails
                        (default: 30)`;

const PROJECT_ID_HELP = `  --project-id <id>     The Unlayer project the Editor view opens designs in
                        (default: UNLAYER_PROJECT_ID, or none)`;

/** Each command's own help: `elements-preview help <command>` or `elements-preview <command> --help`. */
const COMMAND_HELP: Record<string, string> = {
  dev: `Usage: elements-preview dev [options]

Preview the templates in your browser, updated as you edit them.

Options:
  --dir <path>          The templates folder (default: emails)
  --port <number>       The port (default: 3000, or the next free one)
  --open                Open the preview in your browser
${PROJECT_ID_HELP}
${RENDER_TIMEOUT_HELP}
${VITE_PLUGINS_HELP}
`,
  export: `Usage: elements-preview export [options]

Render every template, with its PreviewProps, to an HTML (or plain text) file.

Options:
  --dir <path>          The templates folder (default: emails)
  --outDir <path>       Where to write the files (default: out)
  --pretty              Format the HTML for reading
  --plainText           Write plain text instead of HTML
  --design              Also write each template's design JSON (<name>.design.json, opens in the Unlayer builder)
  --extension <ext>     The file extension (default: html, or txt with --plainText)
${RENDER_TIMEOUT_HELP}
${VITE_PLUGINS_HELP}
`,
  build: `Usage: elements-preview build [options]

Build the preview as static files to share or host anywhere. Building again
replaces the previous build's files and keeps any others; a folder with files
that aren't a build is refused (exit code 2).

Options:
  --dir <path>          The templates folder (default: emails)
  --outDir <path>       Where to write the build (default: .elements-preview)
${PROJECT_ID_HELP}
${RENDER_TIMEOUT_HELP}
${VITE_PLUGINS_HELP}
`,
  start: `Usage: elements-preview start [options]

Serve a build on localhost.

Options:
  --outDir <path>       The build to serve (default: .elements-preview)
  --port <number>       The port (default: 3000, or the next free one)
  --open                Open it in your browser
`,
  check: `Usage: elements-preview check [templates...] [options]

Render templates and check them as the preview's Checks do: render errors,
Elements and React warnings, the design JSON and plain text, email client
compatibility, links and images, and Gmail's clipping size. Errors are to fix,
warnings to check. With no templates, it checks every one.

Name templates by their path in the templates folder (welcome.tsx) or from
here (emails/welcome.tsx), or a folder of them.

Options:
  --dir <path>          The templates folder (default: emails)
  --json                Print the report as JSON (its shape is in the README)
  --strict              Fail on what's to check too, not only on what's to fix
  --offline             Don't request the links and images; check the HTML only
${RENDER_TIMEOUT_HELP}
${VITE_PLUGINS_HELP}

Exit codes: 0 nothing to fix; 1 something to fix (with --strict, or to check);
2 the check couldn't run (an option, folder or template that isn't right, a
folder with no templates, Elements not installed); with --json, stderr then
has {"error": "..."}.
`,
  screenshot: `Usage: elements-preview screenshot <templates...> [options]

Save full-length PNGs of templates rendered with their PreviewProps, to
<out>/<template path>.<variant>.png, with Chrome, Chromium, Edge or Brave
(one already installed: nothing is downloaded).

Name templates by their path in the templates folder (welcome.tsx) or from
here (emails/welcome.tsx), or a folder of them (. for all).

Options:
  --dir <path>          The templates folder (default: emails)
  --out <path>          Where to write the PNGs (default: screenshots)
  --phone               Also at phone width (375 px)
  --dark                Also in dark mode, as the preview shows it (every color flipped)
  --all                 Desktop, phone and dark
  --width <px>          The desktop width (default: 680; a Document: its page width)
  --browser <path>      The browser (default: CHROME_PATH, or the first one found)
  --json                Print the result as JSON
${RENDER_TIMEOUT_HELP}
${VITE_PLUGINS_HELP}

Exit codes: 0 every screenshot taken; 1 a template failed to render or shoot;
2 it couldn't run (an option, folder or template that isn't right, no browser,
two templates whose screenshots would have the same name).
`,
  render: `Usage: elements-preview render <templates...> [options]

Render templates with their PreviewProps and print what a program needs to use
them elsewhere: with --json, one JSON object per template, a line each:
{ path, file, ok, mode, html, design, warnings }, with designError when there's
no design JSON, error when it doesn't render, and check with --check. Without
--json, it prints one template's HTML.

Name templates by their path in the templates folder (welcome.tsx) or from
here (emails/welcome.tsx), or a folder of them (. for all).

Options:
  --dir <path>          The templates folder (default: emails)
  --json                Print each template as a line of JSON
  --check               Also run check's checks: check { ok, toFix, toCheck, notes }
  --offline             With --check, don't request the links and images
${RENDER_TIMEOUT_HELP}
${VITE_PLUGINS_HELP}

Exit codes: 0 every template rendered (with --check, nothing to fix); 1 one
didn't (or has something to fix); 2 it couldn't run (an option, folder or
template that isn't right, Elements not installed); with --json, stderr then
has {"error": "..."}.
`,
};

const HELP = `Usage: elements-preview <command> [options]

Commands:
  dev         Preview the templates in your browser, updated as you edit them
  export      Render every template to an HTML (or plain text) file
  build       Build the preview as static files to share or host
  start       Serve a build on localhost
  check       Check templates as the preview's Checks do (--json for agents and CI)
  screenshot  Save PNG screenshots of templates: desktop, phone, dark mode
  render      Render templates to their HTML and design JSON (--json for programs)
  help        Show a command's options: elements-preview help <command>

  -h, --help            Show this help (with a command: that command's help)
  -v, --version         Show the version
`;

function version(): string {
  return JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
}

function openBrowser(url: string): void {
  const [command, args] =
    process.platform === "darwin" ? ["open", [url]] : process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  const child = spawn(command, args as string[], { stdio: "ignore", detached: true });
  child.on("error", () => undefined);
  child.unref();
}

/** The command the user typed to get here: the Unlayer CLI runs this one as `unlayer elements`. */
const COMMAND = process.env.ELEMENTS_PREVIEW_COMMAND || "elements-preview";

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

/**
 * Ends `check` or `screenshot` when it can't run (a UsageError, or anything
 * else that stops it before its report) with 2, so 1 always means a report
 * that found something. With --json the message is JSON on stderr, as the
 * Unlayer CLI writes its errors.
 */
function failCommand(error: unknown, json: boolean | undefined): never {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(json ? `${JSON.stringify({ error: message })}\n` : `${message}\n`);
  process.exit(2);
}

/**
 * Ends `export` or `build` when it can't start: with 2 for what it refuses
 * to do (a UsageError: two templates writing the same file, a folder that
 * isn't a build), as the other commands, and 1 for anything else.
 */
function failSetup(error: unknown): never {
  if (error instanceof UsageError) failCommand(error, false);
  fail((error as Error).message);
}

/**
 * Ends a one-off command whose output is written while a template that timed
 * out is still rendering: it may wait on a connection or a timer that would
 * keep the process running long after the command is done.
 */
async function endIfStillRendering(): Promise<void> {
  if (!rendersStillRunning()) return;
  for (const stream of [process.stdout, process.stderr]) if (stream.writableLength > 0) await once(stream, "drain");
  process.exit(process.exitCode);
}

function useColor(): boolean {
  return Boolean(process.stdout.isTTY) && !process.env.NO_COLOR && process.env.TERM !== "dumb";
}

/** A render error for JSON: what it says and where, without the stack. */
function errorJson({ message, file, line, column, frame }: TemplateError) {
  return { message, file, line, column, frame };
}

function errorLine(error: TemplateError): string {
  const where = error.file ? ` (${error.file}${error.line ? `:${error.line}:${error.column ?? 0}` : ""})` : "";
  return `${error.message.split("\n")[0]}${where}`;
}

/** The Unlayer project the Editor view opens designs in: --project-id, or UNLAYER_PROJECT_ID; none by default. */
function projectIdFrom(option: string | undefined): number | undefined {
  const [value, name] = option !== undefined ? [option, "--project-id"] : [process.env.UNLAYER_PROJECT_ID, "UNLAYER_PROJECT_ID"];
  if (value === undefined || value.trim() === "") return undefined;
  const id = Number(value.trim());
  if (!Number.isSafeInteger(id) || id < 1) fail(`${name} must be an Unlayer project id (a number), not ${value}`);
  return id;
}

export async function run(argv: string[]): Promise<void> {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        dir: { type: "string", default: "emails" },
        port: { type: "string" },
        open: { type: "boolean", default: false },
        outDir: { type: "string" },
        "vite-plugins": { type: "string" },
        "project-id": { type: "string" },
        "render-timeout": { type: "string" },
        pretty: { type: "boolean", default: false },
        plainText: { type: "boolean", default: false },
        design: { type: "boolean", default: false },
        extension: { type: "string" },
        json: { type: "boolean", default: false },
        check: { type: "boolean", default: false },
        strict: { type: "boolean", default: false },
        offline: { type: "boolean", default: false },
        out: { type: "string" },
        phone: { type: "boolean", default: false },
        dark: { type: "boolean", default: false },
        all: { type: "boolean", default: false },
        width: { type: "string" },
        browser: { type: "string" },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
    });
  } catch (error) {
    // An option that isn't one: a usage error.
    const message = (error as Error).message;
    process.stderr.write(argv.includes("--json") ? `${JSON.stringify({ error: message })}\n` : `${message}\n\n${HELP}`);
    process.exit(2);
  }
  const { values, positionals } = parsed;
  if (values.version) return void process.stdout.write(`${version()}\n`);
  const command = positionals[0];
  if (command === "help") {
    const topic = positionals[1];
    if (topic && !COMMAND_HELP[topic]) fail(`No command ${topic}.\n\n${HELP}`);
    return void process.stdout.write(topic ? COMMAND_HELP[topic] : HELP);
  }
  if (values.help || !command) return void process.stdout.write((command && COMMAND_HELP[command]) || HELP);

  const port = values.port === undefined ? undefined : Number(values.port);
  if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) fail(`--port must be a port number, not ${values.port}`);
  const projectId = command === "dev" || command === "build" ? projectIdFrom(values["project-id"]) : undefined;
  const oneOff = command === "check" || command === "screenshot" || command === "render";
  let renderTimeoutMs: number | undefined;
  if (values["render-timeout"] !== undefined) {
    const seconds = Number(values["render-timeout"]);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      const error = new UsageError(`--render-timeout must be a number of seconds, not ${values["render-timeout"]}`);
      if (oneOff) failCommand(error, values.json);
      failSetup(error);
    }
    // setTimeout's longest delay.
    renderTimeoutMs = Math.min(seconds * 1000, 2 ** 31 - 1);
  }
  let plugins: unknown[] | undefined;
  if (values["vite-plugins"]) {
    try {
      plugins = await loadVitePlugins(values["vite-plugins"]);
    } catch (error) {
      const message = `Couldn't load the Vite plugins in ${values["vite-plugins"]}: ${(error as Error).message}`;
      if (oneOff) failCommand(message, values.json);
      fail(message);
    }
  }

  if (command === "check") {
    let report;
    try {
      report = await checkTemplates({ dir: values.dir, templates: positionals.slice(1), network: !values.offline, strict: values.strict, plugins, renderTimeoutMs });
    } catch (error) {
      failCommand(error, values.json);
    }
    process.stdout.write(values.json ? `${JSON.stringify(report, null, 2)}\n` : formatCheckReport(report, { color: useColor(), dir: shown(path.resolve(values.dir)) }));
    process.exitCode = report.ok ? 0 : 1;
    return endIfStillRendering();
  }

  if (command === "render") {
    const templates = positionals.slice(1);
    let result;
    try {
      if (!templates.length) throw new UsageError("Name the templates to render (. for all): elements-preview render welcome.tsx --json");
      result = await renderTemplates({
        dir: values.dir,
        templates,
        check: values.check,
        network: !values.offline,
        plugins,
        renderTimeoutMs,
        // With --json each template is printed as soon as it's done.
        onTemplate: values.json ? (template) => process.stdout.write(`${JSON.stringify(template)}\n`) : undefined,
      });
      if (!values.json && result.templates.length !== 1) {
        throw new UsageError(`${templates.join(" ")} names ${result.templates.length} templates. Name one to print its HTML, or pass --json.`);
      }
    } catch (error) {
      failCommand(error, values.json);
    }
    if (!values.json) {
      const [template] = result.templates;
      if (template.html !== null) process.stdout.write(template.html);
      if (template.error) process.stderr.write(`  ✗ ${template.path}: ${errorLine({ ...template.error, phase: "render" })}\n`);
      for (const finding of template.check?.toFix ?? []) process.stderr.write(`  ✗ ${template.path}: ${finding.message.split("\n")[0]}\n`);
    }
    process.exitCode = result.failed ? 1 : 0;
    return endIfStillRendering();
  }

  if (command === "screenshot") {
    const width = values.width === undefined ? undefined : Number(values.width);
    if (width !== undefined && (!Number.isInteger(width) || width < 200 || width > 4000)) {
      failCommand(new UsageError(`--width must be a width in pixels between 200 and 4000, not ${values.width}`), values.json);
    }
    let result;
    try {
      result = await takeScreenshots({
        dir: values.dir,
        templates: positionals.slice(1),
        outDir: values.out,
        variants: screenshotVariants(values),
        width,
        browser: values.browser,
        plugins,
        renderTimeoutMs,
        onScreenshot: values.json ? undefined : (_, screenshot) => process.stdout.write(`${screenshot.file}\n`),
      });
    } catch (error) {
      failCommand(error, values.json);
    }
    if (values.json) {
      const templates = result.templates.map(({ error, ...template }) => ({ ...template, ...(error ? { error: errorJson(error) } : {}) }));
      process.stdout.write(`${JSON.stringify({ ok: result.failed === 0, browser: result.browser.path, outDir: shown(result.outDir), templates }, null, 2)}\n`);
    } else {
      for (const template of result.templates) {
        if (template.error) process.stderr.write(`  ✗ ${template.path}: ${errorLine(template.error)}\n`);
        for (const warning of template.warnings) process.stderr.write(`  ! ${template.path}: ${warning}\n`);
      }
    }
    process.exitCode = result.failed ? 1 : 0;
    return endIfStillRendering();
  }

  if (command === "dev") {
    let server;
    try {
      server = await startDevServer({ dir: values.dir, port, strictPort: port !== undefined, plugins, projectId, renderTimeoutMs });
    } catch (error) {
      fail((error as Error).message);
    }
    const { project } = server;
    process.stdout.write(
      [
        "",
        `  Elements preview  ${server.url}`,
        "",
        `  Templates  ${shown(path.resolve(values.dir))}`,
        `  Elements   ${project.elementsVersion ?? "not installed"}    React ${project.reactVersion ?? "not installed"}`,
        ...project.warnings.map((w) => `\n  ! ${w}`),
        "",
        "",
      ].join("\n")
    );
    if (values.open) openBrowser(server.url);
    const stop = async () => {
      await server.close();
      process.exit(0);
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    return;
  }

  if (command === "export") {
    let result;
    try {
      result = await exportTemplates({
        dir: values.dir,
        outDir: values.outDir ?? "out",
        plugins,
        renderTimeoutMs,
        pretty: values.pretty,
        plainText: values.plainText,
        design: values.design,
        extension: values.extension,
      });
    } catch (error) {
      failSetup(error);
    }
    for (const template of result.templates) {
      if (template.error) {
        const where = template.error.file ? ` (${template.error.file}${template.error.line ? `:${template.error.line}:${template.error.column ?? 0}` : ""})` : "";
        process.stderr.write(`  ✗ ${template.template}: ${template.error.message.split("\n")[0]}${where}\n`);
      } else {
        process.stdout.write(`  ✓ ${template.template} → ${template.files.join(", ")}\n`);
      }
      for (const warning of template.warnings) process.stdout.write(`    ! ${warning.split("\n")[0]}\n`);
    }
    const done = result.templates.length - result.failed;
    process.stdout.write(`\n${done} of ${result.templates.length} templates exported to ${shown(result.outDir)}\n`);
    if (result.templates.length === 0) process.stdout.write(`No templates found in ${values.dir}. Templates are .tsx, .jsx or .js files with an export default.\n`);
    if (result.failed) process.exitCode = 1;
    return endIfStillRendering();
  }

  if (command === "build") {
    let result;
    try {
      result = await buildPreview({ dir: values.dir, outDir: values.outDir, plugins, projectId, renderTimeoutMs });
    } catch (error) {
      failSetup(error);
    }
    for (const { template, error } of result.failed) {
      process.stderr.write(`  ✗ ${template}: ${error.message.split("\n")[0]}${error.file ? ` (${error.file}${error.line ? `:${error.line}` : ""})` : ""}\n`);
    }
    const where = shown(result.outDir);
    process.stdout.write(
      `\n${result.templates} templates built to ${where}${result.failed.length ? `, ${result.failed.length} with errors (shown in the preview)` : ""}.\n` +
        `Host the folder on any static host, or run: ${COMMAND} start${values.outDir && values.outDir !== ".elements-preview" ? ` --outDir ${where}` : ""}\n`
    );
    return endIfStillRendering();
  }

  if (command === "start") {
    let server;
    try {
      server = await startStaticServer({ outDir: values.outDir, port, strictPort: port !== undefined });
    } catch (error) {
      fail((error as Error).message);
    }
    process.stdout.write(`\n  Elements preview (build)  ${server.url}\n\n`);
    if (values.open) openBrowser(server.url);
    const stop = async () => {
      await server.close();
      process.exit(0);
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    return;
  }

  fail(`Unknown command: ${command}\n\n${HELP}`);
}
