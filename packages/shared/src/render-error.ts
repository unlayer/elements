/**
 * A part of a template that failed while it rendered: a component that throws (or is async, or suspends, in a
 * synchronous render), a Row whose Columns don't fit its layout, an exporter that fails. The renderers throw it by
 * default; with `onError: "omit"` (or a function) they leave that part out of the HTML, the plain text and the design
 * alike, and list it.
 */
export class RenderError extends Error {
  /** The component that failed (`Hero`, `Row`, `Button`, `div`). */
  readonly component: string;
  /** Where it is in the template: `Row 3 › Column 1 › Hero`. */
  readonly position: string;

  constructor(what: string, component: string, position: string, cause?: unknown) {
    super(`[Unlayer] ${what} (in <${component}>${position && position !== component ? ` at ${position}` : ""})`);
    this.name = "RenderError";
    this.component = component;
    this.position = position;
    // The original error (its stack points at the template's line): Error's own `cause`.
    if (cause !== undefined) Object.defineProperty(this, "cause", { value: cause, configurable: true, writable: true });
  }
}

/**
 * What a render does with a part of the template that fails. `"throw"` (the default): the render throws a
 * RenderError. `"omit"`: the part is left out of the HTML, the plain text and the design alike, and each part left out
 * is said with `console.error` (and listed in `renderToHtmlParts`'s `omitted`). A function: the part is left out and
 * the RenderError given to it (instead of the console); it can throw it to fail the render.
 */
export type OnError = "throw" | "omit" | ((error: RenderError) => void);
