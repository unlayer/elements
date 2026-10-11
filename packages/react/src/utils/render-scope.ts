/**
 * One render's scope (renderToHtml, renderToJson, …): what it works out once,
 * like a template's collected render, is reused for the rest of it and never
 * by the next render (an element kept between renders may read other data).
 */
import { escapeText } from "@unlayer-internal/shared-elements";
import { within } from "./collect";

let scoped: WeakMap<object, unknown> | undefined;

/** `make()`'s result for `key`, worked out once per render (each time outside one). */
export function scopeCache<T>(key: object, make: () => T): T {
  if (!scoped) return make();
  if (!scoped.has(key)) scoped.set(key, make());
  return scoped.get(key) as T;
}

/**
 * Runs one render with its own scope (a render inside another shares it), apart from a template being
 * collected: called inside a component of one (a block rendered to a string), it renders what it's given.
 */
export function withRenderScope<T>(render: () => T): T {
  return within(null, () => {
    if (scoped) return render();
    scoped = new WeakMap();
    try {
      return render();
    } finally {
      scoped = undefined;
    }
  });
}

/**
 * Text placed straight in a Row or Column, as HTML: escaped, as React shows
 * text (raw HTML goes in an Html block). The editor has no place for it, so
 * the warning says where it belongs.
 */
export function looseText(child: string | number, container: string): string {
  const text = String(child);
  if (text.trim()) {
    console.warn(`${container}: text placed straight in a ${container} shows as text and isn't kept in the editor's design. Put it in a <Paragraph>, or HTML in an <Html> block.`);
  }
  return escapeText(text, true);
}
