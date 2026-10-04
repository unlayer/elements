import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToHtml, renderToJson } from "@unlayer/react-elements";
import { chromium } from "playwright";
import { invoiceTemplate, sampleInvoice } from "./invoice";
import { renderInvoiceEmail } from "./message";
import { htmlToPdf } from "./pdf";

test("the same invoice survives HTML, plain text and editable JSON rendering", async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const mode of ["email", "web", "document"] as const) {
      const html = renderToHtml(invoiceTemplate(sampleInvoice, mode));
      await page.setContent(html);
      assert.equal(await page.locator("body").count(), 1);
      assert.equal(await page.getByRole("heading", { name: "Payment receipt" }).count(), 1);
      assert.match(await page.locator("body").innerText(), /INV-1001/);
      assert.match(await page.locator("body").innerText(), /\$49\.00/);
      assert.equal(await page.getByRole("link", { name: "View invoice" }).getAttribute("href"), sampleInvoice.receiptUrl);
      if (mode === "email") assert.match(html, /\[if mso\]/);
      if (mode === "web") assert.match(html, /display:\s*flex/);
    }
    const { text } = renderInvoiceEmail();
    assert.match(text, /INV-1001/);
    assert.match(text, /Ada Lovelace/);
    const design = JSON.parse(JSON.stringify(renderToJson(invoiceTemplate(sampleInvoice, "email"))));
    assert.equal(design.body.rows.length, 1);
    assert.equal(design.body.rows[0].columns[0].contents.length, 5);
    assert.equal(design.body.values.preheaderText, "Your payment receipt is ready.");
    assert.match(JSON.stringify(design), /INV-1001/);
  } finally {
    await browser.close();
  }
});

test("customer data cannot introduce markup or unsafe receipt links", async () => {
  const customer = '<img src=x onerror="alert(1)"> & Co';
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(renderInvoiceEmail({ ...sampleInvoice, customer }).html);
    assert.equal(await page.locator("img").count(), 0);
    assert.ok((await page.locator("body").innerText()).includes(customer));
    assert.throws(() => invoiceTemplate({ ...sampleInvoice, receiptUrl: "javascript:alert(1)" }, "email"), /HTTPS/);
  } finally {
    await browser.close();
  }
});

test("document HTML produces a real PDF", async () => {
  const html = renderToHtml(invoiceTemplate(sampleInvoice, "document"));
  const pdf = await htmlToPdf(html);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 1000);
});
