/** Legacy design values as the new engine's: lengths, sides and colors. */

export type Sides = { top: number; right: number; bottom: number; left: number };

export const px = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  const match = typeof value === "string" ? /^\s*(-?[\d.]+)\s*(px)?\s*$/.exec(value) : null;
  return match ? Number(match[1]) : undefined;
};

/** "10px 20px" (1 to 4 values) as four sides. */
export function sides(value: unknown): Sides | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return { top: value, right: value, bottom: value, left: value };
  const parts = String(value).trim().split(/\s+/).map((part) => parseFloat(part));
  if (parts.some((part) => !Number.isFinite(part))) return undefined;
  const [top, right = top, bottom = top, left = right] = parts;
  return { top, right, bottom, left };
}

export const color = (value: unknown) => (typeof value === "string" && value !== "" && value !== "transparent" ? value : undefined);
export const some = (s: Sides | undefined) => (s && (s.top || s.right || s.bottom || s.left) ? s : undefined);

