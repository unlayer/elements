/**
 * `loadTailwind(config)`: Tailwind compiled for a config, kept for the next call with it. Compiling is asynchronous
 * (Tailwind loads its config and stylesheets that way); what it gives is a handle whose classes are read
 * synchronously, so the renderers stay synchronous. Tailwind (the optional peer dependency) is loaded here only, when
 * it's first asked for.
 */
import { Tailwind, type Resolver, type TailwindConfig, type TailwindHandle } from "./Tailwind";
// Tailwind's default theme, as its `tailwindcss/theme.css` holds it, built into this module: a bundler or an edge
// runtime has no file to read it from.
/*! Includes tailwindcss's default theme (MIT License, Copyright (c) Tailwind Labs, Inc.): see THIRD_PARTY_LICENSES.md */
import theme from "tailwindcss/theme.css?raw";
import { capped, declarationReader, OVER, CLASSES, STUCK, WAITING, type ClassDeclarations, type Compiler, type DeclarationReader, type PluginFailure } from "./declarations";
import { guarded } from "./guard";
import { RenderError } from "@unlayer/react-elements";
import { classesToProps } from "./props";
import { classNamesIn, inlineClasses } from "./html";
import { unsafeStyle } from "../markdown/sanitize";

/** Shared by every copy of Elements a process loads: a handle from one works with the others. */
export const TAILWIND = Symbol.for("@unlayer/react-elements/tailwind");

/** A handle's resolver: the props a component's classes give it, and the declarations a class string gives. */
export interface HandleResolver extends Resolver {
  declarations(className: string): ClassDeclarations;
}

/**
 * The classes of the records in a render's scopes with a handle (each record's component's `className`, and those in
 * its `html`, as a rewrite reads them), all built at once by `declarations`, before the render rewrites any (see
 * Tailwind.tsx's `prepare`).
 */
function prepareRecords(declarations: DeclarationReader, records: readonly unknown[]): void {
  const names: string[] = [];
  for (const record of records) {
    const props = (record as { props?: unknown } | null)?.props;
    if (!props || typeof props !== "object") continue;
    const { className, html } = props as Record<string, unknown>;
    if (className) names.push(String(className));
    if (typeof html === "string" && /class/i.test(html)) for (const name of classNamesIn(html)) names.push(name);
  }
  declarations.prepare(names.join(" "));
}

/**
 * A config as text with its keys sorted, so equal configs compile once; undefined when it holds what isn't data: a
 * function (a plugin), unless `mark` is what to write for one (what else of it can be read: see withFunctions).
 */
export function configKey(config: unknown, mark?: string, seen = new Set<unknown>()): string | undefined {
  if (config === undefined) return "";
  const type = typeof config;
  if (config === null || type === "string" || type === "number" || type === "boolean") return JSON.stringify(config);
  if (type === "function") return mark;
  if (seen.has(config) || type !== "object" || (!Array.isArray(config) && Object.getPrototypeOf(config) !== Object.prototype && Object.getPrototypeOf(config) !== null)) return undefined;
  seen.add(config);
  const entries = Array.isArray(config) ? config.map((v) => configKey(v, mark, seen)) : Object.keys(config).sort().map((k) => {
    const v = configKey((config as Record<string, unknown>)[k], mark, seen);
    return v === undefined ? undefined : `${JSON.stringify(k)}:${v}`;
  });
  seen.delete(config);
  if (entries.some((e) => e === undefined)) return undefined;
  return Array.isArray(config) ? `[${entries.join(",")}]` : `{${entries.join(",")}}`;
}

