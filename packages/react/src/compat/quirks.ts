/**
 * Where today's components draw something other than their design asks, and the new engine, given the design,
 * draws it as they do (RFC 0001, "Moving the existing components"). Each is one function and one test, so the major
 * that drops them deletes this file.
 */

type Sides = { top: number; right: number; bottom: number; left: number };

/**
 * A Row's padding, in an email: legacy writes its sides outside the content width, where a wide window shows
 * nothing of them and a phone none either (its phone CSS zeroes them). They're left out; its top and bottom stay.
 */
export function rowPaddingInEmail(padding: Sides): Sides {
  return { top: padding.top, right: 0, bottom: padding.bottom, left: 0 };
}
