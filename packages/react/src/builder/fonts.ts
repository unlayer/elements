/**
 * The builder loads a web font from the URL of a stylesheet, given on each font a design names; a template has font
 * files. So each family's @font-face rules are written as a stylesheet, in a data URI. Reading a design, a root's fonts
 * come back from its hidden property, not from these.
 */
import type { Design } from "./design";

/** A face of a root's `fonts`, as the body's hidden property holds it. */
export type Face = { family: string; src: string; format?: string; weight?: number | string | number[]; style?: string };

/** A stylesheet of a family's faces, as a data URI. */
export const fontStylesheet = (family: string, faces: Face[]): string => {
  const rules = faces.map(
    (face) => `@font-face{font-family:'${family.replace(/'/g, "\\'")}';src:url(${face.src})${face.format ? ` format('${face.format}')` : ""};font-weight:${[face.weight ?? 400].flat().join(" ")};font-style:${face.style ?? "normal"}}`
  );
  return `data:text/css;charset=utf-8,${encodeURIComponent(rules.join(""))}`;
};

/** A design with each font the root's `fonts` has carrying its stylesheet. A design with no fonts comes back as it was. */
export function withFontStylesheets(design: Design): Design {
  const faces = (design.body.values as { fonts?: Face[] }).fonts;
  if (!faces?.length) return design;
  const urls = new Map(faces.map(({ family }) => [family, fontStylesheet(family, faces.filter((face) => face.family === family))]));
  const walk = (value: unknown, key?: string): unknown => {
    if (Array.isArray(value)) return value.map((item) => walk(item));
    if (!value || typeof value !== "object") return value;
    const copy = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v, k)]));
    const url = key === "fontFamily" ? urls.get(String((value as { label?: unknown }).label)) : undefined;
    return url ? { ...copy, url } : copy;
  };
  return walk(design) as Design;
}
