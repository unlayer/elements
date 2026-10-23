import React from "react";

/** A Tailwind config, as React Email's `<Tailwind config>` takes it: `{ theme: { extend: { colors: { brand: "#007291" } } } }`. */
export type TailwindConfig = { theme?: Record<string, unknown>; presets?: TailwindConfig[]; plugins?: unknown[]; [key: string]: unknown };

/** Tailwind compiled for one config: `await loadTailwind(config)`. */
export interface TailwindHandle {
  /** The config it was compiled from (undefined: Tailwind's default theme). */
  readonly config: TailwindConfig | undefined;
}

export interface TailwindProps {
  children?: React.ReactNode;
  /** Tailwind compiled for your config: `await loadTailwind(config)`. */
  tw?: TailwindHandle;
  /**
   * A Tailwind config, as React Email's `<Tailwind>` takes it. The renderers from "@unlayer/react-elements" are
   * synchronous, so they need `tw` too; the async renderers ("@unlayer/react-elements/async") compile it.
   */
  config?: TailwindConfig;
}

/** On a compiled Tailwind (its resolver), on <Tailwind> (its rewrite), and on its errors: one for every copy of Elements. */
export const TAILWIND = Symbol.for("@unlayer/react-elements/tailwind");

/**
 * What a handle does with a component's classes: its props, explicit ones kept over those from classes (`rtl`: in a
 * right-to-left document); and, before a render rewrites any, the classes in its components' props (`records`, each
 * with its component's `props`), all built at once (`prepare`: see the rewrite's).
 */
export interface Resolver {
  props(name: string, className: string, explicit: Record<string, any>, defaults?: Record<string, any>, rtl?: boolean): Record<string, any>;
  prepare?(records: readonly unknown[]): void;
}

/**
 * The handles an async render compiled, by config and by the <Tailwind> it's for (this copy's): the main entry gives
 * them to a rewrite in that render (from its scope), never one a synchronous render could find warm.
 */
type Compiled = (config: TailwindConfig | undefined, type: unknown) => unknown;

function resolver({ tw, config }: TailwindProps, compiled?: unknown): Resolver {
  const handle = (tw ?? (typeof compiled === "function" ? (compiled as Compiled)(config, Tailwind) : undefined)) as Record<symbol, Resolver> | undefined;
  if (handle?.[TAILWIND]) return handle[TAILWIND];
  throw Object.assign(
    new Error(
      tw
        ? '[Unlayer] <Tailwind tw> takes `await loadTailwind(config)` from "@unlayer/react-elements/tailwind".'
        : '[Unlayer] <Tailwind config> needs `tw`: `await loadTailwind(config)` from "@unlayer/react-elements/tailwind", or the async renderers ("@unlayer/react-elements/async"), which compile it (these are synchronous).'
    ),
    { [TAILWIND]: { config } }
  );
}

/**
 * A component's props with its `className` (and classes in its `html`) turned into props: the scope's rewrite. `rtl`:
 * the render's root reads right to left, as the main entry's render says (an older copy of it gives none); `compiled`:
 * what the render compiled, where it's an async render's (see Compiled).
 */
function rewrite(scope: TailwindProps, name: string, defaults: Record<string, any> | undefined, props: Record<string, any>, rtl?: boolean, compiled?: unknown): Record<string, any> {
  const { className, ...explicit } = props;
  return resolver(scope, compiled).props(name, className ?? "", explicit, defaults, rtl);
}

/**
 * Before a render rewrites any component's props: what it collected (`records`, each with its component's `props`,
 * whose `className` and `html` are read; the same list for each scope in the render), their classes built at once by
 * the scope's handle, once per render. Tailwind builds its whole stylesheet again for each class it hasn't built, so
 * the classes met one component at a time would take the square of their number. The main entry calls it, where the
 * scope's rewrite has it (an older copy's doesn't), with one object, which a later release can give more in; what it
 * returns isn't read. A scope without a handle is left for the rewrite to say, at the component it's for; what
 * Tailwind throws (a plugin's error) fails the render, as it does there.
 */
function prepare({ scope, records, compiled }: { scope: TailwindProps; records: readonly unknown[]; compiled?: unknown }): void {
  let handle: Resolver;
  try {
    handle = resolver(scope, compiled);
  } catch {
    return;
  }
  handle.prepare?.(records);
}
(rewrite as unknown as Record<string, unknown>).prepare = prepare;

const ROOTS = new Set(["Body", "Email", "Page", "Document"]);

/** Rendered (not collected): it goes inside the roots it's around (their classes are its, see the root's Body). */
function placed({ children, ...props }: TailwindProps): React.ReactNode {
  return React.Children.map(children, (child) =>
    React.isValidElement<{ children?: React.ReactNode }>(child) && ROOTS.has((child.type as { displayName?: string })?.displayName ?? "")
      ? React.cloneElement(child, undefined, React.createElement(Tailwind, props, child.props.children))
      : child
  );
}

/**
 * Tailwind - Turns the `className` of the Elements components inside it into their props.
 *
 * `<Button className="bg-blue-600 px-6 text-white">` renders as `<Button backgroundColor="#155dfc" padding="10px 24px"
 * color="#fff">`, so the design stays editable; props you set win over classes, styles no prop takes are inline
 * styles, and a class that can't apply in an email is reported. Put it around the root (or inside it, around
 * everything) to style the root too.
 *
 * @example
 * ```tsx
 * const tw = await loadTailwind({ theme: { extend: { colors: { brand: "#007291" } } } });
 * renderToHtml(
 *   <Tailwind tw={tw}>
 *     <Email className="bg-gray-100">
 *       <Row className="bg-white"><Column className="p-6"><Paragraph className="text-lg text-brand">Hi</Paragraph></Column></Row>
 *     </Email>
 *   </Tailwind>
 * );
 * ```
 */
export function Tailwind(props: TailwindProps): React.ReactElement {
  return <>{placed(props)}</>;
}

Tailwind.displayName = "Tailwind";
// A template's collecting walk records it, with this rewrite (see the main entry's utils/tailwind.ts and record.tsx).
(Tailwind as unknown as Record<symbol, unknown>)[TAILWIND] = rewrite;

export default Tailwind;
