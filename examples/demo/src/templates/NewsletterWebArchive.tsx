import type { ReactElement } from "react";
import { newsletterTemplate } from "./NewsletterDigest";

/**
 * Newsletter web archive — the "view in browser" page for the newsletter email.
 *
 * This is the *same content* as NewsletterDigest. Nothing is duplicated:
 * `newsletterTemplate()` gives it to a different root.
 *
 *   newsletterTemplate("email")  →  <Email>  →  tables, inlined for Outlook/Gmail
 *   newsletterTemplate("web")    →  <Page>   →  div/flexbox, responsive browser HTML
 *
 * The rows, columns, headings, images, and buttons in between are the same. That
 * is the point: send the email, then publish the archive page from the same
 * source — no second template to keep in sync.
 *
 * Rendering it is the usual one-liner:
 *   const { html } = await render(<NewsletterWebArchive />);
 */
export default function NewsletterWebArchive(): ReactElement {
  return newsletterTemplate("web");
}
