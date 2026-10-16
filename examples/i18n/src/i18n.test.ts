import assert from "node:assert/strict";
import { test } from "node:test";
import i18next from "i18next";
import { loadMessages, sampleOrder, type Locale } from "./locales";
import * as withNextIntl from "./next-intl";
import { createI18n, renderShippedEmail as renderWithI18next } from "./react-i18next";
import * as withReactIntl from "./react-intl";

const expected: Record<Locale, { dir: string; subject: string; heading: string; greeting: string; cta: string; preview: string }> = {
  en: {
    dir: "ltr",
    subject: "Order A-1042 has shipped",
    heading: "Your order has shipped",
    greeting: "Hi Ada, order A-1042 is on its way.",
    cta: "Track your package",
    preview: "Your order is on its way.",
  },
  ar: {
    dir: "rtl",
    subject: "تم شحن طلبك A-1042",
    heading: "تم شحن طلبك",
    greeting: "مرحبًا Ada، طلبك A-1042 في الطريق إليك.",
    cta: "تتبّع شحنتك",
    preview: "طلبك في الطريق إليك.",
  },
};

const renderers: Record<string, (locale: Locale) => Promise<{ subject: string; html: string; text: string }>> = {
  "react-intl": async (locale) => withReactIntl.renderShippedEmail(locale, await loadMessages(locale), sampleOrder),
  "react-i18next": async (locale) => renderWithI18next(await createI18n(locale, await loadMessages(locale)), sampleOrder),
  "next-intl": async (locale) => withNextIntl.renderShippedEmail(locale, await loadMessages(locale), sampleOrder),
};

for (const [library, render] of Object.entries(renderers)) {
  test(`${library} renders the email in English and Arabic`, async () => {
    for (const locale of ["en", "ar"] as const) {
      const want = expected[locale];
      const { subject, html, text } = await render(locale);
      const htmlTag = html.match(/<html[^>]*>/)?.[0] ?? "";
      assert.match(htmlTag, new RegExp(` lang="${locale}"`));
      assert.match(htmlTag, new RegExp(` dir="${want.dir}"`));
      assert.equal(subject, want.subject);
      for (const phrase of [want.heading, want.greeting, want.cta, want.preview]) {
        assert.ok(html.includes(phrase), `${locale} HTML contains "${phrase}"`);
      }
      assert.ok(text.includes(want.greeting), `${locale} plain text contains the greeting`);
      // The heading and paragraph start on the reading side: right in Arabic, left in English.
      const aligned = html.match(/text-align: (left|right)/g) ?? [];
      assert.deepEqual(aligned, [`text-align: ${want.dir === "rtl" ? "right" : "left"}`, `text-align: ${want.dir === "rtl" ? "right" : "left"}`]);
    }
  });
}

test("rendering before i18next has loaded the messages fails instead of sending an empty email", (t) => {
  // react-i18next warns that useTranslation suspended; Elements then refuses to render.
  t.mock.method(console, "warn", () => {});
  const notLoaded = i18next.createInstance();
  assert.throws(() => renderWithI18next(notLoaded, sampleOrder), /async and suspending templates need/);
});
