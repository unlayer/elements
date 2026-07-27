import type { ReactElement } from "react";
import { newsletterTemplate } from "./NewsletterDigest";

/**
 * Newsletter web archive — the "view in browser" page for the newsletter email.
 *
 * This is the *same component tree* as NewsletterDigest. Nothing is duplicated:
 * `newsletterTemplate()` swaps only the root wrapper.
 *
 *   newsletterTemplate("email")  →  <Email>  →  tables, inlined for Outlook/Gmail
 *   newsletterTemplate("web")    →  <Page>   →  div/flexbox, responsive browser HTML
 *
 * The rows, columns, headings, images, and buttons in between are byte-identical.
 * That is the point: send the email, then publish the archive page from the same
 * source — no second template to keep in sync.
 *
 * Rendering it is the usual one-liner:
 *   renderToHtml(<Page>…</Page>)  // or renderToHtmlParts() to own the shell
 */
export default function NewsletterWebArchive(): ReactElement {
  return newsletterTemplate("web");
}
