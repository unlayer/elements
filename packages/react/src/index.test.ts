import { describe, it, expect } from "vitest";
import {
  Button, Divider, Heading, Html, Image, Menu, Paragraph,
  Social, Table, Video, Row, Column, Body, Email, Page, Document,
  ColumnLayouts, validateColumnLayout,
  UnlayerProvider, useUnlayerConfig, DEFAULT_CONFIG,
  renderToHtml, renderToPlainText, renderToHtmlParts,
  renderToJson, htmlToTextJson,
} from "./index";

describe("@unlayer/react-elements exports", () => {
  it("exports all item components as functions with displayNames", () => {
    const items = { Button, Divider, Heading, Html, Image, Menu, Paragraph, Social, Table, Video };
    for (const [name, component] of Object.entries(items)) {
      expect(component, `${name} should be exported`).toBeTypeOf("function");
      expect((component as any).displayName, `${name} should have displayName`).toBe(name);
    }
  });

  it("exports container components", () => {
    expect(Row).toBeTypeOf("function");
    expect(Column).toBeTypeOf("function");
    expect(Body).toBeTypeOf("function");
  });

  it("exports semantic wrapper components", () => {
    expect(Email).toBeTypeOf("function");
    expect(Page).toBeTypeOf("function");
    expect(Document).toBeTypeOf("function");
  });

  it("exports layout utilities with correct data", () => {
    expect(ColumnLayouts).toBeDefined();
    expect(Object.keys(ColumnLayouts).length).toBeGreaterThan(0);
    expect(validateColumnLayout).toBeTypeOf("function");
  });

  it("exports context with correct default config", () => {
    expect(UnlayerProvider).toBeTypeOf("function");
    expect(useUnlayerConfig).toBeTypeOf("function");
    expect(DEFAULT_CONFIG).toBeDefined();
    expect(DEFAULT_CONFIG.cdnBaseUrl).toBe("https://cdn.tools.unlayer.com");
  });

  it("exports rendering functions", () => {
    expect(renderToHtml).toBeTypeOf("function");
    expect(renderToPlainText).toBeTypeOf("function");
    expect(renderToHtmlParts).toBeTypeOf("function");
    expect(renderToJson).toBeTypeOf("function");
    expect(htmlToTextJson).toBeTypeOf("function");
  });
});
