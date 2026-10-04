# React transactional email, web, PDF, and visual editing example

One invoice template demonstrates `@unlayer/react-elements` rendering and delivery. Use this example for receipts, order confirmations, invoices, or AI-generated templates that need visual editing. All commands below run from the repository root with Node.js 20+ and pnpm 9.

## Install and run

```bash
pnpm install
pnpm build
pnpm --filter @unlayer/content-workflows-example render:email
pnpm --filter @unlayer/content-workflows-example exec playwright install chromium
pnpm --filter @unlayer/content-workflows-example render:all
```

The files are written to `examples/content-workflows/output/`:

| File | Expected output |
|------|-----------------|
| `invoice.email.html` | Complete email document with Outlook conditionals |
| `invoice.txt` | Plain-text email body |
| `invoice.design.json` | Unlayer design with one row, one column, and five content items |
| `invoice.web.html` | Responsive web document |
| `invoice.document.html` | Print-ready HTML |
| `invoice.pdf` | A4 PDF bytes printed by Chromium |

All contain invoice INV-1001 for Ada Lovelace, paid $49.00. The render commands create files locally and do not send email. System fonts and no remote images make this sample independent of asset downloads.

```bash
pnpm --filter @unlayer/content-workflows-example preview
```

Open <http://127.0.0.1:3001/output/invoice.web.html> for the web receipt, or <http://127.0.0.1:3001/editor.html> to load the design in Unlayer's hosted editor. The editor requires internet access. Its download button exports edited JSON and HTML; it does not change the React source or send email.

## Delivery

The [provider guide](../../packages/react/docs/email-providers.md) lists install commands, environment variables, and one send command per provider. Only `send:*` commands send email. Export credentials into the process environment; this example does not automatically load `.env` files.

## Files and validation

- `src/invoice.tsx`: shared component tree and sample data.
- `src/message.ts`: HTML and plain-text renderer plus environment handling.
- `src/render-email.ts` / `src/render-all.ts`: output files.
- `src/pdf.ts`: Playwright PDF generation and browser cleanup.
- `src/providers/`: Resend, SES, Postmark, SendGrid, and SMTP delivery.
- `editor.html`: wait for editor readiness, load design, export edits.

```bash
pnpm --filter @unlayer/content-workflows-example typecheck
pnpm --filter @unlayer/content-workflows-example test
```

Tests check invoice content in Chromium across all three modes, plain text, editable JSON, escaped customer input, URL validation, and real PDF bytes. They do not send email or depend on the hosted editor. Review inbox compatibility and PDF pagination with your real content before deployment. See the [task guides](../../packages/react/docs/README.md) for constraints and adaptation.
