import { renderToHtml, renderToPlainText } from "@unlayer/react-elements";
import { invoiceTemplate, sampleInvoice, type InvoiceData } from "./invoice";

export function renderInvoiceEmail(data: InvoiceData = sampleInvoice) {
  const email = invoiceTemplate(data, "email");
  return {
    subject: `Receipt for invoice ${data.number}`,
    html: renderToHtml(email, { title: `Invoice ${data.number}` }),
    text: renderToPlainText(email),
  };
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Set ${name} before sending email`);
  return value;
}

export function deliveryMessage() {
  return {
    ...renderInvoiceEmail(),
    from: requireEnv("EMAIL_FROM"),
    to: requireEnv("EMAIL_TO"),
  };
}
