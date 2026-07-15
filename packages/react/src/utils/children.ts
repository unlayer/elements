import React from "react";

/**
 * React.Children.toArray with Fragment flattening.
 *
 * The containers (Body/Row/Column) walk their children to thread layout
 * context and render items — a `<>…</>` around Rows or Columns is an everyday
 * React pattern and must be transparent to that walk. `cloneElement` cannot
 * forward props through a Fragment, so the walkers operate on the flattened
 * list instead.
 */
/**
 * Unwrap React.memo / React.forwardRef wrappers down to the underlying
 * function component, so a memoized Unlayer component still exposes its
 * render statics (UNLAYER_RENDER_KEY / UNLAYER_CONFIG_KEY) to the walkers.
 */
export function unwrapComponentType(type: unknown): unknown {
  let t: any = type;
  while (t && typeof t === "object") {
    if (t.type) { t = t.type; continue; }   // React.memo
    if (t.render) { t = t.render; continue; } // React.forwardRef
    break;
  }
  return t;
}

export function flattenChildren(node: React.ReactNode): ReturnType<typeof React.Children.toArray> {
  const out: ReturnType<typeof React.Children.toArray> = [];
  React.Children.toArray(node).forEach((child) => {
    if (React.isValidElement(child) && child.type === React.Fragment) {
      out.push(
        ...flattenChildren((child.props as { children?: React.ReactNode }).children)
      );
    } else {
      out.push(child);
    }
  });
  return out;
}
