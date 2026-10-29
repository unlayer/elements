/**
 * The editor's links as the URLs it exports. The editor saves a link as an action, `{ name, values, attrs }` (a web
 * page, an email, a phone call, a text message, a page section, or a link type of the embedder's), whose `attrs` are
 * templates (`mailto:{{email}}?subject={{subject}}&body={{body}}`) its exporters fill in with `values`. Elements'
 * components take a link as its URL, so codegen writes that URL, filled in as the exporters fill it (`fill`, quirks
 * and all), and compare.ts compares links by it.
 */
import { deepEqual, isPlainObject, type Plain } from "./values";

/** The editor's own actions: their templates, and their fields' defaults, which its link editor fills in. */
const ACTIONS: Record<string, { attrs: Plain; fields: Plain }> = {
  web: { attrs: { href: "{{href}}", target: "{{target}}" }, fields: { href: "", target: "_blank" } },
  email: { attrs: { href: "mailto:{{email}}?subject={{subject}}&body={{body}}" }, fields: { email: "", subject: "", body: "" } },
  phone: { attrs: { href: "tel:{{phone}}" }, fields: { phone: "" } },
  sms: { attrs: { href: "sms:{{phone}}" }, fields: { phone: "" } },
  anchor: { attrs: { href: "#{{href}}", target: "_self" }, fields: { href: "" } },
};

/** The actions the builder's link editor reads back from their URL: a web link to `mailto:…` opens as an email. */
export const READ_BACK = new Set(["web", "email", "phone", "sms"]);

/**
 * A link as the editor exports it: its URL (`""` for none) and where it opens; `kept` where the builder reads the
 * same action back from that URL. `lost`: what it has beside them, which no URL holds (code it runs, a class, a
 * download, a `rel`, a `title`, data attributes, any other attribute).
 */
export type EditorLink = { url: string; target: string; kept: boolean } | { lost: string[] };

/** A value as the editor writes it into a template: a list option's `value`, a number as its digits. */
const text = (value: unknown): string => (typeof value === "number" ? `${value}` : `${(isPlainObject(value) && "value" in value ? value.value : undefined) ?? value ?? ""}`);

/** Each character but `{` and `}` (a merge tag's) percent-encoded, as the editor encodes a query's values. */
const encode = (value: string) => Array.from(value, (c) => (c === "{" || c === "}" ? c : encodeURIComponent(c))).join("");

/** The editor's built-in placeholders: one left unfilled is no link. */
const PLACEHOLDERS = ["{{href}}", "{{url}}", "{{custom}}"];

/**
 * An attribute of a link (`href`, `target`, …) as the editor's exporters write it: its template (with what a `+href`
 * template adds to it) filled in with the link's values, those in a query encoded; or, without a template, the value
 * of that name. An `href` drops a `mailto:`'s empty fields, and is undefined where it's empty or an unfilled
 * placeholder.
 */
