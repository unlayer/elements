/**
 * Beefree modules that become an HTML block or another kind of block: `html` (an HTML block, as it was), `video` (a
 * Video), `icons` (an Image when it's one picture, else HTML), `merge-content`, `form`, `table` and `carousel` (HTML),
 * an `addon` holding an image (an Image), and modules this converter doesn't know (HTML where they hold some).
 */
import { align, boxString, color, px, pxString, sides } from "../css";
import type { ModuleContext, ModuleResult } from "../context";
import { escapeHtml } from "../html";
import type { Values } from "../types";
import { blockDevice, blockPadding } from "./common";
import { image } from "./image";

/** An HTML block: Beefree's own `html` module, or (`fallback`) a module kept as HTML. */
function htmlBlock(html: string, descriptor: Record<string, any>, ctx: ModuleContext, fallback?: string): ModuleResult {
  if (fallback) ctx.fallback(fallback);
  const { containerPadding } = blockPadding(descriptor);
  return [ctx.builder.content("html", { containerPadding, html }, blockDevice(descriptor, ctx))];
}

export function html(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const source = String(descriptor.html?.html ?? "");
  if (!source.trim()) {
    ctx.warn("empty-module", `${ctx.where}: the HTML module is empty, so it's left out.`);
    return [];
  }
  return htmlBlock(source, descriptor, ctx);
}

/** A YouTube or Vimeo URL's provider and id. */
function videoId(url: string): { type: "youtube" | "vimeo"; id: string } | undefined {
  const youtube = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/i.exec(url);
  if (youtube) return { type: "youtube", id: youtube[1] };
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(url);
  if (vimeo) return { type: "vimeo", id: vimeo[1] };
  return undefined;
}

export function video(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const source = descriptor.video ?? {};
  const url = String(source.src ?? "").trim();
  const thumbnail = String(source.thumbSrc ?? "").trim();
  const found = videoId(url);
  if (!found) {
    if (!thumbnail) {
      ctx.warn("video-unknown", `${ctx.where}: the video (${url || "no URL"}) isn't a YouTube or Vimeo one and has no thumbnail, so it's left out.`);
      return [];
    }
    ctx.warn("video-unknown", `${ctx.where}: the video isn't a YouTube or Vimeo one, so it's its thumbnail, linking to it.`);
    return image({ ...descriptor, image: { src: thumbnail, alt: source.thumbAlt ?? "", href: url }, computedStyle: { ...descriptor.computedStyle, class: "center autowidth" } }, ctx);
  }
  const { containerPadding } = blockPadding(descriptor);
  const values: Values = {
    containerPadding,
    // The template's thumbnail where it has one (Beefree's own, often the video's largest).
    video: { type: found.type, videoId: found.id, thumbnail: thumbnail || (found.type === "youtube" ? `https://img.youtube.com/vi/${found.id}/0.jpg` : ""), loading: false },
  };
  if (source.mode && source.mode !== "thumbnail") ctx.warn("video-embedded", `${ctx.where}: Beefree embeds this video (${source.mode}); Unlayer shows its thumbnail, linking to it.`);
  return [ctx.builder.content("video", values, blockDevice(descriptor, ctx))];
}

