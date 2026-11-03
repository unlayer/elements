// Renders every corpus template with one side's package (OLD or NEW; the build aliases @unlayer/react-elements).
//
//   node .build/<side>/render.js --side old --out .work/old [--only <substring>] [--modes email,web,document]
//
// For each template: renderToJson once, and for each mode it's meant for, renderToHtml(element, { mode }) and
// renderToPlainText(element, { mode }). Writes .work/<side>/<id>/{design.json,<mode>.html,<mode>.txt} and
// .work/<side>/manifest.json. A template that throws is recorded with its error, never fatal.
import fs from "node:fs";
import path from "node:path";
import React from "react";
import * as Pkg from "@unlayer/react-elements";
import { modules } from "../corpus/index";

const argv = process.argv.slice(2);
const opt = (name: string, fallback?: string) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback);
const SIDE = opt("--side", "?")!;
const OUT = path.resolve(opt("--out", `.work/${SIDE}`)!);
const ONLY = opt("--only", "")!;
const MODES = opt("--modes", "email,web,document")!.split(",").map((s) => s.trim()).filter(Boolean);

const P: any = Pkg;
const ROOT_MODES = new Map<any, string>([
  [P.Email, "email"],
  [P.Page, "web"],
  [P.Document, "document"],
]);
const PACKAGE_VALUES = new Set(Object.values(P));
const isRoot = (el: any) => React.isValidElement(el) && (ROOT_MODES.has(el.type) || el.type === P.Body);

/** A story's element, unwrapped to the design it shows (a template function's root, a design it renders through
 *  renderToHtmlParts, a `tree` prop). */
function unwrap(el: any): any {
  for (let depth = 0; depth < 4 && React.isValidElement(el) && !isRoot(el); depth++) {
    const props: any = el.props;
    if (React.isValidElement(props?.tree)) {
      el = props.tree;
      continue;
    }
    if (typeof el.type === "function" && !PACKAGE_VALUES.has(el.type)) {
      (globalThis as any).__sandboxCaptured = undefined;
      let inner: any;
      try {
        inner = (el.type as any)(props);
      } catch {
        break; // uses hooks, or a class: rendered as is
      }
      const captured = (globalThis as any).__sandboxCaptured;
      if (React.isValidElement(captured)) {
        el = captured;
        continue;
      }
      if (isRoot(inner)) {
        el = inner;
        continue;
      }
    }
    break;
  }
  return el;
}

/** The root to render, and the modes it's meant for. */
function asRoot(el: any): { root: any; modes: string[]; wrapped?: string } {
  if (ROOT_MODES.has(el.type)) return { root: el, modes: [ROOT_MODES.get(el.type)!] };
  if (el.type === P.Body) return { root: el, modes: el.props.mode ? [el.props.mode] : ["email", "web"] };
  if (el.type === P.UnlayerProvider) {
    const mode = el.props.config?.mode;
    return { root: el, modes: mode ? [mode] : ["email", "web"] };
  }
  if (el.type === P.Row) return { root: React.createElement(P.Body, null, el), modes: ["email", "web"], wrapped: "Body" };
  return { root: React.createElement(P.Body, null, React.createElement(P.Row, null, React.createElement(P.Column, null, el))), modes: ["email", "web"], wrapped: "Body > Row > Column" };
}

type Template = { id: string; source: string; module: string; make: () => any };
const templates: Template[] = [];
const skipped: Array<{ id: string; reason: string }> = [];
const moduleErrors: Array<{ module: string; error: string }> = [];
const message = (e: any) => String(e?.message ?? e).split("\n")[0].slice(0, 400);

