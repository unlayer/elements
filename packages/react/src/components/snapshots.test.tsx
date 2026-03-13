/**
 * Render Snapshot Tests
 *
 * Snapshots the HTML output of each component in web and email modes.
 * Catches regressions from upstream changes to:
 *   - codegen (editor-types)
 *   - renderers (exporters)
 *   - react wrappers (this package)
 *
 * To update snapshots after intentional changes:
 *   pnpm vitest --run -u src/components/snapshots.test.tsx
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import Button from "./Button";
import Divider from "./Divider";
import Heading from "./Heading";
import Html from "./Html";
import Image from "./Image";
import Menu from "./Menu";
import Paragraph from "./Paragraph";
import Social from "./Social";
import Table from "./Table";

import Video from "./Video";
import Body from "./Body";
import Row from "./Row";
import Column from "./Column";

function renderHtml(element: React.ReactElement): string {
  const { container } = render(element);
  return container.innerHTML;
}

describe("Render Snapshots", () => {
  describe("Button", () => {
    it("web", () => {
      expect(renderHtml(<Button mode="web">Click me</Button>)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Button mode="email">Click me</Button>)).toMatchSnapshot();
    });
  });

  describe("Divider", () => {
    it("web", () => {
      expect(renderHtml(<Divider mode="web" />)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Divider mode="email" />)).toMatchSnapshot();
    });
  });

  describe("Heading", () => {
    it("web", () => {
      expect(renderHtml(<Heading mode="web">Hello World</Heading>)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Heading mode="email">Hello World</Heading>)).toMatchSnapshot();
    });
  });

  describe("Html", () => {
    it("web", () => {
      expect(renderHtml(<Html mode="web"><p>Custom HTML</p></Html>)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Html mode="email"><p>Custom HTML</p></Html>)).toMatchSnapshot();
    });
  });

  describe("Image", () => {
    it("web", () => {
      expect(renderHtml(<Image mode="web" src="https://example.com/img.png" />)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Image mode="email" src="https://example.com/img.png" />)).toMatchSnapshot();
    });
  });

  describe("Menu", () => {
    it("web", () => {
      expect(renderHtml(<Menu mode="web" />)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Menu mode="email" />)).toMatchSnapshot();
    });
  });

  describe("Paragraph", () => {
    it("web", () => {
      expect(renderHtml(<Paragraph mode="web" />)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Paragraph mode="email" />)).toMatchSnapshot();
    });
  });

  describe("Social", () => {
    it("web", () => {
      expect(renderHtml(<Social mode="web" />)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Social mode="email" />)).toMatchSnapshot();
    });
  });

  describe("Table", () => {
    it("web", () => {
      expect(renderHtml(<Table mode="web" />)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Table mode="email" />)).toMatchSnapshot();
    });
  });

  describe("Video", () => {
    it("web", () => {
      expect(renderHtml(<Video mode="web" />)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Video mode="email" />)).toMatchSnapshot();
    });
  });

  describe("Body", () => {
    it("web", () => {
      expect(renderHtml(<Body mode="web" />)).toMatchSnapshot();
    });
    it("email", () => {
      expect(renderHtml(<Body mode="email" />)).toMatchSnapshot();
    });
    it("document", () => {
      expect(renderHtml(<Body mode="document" />)).toMatchSnapshot();
    });
  });

  describe("Body + Row + Column + Items", () => {
    it("full tree web", () => {
      expect(
        renderHtml(
          <Body mode="web">
            <Row>
              <Column>
                <Paragraph mode="web">Hello</Paragraph>
                <Button mode="web">Click</Button>
              </Column>
            </Row>
          </Body>
        )
      ).toMatchSnapshot();
    });
    it("full tree email", () => {
      expect(
        renderHtml(
          <Body mode="email">
            <Row>
              <Column>
                <Paragraph mode="email">Hello</Paragraph>
                <Button mode="email">Click</Button>
              </Column>
            </Row>
          </Body>
        )
      ).toMatchSnapshot();
    });
  });
});
