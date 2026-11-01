// @vitest-environment node
/**
 * Renders inside renders that leave nothing of one tenant for another: in a spec of its own, as what one leaked was
 * every later render's in the process (vitest gives each file its own modules, and its own process state here).
 */
import React, { createContext, useContext } from "react";
import { renderToString } from "react-dom/server";
import { renderToString as renderToStringWithBrowserBuild } from "react-dom/server.browser";
import { describe, expect, it, vi } from "vitest";
import { Column, Email, Paragraph, RenderError, Row, renderToHtml, renderToPlainText } from "../index";

const User = createContext("TENANT:DEFAULT");
const Read = () => <>{useContext(User)}</>;
const email = (body: React.ReactNode) => <Email><Row><Column>{body}</Column></Row></Email>;
/** What later renders read where they provide nothing: Elements' (synchronous) and an app's own. */
const later = () => [renderToPlainText(email(<Paragraph><Read /></Paragraph>)).trim(), renderToString(<p><Read /></p>)];

describe("a render inside a render inside a render", () => {
  it("fails saying so, and leaves no provider's value for any render after it (another tenant's, an app's page)", () => {
    // A preview worked out inside a preview: Elements asked react-dom/server, under way below another module's render,
    // what it was doing, which left that render's providers out for good. The render failed with React's own "Tried to
    // pop a Context at the root of the app", and every synchronous render after it, the app's own too, read tenant A's
    // value.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Snippet = () => <Paragraph>{renderToPlainText(email(<Paragraph><Read /></Paragraph>)).trim()}</Paragraph>;
    const Summary = () => <Paragraph>{renderToPlainText(<Email><User.Provider value="TENANT:alice-secret"><Row><Column><Snippet /></Column></Row></User.Provider></Email>).trim()}</Paragraph>;
    const tenantA = <Email><User.Provider value="TENANT:alice-secret"><Row><Column><Summary /></Column></Row></User.Provider></Email>;
    const failed = (() => {
      try {
        renderToHtml(tenantA);
      } catch (error) {
        return error;
      }
    })();
    expect(failed).toBeInstanceOf(RenderError);
    expect((failed as Error).message).not.toMatch(/This is a bug in React/);
    expect(later()).toEqual(["TENANT:DEFAULT", "<p>TENANT:DEFAULT</p>"]);
    vi.restoreAllMocks();
  });

  it("in an app's page: the page's render leaves no provider's value either, and isn't React's own error", () => {
    // An app's page shows an email whose template works out its preview text: the page's own render failed with React's
    // "Tried to pop a Context at the root of the app", and left its session's value for every render after it.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Welcome = () => <Email previewText={renderToPlainText(email(<Paragraph>Hi Ada</Paragraph>)).trim()}><Row><Column><Paragraph>Welcome</Paragraph></Column></Row></Email>;
    const EmailPreview = () => <section dangerouslySetInnerHTML={{ __html: renderToHtml(<Welcome />).length ? "email ok" : "" }} />;
    const page = <User.Provider value="TENANT:alice@acme (session 7f3a)"><header><Read /></header><EmailPreview /><header><Read /></header></User.Provider>;
    let html = "";
    let failed: unknown;
    try {
      html = renderToString(page);
    } catch (error) {
      failed = error;
    }
    // (It renders, or fails by name: a render two deep inside the page.)
    if (failed) expect(failed).toBeInstanceOf(RenderError);
    else expect(html).toBe("<header>TENANT:alice@acme (session 7f3a)</header><section>email ok</section><header>TENANT:alice@acme (session 7f3a)</header>");
    expect(later()).toEqual(["TENANT:DEFAULT", "<p>TENANT:DEFAULT</p>"]);
    vi.restoreAllMocks();
  });

  it("in an app's page another module of react-dom's renders, the one Elements renders with inside a template: it leaves nothing, and isn't React's own error", () => {
    // The page rendered with react-dom/server.browser's renderToString, the module Elements found to render a template's
    // own render with (on React 18): Elements asked it, under its own render, what it was doing, mid-way through the
    // page's render, and the page failed with React's "Tried to pop a Context at the root of the app". (In Node.js,
    // react-dom/server is server.node: with the page's module rendering, there's no other for the preview.)
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Welcome = () => <Email previewText={renderToPlainText(email(<Paragraph>Hi Ada</Paragraph>)).trim()}><Row><Column><Paragraph>Welcome</Paragraph></Column></Row></Email>;
    // (A page that shows what failed: where its own render fails inside its provider, React leaves that provider's value
    // in its module till it renders again, Elements or not. See README, "Contexts and the async renderers".)
    const EmailPreview = () => {
      try {
        return <section>{renderToHtml(<Welcome />).includes("Welcome") ? "email ok" : "no email"}</section>;
      } catch (error) {
        return <section>{error instanceof RenderError ? "said by name" : "React's own error"}</section>;
      }
    };
    const page = <User.Provider value="TENANT:alice@acme (session 7f3a)"><header><Read /></header><EmailPreview /><header><Read /></header></User.Provider>;
    expect(renderToStringWithBrowserBuild(page)).toMatch(/^<header>TENANT:alice@acme \(session 7f3a\)<\/header><section>(email ok|said by name)<\/section><header>TENANT:alice@acme \(session 7f3a\)<\/header>$/);
    expect(later()).toEqual(["TENANT:DEFAULT", "<p>TENANT:DEFAULT</p>"]);
    vi.restoreAllMocks();
  });
});
