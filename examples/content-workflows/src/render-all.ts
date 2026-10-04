import { mkdir, writeFile } from "node:fs/promises";
import { renderToHtml } from "@unlayer/react-elements";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { htmlToPdf } from "./pdf";
import "./render-email";

await mkdir("output", { recursive: true });
const webHtml = renderToHtml(invoiceTemplate(sampleInvoice, "web"));
const documentHtml = renderToHtml(invoiceTemplate(sampleInvoice, "document"));
await writeFile("output/invoice.web.html", webHtml);
await writeFile("output/invoice.document.html", documentHtml);
await writeFile("output/invoice.pdf", await htmlToPdf(documentHtml));
console.log("Wrote output/invoice.web.html, invoice.document.html and invoice.pdf");
