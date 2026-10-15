import React from "react";
import { renderToHtml } from "@unlayer/react-elements";

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

/** What a handle does with a component's classes: its props, explicit ones kept over those from classes. */
export interface Resolver {
  props(name: string, className: string, explicit: Record<string, any>, defaults?: Record<string, any>): Record<string, any>;
}

// The handles an async renderer compiled, by config, while it renders (never a cache a sync render could find warm).
const SCOPES = Symbol.for("@unlayer/react-elements/tailwind-scopes");
export const lookups = ((globalThis as Record<symbol, unknown>)[SCOPES] ??= []) as Array<(config?: TailwindConfig) => unknown>;

function resolver({ tw, config }: TailwindProps): Resolver {
  const handle = (tw ?? lookups[lookups.length - 1]?.(config)) as Record<symbol, Resolver> | undefined;
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

/** A component's props with its `className` (and classes in its `html`) turned into props: the scope's rewrite. */
function rewrite(scope: TailwindProps, name: string, defaults: Record<string, any> | undefined, props: Record<string, any>): Record<string, any> {
  const { className, ...explicit } = props;
  return resolver(scope).props(name, className ?? "", explicit, defaults);
}

const internals = (renderToHtml as unknown as Record<symbol, any>)[Symbol.for("@unlayer/react-elements/internals")];
const ROOTS = new Set(["Body", "Email", "Page", "Document"]);

/** Outside a template being collected: it goes inside the roots it's around (their classes are its, see the root's Body). */
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
  // While a template is collected, it records itself, with its rewrite (see the main entry's utils/tailwind.ts).
  if (internals.collecting()) return internals.whileCollecting(() => internals.recordContainer("tailwind", { ...props, [TAILWIND]: rewrite }), () => placed(props), "Tailwind");
  return <>{placed(props)}</>;
}

Tailwind.displayName = "Tailwind";
(Tailwind as unknown as Record<symbol, unknown>)[TAILWIND] = rewrite;

export default Tailwind;
