/**
 * Templates with Divider, Html, Menu and Social blocks, for the tests of their web and document HTML (pages.test.tsx,
 * parity.test.ts): every story, the codegen fixtures' designs as Elements code, the values the regression suite gives
 * users' text and links, and templates for what these blocks take (links and targets, icon sets, sizes, alignment,
 * borders, markup, right-to-left text, merge tags, phone settings). Each renders as a Page and as a Document.
 */
import React from "react";
import * as Elements from "../index";
import { Body, Column, Divider, Document, Email, Html, Menu, Page, Row, Social, UnlayerProvider } from "../index";
import { DESIGNS } from "../codegen/__fixtures__/designs";
import kitchenSink from "../codegen/__fixtures__/editor-kitchen-sink.json";
import { designToElements } from "../codegen/design-to-elements";
import { evaluate } from "../codegen/test-harness";
import type { Plain } from "../codegen/values";

export interface Template {
  name: string;
  /** The template, with any root (Email, Page, Document, Body), which `as` replaces. */
  element: React.ReactElement;
  /** renderToHtml's options. */
  options?: Record<string, unknown>;
}

const ROOTS = new Set<unknown>([Email, Page, Document, Body]);
const OWN = new Set<unknown>(Object.values(Elements));

/** What a template component renders, where it can be called outside a render (no hooks), or undefined. */
function rendered(type: (props: object) => React.ReactNode, props: object): React.ReactNode | undefined {
  const error = console.error;
  console.error = () => {};
  try {
    return type(props);
  } catch {
    return undefined;
  } finally {
    console.error = error;
  }
}

/** The template rendered by `Root` (Page or Document): its root replaced, found through the components that render it. */
export function as(node: React.ReactNode, Root: typeof Page): React.ReactElement {
  if (React.isValidElement(node)) {
    const { type, props } = node as React.ReactElement<Record<string, unknown>>;
    if (ROOTS.has(type)) {
      const { mode: _mode, ...rest } = props;
      return <Root {...rest} />;
    }
    if (type === UnlayerProvider) return React.cloneElement(node as React.ReactElement<Record<string, unknown>>, undefined, as(props.children as React.ReactNode, Root));
    if (typeof type === "function" && !OWN.has(type) && !(type.prototype && type.prototype.isReactComponent)) {
      const inner = rendered(type as (props: object) => React.ReactNode, props);
      if (inner !== undefined) return as(inner, Root);
    }
  }
  return <Root>{node}</Root>;
}

type Story = ((args: object) => React.ReactNode) | { args?: object; render?: (args: object, context: object) => React.ReactNode };
type StoryModule = Record<string, unknown> & { default?: { component?: React.ComponentType<object>; args?: object; render?: (args: object, context: object) => React.ReactNode } };

const STORY_MODULES = (import.meta as unknown as { glob: (pattern: string, options: { eager: true }) => Record<string, StoryModule> }).glob("../**/*.stories.tsx", { eager: true });

/** Every story, as Storybook renders it: its render function (called in a component, as one can use hooks), or its component with its args. */
function stories(): Template[] {
  const out: Template[] = [];
  for (const [file, module] of Object.entries(STORY_MODULES)) {
    const meta = module.default ?? {};
    for (const [name, story] of Object.entries(module)) {
      if (name === "default" || !story || (typeof story !== "function" && typeof story !== "object")) continue;
      const own = story as Story;
      const args = { ...meta.args, ...(typeof own === "object" ? own.args : undefined) };
      const render = typeof own === "function" ? own : own.render ?? meta.render;
      let element: React.ReactElement;
      if (render) {
        // Called here where it can be (to find its root), else in a component, where its hooks work.
        const tree = rendered(() => render(args, { args }), {});
        const Story = () => <>{render(args, { args })}</>;
        element = tree !== undefined && React.isValidElement(tree) ? tree : <Story />;
      } else if (meta.component) element = React.createElement(meta.component, args);
      else continue;
      out.push({ name: `${file.replace(/^\.\.\//, "").replace(/\.stories\.tsx$/, "")}: ${name}`, element });
    }
  }
  return out;
}

/** The codegen fixtures' designs (as the editor saves them) as the Elements code codegen writes for them. */
function designs(): Template[] {
  const all: [string, Plain][] = [["editor kitchen sink", kitchenSink as unknown as Plain], ...Object.entries(DESIGNS).map(([name, { design }]): [string, Plain] => [name, design])];
  return all.flatMap(([name, design]) => {
    const types = JSON.stringify(design).match(/"type":"(divider|html|menu|social)"/);
    if (!types) return [];
    const Template = evaluate(designToElements(design).code);
    return [{ name: `design: ${name}`, element: <Template /> }];
  });
}

