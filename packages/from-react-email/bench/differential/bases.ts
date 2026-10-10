/**
 * Small documents the differential test mutates, besides the fixture
 * templates' renders: the shapes React Email and Elements write (tables,
 * paragraphs, buttons, columns, a <style> with phone rules), with rules that
 * compete (specificity, order, !important) so rewrites have something to win
 * or lose against.
 */
const page = (body: string, css = "") =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;font-family:Arial,sans-serif;font-size:16px;color:#1f2937">${body}</body></html>`;

const preview = '<div data-skip-in-text="true" style="display:none;max-height:0;overflow:hidden">Your weekly summary is ready</div>';

export const BASES: Record<string, string> = {
  "react-email-text": page(
    `${preview}<table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px"><tbody><tr><td>
      <h1 style="font-size:28px;font-weight:700;margin:0 0 16px">Welcome to Acme</h1>
      <p style="font-size:14px;line-height:24px;margin:16px 0">Thanks for joining, Ada. Your account is ready to use today.</p>
      <p class="muted" style="font-size:14px;line-height:24px;margin:16px 0">Questions? Reply to this email any time.</p>
      <a href="https://example.com/start" style="color:#2563eb;text-decoration-line:none">Get started now</a>
    </td></tr></tbody></table>`,
    ".muted { color: #6b7280 } p { color: #111827 } @media only screen and (max-width: 600px) { .muted { font-size: 12px !important } }"
  ),
  "react-email-button": page(
    `<table align="center" width="100%" role="presentation" style="max-width:600px"><tbody><tr><td style="text-align:center;padding:24px">
      <p style="font-size:16px;margin:0 0 12px">Confirm your address to keep receiving updates</p>
      <a href="https://example.com/confirm" target="_blank" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;background-color:#111827;color:#ffffff;padding:12px 20px;border-radius:6px">Confirm email address</a>
    </td></tr></tbody></table>`
  ),
  "two-columns": page(
    `<table width="600" role="presentation" style="width:600px"><tbody><tr>
      <td class="col" width="300" style="width:300px;vertical-align:top"><p style="margin:0">Left column text about orders</p></td>
      <td class="col" width="300" style="width:300px;vertical-align:top"><p style="margin:0">Right column text about returns</p></td>
    </tr></tbody></table>
    <p style="margin:12px 0 0">A line under both columns stays put</p>`,
    "@media only screen and (max-width: 480px) { .col { display: block !important; width: 100% !important } }"
  ),
  "inline-block-columns": page(
    `<div style="width:600px;font-size:0">
      <div class="half" style="display:inline-block;width:300px;vertical-align:top;font-size:16px"><p style="margin:0">First half words here</p></div><div class="half" style="display:inline-block;width:300px;vertical-align:top;font-size:16px"><p style="margin:0">Second half words here</p></div>
    </div><p style="margin:8px 0 0">Footer line under the halves</p>`
  ),
  "flex-row": page(
    `<div style="display:flex;width:600px;justify-content:space-between"><p style="margin:0;flex:1">Plan name Pro</p><p style="margin:0;flex:1;text-align:right">Monthly 20 dollars</p></div><p style="margin:8px 0 0">Billed every month until you cancel</p>`
  ),
  "headings-lists": page(
    `<h2 class="title" style="margin:0">Release notes</h2><ul style="margin:8px 0;padding-left:20px"><li>Faster exports for large designs</li><li class="hot">New color picker</li><li>Fixed a crash on save</li></ul><p><strong>Bold note</strong> and <em>an italic aside</em> and <u>underlined words</u> in one line</p>`,
    "h2.title { color: #0f766e; font-size: 22px } .title { color: #b91c1c } li.hot { font-weight: bold } ul li { color: #374151 }"
  ),
  "card-on-color": page(
    `<table width="100%" bgcolor="#f3f4f6" role="presentation"><tbody><tr><td align="center" style="padding:24px">
      <table width="480" bgcolor="#ffffff" role="presentation" style="border-radius:8px"><tbody><tr><td style="padding:20px">
        <p style="margin:0;color:#111827">Your order shipped on Monday</p>
        <p style="margin:8px 0 0;color:#4b5563;font-size:13px">Tracking updates every few hours</p>
      </td></tr></tbody></table>
    </td></tr></tbody></table>`
  ),
  "centered-blocks": page(
    `<table width="600" role="presentation"><tbody><tr><td align="center">
      <p style="margin:0">Your code is below</p>
      <div style="width:220px;padding:10px 0;border:1px solid #929292;text-align:center">ABC 123 456</div>
      <p style="margin:12px 0 0;text-align:left">This code expires in ten minutes</p>
    </td></tr></tbody></table>`
  ),
  "variables-and-media": page(
    `<div class="wrap"><p class="lead">Lead paragraph with the main news</p><p class="small">Small print at the bottom of the email</p></div>`,
    ":root { --brand: #7c3aed; --pad: 16px } .wrap { padding: var(--pad) } .lead { color: var(--brand); font-size: 18px } .small { font-size: 12px; color: #6b7280 } @media (max-width: 600px) { .lead { font-size: 16px } .small { display: none } }"
  ),
  "links-and-images": page(
    `<p style="margin:0">Read <a href="https://example.com/a">the full story</a> or <a href="https://example.com/b" target="_blank" style="color:#e11d48">see the photos</a></p>
     <img src="https://example.com/logo.png" width="120" height="40" alt="Acme logo" style="display:block;border:0">
     <p style="margin:8px 0 0">Sent by Acme to ada at example dot com</p>`
  ),
  "nested-inherit": page(
    `<div style="color:#1d4ed8;font-size:20px;font-style:italic;text-transform:uppercase"><section><p style="margin:0">Inherited styles reach here</p><p style="margin:0;font-size:0.8em">Relative size line</p></section></div><p style="margin:0">Plain line outside</p>`
  ),
  "elements-like": page(
    `<div class="u-row-container" style="padding:0"><div class="u-row" style="margin:0 auto;min-width:320px;max-width:600px"><div style="display:table;width:100%">
      <div class="u-col u-col-50" style="display:table-cell;vertical-align:top;width:300px"><div style="padding:10px"><p style="margin:0;font-size:14px;line-height:140%">Elements column one copy</p></div></div>
      <div class="u-col u-col-50" style="display:table-cell;vertical-align:top;width:300px"><div style="padding:10px"><p style="margin:0;font-size:14px;line-height:140%;text-align:right">Elements column two copy</p></div></div>
    </div></div></div>`,
    "@media only screen and (min-width: 620px) { .u-row .u-col-50 { width: 300px !important } } @media only screen and (max-width: 620px) { .u-row .u-col { display: block !important; width: 100% !important } }"
  ),
};
