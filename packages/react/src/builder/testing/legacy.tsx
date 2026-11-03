/**
 * A design JSON drawn as the builder draws it: today's components given each item's values, which today's exporters
 * write (as the builder's do). For the Builder stories, which put it beside what fromDesign() gives back.
 */
import React from "react";
import { Button, Column, Divider, Document, Email, Heading, Html, Image, Menu, Page, PageBreak, Paragraph, Row, Social, Video } from "../../index";
import { HIDDEN } from "../manifest";
import type { Design } from "../write";

const TOOLS: Record<string, React.ComponentType<any>> = { text: Paragraph, heading: Heading, button: Button, image: Image, divider: Divider, menu: Menu, social: Social, video: Video, html: Html, page_break: PageBreak };
const ROOTS = { email: Email, web: Page, document: Document } as const;

export function legacyOf(design: Design, mode: keyof typeof ROOTS = "email"): React.ReactElement {
  const Root = ROOTS[mode] as React.ComponentType<any>;
  return (
    <Root values={design.body.values}>
      {design.body.rows.map((row, r) => (
        <Row key={r} cells={row.cells} values={row.values as never}>
          {row.columns.map((column, c) => (
            <Column key={c} values={column.values as never}>
              {column.contents.map((content, i) => {
                const Tool = TOOLS[content.type];
                return Tool ? <Tool key={i} values={content.values} /> : null;
              })}
            </Column>
          ))}
        </Row>
      ))}
    </Root>
  );
}

/** The design without its hidden properties: only what the builder draws. */
export function withoutHidden(design: Design): Design {
  const copy = JSON.parse(JSON.stringify(design)) as Design;
  const strip = (tool: string, values: Record<string, any>) => {
    for (const { key, path } of HIDDEN[tool] ?? []) {
      if (path.startsWith("hidden.")) delete values._override?.[path.slice(7)]?.[key];
      else {
        delete values[key];
        delete values._override?.mobile?.[key];
      }
    }
  };
  strip("body", copy.body.values);
  for (const rows of [copy.body.rows, copy.body.headers ?? [], copy.body.footers ?? []]) {
    for (const row of rows) {
      strip("row", row.values);
      for (const column of row.columns) {
        strip("column", column.values);
        for (const content of column.contents) strip(content.type, content.values);
      }
    }
  }
  return copy;
}
