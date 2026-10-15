/**
 * Document layouts — the per-mode HTML shells renderToHtml wraps the body in.
 *
 * Each layout matches the document shell the Unlayer editor produces when
 * exporting HTML, so a design renders identically whether exported from the
 * editor or rendered from Elements. The golden-template snapshots lock the
 * current output.
 *
 * Layouts only place pre-built pieces — escaping and tag construction stay
 * in render-to-html.tsx.
 */

/**
 * The editor's base stylesheet for each mode, which its exported documents have in their head, before the blocks' CSS
 * (its `styles/<mode>/index.scss` and `inline.css`, minified as it ships them): resets, `p` and `sub`/`sup` line
 * spacing, and in email the table and Apple data-detector rules. The web one leaves out the editor's form styles
 * (Elements has no form block).
 */
const BASE_CSS = {
  email:
    "sub,sup{line-height:0}\n\nbody{margin:0;padding:0}table,td,tr{border-collapse:collapse;vertical-align:top}p{margin:0}.ie-container table,.mso-container table{table-layout:fixed}*{line-height:inherit}a[x-apple-data-detectors=true]{color:inherit!important;text-decoration:none!important}",
  web:
    "body,html{margin:0;padding:0}html{box-sizing:border-box}*,:after,:before{box-sizing:inherit}html{font-size:14px;-ms-overflow-style:scrollbar;-webkit-tap-highlight-color:rgba(0,0,0,0)}p{margin:0}.container{--bs-gutter-x:0px;--bs-gutter-y:0;margin-left:auto;margin-right:auto;padding-left:calc(var(--bs-gutter-x)*.5);padding-right:calc(var(--bs-gutter-x)*.5);width:100%}sub,sup{line-height:0}\n\na[onclick]{cursor:pointer}",
  document: "body,html{margin:0;padding:0}html{box-sizing:border-box}*,:after,:before{box-sizing:inherit}html{font-size:14px}p{margin:0}sub,sup{line-height:0}\n\na[onclick]{cursor:pointer}",
};

/** The head's `<style>`: the mode's base stylesheet, then the blocks' CSS. */
const styleTag = (base: string, css: string) => `<style type="text/css">\n${[base, css].filter(Boolean).join("\n")}\n</style>`;

export interface DocumentLayoutArgs {
  /** ` lang="ar"` attribute chunk for <html>, or "" */
  lang?: string;
  /** ` dir="rtl"` attribute chunk for <html>, or "" */
  dir: string;
  /** `<title>...</title>` or "" */
  titleTag: string;
  /** Newline-joined head tags from component head functions, or "" */
  tagLines: string;
  /** The blocks' CSS for the head's `<style>` (a `</style` in it escaped), or "" */
  css: string;
  /** `<script type="application/javascript">...</script>` or "" */
  scriptTag: string;
  /** Concatenated `<link rel="stylesheet">` tags for web fonts, or "" */
  fontLinks: string;
  /** Rendered body markup (includes <body> in email/document mode, not web) */
  body: string;
}

/**
 * Email shell — XHTML transitional doctype, VML/Office namespaces, and the
 * MSO conditional comments Outlook needs. The body markup already contains
 * the <body> tag in email mode.
 */
export function emailLayout(args: DocumentLayoutArgs): string {
  const { dir, titleTag, tagLines, css, scriptTag, fontLinks, body } = args;

  const head = [
    titleTag,
    tagLines,
    styleTag(BASE_CSS.email, css),
    scriptTag,
    fontLinks && `<!--[if !mso]><!-->${fontLinks}<!--<![endif]-->`,
  ]
    .filter(Boolean)
    .join("\n  ");

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html${dir}${args.lang || ""} xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  ${head}
</head>
${body}
</html>
`;
}

/**
 * Document (print/PDF) shell — XHTML transitional doctype. The body markup
 * already contains the <body> tag in document mode. Fonts are emitted as
 * <link> tags — PDF renderers that can't fetch should pass no fonts.
 */
export function documentLayout(args: DocumentLayoutArgs): string {
  const { dir, titleTag, tagLines, css, scriptTag, fontLinks, body } = args;

  const head = [titleTag, tagLines, styleTag(BASE_CSS.document, css), scriptTag, fontLinks]
    .filter(Boolean)
    .join("\n  ");

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html${dir}${args.lang || ""} xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  ${head}
</head>
${body}
</html>
`;
}

/**
 * Web shell — HTML5 doctype with standard viewport/charset meta tags.
 * The body markup has no <body> tag in web mode, so the shell provides it.
 */
export function webLayout(args: DocumentLayoutArgs): string {
  const { dir, titleTag, tagLines, css, scriptTag, fontLinks, body } = args;

  const head = [titleTag, fontLinks, tagLines, styleTag(BASE_CSS.web, css), scriptTag]
    .filter(Boolean)
    .join("\n    ");

  return `<!doctype html>
<html${dir}${args.lang || ""}>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${head}
  </head>
  <body${dir.includes("rtl") ? `${dir}${args.lang || ""}` : ""}>
${body}
  </body>
</html>
`;
}
