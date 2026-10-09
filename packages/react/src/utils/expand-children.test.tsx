import { describe, it, expect } from "vitest";
import React, { memo, useState } from "react";
import { renderToHtml } from "./render-to-html";
import { renderToJson } from "./render-to-json";
import { Email, Row, Column, Paragraph } from "../index";

const block = (text: string, props: Record<string, unknown> = {}) => <Row><Column><Paragraph {...props}>{text}</Paragraph></Column></Row>;
const Header = () => block("Header");
const Pair = () => [<React.Fragment key="a">{block("Pair one")}</React.Fragment>, block("Pair two")];
const Gappy = () => <>{null}{block("Gappy")}{false}</>;
const MemoRow = memo(() => block("Memo"));
const Note = ({ text }: { text: string }) => {
  const [value] = useState(text); // a hook: called in a render of its own
  return <Paragraph>{value}</Paragraph>;
};

const template = (
  <Email>
    <Header />
    <>{block("Fragment")}</>
    <Pair />
    <Gappy />
    <MemoRow />
    <Row><Column><Note text="Note" /><Paragraph mobile={{ fontSize: "30px" }}>Target</Paragraph></Column></Row>
    {block("Last")}
  </Email>
);
const order = ["Header", "Fragment", "Pair one", "Pair two", "Gappy", "Memo", "Note", "Target", "Last"];

describe("Fragments and user components among the blocks", () => {
  it("render every block once, in order, each with its own id", () => {
    const html = renderToHtml(template);
    const body = html.slice(html.indexOf("<body"));
    const texts = order.map((t) => body.indexOf(`>${t}<`));
    expect(texts.every((at) => at > 0)).toBe(true);
    expect([...texts].sort((a, b) => a - b)).toEqual(texts);
    const ids = [...body.matchAll(/id="(u_(?:row|column|content_paragraph)_\d+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    // Every row renders as an email row, a user component's too.
    expect(body.match(/<!--\[if \(mso\)\|\(IE\)\]><table[^>]*><tr><td align="center"/g)?.length ?? 0).toBeGreaterThan(0);
    expect(ids.filter((id) => id.startsWith("u_row_")).length).toBe(8);
  });

  it("put the phone CSS on the block that asked for it, and the design has the same blocks", () => {
    const html = renderToHtml(template);
    const selector = /#(u_content_paragraph_\d+)[^{]*\{[^}]*font-size:\s*30px/.exec(html)?.[1];
    const targetId = new RegExp(`id="(u_content_paragraph_\\d+)"[^>]*>(?:(?!id=")[\\s\\S])*?>Target<`).exec(html)?.[1];
    expect(selector).toBeDefined();
    expect(selector).toBe(targetId);
    expect(html.match(new RegExp(`id="${selector}"`, "g"))).toHaveLength(1);

    const design = renderToJson(template) as any;
    const paragraphs = design.body.rows.flatMap((r: any) => r.columns.flatMap((c: any) => c.contents));
    expect(paragraphs.map((p: any) => (p.values.text ?? "").replace(/<[^>]+>/g, ""))).toEqual(order);
    // The design names a paragraph as the editor does (`u_content_text_N`): the same N.
    expect(paragraphs.find((p: any) => /Target/.test(p.values.text)).values._meta.htmlID.replace("_text_", "_paragraph_")).toBe(selector);
  });

  it("leave a template without them as it was", () => {
    const plain = <Email>{block("One")}{block("Two", { mobile: { fontSize: "30px" } })}</Email>;
    const html = renderToHtml(plain);
    expect(/#(u_content_paragraph_\d+)[^{]*\{[^}]*font-size:\s*30px/.exec(html)?.[1]).toBe("u_content_paragraph_2");
  });
});