function fill(key: string, attrs: Plain | undefined, values: Plain): string | undefined {
  let template = `${attrs?.[key] ?? ""}`;
  const more = attrs?.[`+${key}`];
  if (more) {
    const add = String(more);
    template += template.startsWith("#") && /^[?&]/.test(add) ? "" : add.startsWith("?") && template.includes("?") ? add.replace("?", "&") : add.startsWith("&") && !template.includes("?") ? add.replace("&", "?") : add;
  }
  if (!template) return `${values[key] || ""}`;
  // A value goes in as it is, or encoded after the template's `?` or first `&`: where the placeholder is in the URL
  // filled in so far, against where those are in the template, as the editor's exporters place it.
  const query = template.indexOf("?");
  const amp = template.match(/&(?!amp;)/)?.index ?? Infinity;
  // The URL in pieces: the template's own, and the values filled in, whose placeholders aren't filled again (the
  // exporters fill a value's `{{…}}` as the template's: a design under 1 KB, its values nesting them, gave 10 MB).
  let pieces: Array<{ text: string; filled: boolean }> = [{ text: template, filled: false }];
  for (const [name, value] of Object.entries(values)) {
    const list = Array.isArray(value) ? value.map(text).map(encode).join(key === "class" ? " " : ",") : undefined;
    const placeholder = `{{${name}}}`;
    const next: typeof pieces = [];
    // (Where it is in the URL filled in so far, as the exporters read it.)
    let offset = 0;
    for (const piece of pieces) {
      let from = 0;
      if (!piece.filled) {
        for (let at = piece.text.indexOf(placeholder); at >= 0; at = piece.text.indexOf(placeholder, from)) {
          if (at > from) next.push({ text: piece.text.slice(from, at), filled: false });
          const where = offset + at;
          next.push({ text: list ?? ((query >= 0 && where > query) || where > amp ? encode(text(value)) : text(value)), filled: true });
          from = at + placeholder.length;
        }
      }
      if (from < piece.text.length) next.push({ text: piece.text.slice(from), filled: piece.filled });
      offset += piece.text.length;
    }
    pieces = next;
  }
  let result = pieces.map((piece) => piece.text).join("");
  if (key !== "href") return result;
  // Email clients (Outlook) break on a `mailto:` with an empty field, and a URL doesn't end in `?` or `&`.
  // (A field's name is read from where its letters start: from inside them, a long run with no `=` was read again from
  // each of its letters.)
  if (result.startsWith("mailto:")) result = result.replace(/([?&]?)(?<!\w)(\w+)=(&|$)/g, "$1");
  result = result.replace(/[?&]$/, "");
  if (!result.trim()) return undefined;
  if (PLACEHOLDERS.includes(result) && template.includes(result) && !text(values[result.slice(2, -2)])) return undefined;
  return result;
}

/**
 * A link (a design's `href`, `action` or menu item `link`) as the editor exports it, or undefined where it isn't one.
 * A link without its templates (a design the editor didn't save) is read as the editor's link editor reads it: with
 * its action's, its fields' defaults filled in.
 */
export function editorLink(link: unknown): EditorLink | undefined {
  if (typeof link === "string") return { url: link, target: "_blank", kept: true };
  if (!isPlainObject(link)) return undefined;
  // The shape the exporters read (Elements' components take it too).
  if ("url" in link && !("name" in link)) {
    const lost = Object.keys(link).filter((key) => key !== "url" && key !== "target" && link[key] !== undefined && link[key] !== "" && !(isPlainObject(link[key]) && !Object.keys(link[key]).length));
    return lost.length ? { lost } : { url: `${link.url || ""}`, target: `${link.target || "_blank"}`, kept: true };
  }
  if (typeof link.name !== "string") return undefined;
  const action = ACTIONS[link.name];
  const own = isPlainObject(link.attrs) ? link.attrs : undefined;
  const attrs = own ?? action?.attrs;
  // In the order the values fill the templates in (which can matter, see fill): the design's, as the exporters take
  // them, with the fields it doesn't have after; or the link editor's, fields first, where it gives the templates.
  const given: Plain = isPlainObject(link.values) ? link.values : {};
  const values: Plain = own ? { ...given } : { ...action?.fields };
  for (const [key, value] of Object.entries(own ? (action?.fields ?? {}) : given)) if (value !== undefined && (!own || values[key] === undefined)) values[key] = value;
  // What it has beside its URL and where it opens, which are all a component's link takes (a Button's `href` and
  // `target`, an Image's action, a Menu item's `href` and `target`): any other attribute, unless it's filled in empty.
  const others = new Set(Object.keys(attrs ?? {}).map((key) => key.replace(/^\+/, "")));
  for (const key of ["href", "target", "onClick", "class", "download"]) others.delete(key);
  const lost = [
    ...["onClick", "class"].filter((key) => fill(key, attrs, values)),
    ...(fill("download", attrs, values) === "true" ? ["download"] : []),
    ...[...others].filter((key) => fill(key, attrs, values) || (key.startsWith("data-") && values[key])),
  ];
  if (lost.length) return { lost };
  return {
    url: fill("href", attrs, values) ?? "",
    target: fill("target", attrs, values) || "_blank",
    // (A web link is one whatever its templates.)
    kept: link.name === "web" || (READ_BACK.has(link.name) && (!own || deepEqual(own, action.attrs))),
  };
}
