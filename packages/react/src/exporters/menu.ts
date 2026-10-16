import { MenuExporters } from "@unlayer/exporters";
import { decodeBase64, encodeBase64 } from "./base64";
import { element, NeedsReact, staticMarkup } from "./markup";
import { present } from "./present";

/** lodash's `omit(value, ["onClick"])`: its keys, own and inherited, but `onClick`. */
function withoutOnClick(value: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (value != null) {
    const from = Object(value) as Record<string, unknown>;
    for (const key in from) {
      if (key === "onClick" || (key === "constructor" && !Object.prototype.hasOwnProperty.call(from, key))) continue;
      Object.defineProperty(out, key, { value: from[key], enumerable: true, writable: true, configurable: true });
    }
  }
  return out;
}

/** The keys that aren't undefined. */
const defined = (attrs: Record<string, unknown>) => Object.keys(attrs).reduce<Record<string, unknown>>((out, key) => (attrs[key] === undefined ? out : { ...out, [key]: attrs[key] }), {});

/** A link's attributes from the link editor's value (`{ url, target, onClick, class, customAttrs }`), as the exporters read it. */
function linkAttrs(link: any, defaults: Record<string, unknown> = { href: "" }): Record<string, any> {
  const attrs = { ...withoutOnClick(link?.customAttrs), href: link?.url || undefined, target: link?.target || undefined, onclick: link?.onClick || undefined, class: link?.class || undefined };
  // Custom attributes, all of them empty, on a link with no URL or click handler: no link.
  const empty =
    link?.customAttrs &&
    Object.keys(link.customAttrs).length > 0 &&
    Object.keys(link.customAttrs).every((key) => !link.customAttrs[key] || link.customAttrs[key].trim() === "") &&
    !link?.url &&
    !link?.onClick;
  return empty ? {} : { ...defaults, ...defined(attrs) };
}

/** The menu's markup, as the exporters' React component renders it for an export. */
function markup(values: Record<string, any>): string {
  const { menu: { items: given }, fontFamily, fontSize, linkColor, align, separator, textColor, padding, layout, fontWeight, letterSpacing } = values;
  const items = present(given);
  if (items.length === 0) return "";
  return staticMarkup(
    element(
      "div",
      { style: { textAlign: align, letterSpacing }, "aria-label": "menu" },
      items.map((item, index) => {
        const attrs = linkAttrs(item.link);
        // (React leaves out an `onclick` it's given as a string, so it goes in another attribute until it's rendered.)
        if (typeof attrs.onclick == "string") {
          attrs["data-onclick-encoded"] = encodeBase64(attrs.onclick);
          delete attrs.onclick;
        }
        const elements = [
          element(
            "a",
            {
              ...attrs,
              "aria-label": `Menu item - ${item?.text || index}`,
              key: `menu-item-${index}`,
              className: "v-padding v-font-size v-layout-display v-font-weight v-letter-spacing",
              style: { display: layout === "horizontal" ? "inline-block" : "block", padding, fontSize, fontFamily: fontFamily?.value, color: attrs.href ? linkColor : textColor, textDecoration: "none", fontWeight },
            },
            item.text
          ),
        ];
        if (separator && layout !== "vertical" && index + 1 < items.length)
          elements.push(
            element(
              "span",
              {
                "aria-label": "menu separator",
                className: "v-padding v-font-size v-letter-spacing hide-mobile",
                key: `menu-separator-${index}`,
                style: { display: "inline-block", padding, fontSize, fontFamily: fontFamily?.value, color: textColor, fontWeight },
              },
              separator
            )
          );
        return elements;
      })
    )
  );
}

/**
 * Menu's web HTML (which a document uses too), as @unlayer/exporters' MenuExporters write it with React (byte for
 * byte). Item text or a separator only React can render (an element) renders with React, as it did.
 */
export function menu(values: Record<string, any>, ...args: any[]): string {
  let html: string;
  try {
    html = markup({ ...values, menu: { ...values?.menu, items: present(values?.menu?.items || []) } });
  } catch (error) {
    if (error instanceof NeedsReact) return (MenuExporters.web as (...given: unknown[]) => string)(values, ...args);
    throw error;
  }
  return html.replace(/data-onclick-encoded="([^\"]+)"/gi, (_, encoded: string) => `onclick="${decodeBase64(encoded)}"`);
}
