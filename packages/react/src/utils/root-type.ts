/**
 * Elements' roots (Body, Email, Page, Document), of any copy of Elements, by their type. This release's and later
 * carry ROOT, their name, shared by `Symbol.for` (a package's ESM and CommonJS builds, two installs). An older copy's
 * (0.2.1 and before, from a package still on it) carries none: it's recognized by its name and its code, as an older
 * copy's Rows are (see record.tsx): its Body reads the `_config` it passes its rows, and its Email, Page and Document
 * are that Body in their mode (`{ ...props, mode: "email" }`). A component of the user's own given a root's name (a
 * design-system wrapper, `Email.displayName = "Email"`) is neither, and is called as any component is.
 */
export const ROOT = Symbol.for("@unlayer/react-elements/root");

/** An older copy's root, by its name: what its code has. */
const OLDER = new Map([
  ["Body", /\b_config\b/],
  ["Email", /\.\.\.[\w$]+, ?mode: ?"email" ?\}/],
  ["Page", /\.\.\.[\w$]+, ?mode: ?"web" ?\}/],
  ["Document", /\.\.\.[\w$]+, ?mode: ?"document" ?\}/],
]);

/** The root a component type is (`"Email"`), of any copy of Elements; undefined for any other type. */
export function rootName(type: unknown): string | undefined {
  if (typeof type !== "function") return undefined;
  const own = (type as unknown as Record<symbol, unknown>)[ROOT];
  if (typeof own === "string") return own;
  const name = (type as { displayName?: string }).displayName;
  return name && OLDER.get(name)?.test(String(type)) ? name : undefined;
}

/** Whether a component type is one of Elements' roots (see rootName). */
export const isRoot = (type: unknown): boolean => !!rootName(type);
