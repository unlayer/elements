import { boxSides, type BoxSides } from "@unlayer/convert-core";
import type { Style } from "./styles";

/** Cascade phone rules in stylesheet order, keeping desktop styles separate. */
export function withPhoneStyles(style: Style, classes: readonly string[], rules: Map<string, Style>): Style {
  const mobile: Style = {};
  for (const [cls, value] of rules) if (classes.includes(cls)) Object.assign(mobile, value);
  return Object.keys(mobile).length ? { ...style, _phone: mobile } : style;
}

export function phoneSides(style: Style, property: "padding" | "margin", desktop: BoxSides): BoxSides | undefined {
  const mobile = style._phone as Style | undefined;
  if (!mobile || !Object.keys(mobile).some((k) => k === property || k.startsWith(property))) return;
  const merged = { ...desktop };
  if (mobile[property] !== undefined) Object.assign(merged, boxSides(mobile, property));
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    const key = `${property}${side}`;
    if (mobile[key] !== undefined) merged[side.toLowerCase() as keyof BoxSides] = boxSides(mobile, property)[side.toLowerCase() as keyof BoxSides];
  }
  return merged;
}

/**
 * A phone rule's declarations Elements can't hold on phones (a color, a font weight), as CSS, for
 * the report. It holds padding, margins, font size, line height, alignment, hiding (and showing
 * content only phones get), and a full width for columns and images.
 */
export function unheldPhoneStyles(rule: Style, component: string | undefined): string[] {
  return Object.entries(rule)
    .filter(([key, value]) =>
      !key.startsWith("-") &&
      !/^(padding|margin)(Top|Right|Bottom|Left)?$/.test(key) &&
      !["fontSize", "lineHeight", "textAlign"].includes(key) &&
      !(key === "display" && /^(none|block)$/.test(String(value).trim())) &&
      !((component === "Column" || component === "Img") && (key === "width" || key === "maxWidth") && String(value).trim() === "100%"))
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`);
}

/** Only suppress a class note when every declaration is represented. */
export function handledPhoneClass(cls: string, rules: Map<string, Style>, component: string): boolean {
  const style = rules.get(cls);
  if (!style || !Object.keys(style).length) return false;
  return Object.entries(style).every(([key, value]) =>
    (key.startsWith("-Tw") && !Object.values(style).some(v => String(v).includes("var("))) ||
    /^(padding|margin)(Top|Right|Bottom|Left)?$/.test(key) ||
    ["fontSize", "lineHeight", "textAlign"].includes(key) ||
    (key === "display" && value === "none") ||
    ((component === "Column" || component === "Img") && ((key === "display" && value === "block") || ((key === "width" || key === "maxWidth") && value === "100%")))
  );
}
