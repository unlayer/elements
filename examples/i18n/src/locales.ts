import { readFile } from "node:fs/promises";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

/** One file per locale in messages/, nested by email, with ICU placeholders: "Hi {name}". */
export interface Messages {
  shipped: Record<"subject" | "preview" | "heading" | "greeting" | "cta", string>;
}

/** Elements renders synchronously, so load a locale's messages before rendering. */
export async function loadMessages(locale: Locale): Promise<Messages> {
  return JSON.parse(await readFile(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
}

const RTL_LANGUAGES = new Set(["ar", "fa", "he", "ur"]);

/** The value for the root's `textDirection` prop. */
export function directionOf(locale: string): "ltr" | "rtl" {
  return RTL_LANGUAGES.has(new Intl.Locale(locale).language) ? "rtl" : "ltr";
}

export interface Order {
  id: string;
  customer: string;
  trackingUrl: string;
}

export const sampleOrder: Order = {
  id: "A-1042",
  customer: "Ada",
  trackingUrl: "https://example.com/orders/A-1042",
};
