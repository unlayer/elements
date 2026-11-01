import { describe, expect, it } from "vitest";
import { Column, Email, Heading, Paragraph, Row, renderToHtml, renderToJson, renderToPlainText } from "../index";
import { lowerDesign } from "./lower";
import { rowPaddingInEmail } from "./quirks";
import { renderWithNewEngine } from "./shadow";

const template = (
  <Email backgroundColor="#eeeeee" contentWidth="560px" textColor="#222222" previewText="Hi">
    <Row backgroundColor="#ffffff" padding="20px 40px 10px 40px" cells={[1, 2]}>
      <Column padding="8px">
        <Heading>Left</Heading>
      </Column>
      <Column>
        <Paragraph hideOnMobile>Right</Paragraph>
      </Column>
    </Row>
  </Email>
);

describe("lowerDesign()", () => {
  it("makes the body the Email, a row a Section around a Row, its columns' shares percentages, a block what block() makes", () => {
    const blocks: string[] = [];
    const { root } = lowerDesign(renderToJson(template) as never, { mode: "email", block: (b) => (blocks.push(b.type), { type: "Raw", props: { html: b.type } }) });
    expect(root).toMatchObject({ type: "Email", props: { width: 560, previewText: "Hi" }, style: { backgroundColor: "#eeeeee", color: "#222222" } });
    const [section] = root.children as any[];
    expect(section).toMatchObject({ type: "Section", style: { backgroundColor: "#ffffff", padding: { top: 20, right: 0, bottom: 10, left: 0 } } });
    const [left, right] = section.children[0].children;
    expect([left.style.width, right.style.width]).toEqual(["33.3333%", "66.6667%"]);
    expect(left.style.padding).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
    expect(right.children[0]).toEqual({ type: "Raw", props: { html: "text" }, hidden: { mobile: true } });
    expect(blocks).toEqual(["heading", "text"]);
  });
});

describe("quirks", () => {
  it("leaves a row's sides out in an email, where legacy writes them outside the content", () => {
    expect(rowPaddingInEmail({ top: 20, right: 40, bottom: 10, left: 40 })).toEqual({ top: 20, right: 0, bottom: 10, left: 0 });
  });
});

describe("renderWithNewEngine()", () => {
  it("renders each block as legacy writes it, in its place, and the plain text legacy writes", () => {
    const { html, text } = renderWithNewEngine(template);
    const legacy = renderToHtml(template);
    for (const id of ["u_content_heading_1", "u_content_paragraph_1"]) {
      expect(html).toContain(`id="${id}"`);
      expect(legacy).toContain(`id="${id}"`);
    }
    expect(html.indexOf(">Left<")).toBeLessThan(html.indexOf(">Right<"));
    expect(text).toBe(renderToPlainText(template));
  });
});