for (const m of modules) {
  let mod: any;
  try {
    mod = await m.load();
  } catch (e) {
    moduleErrors.push({ module: m.key, error: message(e) });
    continue;
  }
  if (m.source === "demo") {
    for (const t of mod.templates) templates.push({ id: `demo-${t.id}`, source: "demo", module: m.key, make: () => t.component() });
  } else if (m.source === "generated" || m.source === "review") {
    templates.push({ id: `${m.source === "review" ? "rev" : "gen"}-${m.key.split("/").pop()}`, source: m.source, module: m.key, make: () => mod.T() });
  } else {
    const meta = mod.default ?? {};
    for (const [key, story] of Object.entries<any>(mod)) {
      // Named exports that are objects are stories; the examples' exported template functions repeat their Default.
      if (key === "default" || !story || typeof story !== "object") continue;
      const id = (m.source === "components" ? "story-" : "ex-") + m.key.split("/").pop() + "-" + key;
      const args = { ...(meta.args ?? {}), ...(story.args ?? {}) };
      const render = story.render ?? meta.render;
      if (!render && !meta.component) {
        skipped.push({ id, reason: "the story has no render and its module no component" });
        continue;
      }
      const context = { args, name: key, id };
      templates.push({
        id,
        source: m.source,
        module: m.key,
        make: () => {
          if (!render) return React.createElement(meta.component, args);
          try {
            return render(args, context);
          } catch {
            // A render using hooks (CompletePixelParityTest): rendered as a component, as Storybook does.
            return React.createElement(function Story() {
              return render(args, context);
            });
          }
        },
      });
    }
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

/** Runs `fn`, collecting what it warns. */
function quietly<T>(fn: () => T): { value?: T; error?: string; warnings: string[] } {
  const warnings: string[] = [];
  const { warn, error } = console;
  console.warn = (...a: any[]) => warnings.push(a.map(String).join(" ").slice(0, 300));
  console.error = (...a: any[]) => warnings.push(a.map(String).join(" ").slice(0, 300));
  try {
    return { value: fn(), warnings };
  } catch (e) {
    return { error: message(e), warnings };
  } finally {
    console.warn = warn;
    console.error = error;
  }
}

const results: any[] = [];
const started = Date.now();
for (const t of templates) {
  if (ONLY && !t.id.includes(ONLY)) continue;
  const entry: any = { id: t.id, source: t.source, module: t.module, renders: {} };
  results.push(entry);
  const made = quietly(() => asRoot(unwrap(t.make())));
  if (made.error || !React.isValidElement(made.value?.root)) {
    entry.error = made.error ?? "the template made no element";
    continue;
  }
  const { root, modes, wrapped } = made.value!;
  entry.modes = modes;
  if (wrapped) entry.wrapped = wrapped;
  const dir = path.join(OUT, t.id);
  fs.mkdirSync(dir, { recursive: true });
  const json = quietly(() => P.renderToJson(root));
  if (json.error) entry.json = { error: json.error };
  else {
    fs.writeFileSync(path.join(dir, "design.json"), JSON.stringify(json.value, null, 1));
    entry.json = { ok: true };
  }
  for (const mode of modes.filter((m) => MODES.includes(m))) {
    const html = quietly(() => P.renderToHtml(root, { mode }));
    const text = quietly(() => P.renderToPlainText(root, { mode }));
    const r: any = (entry.renders[mode] = {});
    if (html.error) r.htmlError = html.error;
    else fs.writeFileSync(path.join(dir, `${mode}.html`), html.value as string);
    if (text.error) r.textError = text.error;
    else fs.writeFileSync(path.join(dir, `${mode}.txt`), text.value as string);
    const warnings = [...new Set([...html.warnings, ...text.warnings])];
    if (warnings.length) r.warnings = warnings;
  }
}

const pkgJson = JSON.parse(fs.readFileSync(process.env.SANDBOX_PKG_JSON!, "utf8"));
fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify({ side: SIDE, package: { name: pkgJson.name, version: pkgJson.version, dir: path.dirname(process.env.SANDBOX_PKG_JSON!) }, ms: Date.now() - started, moduleErrors, skipped, templates: results }, null, 1)
);
console.log(`${SIDE}: rendered ${results.length} templates in ${Date.now() - started} ms${moduleErrors.length ? `; ${moduleErrors.length} module(s) failed to load` : ""}`);