/** The `icons` module: a row of pictures (each with its link and optional text) as one Image, or as HTML. */
export function icons(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const list: Record<string, any>[] = Array.isArray(descriptor.iconsList?.icons) ? descriptor.iconsList.icons : [];
  const computed = descriptor.computedStyle ?? {};
  const style = descriptor.style ?? {};
  const height = px(computed.iconHeight) ?? 32;
  if (!list.length) {
    ctx.warn("empty-module", `${ctx.where}: the icons module has no icons, so it's left out.`);
    return [];
  }
  const sizeOf = (icon: Record<string, any>) => {
    const w = px(icon.width);
    const h = px(icon.height);
    return { width: w && h ? Math.round((w / h) * height) : height, height };
  };
  if (list.length === 1 && !String(list[0].text ?? "").trim() && list[0].image) {
    const icon = list[0];
    const { width } = sizeOf(icon);
    return image({ ...descriptor, image: { src: icon.image, alt: icon.alt ?? icon.title ?? "", href: icon.href ?? "", target: icon.target, width: px(icon.width) ? icon.width : `${width}px`, height: icon.height }, computedStyle: { ...computed, class: `${align(style["text-align"]) ?? "center"} fixedwidth`, width: `${width}px` } }, ctx);
  }
  // As Beefree lays them out: side by side, each picture with its text beside (or below) it.
  const [pt, pr, pb, pl] = sides(computed.iconSpacing);
  const textStyle = [`color: ${color(style.color) || ctx.textColor}`, `font-size: ${pxString(px(style["font-size"]) ?? 14)}`, ...(style["font-family"] && !/inherit/i.test(style["font-family"]) ? [`font-family: ${style["font-family"].replace(/"/g, "'")}`] : [])].join("; ");
  const cells = list.map((icon) => {
    const { width } = sizeOf(icon);
    const picture = icon.image ? `<img src="${escapeHtml(String(icon.image))}" alt="${escapeHtml(String(icon.alt ?? ""))}" width="${width}" height="${height}" style="display: block; height: ${height}px; width: ${width}px; border: 0;">` : "";
    const linked = (inner: string) => (icon.href ? `<a href="${escapeHtml(String(icon.href))}" target="${escapeHtml(String(icon.target || "_blank"))}" style="text-decoration: none; ${textStyle}">${inner}</a>` : inner);
    const label = String(icon.text ?? "").trim() ? `<span style="${textStyle}">${escapeHtml(String(icon.text))}</span>` : "";
    const below = icon.textPosition === "bottom" || icon.textPosition === "top";
    const content = label ? (below ? `${linked(picture)}<div style="padding-top: 5px;">${linked(label)}</div>` : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="vertical-align: middle;">${linked(picture)}</td><td style="vertical-align: middle; padding-left: 5px;">${linked(label)}</td></tr></table>`) : linked(picture);
    return `<td style="vertical-align: middle; padding: ${boxString([pt, pr, pb, pl])};">${content}</td>`;
  });
  const side = align(style["text-align"]) ?? "center";
  const markup = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${side}" style="margin: ${side === "center" ? "0 auto" : side === "right" ? "0 0 0 auto" : "0"};"><tr>${cells.join("")}</tr></table>`;
  ctx.warn("icons-as-html", `${ctx.where}: the icons module has no Unlayer equivalent, so it's an HTML block (its pictures, links and text as they are).`);
  return htmlBlock(markup, descriptor, ctx, "icons module");
}

export function mergeContent(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const value = String(descriptor.mergeContent?.value ?? "").trim();
  if (!value) {
    ctx.warn("empty-module", `${ctx.where}: the merge content has no value, so it's left out.`);
    return [];
  }
  ctx.warn("merge-content", `${ctx.where}: the merge content "${descriptor.mergeContent?.name ?? value}" is an HTML block holding its placeholder (${value}), which your sending platform fills in.`);
  return htmlBlock(value, descriptor, ctx, "merge content");
}

/** A field label's Markdown links (`I agree to the [Privacy Policy](#form.privacyurl)`) as HTML. */
const labelHtml = (label: string) => escapeHtml(label).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text: string, href: string) => `<a href="${href}">${text}</a>`);

/** The `form` module (landing pages, popups): its fields as an HTML form. */
export function form(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const structure = descriptor.form?.structure ?? {};
  const fields: Record<string, Record<string, any>> = structure.fields ?? {};
  const layout: string[][] = Array.isArray(structure.layout) ? structure.layout : Object.keys(fields).map((key) => [key]);
  const attrs = structure.attributes ?? {};
  const rows: string[] = [];
  for (const line of layout) {
    const cells = (Array.isArray(line) ? line : [line]).map((key) => {
      const field = fields[key];
      if (!field || field.removeFromLayout || field.type === "hidden") return "";
      const name = escapeHtml(String(key));
      const label = String(field.label ?? "").trim();
      const caption = label ? `<label style="display: block;">${labelHtml(label)}</label>` : "";
      const options: Record<string, any>[] = Array.isArray(field.options) ? field.options : [];
      if (field.type === "submit") return `<button type="submit" name="${name}" style="cursor: pointer;">${escapeHtml(String(field.attributes?.value ?? field.label ?? "Submit"))}</button>`;
      if ((field.type === "checkbox" || field.type === "radio") && options.length) {
        const choices = options.map((option) => `<label style="margin-right: 10px;"><input type="${field.type}" name="${name}" value="${escapeHtml(String(option.value ?? ""))}"> ${labelHtml(String(option.label ?? option.value ?? ""))}</label>`);
        return `${caption}${choices.join(" ")}`;
      }
      if (field.type === "checkbox" || field.type === "radio") return `<label><input type="${field.type}" name="${name}"> ${labelHtml(label)}</label>`;
      if (field.type === "select" || field.type === "dropdown") {
        return `${caption}<select name="${name}" style="width: 100%;">${options.map((option) => `<option value="${escapeHtml(String(option.value ?? ""))}">${escapeHtml(String(option.label ?? option.value ?? ""))}</option>`).join("")}</select>`;
      }
      const input = field.type === "textarea" ? `<textarea name="${name}" style="width: 100%;"></textarea>` : `<input type="${escapeHtml(String(field.type || "text"))}" name="${name}" style="width: 100%;">`;
      return `${caption}${input}`;
    });
    const kept = cells.filter(Boolean);
    if (kept.length) rows.push(`<div style="padding: 3px 0;">${kept.join(" ")}</div>`);
  }
  if (!rows.length) {
    ctx.warn("empty-module", `${ctx.where}: the form has no fields, so it's left out.`);
    return [];
  }
  const action = escapeHtml(String(attrs.action ?? ""));
  const method = escapeHtml(String(attrs.method ?? "post"));
  ctx.warn("form-as-html", `${ctx.where}: the form has no Unlayer equivalent, so it's an HTML block with its fields (without Beefree's styling).`);
  return htmlBlock(`<form action="${action}" method="${method}">${rows.join("")}</form>`, descriptor, ctx, "form module");
}

/** The `table` module: its cells (HTML) as an HTML table. */
export function table(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const content = descriptor.table?.content ?? {};
  const row = (cells: Record<string, any>[] = [], tag: "th" | "td") => `<tr>${cells.map((cell) => `<${tag} style="padding: 5px; border: 1px solid #dddddd;">${String(cell?.html ?? "")}</${tag}>`).join("")}</tr>`;
  const head = (content.headers ?? []).map((r: Record<string, any>) => row(r.cells, "th")).join("");
  const body = (content.rows ?? []).map((r: Record<string, any>) => row(r.cells, "td")).join("");
  if (!head && !body) {
    ctx.warn("empty-module", `${ctx.where}: the table has no cells, so it's left out.`);
    return [];
  }
  ctx.warn("table-as-html", `${ctx.where}: the table is an HTML block with its cells (Beefree's table styles aren't kept).`);
  return htmlBlock(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">${head}${body}</table>`, descriptor, ctx, "table module");
}

/** The `carousel` module: emails show its first slide; the slides as images one below the other, as HTML. */
export function carousel(descriptor: Record<string, any>, ctx: ModuleContext): ModuleResult {
  const slides: Record<string, any>[] = Array.isArray(descriptor.carousel?.slides) ? descriptor.carousel.slides : [];
  if (!slides.length) {
    ctx.warn("empty-module", `${ctx.where}: the carousel has no slides, so it's left out.`);
    return [];
  }
  const markup = slides
    .map((slide) => {
      const picture = `<img src="${escapeHtml(String(slide.src ?? ""))}" alt="${escapeHtml(String(slide.alt ?? ""))}" style="display: block; width: 100%; height: auto; border: 0;">`;
      return slide.href ? `<a href="${escapeHtml(String(slide.href))}" target="_blank">${picture}</a>` : picture;
    })
    .join("");
  ctx.warn("carousel-as-html", `${ctx.where}: the carousel has no Unlayer equivalent, so it's an HTML block with its ${slides.length} slides one below the other.`);
  return htmlBlock(markup, descriptor, ctx, "carousel module");
}

/** An `addon`: an image one (a GIF) as an Image, else its HTML where it has some. */
export function addon(descriptor: Record<string, any>, ctx: ModuleContext, module: Record<string, any>): ModuleResult {
  if (descriptor.image?.src) return image(descriptor, ctx);
  return unknown(descriptor, ctx, `addon${module.contentType ? ` (${module.contentType})` : ""}`);
}

/** The first HTML a module holds (`descriptor.<something>.html`), for a module this converter doesn't know. */
function heldHtml(descriptor: Record<string, any>): string | undefined {
  for (const value of Object.values(descriptor)) {
    if (value && typeof value === "object" && typeof value.html === "string" && value.html.trim()) return value.html;
  }
  return undefined;
}

export function unknown(descriptor: Record<string, any>, ctx: ModuleContext, kind: string): ModuleResult {
  const held = heldHtml(descriptor);
  if (held) {
    ctx.warn("unknown-module", `${ctx.where}: the ${kind} module is one this converter doesn't know, so it's an HTML block with the HTML it holds.`);
    return htmlBlock(held, descriptor, ctx, `${kind} module`);
  }
  ctx.warn("unknown-module", `${ctx.where}: the ${kind} module is one this converter doesn't know and holds no HTML, so it's left out.`);
  return [];
}
