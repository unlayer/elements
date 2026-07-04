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

export interface DocumentLayoutArgs {
  /** ` dir="rtl"` attribute chunk for <html>, or "" */
  dir: string;
  /** `<title>...</title>` or "" */
  titleTag: string;
  /** Newline-joined head tags from component head functions, or "" */
  tagLines: string;
  /** `<style type="text/css">...</style>` or "" */
  styleTag: string;
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
  const { dir, titleTag, tagLines, styleTag, scriptTag, fontLinks, body } = args;

  const head = [
    titleTag,
    tagLines,
    styleTag,
    scriptTag,
    fontLinks && `<!--[if !mso]><!-->${fontLinks}<!--<![endif]-->`,
  ]
    .filter(Boolean)
    .join("\n  ");

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html${dir} xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
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
  const { dir, titleTag, tagLines, styleTag, scriptTag, fontLinks, body } = args;

  const head = [titleTag, tagLines, styleTag, scriptTag, fontLinks]
    .filter(Boolean)
    .join("\n  ");

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html${dir} xmlns="http://www.w3.org/1999/xhtml">
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
  const { dir, titleTag, tagLines, styleTag, scriptTag, fontLinks, body } = args;

  const head = [titleTag, fontLinks, tagLines, styleTag, scriptTag]
    .filter(Boolean)
    .join("\n    ");

  return `<!doctype html>
<html${dir}>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${head}
  </head>
  <body>
${body}
  </body>
</html>
`;
}
