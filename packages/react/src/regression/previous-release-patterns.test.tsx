/**
 * The ways users write their own components, rendered with this build and
 * with the last published Elements (`@unlayer/react-elements-previous`).
 * Each pattern says what React shows for it. Where the previous release
 * showed that, this build must give the same HTML text, plain text and
 * design; where it didn't (`fixed`), this build must show it. Each pattern is
 * built twice, once with each release's components.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React, { createContext, forwardRef, memo, useContext, useId, useMemo, useState } from "react";
import * as current from "../index";
import * as previous from "@unlayer/react-elements-previous";
import previousPackage from "@unlayer/react-elements-previous/package.json";

type Lib = typeof current;
// The previous release had the bugs `fixed` patterns record until 0.2.0, the release that fixed them.
const previousHasTheBugs = /^0\.1\./.test(previousPackage.version);
const releases = { current, previous: previous as unknown as Lib };

/** React's `useId()` values (`:R1:` in React 18, `«R1»` in 19). */
const REACT_ID = /:R[\w-]*:|«R[\w-]*»/g;

/** What a reader sees: the body's text, tags and entities gone (React's ids as "‹id›", whatever their format). */
function visible(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .replace(REACT_ID, "‹id›")
    .trim();
}

const Theme = createContext("default theme");

/** Each pattern builds its template with one release's components. */
type Pattern = {
  build: (L: Lib) => React.ReactElement;
  /** What a reader sees in the HTML. */
  shows: string;
  /** The previous release didn't show it (a bug this build fixes): only this build is checked. */
  fixed?: true;
  /** The design isn't compared: a component of the user's own isn't a block, or the design keeps text as HTML now. */
  json?: false;
  /** How many different `useId()` values the HTML shows. */
  ids?: number;
};

