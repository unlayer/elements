import { describe, it, expect } from "vitest";
import React from "react";
import { registerElementsTool } from "./register-tool";
import { renderToHtml, renderToHtmlParts } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import Email from "../components/Email";
import Page from "../components/Page";
import Document from "../components/Document";
import Row from "../components/Row";
import Column from "../components/Column";
import Button from "../components/Button";

const countdownTool = {
  name: "countdown",
  label: "Countdown",
  icon: "fa-clock",
  options: { colors: { title: "Colors" } }, // editor-only, must be ignored
  values: { endTime: "2026-01-01", digitColor: "#404040" },
  renderer: {
    Viewer: () => "editor-only", // ignored
    exporters: {
      web: (values: any) =>
        `<div class="cd-web" style="color:${values.digitColor}">${values.endTime}</div>`,
      email: (values: any) =>
        `<table role="presentation" class="cd-email"><tr><td>${values.endTime}</td></tr></table>`,
    },
    head: {
      css: () => ".countdown-digits { font-variant-numeric: tabular-nums; }",
    },
  },
  validator: () => [], // editor-only, must be ignored
};

const Countdown = registerElementsTool(countdownTool);

const inEmail = (child: React.ReactElement) => (
  <Email>
    <Row>
      <Column>{child}</Column>
    </Row>
  </Email>
);

describe("registerElementsTool: rendering", () => {
  it("renders via the email exporter in email mode", () => {
    const html = renderToHtml(inEmail(<Countdown endTime="2026-08-01" />));
    expect(html).toContain('class="cd-email"');
    expect(html).toContain("2026-08-01");
    expect(html).not.toContain("cd-web");
    // content wrapper carries the custom-tool meta ids
    expect(html).toContain('id="u_content_custom_countdown_1"');
    expect(html).toContain('class="u_content_custom_countdown"');
  });

  it("renders via the web exporter in web mode", () => {
    const html = renderToHtml(
      <Page>
        <Row>
          <Column>
            <Countdown digitColor="#e11d48" />
          </Column>
        </Row>
      </Page>
    );
    expect(html).toContain('class="cd-web"');
    expect(html).toContain("color:#e11d48");
  });

  it("document mode falls back to the web exporter", () => {
    const html = renderToHtml(
      <Document>
        <Row>
          <Column>
            <Countdown />
          </Column>
        </Row>
      </Document>
    );
    expect(html).toContain('class="cd-web"');
  });

  it("an email-only tool renders everywhere via its email exporter", () => {
    const EmailOnly = registerElementsTool({
      name: "email_only",
      values: {},
      renderer: { exporters: { email: () => '<span class="eo">x</span>' } },
    });
    const html = renderToHtml(
      <Page>
        <Row>
          <Column>
            <EmailOnly />
          </Column>
        </Row>
      </Page>
    );
    expect(html).toContain('class="eo"');
  });

  it("merges flat props over defaults, with a values escape hatch", () => {
    const html = renderToHtml(inEmail(<Countdown values={{ endTime: "via-values" }} />));
    expect(html).toContain("via-values");
    const html2 = renderToHtml(inEmail(<Countdown />));
    expect(html2).toContain("2026-01-01"); // default value
  });
});

describe("registerElementsTool: head + document integration", () => {
  it("collects the tool's head css into renderToHtmlParts", () => {
    const { head } = renderToHtmlParts(inEmail(<Countdown />));
    expect(head).toContain("font-variant-numeric: tabular-nums");
  });

  it("collects the tool's head css into the full document", () => {
    const html = renderToHtml(inEmail(<Countdown />));
    expect(html).toContain("font-variant-numeric: tabular-nums");
  });
});

describe("registerElementsTool: sanitization", () => {
  it("applies configured toSafeHtml to the tool's output", () => {
    const Sketchy = registerElementsTool({
      name: "sketchy",
      values: {},
      renderer: {
        exporters: { email: () => '<div>ok<script>evil()</script></div>' },
      },
    });
    const stripScripts = (html: string) =>
      html.replace(/<script[\s\S]*?<\/script>/g, "");
    const html = renderToHtml(inEmail(<Sketchy />), { toSafeHtml: stripScripts });
    expect(html).toContain("<div>ok</div>");
    expect(html).not.toContain("evil()");
  });

  it("passes output through unchanged when no sanitizer is configured", () => {
    const html = renderToHtml(inEmail(<Countdown />));
    expect(html).toContain('class="cd-email"');
  });
});

describe("registerElementsTool: design JSON", () => {
  it("emits the editor's custom content shape", () => {
    const json = renderToJson(
      inEmail(<Countdown endTime="2026-08-01" digitColor="#e11d48" />)
    );
    const content = json.body.rows[0].columns[0].contents[0];
    expect(content.type).toBe("custom");
    expect(content.slug).toBe("countdown");
    expect(content.values.endTime).toBe("2026-08-01");
    expect(content.values.digitColor).toBe("#e11d48");
    expect(content.values._meta.htmlID).toBe("u_content_custom_countdown_1");
    expect(content.values._meta.htmlClassNames).toBe("u_content_custom_countdown");
  });

  it("counts multiple instances per slug", () => {
    const json = renderToJson(
      <Email>
        <Row>
          <Column>
            <Countdown />
            <Countdown />
          </Column>
        </Row>
      </Email>
    );
    const [first, second] = json.body.rows[0].columns[0].contents;
    expect(first.values._meta.htmlID).toBe("u_content_custom_countdown_1");
    expect(second.values._meta.htmlID).toBe("u_content_custom_countdown_2");
  });

  it("built-in components are unaffected (no slug field)", () => {
    const json = renderToJson(inEmail(<Countdown />));
    expect("slug" in json.body.rows[0].columns[0].contents[0]).toBe(true);
    const json2 = renderToJson(inEmail(<Button>B</Button>));
    const buttonContent = json2.body.rows[0].columns[0].contents[0];
    expect(buttonContent.type).toBe("button");
    expect("slug" in buttonContent).toBe(false);
  });
});

describe("registerElementsTool: validation", () => {
  it("throws without a name", () => {
    expect(() => registerElementsTool({ renderer: { exporters: { web: () => "" } } } as any)).toThrow(
      /name/
    );
  });

  it("throws without exporters", () => {
    expect(() => registerElementsTool({ name: "x", renderer: { exporters: {} } } as any)).toThrow(
      /exporter/
    );
  });
});