/** Values from users (the regression suite's), which must render as they did: markup, quotes, entities, other scripts. */
export const TEXTS = [
  "Home",
  "",
  " padded ",
  '"><x-pwn></x-pwn>',
  "'><x-pwn></x-pwn>",
  '" x-pwn="1',
  "' x-pwn='1",
  "</p></div></td></tr></table><x-pwn></x-pwn>",
  '{{ " }} x-pwn=1 y',
  '{{ x" x-pwn }}',
  '<%a%>" x-pwn="1',
  "Fish &amp; chips & <b>bold</b>",
  "“Quotes” ‘single’ — dash…",
  "مرحبا بالعالم",
  "שלום עולם",
  "日本語のテキスト",
  "😀 emoji 👍🏽",
  "{{first_name}}",
  "*|FNAME|*",
  "%%name%%",
  "line\nbreak\ttab",
];

export const LINKS = [
  "https://example.com/",
  "https://example.com/path?a=1&b=2#hash",
  "http://example.com/a b",
  "/relative/path",
  "#anchor",
  "mailto:hi@example.com?subject=Hi there",
  "tel:+15550100",
  "sms:+15550100",
  "javascript:alert(1)",
  "{{unsubscribe_url}}",
  "https://example.com/?u={{user_id}}&t=*|TOKEN|*",
  "<%asm_group_unsubscribe_raw_url%>",
  "",
];

const ICON_NAMES = ["Facebook", "X", "Twitter", "Instagram", "LinkedIn", "YouTube", "Pinterest", "TikTok", "WhatsApp", "Discord", "Email", "Custom"];
const ICON_TYPES = ["circle", "rounded", "squared", "circle-black", "circle-white", "rounded-black", "squared-black"];

const row = (...blocks: React.ReactNode[]) => (
  <Row>
    <Column>{blocks}</Column>
  </Row>
);

