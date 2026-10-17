import { mkdir, writeFile } from "node:fs/promises";
import { loadMessages, locales, sampleOrder } from "./locales";
import { renderShippedEmail } from "./react-intl";

await mkdir("output", { recursive: true });
for (const locale of locales) {
  const { subject, html, text } = renderShippedEmail(locale, await loadMessages(locale), sampleOrder);
  await writeFile(`output/shipped.${locale}.html`, html);
  await writeFile(`output/shipped.${locale}.txt`, text);
  console.info(`${locale}: ${subject} -> output/shipped.${locale}.html`);
}
