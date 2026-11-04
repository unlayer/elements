import { render } from "@unlayer/react-elements/primitives";
import { invoiceTemplate, sampleInvoice, type InvoiceData } from "./invoice";

export async function renderInvoiceEmail(data: InvoiceData = sampleInvoice) {
  const { html, text } = await render(invoiceTemplate(data, "email"));
  return {
    subject: `Receipt for invoice ${data.number}`,
    html,
    text,
  };
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Set ${name} before sending email`);
  return value;
}

export async function deliveryMessage() {
  return {
    ...(await renderInvoiceEmail()),
    from: requireEnv("EMAIL_FROM"),
    to: requireEnv("EMAIL_TO"),
  };
}