/** Templates for the values these blocks take. */
function values(): Template[] {
  const out: Template[] = [];
  const add = (name: string, element: React.ReactElement, options?: Record<string, unknown>) => out.push({ name, element, options });

  add("defaults", <Email>{row(<Divider key="d" />, <Html key="h" />, <Menu key="m" />, <Social key="s" />)}</Email>);
  add("defaults, bare in the root", <Email><Divider /><Html /><Menu /><Social /></Email>);
  add("defaults, two columns", <Email><Row layout={Elements.ColumnLayouts.TwoEqual}><Column><Menu /><Divider /></Column><Column><Social /><Html /></Column></Row></Email>);

  TEXTS.forEach((text, i) =>
    add(
      `user text ${i}: ${JSON.stringify(text)}`,
      <Email>
        {row(
          <Menu key="m" items={[{ text, href: `https://example.com/${text}` }, { text: `${text} 2` }]} separator={text || "|"} />,
          <Social key="s" icons={[{ name: text || "Facebook", url: `https://example.com/${text}` }, { name: "X", url: text }]} />,
          <Html key="h" html={`<p>${text}</p>`} />,
          <Html key="h2" html={text} />,
        )}
      </Email>,
    ),
  );

  LINKS.forEach((href, i) =>
    add(
      `link ${i}: ${JSON.stringify(href)}`,
      <Email>
        {row(
          <Menu key="m" items={[{ text: "Same tab", href, target: "_self" }, { text: "New tab", href, target: "_blank" }, { text: "Parent", href, target: "_parent" }, { text: "Top", href, target: "_top" }, { text: "No link" }]} separator="•" />,
          <Social key="s" icons={[{ name: "Facebook", url: href }, { name: "Email", url: href.replace(/^mailto:/, "") }, { name: "Email", url: href }]} />,
        )}
      </Email>,
    ),
  );

  // Links in the editor's own shapes (`values`): the stored link, and the link editor's render value with
  // custom attributes, a click handler and a class.
  const editorLinks: Record<string, unknown>[] = [
    { name: "web", values: { href: "https://example.com/stored", target: "_self" } },
    { name: "web", values: { href: "" }, attrs: { href: "https://example.com/attrs", target: "_top", rel: "noopener" } },
    { name: "email", values: { email: "hi@example.com", subject: "Hello" } },
    { name: "phone", values: { phone: "+15550100" } },
    { url: "https://example.com/render", target: "_blank", customAttrs: { "data-track": "menu", rel: "noopener noreferrer", title: 'Say "hi"', id: "m1" } },
    { url: "https://example.com/render", customAttrs: { "data-empty": "", "aria-hidden": "true" } },
    { url: "", customAttrs: { "data-empty": " ", rel: "" } },
    { url: "https://example.com/click", onClick: "track('menu', \"home\"); return true;", class: "menu-link primary" },
    { url: "", onClick: "openChat()" },
    { url: "https://example.com/{{id}}", target: "", class: "" },
  ];
  add(
    "editor links",
    <Email>
      {row(
        <Menu
          key="m"
          values={{ menu: { items: editorLinks.map((link, i) => ({ key: String(i + 1), text: `Item ${i + 1}`, link })) } } as never}
          separator="/"
        />,
      )}
    </Email>,
  );

  for (const layout of ["horizontal", "vertical"] as const)
    for (const align of ["left", "center", "right"] as const)
      add(
        `menu: ${layout}, ${align}`,
        <Email>
          {row(
            <Menu
              key="m"
              items={[{ text: "Home", href: "https://example.com/" }, { text: "Shop", href: "https://example.com/shop" }, { text: "Help" }]}
              layout={layout}
              align={align}
              separator={layout === "horizontal" ? "|" : "-"}
              padding="8px 12px"
              fontSize="13px"
              fontWeight={700}
              fontFamily="Georgia, serif"
              letterSpacing="1px"
              linkColor="#1a73e8"
              textColor="#555555"
            />,
            <Menu key="m2" items={[{ text: "A", href: "https://example.com/a" }, { text: "B", href: "https://example.com/b" }]} layout={layout} textAlign={align} color="#ff0000" padding={4} />,
          )}
        </Email>,
      );

  ICON_TYPES.forEach((iconType) =>
    [16, 32, "48px"].forEach((iconSize) =>
      (["left", "center", "right"] as const).forEach((align) =>
        add(
          `social: ${iconType}, ${iconSize}, ${align}`,
          <Email>
            {row(
              <Social
                key="s"
                icons={ICON_NAMES.map((name) => ({ name, url: `https://example.com/${name.toLowerCase()}` }))}
                iconType={iconType as "circle"}
                iconSize={iconSize}
                spacing={iconSize === 16 ? 0 : 10}
                align={align}
              />,
            )}
          </Email>,
        ),
      ),
    ),
  );
  add("social: no icons", <Email>{row(<Social key="s" icons={[]} />, <Social key="s2" values={{ icons: { iconType: "squared", icons: [] } } as never} iconSize={20} />)}</Email>);
  add(
    "social: custom icons",
    <Email>
      {row(
        <Social
          key="s"
          values={{
            icons: {
              iconType: "circle",
              icons: [{ name: "Mastodon", url: "https://example.com/@me" }, { name: "Facebook", url: "https://facebook.com/x", imgUrl: "https://example.com/fb.png" }],
              editor: { data: { customIcons: [{ name: "Mastodon", url: "https://mastodon.social", icons: { circle: "https://example.com/mastodon-circle.png" } }] } },
            },
          } as never}
        />,
      )}
    </Email>,
  );

  for (const style of ["solid", "dashed", "dotted", "double", "none"])
    for (const width of ["100%", "50%", "240px"])
      add(
        `divider: ${style}, ${width}`,
        <Email>
          {row(
            <Divider key="a" width={width} borderTopWidth="3px" borderTopStyle={style} borderTopColor="#cc0000" align="left" />,
            <Divider key="b" width={width} border={{ borderTopWidth: 1, borderTopStyle: style, borderTopColor: "rgb(10, 20, 30)" }} textAlign="right" />,
            <Divider key="c" values={{ width, border: { borderTopWidth: "10px", borderTopStyle: style, borderTopColor: "#BBBBBB" }, textAlign: "center" } as never} />,
          )}
        </Email>,
      );

  add(
    "right-to-left",
    <Email textDirection="rtl" lang="ar">
      {row(
        <Menu key="m" items={[{ text: "الرئيسية", href: "https://example.com/ar" }, { text: "اتصل بنا" }]} separator="|" />,
        <Social key="s" icons={[{ name: "Facebook", url: "https://facebook.com/x" }, { name: "X", url: "https://x.com/x" }]} />,
        <Divider key="d" width="60%" />,
        <Html key="h" html={'<p dir="rtl">مرحبا <b>بالعالم</b></p>'} />,
      )}
    </Email>,
  );
  add(
    "merge tags",
    <Email>
      {row(
        <Menu key="m" items={[{ text: "Hi {{first_name}}", href: "{{profile_url}}" }, { text: "Unsubscribe", href: "{{unsubscribe_url}}" }]} />,
        <Social key="s" icons={[{ name: "Facebook", url: "{{facebook_url}}" }, { name: "Email", url: "{{email}}" }]} />,
        <Html key="h" html="<p>Hello {{first_name}}, your code is <strong>{{code}}</strong>.</p>" />,
      )}
    </Email>,
    { mergeTagState: { first_name: "Ada" } },
  );
  add(
    "phone settings",
    <Email>
      {row(
        <Menu key="m" items={[{ text: "Home", href: "https://example.com/" }]} mobile={{ fontSize: "12px", padding: "2px" } as never} hideOnDesktop />,
        <Social key="s" icons={[{ name: "X", url: "https://x.com/x" }]} hideOnMobile />,
        <Divider key="d" mobile={{ width: "40%" } as never} />,
        <Html key="h" html="<p>Desktop only</p>" hideOnMobile />,
      )}
    </Email>,
  );
  add(
    "toSafeHtml",
    <Email>{row(<Html key="h" html={'<p onclick="x()">Hi</p><script>alert(1)</script><link rel="preload" as="image" href="https://example.com/a.png">'} />)}</Email>,
    { toSafeHtml: (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/ on\w+="[^"]*"/g, "") },
  );
  add(
    "a CDN for the icons",
    <UnlayerProvider config={{ cdnBaseUrl: "https://cdn.example.com/assets" }}>
      <Email>{row(<Social key="s" icons={[{ name: "Facebook", url: "https://facebook.com/x" }]} />, <Social key="s2" icons={[]} />)}</Email>
    </UnlayerProvider>,
  );
  return out;
}

/** The templates, in order. */
export function corpus(): Template[] {
  return [...values(), ...designs(), ...stories()];
}