/** Tailwind's compiler for a config, its plugins kept from throwing into its builds (see guard.ts). */
async function compiler(config: TailwindConfig | undefined): Promise<Compiler> {
  let tailwind: Record<string, any>;
  try {
    tailwind = await import("tailwindcss");
  } catch (cause) {
    throw Object.assign(new Error('[Unlayer] loadTailwind needs Tailwind CSS 4: install it with `npm install tailwindcss` (it\'s an optional peer dependency of @unlayer/react-elements).'), { cause });
  }
  const run = (tailwind.compile ?? tailwind.default?.compile) as (css: string, options: Record<string, unknown>) => Promise<Compiler>;
  const failures: PluginFailure[] = [];
  let building = false;
  // An older Tailwind installs with Elements (the peer dependency takes any version, so a project's Tailwind 3 doesn't
  // fail the install), but has no `compile`: Tailwind CSS 3's is a PostCSS plugin.
  if (typeof run !== "function") {
    const older = (tailwind.default ?? tailwind)?.postcss === true ? "Tailwind CSS 3 or older (a PostCSS plugin)" : "another one (it has no `compile`)";
    throw new Error(`[Unlayer] loadTailwind needs Tailwind CSS 4, and the tailwindcss installed is ${older}: upgrade it with \`npm install tailwindcss@4\` (it's an optional peer dependency of @unlayer/react-elements).`);
  }
  // Tailwind's theme and utilities, no reset (an email has its own), and the config as React Email's <Tailwind> takes it.
  const input = `@layer theme, base, components, utilities;\n@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities);\n${config ? "@config;\n" : ""}`;
  const compiled = await run(input, {
    base: "/",
    // No fallbacks for older browsers (`@supports` blocks): colors are converted for email anyway.
    polyfills: 0,
    async loadStylesheet(id: string, base: string) {
      if (id === "tailwindcss/theme.css") return { path: id, base, content: theme };
      if (id === "tailwindcss/utilities.css") return { path: id, base, content: "@tailwind utilities;" };
      throw new Error(`[Unlayer] loadTailwind: Tailwind asked for the stylesheet "${id}", which an email has no use for.`);
    },
    async loadModule(id: string, base: string, hint: string) {
      if (hint === "config") return { path: id, base, module: guarded(config, failures, () => building) };
      throw new Error(`[Unlayer] loadTailwind: plugins are given in the config's \`plugins\`, not loaded by name ("${id}").`);
    },
  });
  return {
    failures,
    build(candidates: string[]) {
      building = true;
      try {
        return compiled.build(candidates);
      } finally {
        building = false;
      }
    },
  };
}

/** Why a class isn't read that's no fault of its own, but Tailwind's compiling again (see declarationReader). */
const stale = (reason: string) => reason === WAITING || reason.startsWith(STUCK);

/** A handle for `config`, compiled from `source` (a copy of it, or the config itself where it can't be copied). */
async function compile(config: TailwindConfig | undefined, source = config): Promise<TailwindHandle> {
  // (A fresh compiler past the classes one keeps: see declarationReader.)
  const declarations = declarationReader(await compiler(source), () => compiler(source));
  // What renders collected, prepared (once per render, whichever of its scopes asks: each gives the same list).
  const prepared = new WeakSet<object>();
  // Each render's classes, read together (see capped), by the render (the main entry's key for it); each call's where
  // there's none.
  const renders = new WeakMap<object, ReturnType<typeof capped>>();
  const reader = (render?: object) => {
    let read = render && renders.get(render);
    if (!read) {
      read = capped(declarations);
      if (render) renders.set(render, read);
    }
    return read;
  };
  const resolver: HandleResolver = {
    declarations: (className) => capped(declarations)(className),
    ready: () => declarations.ready?.(),
    prepare: (records, render) => void (!prepared.has(records) && prepared.add(records) && prepareRecords(reader(render), records)),
    props: (name: string, className: string, explicit: Record<string, any>, defaults?: Record<string, any>, rtl = false, render?: object) => {
      const capped = reader(render);
      const warn = (text: string) => console.warn(`[Unlayer] ${name} ${text}.`);
      capped.first = undefined;
      // A class that isn't read as Tailwind compiles again after a class it couldn't read (one another render may have
      // given) fails the render, which renders right once it has: never without the class's styles.
      let missed: { className: string; reason: string } | undefined;
      const read = Object.assign((className: string) => {
        const found = capped(className);
        missed ??= found.ignored.find((i) => stale(i.reason));
        return found;
      }, { prepare: capped.prepare });
      // Classes in its markup (an Html block's, a Paragraph's `html`): inline styles; in Markdown's sanitized HTML, none
      // its sanitizer wouldn't keep in a `style` (your own markup's are as you wrote them).
      const html = explicit.html;
      if (typeof html === "string" && /class/i.test(html)) explicit = { ...explicit, html: inlineClasses(html, read, warn, rtl, explicit._sanitized ? unsafeStyle : undefined) };
      const found = read(className);
      if (missed) throw Object.assign(new RenderError(`<Tailwind> can't read the class \`${missed.className}\` now: ${missed.reason}. Render again then (the async renderers wait for it)`, name, ""), { [TAILWIND]: { compiling: true } });
      // Classes past the render's first CLASSES: said once in the render, where they're first met.
      if (capped.first !== undefined && !capped.said && (capped.said = true)) warn(`ignores class \`${capped.first}\`, and the render's other classes past its first ${CLASSES} different ones: a render reads ${CLASSES} at most`);
      return classesToProps(name, { ...found, ignored: found.ignored.filter((i) => i.reason !== OVER) }, explicit, defaults, false, rtl);
    },
  };
  return Object.freeze({ config, [TAILWIND]: resolver }) as TailwindHandle;
}

