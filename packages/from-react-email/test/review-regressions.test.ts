import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { convertReactEmail, convertSource, verifyConversion } from "../src/index";
import { replaceMarkers } from "../src/merge-tags";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

async function templates(source: string) {
  const dir = fs.mkdtempSync(path.join(import.meta.dirname, ".tmp-"));
  dirs.push(dir);
  const original = path.join(dir, "original.tsx");
  fs.writeFileSync(original, source);
  const { default: Original } = await import(original);
  const conversion = await convertSource(source, { fileName: original });
  const migrated = path.join(dir, "migrated.tsx");
  fs.writeFileSync(migrated, conversion.code);
  const { default: Migrated } = await import(migrated);
  return { Original, Migrated, conversion };
}

const imports = `import { Html, Body, Text, Button, Img } from "@react-email/components";`;

describe("lexical bindings", () => {
  it("keeps props, local variables and loop parameters that shadow module constants dynamic", async () => {
    const { Original, Migrated } = await templates(`${imports}
      const name = "Alex", url = "https://example.com/alex", item = "Alex", local = "Alex";
      export default function T({ name, url, items }: { name: string; url: string; items: string[] }) {
        const local = name;
        return <Html><Body><Text>Hello {name} {local}</Text>
          {items.map(item => <Text key={item}>{item}</Text>)}
          <Button href={url}>Profile</Button></Body></Html>;
      }
      T.PreviewProps = { name: "Alex", url: "https://example.com/alex", items: ["Alex"] };`);
    for (const props of [Original.PreviewProps, { name: "Jordan", url: "https://example.com/jordan", items: ["Sam", "Taylor"] }]) {
      const check = await verifyConversion(Original, Migrated, { props });
      expect(check.missing).toEqual([]);
      expect(check.added).toEqual([]);
      expect(check.missingAttributes).toEqual([]);
      expect(check.designWarnings).toEqual([]);
    }
  });

  it("still evaluates unshadowed module style constants", async () => {
    const { conversion } = await templates(`${imports}
      const look = { color: "#123456" };
      export default function T() { return <Html><Body><Text style={look}>Hello</Text></Body></Html>; }`);
    expect(conversion.code).toContain('color="#123456"');
  });
});

describe("spread props", () => {
  it("keeps dynamic values in object literal spreads and their override order", async () => {
    const { Original, Migrated } = await templates(`${imports}
      const staticProps = { href: "https://example.com/static" };
      export default function T({ url }: { url: string }) {
        return <Html><Body><Button href="https://example.com/old" {...{ href: url }}>Profile</Button>
          <Button {...{ href: "https://example.com/old", ...{ href: url } }}>Nested</Button>
          <Button {...{ href: url }} href="https://example.com/last">Last</Button>
          <Button {...staticProps}>Static</Button><Button href={url}>Help</Button></Body></Html>;
      }
      T.PreviewProps = { url: "https://example.com/profile" };`);
    const check = await verifyConversion(Original, Migrated, { props: { url: "https://example.com/jordan" } });
    expect(check.missingAttributes).toEqual([]);
    const links = [...check.convertedHtml.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    expect(links.map(([, attrs]) => /href="([^"]*)"/.exec(attrs)?.[1])).toEqual([
      "https://example.com/jordan", "https://example.com/jordan", "https://example.com/last",
      "https://example.com/static", "https://example.com/jordan",
    ]);
  });

  it("keeps an opaque spread as HTML, including children supplied as a prop", async () => {
    const { Original, Migrated, conversion } = await templates(`${imports}
      export default function T({ props }: { props: { href: string; children: string } }) {
        return <Html><Body><Button {...props}/></Body></Html>;
      }
      T.PreviewProps = { props: { href: "https://example.com/profile", children: "Profile" } };`);
    const check = await verifyConversion(Original, Migrated);
    expect(check.missing).toEqual([]);
    expect(check.missingAttributes).toEqual([]);
    expect(conversion.report.fallbacks).not.toEqual([]);
  });

  it("preserves inline links and columns with opaque spread props", async () => {
    const { Original, Migrated } = await templates(`${imports}
      import { Link, Row, Column } from "@react-email/components";
      export default function T({ link, cell }: { link: object; cell: object }) {
        return <Html><Body><Text>Open <Link {...link}>Profile</Link></Text>
          <Row><Column {...cell}/><Column><Text>Help</Text></Column></Row></Body></Html>;
      }
      T.PreviewProps = { link: { href: "https://example.com/profile" }, cell: { children: "Kept cell" } };`);
    const check = await verifyConversion(Original, Migrated);
    expect(check.missing).toEqual([]);
    expect(check.missingAttributes).toEqual([]);
  });

  it("fails document spreads that cannot be kept in an HTML content block", async () => {
    await expect(convertSource(`${imports}
      export default function T({ props }: { props: object }) { return <Html><Body {...props}><Text>Hello</Text></Body></Html>; }`))
      .rejects.toThrow("Can't safely convert Body");
  });
});

describe("merge tags in HTML image sources", () => {
  it("keeps unsized and inline image URLs while still tagging text and links", async () => {
    const { Original } = await templates(`${imports}
      export default function T({ avatar, name, url }: { avatar: string; name: string; url: string }) {
        return <Html><Body><Img src={avatar} alt="Avatar"/>
          <Text>Hello {name} <Img src={avatar} alt="Inline avatar" width={20}/></Text>
          <Button href={url}>Profile</Button></Body></Html>;
      }
      T.PreviewProps = { avatar: "https://example.com/avatar.png?a=1&b=2", name: "Alex", url: "https://example.com/profile" };`);
    const result = await convertReactEmail(Original);
    expect(result.html()).toContain('src="https://example.com/avatar.png?a=1&amp;b=2"');
    expect(result.html()).not.toContain("{{avatar}}");
    expect(JSON.stringify(result.design())).not.toContain("{{avatar}}");
    expect(result.html()).toContain("Hello {{name}}");
    expect(result.html()).toContain('href="{{url}}"');
  });

  it("protects HTML source sets, background attributes and CSS URLs, with safe escaping", () => {
    const marker = "\uE000uNlAyEr0\uE001";
    const sample = 'https://example.com/image.png?a=1&label="A"';
    const output = { html: `<img srcset="${marker} 1x, ${marker} 2x"><table background='${marker}' style="background-image:url('${marker}')">${marker}</table><a href="${marker}">Link</a>` };
    const html = replaceMarkers(output, [{ path: "asset", value: sample }], () => "{{asset}}").html;
    expect(html).toContain('srcset="https://example.com/image.png?a=1&amp;label=&quot;A&quot; 1x');
    expect(html).toContain("background-image:url('https://example.com/image.png?a=1&amp;label=&quot;A&quot;')");
    expect(html).toContain(">{{asset}}</table>");
    expect(html).toContain('href="{{asset}}"');
  });
});
