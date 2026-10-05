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
