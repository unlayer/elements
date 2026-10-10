/**
 * The ways users write their own components, rendered with this build and
 * with the last published Elements (`@unlayer/react-elements-previous`).
 * Each pattern says what React shows for it. Where the previous release
 * showed that, this build must give the same HTML text, plain text and
 * design; where it didn't (`fixed`), this build must show it. Each pattern is
 * built twice, once with each release's components.
 */
import { describe, expect, it } from "vitest";
import React, { createContext, forwardRef, memo, useContext, useId, useMemo, useState } from "react";
import * as current from "../index";
import * as previous from "@unlayer/react-elements-previous";

type Lib = typeof current;
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

describe.each(Object.entries(PATTERNS))("%s", (_, { build, shows, fixed, json, ids }) => {
  const now = build(releases.current);
  const before = build(releases.previous);

  it("shows what React shows", () => {
    expect(visible(current.renderToHtml(now))).toBe(shows);
    if (ids) expect(new Set(current.renderToHtml(now).match(REACT_ID)).size).toBe(ids);
    // The previous release showed it too, or it's a fix: a pattern that changes either way is a decision to make.
    expect(visible(previous.renderToHtml(before)) === shows).toBe(!fixed);
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
