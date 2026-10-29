import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render, renderHook } from "@testing-library/react";
import { UnlayerProvider, useUnlayerConfig, PROVIDER_ACTIVE_KEY } from "./UnlayerProvider";
import { Body, Button, Column, Document, Email, Page, Paragraph, Row, Social, renderToHtml, renderToHtmlParts, renderToJson, renderToPlainText } from "../index";

describe("UnlayerProvider", () => {
  it("returns default config when no provider", () => {
    const { result } = renderHook(() => useUnlayerConfig());
    expect(result.current.cdnBaseUrl).toBe("https://cdn.tools.unlayer.com");
    expect(result.current.mode).toBe("web");
  });

  it("merges config with defaults", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UnlayerProvider config={{ cdnBaseUrl: "https://custom.cdn.com" }}>
        {children}
      </UnlayerProvider>
    );
    const { result } = renderHook(() => useUnlayerConfig(), { wrapper });
    expect(result.current.cdnBaseUrl).toBe("https://custom.cdn.com");
    expect(result.current.mode).toBe("web"); // default preserved
  });

  it("sets provider active flag", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <UnlayerProvider config={{}}>{children}</UnlayerProvider>
    );
    const { result } = renderHook(() => useUnlayerConfig(), { wrapper });
    expect((result.current as any)[PROVIDER_ACTIVE_KEY]).toBe(true);
  });

  it("does not set provider active flag without provider", () => {
    const { result } = renderHook(() => useUnlayerConfig());
    expect((result.current as any)[PROVIDER_ACTIVE_KEY]).toBeUndefined();
  });
});

/**
 * A root's config, most specific first: the render function's options, the root's `config` prop, the nearest
 * <UnlayerProvider>'s, then the defaults; key by key. The HTML and the design read the same.
 */
