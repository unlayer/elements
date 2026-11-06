import { mkdir, writeFile } from "node:fs/promises";
import { render } from "@unlayer/react-elements";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { htmlToPdf } from "./pdf";
import "./render-email";

await mkdir("output", { recursive: true });
const { html: webHtml } = await render(invoiceTemplate(sampleInvoice, "web"));
const { html: documentHtml } = await render(invoiceTemplate(sampleInvoice, "document"));
await writeFile("output/invoice.web.html", webHtml);
await writeFile("output/invoice.document.html", documentHtml);
await writeFile("output/invoice.pdf", await htmlToPdf(documentHtml));
console.info("Wrote output/invoice.web.html, invoice.document.html and invoice.pdf");
