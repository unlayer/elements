import type { RenderMode } from "@unlayer-internal/shared-elements";

type DeviceStyles = Record<string, string[]>;
type Collection = "rows" | "columns" | "contents";

// Mirrors the Unlayer editor's device-override CSS, including option order.
const contentOptions: Record<string, string[]> = {
  Button: ["size", "fontSize", "lineHeight", "textAlign", "padding"],
  Image: ["src", "textAlign"],
  Heading: ["fontSize", "textAlign", "lineHeight"],
  Paragraph: ["fontSize", "textAlign", "lineHeight"],
  Menu: ["fontSize", "padding"],
  Divider: ["width", "textAlign"],
};

/**
 * A value as CSS writes it in a declaration, or undefined when it could end the
 * declaration, the rule or the `<style>` element (`16px</style><script>`),
 * start a comment that hides the rules after it (`16px /*`), or leave a
 * bracket open, which swallows the rules after it (`calc(12px + 4px`): a
 * phone setting may come from data, and it's written into the head as is.
 */
function css(value: unknown): string | undefined {
  const text = String(value).trim();
  if (!text || /[<>{};!\\"'\n\r]|\/\*|\*\//.test(text)) return undefined;
  let depth = 0;
  for (const c of text) {
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    if (depth < 0) return undefined;
  }
  return depth === 0 ? text : undefined;
}

function size(value: unknown): string | undefined {
  const number = parseFloat(String(value));
  if (!Number.isFinite(number)) return;
  const rounded = parseFloat(number.toFixed(2));
  if (typeof value === "number" || String(value).endsWith("px")) return `${rounded}px`;
  if (String(value).endsWith("%")) return `${rounded}%`;
}

export function collectDeviceStyles(values: Record<string, any>, collection: Collection, name: string, mode: RenderMode, styles: DeviceStyles): void {
  const id = values._meta?.htmlID;
  if (!id) return;
  const options = collection === "contents" ? ["containerPadding", ...(contentOptions[name] || [])] : collection === "columns" ? ["padding", "border"] : ["padding"];
  for (const device of mode === "document" ? ["desktop"] : ["desktop", "mobile"]) {
    const overrides = values._override?.[device];
    if (!overrides) continue;
    for (const option of options) {
      if (!(option in overrides)) continue;
      const value = overrides[option];
      const property = option.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      const prefix = collection === "rows" ? "row-" : collection === "columns" ? "col-" : "";
      const selector = (attribute: string) => `#${id} .v-${prefix}${property === attribute ? property : `${property}-${attribute}`}`;
      const push = (rule: string) => (styles[device] ||= []).push(rule);
      if (option === "padding" || option === "containerPadding") {
        if (!(value || value === 0) || css(value) === undefined) continue;
        const direct = collection === "rows" || (mode === "web" && collection === "contents" && option === "containerPadding");
        const target = direct ? selector("padding").replace(`#${id} `, `#${id}`) : selector("padding");
        push(`${target} { padding: ${css(value)} !important; }`);
        if (mode === "email" && collection === "rows") {
          const parts = String(value).trim().split(/\s+/);
          // A length the editor doesn't write (`2em`, a bare `0`) is written as it is.
          const [top, bottom] = [parts[0], parts[2] || parts[0]].map((part) => size(part) ?? css(part));
          if (top !== undefined && bottom !== undefined) push(`${target}--vertical { padding-top: ${top} !important; padding-bottom: ${bottom} !important; }`);
        }
      } else if (option === "border") {
        // As the editor's borderToStyle: transparent unless a side has a width.
        if (value) push(`${selector("border")} { ${["Top", "Left", "Right", "Bottom"].map((d) => { const w = css(value[`border${d}Width`] || "0px") ?? "0px"; return `border-${d.toLowerCase()}: ${w} ${css(value[`border${d}Style`] || "solid") ?? "solid"} ${(parseInt(w) > 0 && css(value[`border${d}Color`])) || "transparent"} !important;`; }).join("")} }`);
      } else if (option === "src") {
        if (!value) continue;
        const merged = { ...values.src, ...value };
        const maximum = merged.autoWidth === false ? size(merged.maxWidth) : undefined;
        push(`${selector("width")} { width: ${maximum || "100%"} !important; }`);
        push(`${selector("max-width")} { max-width: ${size(maximum || merged.width || "100%")} !important; }`);
      } else if (option === "size" || option === "width") {
        if (!value) continue;
        push(`${selector("width")} { width: ${size(value.width) && !value.autoWidth ? size(value.width) : "auto"} !important; }`);
        push(`${selector("max-width")} { max-width: 100% !important; }`);
      } else {
        if (!(value || (option === "lineHeight" && `${value}` === "0"))) continue;
        const rendered = css(option === "fontSize" && typeof value === "number" ? `${value}px` : value);
        if (rendered === undefined) continue;
        push(`${selector(property)} { ${property}: ${rendered} !important; }`);
      }
    }
  }
}

export function deviceStylesCss(styles: DeviceStyles, mode: RenderMode): string {
  return Object.entries(styles).filter(([, rules]) => rules.length).map(([device, rules]) => {
    const query = device === "mobile" ? "@media (max-width: 480px)" : `@media (min-width: ${mode === "document" ? 1 : 481}px)`;
    return `${query} { ${rules.join(" ")} }`;
  }).join("\n");
}

export function deviceVisibilityCss(mode: RenderMode): string {
  if (mode === "document") return "";
  const extra = mode === "email" ? "max-height: 0px; overflow: hidden; " : "";
  const reset = mode === "email" ? "@media (min-width: 0px) { .hide-default__display-block { display: block !important; mso-hide: unset !important; } .hide-default__display-table { display: table !important; mso-hide: unset !important; } }\n" : "";
  return reset + `@media (max-width: 480px) { .hide-mobile { ${extra}display: none !important; } }\n` + `@media (min-width: 481px) { .hide-desktop { ${extra}display: none !important; } }`;
}