const PATTERNS: Record<string, Pattern> = {
  "a component with a hook that renders plain HTML, in a Column next to blocks": {
    build: (L) => {
      function Signature({ name }: { name: string }) {
        const text = useMemo(() => `Signed by ${name}`, [name]);
        return <div dangerouslySetInnerHTML={{ __html: text }} />;
      }
      return <L.Email><L.Row><L.Column><L.Paragraph>Before the signature</L.Paragraph><Signature name="Ada" /><L.Paragraph>After the signature</L.Paragraph></L.Column></L.Row></L.Email>;
    },
    shows: "Before the signature Signed by Ada After the signature",
    json: false, // a component of the user's own isn't a design block, in either release
  },
  "context from a Provider around a Row, read by a component in a Column": {
    build: (L) => {
      function Themed() {
        const theme = useContext(Theme);
        return <div dangerouslySetInnerHTML={{ __html: `Theme: ${theme}` }} />;
      }
      return <L.Email><Theme.Provider value="dark theme"><L.Row><L.Column><Themed /></L.Column></L.Row></Theme.Provider></L.Email>;
    },
    shows: "Theme: dark theme",
    json: false,
  },
  "useId in components, and one element placed twice": {
    build: (L) => {
      function Field() {
        const id = useId();
        return <div dangerouslySetInnerHTML={{ __html: `Field ${id}` }} />;
      }
      const twice = <Field />;
      return <L.Email><L.Row><L.Column><Field />{twice}{twice}</L.Column></L.Row></L.Email>;
    },
    shows: "Field ‹id› Field ‹id› Field ‹id›",
    ids: 3,
    json: false,
  },
  "a component with hooks that returns Rows, among the email's children": {
    build: (L) => {
      function Header({ title }: { title: string }) {
        const [shown] = useState(title.toUpperCase());
        const subtitle = useMemo(() => `${title} — weekly`, [title]);
        return <><L.Row><L.Column><L.Heading>{shown}</L.Heading></L.Column></L.Row><L.Row><L.Column><L.Paragraph>{subtitle}</L.Paragraph></L.Column></L.Row></>;
      }
      return <L.Email><Header title="Digest" /><L.Row><L.Column><L.Paragraph>Body copy</L.Paragraph></L.Column></L.Row></L.Email>;
    },
    shows: "DIGEST Digest — weekly Body copy",
    json: false, // the previous release's design left out the component's rows
  },
  "a component that returns a Fragment of blocks in a Column, and one that returns an array": {
    build: (L) => {
      const Lines = () => <><L.Paragraph>First line</L.Paragraph><L.Paragraph>Second line</L.Paragraph></>;
      const Items = ({ items }: { items: string[] }) => items.map((item) => <L.Paragraph key={item}>{item}</L.Paragraph>) as unknown as React.ReactElement;
      return <L.Email><L.Row><L.Column><Lines /><Items items={["Alpha", "Beta"]} /></L.Column></L.Row></L.Email>;
    },
    shows: "First line Second line Alpha Beta",
    fixed: true,
  },
  "memo and forwardRef components with hooks": {
    build: (L) => {
      const Memoed = memo(function Memoed({ label }: { label: string }) {
        const text = useMemo(() => `Memo ${label}`, [label]);
        return <L.Paragraph>{text}</L.Paragraph>;
      });
      const Forwarded = forwardRef<HTMLDivElement, { label: string }>(function Forwarded({ label }, _ref) {
        const [text] = useState(`Forwarded ${label}`);
        return <L.Paragraph>{text}</L.Paragraph>;
      });
      return <L.Email><L.Row><L.Column><Memoed label="one" /><Forwarded label="two" /></L.Column></L.Row></L.Email>;
    },
    shows: "Memo one Forwarded two",
    fixed: true,
  },
  "a template component with a hook around the email": {
    build: (L) => {
      function Welcome({ name }: { name: string }) {
        const greeting = useMemo(() => `Welcome, ${name}`, [name]);
        return <L.Email><L.Row><L.Column><L.Heading>{greeting}</L.Heading></L.Column></L.Row></L.Email>;
      }
      return <Welcome name="Ada" />;
    },
    shows: "Welcome, Ada",
    json: false, // the previous release's renderToJson couldn't unwrap a template with a hook
  },
  "a component that renders nothing, next to blocks": {
    build: (L) => {
      const Nothing = ({ show }: { show: boolean }) => (show ? <L.Paragraph>Shown</L.Paragraph> : null);
      return <L.Email><L.Row><L.Column><Nothing show={false} /><L.Paragraph>Always</L.Paragraph><Nothing show /></L.Column></L.Row></L.Email>;
    },
    shows: "Always Shown",
    fixed: true,
  },
  "an async component among a Column's blocks": {
    build: (L) => {
      const Recommendations = (async () => <L.Paragraph>You may also like</L.Paragraph>) as unknown as () => React.ReactElement;
      return <L.Email><L.Row><L.Column><L.Paragraph>Thanks for your order</L.Paragraph><Recommendations /><L.Paragraph>See you soon</L.Paragraph></L.Column></L.Row></L.Email>;
    },
    shows: "Thanks for your order See you soon",
    json: false, // 0.1.22's design read the async component's promise as a block
  },
  "a component that throws, among a Row's columns": {
    build: (L) => {
      const ItemColumns = ({ order }: { order: { items?: string[] } }) => <>{order.items!.map((item) => <L.Column key={item}><L.Paragraph>{item}</L.Paragraph></L.Column>)}</>;
      return <L.Email><L.Row><L.Column><L.Paragraph>Thanks for your order</L.Paragraph></L.Column></L.Row><L.Row><ItemColumns order={{}} /><L.Column><L.Paragraph>Total 0 dollars</L.Paragraph></L.Column></L.Row><L.Row><L.Column><L.Paragraph>Footer</L.Paragraph></L.Column></L.Row></L.Email>;
    },
    shows: "Thanks for your order Total 0 dollars Footer",
    json: false,
  },
  "a Column shown under a condition, in a Row with a layout": {
    build: (L) => {
      const image: string | undefined = undefined;
      return (
        <L.Email>
          <L.Row layout={L.ColumnLayouts.TwoEqual}>
            {image && <L.Column><L.Image src={image} alt="Product" /></L.Column>}
            <L.Column><L.Paragraph>Order shipped</L.Paragraph></L.Column>
          </L.Row>
          <L.Row><L.Column><L.Paragraph>Footer</L.Paragraph></L.Column></L.Row>
        </L.Email>
      );
    },
    shows: "Order shipped Footer",
  },
  "a template whose root is in a Fragment": {
    build: (L) => <><L.Email><L.Row><L.Column><L.Paragraph>Inside a Fragment</L.Paragraph></L.Column></L.Row></L.Email></>,
    shows: "Inside a Fragment",
    json: false, // the previous release's renderToJson threw for it; this one reads the root inside
  },
  "a memo component whose function has defaultProps, among the email's rows": {
    build: (L) => {
      function Banner({ title }: { title?: string }) {
        return <L.Row><L.Column><L.Paragraph>{`Banner: ${title}`}</L.Paragraph></L.Column></L.Row>;
      }
      (Banner as unknown as { defaultProps: object }).defaultProps = { title: "default title" };
      const MemoBanner = memo(Banner);
      return <L.Email><MemoBanner /><L.Row><L.Column><L.Paragraph>Footer</L.Paragraph></L.Column></L.Row></L.Email>;
    },
    shows: "Banner: default title Footer",
    json: false, // 0.1.22's design left out components among the rows
  },
  "headings, buttons and text with &, < and quotes": {
    build: (L) => (
      <L.Email>
        <L.Row><L.Column>
          <L.Heading>Q&A: "fast" & 'easy' {"<3"}</L.Heading>
          <L.Heading headingType="h3">Terms & conditions</L.Heading>
          <L.Paragraph>Tom & Jerry {"<b>not bold</b>"}</L.Paragraph>
          <L.Button href="https://example.com">Save & continue</L.Button>
        </L.Column></L.Row>
      </L.Email>
    ),
    shows: `Q&A: "fast" & 'easy' <3 Terms & conditions Tom & Jerry <b>not bold</b> Save & continue`,
    fixed: true, // the previous release read a heading's text as HTML: "<3" was lost
    json: false, // the design keeps Heading and Button text as HTML now (escaped), as the editor does
  },
};

// An async or throwing component is left out with a message: keep the test output quiet.
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterAll(() => vi.restoreAllMocks());

describe.each(Object.entries(PATTERNS))("%s", (_, { build, shows, fixed, json, ids }) => {
  const now = build(releases.current);
  const before = build(releases.previous);

  it("shows what React shows", () => {
    expect(visible(current.renderToHtml(now))).toBe(shows);
    if (ids) expect(new Set(current.renderToHtml(now).match(REACT_ID)).size).toBe(ids);
    // The previous release showed it too, or (while it's a release before the fix) it's a fix: a pattern that
    // changes either way is a decision to make.
    if (!fixed || previousHasTheBugs) expect(visible(previous.renderToHtml(before)) === shows).toBe(!fixed);
  });

  if (!fixed) {
    it("gives the previous release's plain text", () => {
      expect(current.renderToPlainText(now)).toBe(previous.renderToPlainText(before));
    });
  }

  if (!fixed && json !== false) {
    it("gives the previous release's design", () => {
      expect(JSON.stringify(current.renderToJson(now), null, 1)).toBe(JSON.stringify(previous.renderToJson(before), null, 1));
    });
  }
});
