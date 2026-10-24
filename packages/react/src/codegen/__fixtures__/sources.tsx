/**
 * The designs codegen's round trip and type-check tests convert: Elements' own templates (the examples, the demo's
 * templates, the content-workflows invoice, the regression patterns' designs), each rendered with renderToJson, and
 * designs the editor saved (the device-settings fixtures and a kitchen sink of every block).
 */
import React from "react";
import { vi } from "vitest";
import { renderToJson } from "../../index";
import { invoiceTemplate, sampleInvoice } from "../../../../../examples/content-workflows/src/invoice";
import deviceParity from "../../utils/fixtures/device-parity.json";
import kitchenSink from "./editor-kitchen-sink.json";
import type { DisplayMode } from "../design-to-elements";
import type { Plain } from "../values";

// Vite's `import.meta.glob` (Vitest runs this file; the package's types don't load Vite's).
declare global {
  interface ImportMeta {
    glob<T>(patterns: string | string[], options: { eager: true; import?: string; query?: string }): Record<string, T>;
  }
}

export interface Case {
  name: string;
  source: string;
  design: () => Plain;
  displayMode?: DisplayMode;
}

export const quiet = <T,>(run: () => T): T => {
  const spies = (["warn", "error", "info"] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}));
  try {
    return run();
  } finally {
    spies.forEach((spy) => spy.mockRestore());
  }
};

const fromTemplate = (element: () => React.ReactElement) => () => quiet(() => renderToJson(element()) as unknown as Plain);
const modeOf = (element: React.ReactElement): DisplayMode => {
  const name = (element.type as { displayName?: string })?.displayName;
  return name === "Page" ? "web" : name === "Document" ? "document" : "email";
};

export const SOURCES: Case[] = [];
const cases = SOURCES;

// The examples (each exports its template as a component; PhoneOverrides renders its HTML, not a template).
const examples = import.meta.glob<Record<string, unknown>>(["../../examples/*.stories.tsx", "../../SpotifyWelcome.stories.tsx"], { eager: true });
for (const [path, module] of Object.entries(examples)) {
  for (const [name, value] of Object.entries(module)) {
    if (typeof value !== "function" || !/^[A-Z]/.test(name) || name === "PhoneOverrides") continue;
    const Template = value as React.FC;
    cases.push({ name, source: `example ${path.split("/").pop()}`, design: fromTemplate(() => <Template />) });
  }
}

// The demo's templates.
const demo = import.meta.glob<{ default: React.FC }>("../../../../demo/src/templates/*.tsx", { eager: true });
for (const [path, module] of Object.entries(demo)) {
  const Template = module.default;
  cases.push({ name: path.split("/").pop()!.replace(/\.tsx$/, ""), source: "demo template", design: fromTemplate(() => <Template />), displayMode: modeOf(Template({}) as React.ReactElement) });
}

// The content-workflows invoice, in each mode.
for (const mode of ["email", "web", "document"] as const) {
  cases.push({ name: `invoice (${mode})`, source: "content-workflows example", design: fromTemplate(() => invoiceTemplate(sampleInvoice, mode)), displayMode: mode });
}

// The regression patterns' designs (renderToJson's, reviewed).
const patterns = import.meta.glob<Plain>("../../regression/__snapshots__/patterns/*.json", { eager: true, import: "default" });
for (const [path, design] of Object.entries(patterns)) {
  const name = path.split("/").pop()!.replace(/\.json$/, "");
  cases.push({ name, source: "regression pattern", design: () => design, displayMode: /web-page|html-from/.test(name) ? "web" : name === "print-document" ? "document" : "email" });
}

// Designs the editor saved.
for (const [i, fixture] of (deviceParity as Array<{ name: string; mode: DisplayMode; design: Plain }>).entries()) {
  cases.push({ name: `${fixture.name} (${fixture.mode}) #${i + 1}`, source: "editor design (device settings)", design: () => fixture.design, displayMode: fixture.mode });
}
cases.push({ name: "kitchen sink", source: "editor design", design: () => kitchenSink as Plain });