describe("UnlayerProvider config", () => {
  const roots = [["Email", Email], ["Page", Page], ["Document", Document]] as const;
  const provider = { cdnBaseUrl: "https://provider.example", textDirection: "rtl", toSafeHtml: (html: string) => html.replace("Hi", "Hey") };
  const content = (
    <Row>
      <Column>
        <Paragraph text="Hi there" />
        <Social icons={[{ name: "Facebook", url: "https://facebook.com/acme" }]} />
      </Column>
    </Row>
  );
  /** What the config set in some HTML: the icons' CDN, the direction, and whether `toSafeHtml` ran. */
  const set = (html: string) => ({
    cdn: /src="(https:\/\/[^"]*?)\/social\/icons\//.exec(html)?.[1],
    // On <html>, or on the body's own tag (as React renders a root, or the parts' body).
    rtl: [...html.matchAll(/<[a-z]+ [^>]*>/g)].some(([tag]) => /^<html |\bu_body\b/.test(tag) && / dir="rtl"/.test(tag)),
    safe: html.includes("Hey there"),
  });
  const PROVIDED = { cdn: "https://provider.example", rtl: true, safe: true };

  it.each(roots)("is the root's under its own `config` and the render function's options, key by key (%s)", (_, Root) => {
    const html = (root: React.ReactElement, options?: Parameters<typeof renderToHtml>[1]) => set(renderToHtml(root, options));
    expect(html(<Root>{content}</Root>)).toEqual({ cdn: "https://cdn.tools.unlayer.com", rtl: false, safe: false });
    expect(html(<UnlayerProvider config={provider}><Root>{content}</Root></UnlayerProvider>)).toEqual(PROVIDED);
    // The root's config wins where it sets a key; the Provider's other keys stay.
    expect(html(<UnlayerProvider config={provider}><Root config={{ cdnBaseUrl: "https://root.example" }}>{content}</Root></UnlayerProvider>)).toEqual({ ...PROVIDED, cdn: "https://root.example" });
    // The options win over both, and a key they leave undefined comes from below.
    expect(html(<UnlayerProvider config={provider}><Root config={{ cdnBaseUrl: "https://root.example" }}>{content}</Root></UnlayerProvider>, { cdnBaseUrl: "https://option.example", textDirection: undefined })).toEqual({ ...PROVIDED, cdn: "https://option.example" });
    // The root's own `textDirection` is more specific than the Provider's; its `config.textDirection` more than that.
    expect(html(<UnlayerProvider config={provider}><Root textDirection="ltr">{content}</Root></UnlayerProvider>).rtl).toBe(false);
    expect(html(<UnlayerProvider config={{ textDirection: "ltr" }}><Root textDirection="ltr" config={{ textDirection: "rtl" }}>{content}</Root></UnlayerProvider>).rtl).toBe(true);
    // A root rendered as React renders it (renderToStaticMarkup) reads the same.
    expect(set(renderToStaticMarkup(<UnlayerProvider config={provider}><Root config={{ cdnBaseUrl: "https://root.example" }}>{content}</Root></UnlayerProvider>))).toEqual({ ...PROVIDED, cdn: "https://root.example" });
    expect(set(renderToStaticMarkup(<UnlayerProvider config={provider}><Root textDirection="ltr">{content}</Root></UnlayerProvider>)).rtl).toBe(false);
  });

  it.each(roots)("works as the render root and around a template component, through every renderer, and in the design (%s)", (_, Root) => {
    const Welcome = () => <Root>{content}</Root>;
    const Wrapped = () => <UnlayerProvider config={provider}><Root>{content}</Root></UnlayerProvider>;
    for (const element of [<UnlayerProvider config={provider}><Root>{content}</Root></UnlayerProvider>, <UnlayerProvider config={provider}><Welcome /></UnlayerProvider>, <Wrapped />]) {
      expect(set(renderToHtml(element))).toEqual(PROVIDED);
      const parts = renderToHtmlParts(element);
      expect(set(parts.body)).toEqual(PROVIDED);
      expect(renderToPlainText(element)).toContain("Hey there");
      const design = renderToJson(element);
      expect(design.body.values.textDirection).toBe("rtl");
      // A text block in a right-to-left design starts on the right, as in the HTML.
      expect((design.body.rows[0].columns[0].contents[0].values as { textAlign?: string }).textAlign).toBe("right");
      expect(renderToHtml(element)).toMatch(/text-align: ?right/);
      // React renders it the same.
      expect(set(renderToStaticMarkup(element))).toEqual(PROVIDED);
    }
    // Without a Provider, the design keeps no direction, as before.
    expect("textDirection" in renderToJson(<Welcome />).body.values).toBe(false);
    // The root's own config is in the design too.
    expect(renderToJson(<Root config={{ textDirection: "rtl" }}>{content}</Root>).body.values.textDirection).toBe("rtl");
  });

  it("gives a <Body> its mode, which Email, Page and Document lock", () => {
    const body = <Body><Row><Column><Paragraph text="Hi" /></Column></Row></Body>;
    const layout = (html: string) => (html.includes('xmlns:v="urn:schemas-microsoft-com:vml"') ? "email" : html.startsWith("<!doctype html>") ? "web" : "document");
    for (const mode of ["email", "web", "document"] as const) {
      expect(layout(renderToHtml(<UnlayerProvider config={{ mode }}>{body}</UnlayerProvider>))).toBe(mode);
      expect(layout(renderToHtml(<UnlayerProvider config={{ mode }}><Email><Row><Column><Paragraph text="Hi" /></Column></Row></Email></UnlayerProvider>))).toBe("email");
    }
    // As React renders it: an email's tables, or a page's divs.
    const tables = (element: React.ReactElement) => /<table/.test(renderToStaticMarkup(element));
    expect(tables(<UnlayerProvider config={{ mode: "email" }}>{body}</UnlayerProvider>)).toBe(true);
    expect(tables(<UnlayerProvider config={{ mode: "web" }}><Email><Row><Column><Paragraph text="Hi" /></Column></Row></Email></UnlayerProvider>)).toBe(true);
    expect(tables(<UnlayerProvider config={{ mode: "web" }}>{body}</UnlayerProvider>)).toBe(false);
    // The render function's mode wins over the Provider's.
    expect(layout(renderToHtml(<UnlayerProvider config={{ mode: "email" }}>{body}</UnlayerProvider>, { mode: "document" }))).toBe("document");
  });

  it("configures a root rendered and re-rendered on the client, without a word from React", () => {
    const error = vi.spyOn(console, "error");
    try {
      const tree = (cdnBaseUrl: string) => <UnlayerProvider config={{ ...provider, cdnBaseUrl }}><Email>{content}</Email></UnlayerProvider>;
      // (The browser drops the email's <body> tag, with its `dir`, inside the page's.)
      const { container, rerender } = render(tree("https://first.example"));
      expect(set(container.innerHTML)).toMatchObject({ cdn: "https://first.example", safe: true });
      rerender(tree("https://second.example"));
      expect(set(container.innerHTML)).toMatchObject({ cdn: "https://second.example", safe: true });
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("merges a Provider inside another over it, key by key", () => {
    const element = (
      <UnlayerProvider config={provider}>
        <UnlayerProvider config={{ cdnBaseUrl: "https://inner.example" }}>
          <Email>{content}</Email>
        </UnlayerProvider>
      </UnlayerProvider>
    );
    expect(set(renderToHtml(element))).toEqual({ ...PROVIDED, cdn: "https://inner.example" });
    expect(set(renderToStaticMarkup(element))).toEqual({ ...PROVIDED, cdn: "https://inner.example" });
    expect(renderToJson(element).body.values.textDirection).toBe("rtl");
  });

  it("gives its headConfig to the head, and its config to useUnlayerConfig() in the template and its content", () => {
    const hasFeature = vi.fn(() => false);
    const seen: string[] = [];
    const Cdn = () => {
      seen.push(useUnlayerConfig().cdnBaseUrl);
      return <Paragraph text="Hi" />;
    };
    const Welcome = () => {
      seen.push(useUnlayerConfig().cdnBaseUrl);
      return <Page><Row><Column><Cdn /><Button href="https://example.com">Go</Button></Column></Row></Page>;
    };
    renderToHtmlParts(<UnlayerProvider config={{ cdnBaseUrl: "https://provider.example", headConfig: { hasFeature } }}><Welcome /></UnlayerProvider>);
    expect(hasFeature).toHaveBeenCalledWith("legacy.disableHoverButtonColors");
    expect(new Set(seen)).toEqual(new Set(["https://provider.example"]));
  });
});
