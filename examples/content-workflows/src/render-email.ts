import { mkdir, writeFile } from "node:fs/promises";
import { renderToJson } from "@unlayer/react-elements";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { renderInvoiceEmail } from "./message";

await mkdir("output", { recursive: true });
const { html, text } = renderInvoiceEmail();
const design = renderToJson(invoiceTemplate(sampleInvoice, "email"));
await writeFile("output/invoice.email.html", html);
await writeFile("output/invoice.txt", text);
await writeFile("output/invoice.design.json", JSON.stringify(design, null, 2));
console.log("Wrote output/invoice.email.html, invoice.txt and invoice.design.json");
