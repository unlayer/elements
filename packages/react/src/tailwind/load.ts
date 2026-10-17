/**
 * `loadTailwind(config)`: Tailwind compiled once for a config. Compiling is asynchronous (Tailwind loads its config
 * and stylesheets that way); what it gives is a handle whose classes are read synchronously, so the renderers stay
 * synchronous. Tailwind (the optional peer dependency) is loaded here only, when it's first asked for.
 */
import { Tailwind, type Resolver, type TailwindConfig, type TailwindHandle } from "./Tailwind";
// Tailwind's default theme, as its `tailwindcss/theme.css` holds it, built into this module: a bundler or an edge
// runtime has no file to read it from.
/*! Includes tailwindcss's default theme (MIT License, Copyright (c) Tailwind Labs, Inc.): see THIRD_PARTY_LICENSES.md */
import theme from "tailwindcss/theme.css?raw";
import { declarationReader, type ClassDeclarations, type Compiler } from "./declarations";
import { classesToProps } from "./props";
import { inlineClasses } from "./html";

/** Shared by every copy of Elements a process loads: a handle from one works with the others. */
export const TAILWIND = Symbol.for("@unlayer/react-elements/tailwind");

/** A handle's resolver: the props a component's classes give it, and the declarations a class string gives. */
export interface HandleResolver extends Resolver {
  declarations(className: string): ClassDeclarations;
}

/** A config as text with its keys sorted, so equal configs compile once; undefined when it holds functions (plugins). */
export function configKey(config: unknown, seen = new Set<unknown>()): string | undefined {
  if (config === undefined) return "";
  if (config === null || ["string", "number", "boolean"].includes(typeof config)) return JSON.stringify(config);
  if (seen.has(config) || typeof config !== "object" || (!Array.isArray(config) && Object.getPrototypeOf(config) !== Object.prototype && Object.getPrototypeOf(config) !== null)) return undefined;
  seen.add(config);
  const entries = Array.isArray(config) ? config.map((v) => configKey(v, seen)) : Object.keys(config).sort().map((k) => {
    const v = configKey((config as Record<string, unknown>)[k], seen);
    return v === undefined ? undefined : `${JSON.stringify(k)}:${v}`;
  });
  seen.delete(config);
  if (entries.some((e) => e === undefined)) return undefined;
  return Array.isArray(config) ? `[${entries.join(",")}]` : `{${entries.join(",")}}`;
}

async function compile(config: TailwindConfig | undefined): Promise<TailwindHandle> {
  let tailwind: Record<string, any>;
  try {
    tailwind = await import("tailwindcss");
  } catch (cause) {
    throw Object.assign(new Error('[Unlayer] loadTailwind needs Tailwind CSS 4: install it with `npm install tailwindcss` (it\'s an optional peer dependency of @unlayer/react-elements).'), { cause });
  }
  const run = (tailwind.compile ?? tailwind.default?.compile) as (css: string, options: Record<string, unknown>) => Promise<Compiler>;
  // Tailwind's theme and utilities, no reset (an email has its own), and the config as React Email's <Tailwind> takes it.
  const input = `@layer theme, base, components, utilities;\n@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities);\n${config ? "@config;\n" : ""}`;
  const compiler = await run(input, {
    base: "/",
    // No fallbacks for older browsers (`@supports` blocks): colors are converted for email anyway.
    polyfills: 0,
    async loadStylesheet(id: string, base: string) {
      if (id === "tailwindcss/theme.css") return { path: id, base, content: theme };
      if (id === "tailwindcss/utilities.css") return { path: id, base, content: "@tailwind utilities;" };
      throw new Error(`[Unlayer] loadTailwind: Tailwind asked for the stylesheet "${id}", which an email has no use for.`);
    },
    async loadModule(id: string, base: string, hint: string) {
      if (hint === "config") return { path: id, base, module: config };
      throw new Error(`[Unlayer] loadTailwind: plugins are given in the config's \`plugins\`, not loaded by name ("${id}").`);
    },
  });
  const declarations = declarationReader(compiler);
  const resolver: HandleResolver = {
    declarations,
    props: (name: string, className: string, explicit: Record<string, any>, defaults?: Record<string, any>) => {
      // Classes in its markup (an Html block's, a Paragraph's `html`): inline styles.
      const html = explicit.html;
      if (typeof html === "string" && /\sclass\s*=/i.test(html)) explicit = { ...explicit, html: inlineClasses(html, declarations, (text) => console.warn(`[Unlayer] ${name} ${text}.`)) };
      return classesToProps(name, declarations(className), explicit, defaults);
    },
  };
  return Object.freeze({ config, [TAILWIND]: resolver }) as TailwindHandle;
}

const byConfig = new WeakMap<object, Promise<TailwindHandle>>();
const byKey = new Map<string, Promise<TailwindHandle>>();

/**
 * Compiles Tailwind for a config (React Email's `<Tailwind config>` takes the same), once: later calls with the same
 * config (the same object, or one equal to it) get the same handle. Pass it to `<Tailwind tw={tw}>`.
 *
 * @example
 * ```tsx
 * const tw = await loadTailwind({ theme: { extend: { colors: { brand: "#007291" } } } });
 * renderToHtml(<Tailwind tw={tw}><Email className="bg-gray-100">…</Email></Tailwind>);
 * ```
 */
export function loadTailwind(config?: TailwindConfig): Promise<TailwindHandle> {
  const object = config && typeof config === "object" ? config : undefined;
  const known = object && byConfig.get(object);
  if (known) return known;
  const key = configKey(config);
  if (key === undefined) {
    console.warn("[Unlayer] loadTailwind: the config holds functions (plugins), so it's compiled again for each config object: define it once, outside your components.");
  }
  let loading = key === undefined ? undefined : byKey.get(key);
  if (!loading) {
    loading = compile(config);
    if (key !== undefined) byKey.set(key, loading);
    // One that failed (Tailwind not installed) is tried again next time.
    loading.catch(() => {
      if (key !== undefined && byKey.get(key) === loading) byKey.delete(key);
      if (object && byConfig.get(object) === loading) byConfig.delete(object);
    });
  }
  if (object) byConfig.set(object, loading);
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