/** The configs kept compiled (about 1.3 MB each, and their classes), the ones used last: a server rendering each customer's theme keeps these. */
export const CONFIGS = 50;

// By its text, the one used last last; one with functions by the object, with the text of the rest as it was compiled.
const byKey = new Map<string, Promise<TailwindHandle>>();
const byObject = new WeakMap<object, { rest?: string; loading: Promise<TailwindHandle> }>();
const changed = new WeakSet<object>();

/**
 * Compiles Tailwind for a config (React Email's `<Tailwind config>` takes the same), kept for later calls: one with
 * the same config (one equal to it, or the same object as it is now) gets the same handle, while it's among the 50 used
 * last. Pass it to `<Tailwind tw={tw}>`. A config is known by what it holds when it's called: one changed in place
 * (a color made another) is compiled as it is then, and the handles given before keep what they were compiled from.
 *
 * A config with functions (plugins) can't be known by what it holds: it's compiled once per object, so define it
 * once, outside your components, and give a changed one as a new object. (One whose data changed in place is
 * compiled again, saying so; one whose functions did isn't.)
 *
 * @example
 * ```tsx
 * const tw = await loadTailwind({ theme: { extend: { colors: { brand: "#007291" } } } });
 * renderToHtml(<Tailwind tw={tw}><Email className="bg-gray-100">…</Email></Tailwind>);
 * ```
 */
export function loadTailwind(config?: TailwindConfig): Promise<TailwindHandle> {
  const key = configKey(config);
  if (key === undefined) return withFunctions(config!);
  let loading = byKey.get(key);
  if (!loading) {
    // (From a copy: one changed in place after is another config, which its handle's fresh compilers don't read.)
    const compiling = (loading = compile(config, config && structuredClone(config)));
    // One that failed (Tailwind not installed) is tried again next time.
    compiling.catch(() => void (byKey.get(key) === compiling && byKey.delete(key)));
  }
  // Used last, it goes last; past CONFIGS, the one used longest ago goes (a handle given out keeps working).
  byKey.delete(key);
  byKey.set(key, loading);
  if (byKey.size > CONFIGS) byKey.delete(byKey.keys().next().value!);
  return loading;
}

/** A config with functions (see loadTailwind), by the object: compiled again where the rest of it (its data) changed. */
function withFunctions(config: TailwindConfig): Promise<TailwindHandle> {
  const rest = configKey(config, "ƒ");
  const known = byObject.get(config);
  if (known && known.rest === rest) return known.loading;
  if (!known) console.warn("[Unlayer] loadTailwind: the config holds functions (plugins), so it's compiled again for each config object: define it once, outside your components.");
  else if (!changed.has(config) && changed.add(config)) console.warn("[Unlayer] loadTailwind: a config with functions (plugins) changed since it was compiled, so it's compiled again: give a changed config as a new object (a function changed in place isn't seen).");
  const loading = compile(config);
  byObject.set(config, { rest, loading });
  loading.catch(() => void (byObject.get(config)?.loading === loading && byObject.delete(config)));
  return loading;
}

// The async renderers ("@unlayer/react-elements/async") compile a <Tailwind config> with the compiler of the copy of
// Elements whose <Tailwind> it is (two copies in one app, each its own: their classes can differ), and an older
// copy's with the one loaded last, where this entry is loaded (a bundle).
const LOADER = Symbol.for("@unlayer/react-elements/tailwind-loader");
(Tailwind as unknown as Record<symbol, unknown>)[LOADER] = loadTailwind;
(globalThis as Record<symbol, unknown>)[LOADER] = loadTailwind;

/**
 * The declarations a class string gives with a compiled Tailwind, as Elements reads them for an email: colors in
 * hex or rgba, sizes in pixels, variables and `calc()` worked out, each with when it applies; and the classes that
 * don't apply in an email, with why.
 */
export function classNameToDeclarations(tw: TailwindHandle, className: string): ClassDeclarations {
  const resolver = (tw as unknown as Record<symbol, HandleResolver> | undefined)?.[TAILWIND];
  if (!resolver?.declarations) throw new Error("[Unlayer] classNameToDeclarations takes the compiled Tailwind `await loadTailwind(config)` gives.");
  return resolver.declarations(className);
}
