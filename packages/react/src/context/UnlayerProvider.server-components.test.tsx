// @vitest-environment node
/**
 * React Server Components' React has no context (React's `react-server` build has no createContext or useContext).
 * There an <UnlayerProvider> still configures the root a render function renders, which reads its config off the
 * element, and where React renders it, it renders what's in it (it can't reach a root through context). Its own file:
 * React is mocked for all of it.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("react", async (original) => {
  const real = (await original<typeof import("react")>()) as Record<string, any>;
  const none = { createContext: undefined, useContext: undefined };
  return { ...real, ...none, default: { ...real.default, ...none } };
});

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Column, DEFAULT_CONFIG, Email, Paragraph, Row, Social, UnlayerProvider, renderToHtml, renderToJson, useUnlayerConfig } from "../index";

describe("UnlayerProvider with React Server Components' React (no context)", () => {
  const content = (
    <Row>
      <Column>
        <Paragraph text="Hi" />
        <Social icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} />
      </Column>
    </Row>
  );
  const config = { cdnBaseUrl: "https://provider.example", textDirection: "rtl" };

  it("has no context to create", () => {
    expect((React as unknown as Record<string, unknown>).createContext).toBeUndefined();
  });

  it("configures the root the render functions render, and the design", () => {
    const Welcome = () => <Email>{content}</Email>;
    for (const element of [<UnlayerProvider config={config}><Email>{content}</Email></UnlayerProvider>, <UnlayerProvider config={config}><Welcome /></UnlayerProvider>]) {
      const html = renderToHtml(element);
      expect(html).toContain('src="https://provider.example/social/icons/');
      expect(html).toMatch(/<html[^>]* dir="rtl"/);
      expect(renderToJson(element).body.values.textDirection).toBe("rtl");
    }
  });

  it("renders what's in it where React renders it, and useUnlayerConfig() gives the defaults", () => {
    let seen: unknown;
    const Reads = () => {
      seen = useUnlayerConfig();
      return <Paragraph text="Hi" />;
    };
    const html = renderToStaticMarkup(<UnlayerProvider config={config}><Email><Row><Column><Reads /></Column></Row></Email></UnlayerProvider>);
    expect(html).toContain("Hi");
    expect(seen).toBe(DEFAULT_CONFIG);
  });
});
