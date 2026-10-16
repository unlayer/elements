import path from "node:path";
import { describe, expect, it } from "vitest";
import { browserCandidates, findBrowser } from "../src/server/browser";
import { findingLine } from "../src/server/check";
import { discoverTemplates, isTemplatePath, isTemplateSource, resolveTemplatePath, selectTemplates } from "../src/server/discover";
import { codeFrame, formatError, stripAnsi, UsageError } from "../src/server/errors";
import { documentPageWidth, screenshotFile, screenshotVariants } from "../src/server/screenshot";
import { clientFindings, groupFindings, linkFindings, renderingFindings } from "../shared/findings";
import { detectMode } from "../src/server/loader";
import { compareVersions, inspectProject } from "../src/server/project";
import { featureTokens, sourceLines } from "../src/server/compat";
import { darkColor, parseColor } from "../shared/darkMode";
import { aiPrompt } from "../ui/components/aiPrompt";
import { prepareDesign } from "../ui/editor/prepareDesign";
import { absoluteStaticUrls, staticPaths } from "../ui/editor/staticUrls";
import { FIXTURE } from "./helpers";

const EMAILS = path.join(FIXTURE, "emails");

describe("template discovery", () => {
  it("lists files with an export default, as React Email's preview does", async () => {
    const templates = await discoverTemplates(EMAILS);
    expect(templates.map((t) => t.path)).toEqual(["billing/receipt.jsx", "landing.tsx", "plain.js", "welcome.tsx"]);
    expect(templates.find((t) => t.path === "billing/receipt.jsx")?.name).toBe("receipt");
  });

  it("skips _ folders, static/, node_modules and .ts files", () => {
    expect(isTemplatePath("_components/footer.tsx")).toBe(false);
    expect(isTemplatePath("static/logo.tsx")).toBe(false);
    expect(isTemplatePath("node_modules/x/index.js")).toBe(false);
    expect(isTemplatePath("helpers.ts")).toBe(false);
    expect(isTemplatePath("a/b/c.tsx")).toBe(true);
    expect(isTemplateSource("export default function A() {}")).toBe(true);
    expect(isTemplateSource("export function A() {}")).toBe(false);
  });

  it("only resolves paths inside the templates folder", () => {
    expect(resolveTemplatePath(EMAILS, "welcome.tsx")).toBe(path.join(EMAILS, "welcome.tsx"));
    expect(resolveTemplatePath(EMAILS, "../package.json")).toBeUndefined();
    expect(resolveTemplatePath(EMAILS, "../../outside.tsx")).toBeUndefined();
    expect(resolveTemplatePath(EMAILS, "/etc/passwd.tsx")).toBeUndefined();
    expect(resolveTemplatePath(EMAILS, "_components/footer.tsx")).toBeUndefined();
    expect(resolveTemplatePath(EMAILS, "welcome.tsx\0")).toBeUndefined();
  });
});

describe("template selection", () => {
  const templates = [
    { path: "billing/receipt.jsx", name: "receipt" },
    { path: "billing/refund.tsx", name: "refund" },
    { path: "welcome.tsx", name: "welcome" },
  ];
  const root = path.join(path.sep, "project");
  const dir = path.join(root, "emails");

  it("takes paths in the templates folder or from the working directory, folders, and names without the extension", () => {
    expect(selectTemplates(dir, [], templates, root).selected).toEqual(templates);
    expect(selectTemplates(dir, ["welcome.tsx"], templates, root).selected.map((t) => t.path)).toEqual(["welcome.tsx"]);
    expect(selectTemplates(dir, ["emails/welcome.tsx"], templates, root).selected.map((t) => t.path)).toEqual(["welcome.tsx"]);
    expect(selectTemplates(dir, [path.join(dir, "welcome.tsx")], templates, root).selected.map((t) => t.path)).toEqual(["welcome.tsx"]);
    expect(selectTemplates(dir, ["billing"], templates, root).selected.map((t) => t.path)).toEqual(["billing/receipt.jsx", "billing/refund.tsx"]);
    expect(selectTemplates(dir, ["billing/refund"], templates, root).selected.map((t) => t.path)).toEqual(["billing/refund.tsx"]);
    expect(selectTemplates(dir, ["."], templates, root).selected).toEqual(templates);
  });

  it("reports what names no template, including paths outside the folder", () => {
    expect(selectTemplates(dir, ["welcom.tsx", "welcome.tsx"], templates, root)).toEqual({ selected: [templates[2]], unknown: ["welcom.tsx"] });
    expect(selectTemplates(dir, ["../package.json"], templates, root).unknown).toEqual(["../package.json"]);
    // "bill" is a prefix of the folder's name, not a folder.
    expect(selectTemplates(dir, ["bill"], templates, root).unknown).toEqual(["bill"]);
  });
});

describe("check findings", () => {
  it("sorts what rendering reports: errors to fix, warnings to check, the rest notes", () => {
    const failed = renderingFindings({ ok: false, error: { message: "boom", file: "emails/a.tsx", line: 3, column: 5, phase: "render" }, logs: [] });
    expect(failed).toEqual([{ kind: "render", level: "error", message: "boom", file: "emails/a.tsx", line: 3, column: 5, frame: undefined }]);
    const rendered = renderingFindings(
      {
        ok: true,
        jsonError: "no JSON",
        textError: "no text",
        logs: [
          { level: "error", message: "[Unlayer] <Chart> threw while rendering, so it's left out" },
          { level: "warn", message: "Column: a column too many" },
          { level: "log", message: "hello" },
        ],
      },
      ["Elements is old"]
    );
    expect(rendered.map((f) => [f.kind, f.level])).toEqual([
      ["warning", "warning"],
      ["design", "error"],
      ["text", "warning"],
      ["render", "error"],
      ["warning", "warning"],
      ["log", "info"],
    ]);
    expect(rendered[1].message).toMatch(/won't open in the Unlayer editor: no JSON/);
    const grouped = groupFindings(rendered);
    expect([grouped.toFix.length, grouped.toCheck.length, grouped.notes.length]).toEqual([2, 3, 1]);
  });

  it("lists the template's own compatibility issues to check, with their lines and clients, and links at their level", () => {
    const clients = [
      { client: "outlook.windows", label: "Outlook (Windows)", support: "none" as const, notes: [] },
      { client: "gmail.ios", label: "Gmail (iOS)", support: "partial" as const, notes: ["note"] },
    ];
    const compat = {
      applicable: true as const,
      issues: [
        { feature: "display:flex", url: "https://www.caniemail.com/features/css-display-flex/", support: "none" as const, source: "template" as const, clients, locations: [{ block: "Html 1", line: 40 }], sourceLines: [13, 20] },
        { feature: "@media", support: "partial" as const, source: "elements" as const, clients, locations: [{ block: "Head styles" }] },
      ],
    };
    const [flex, ...rest] = clientFindings(compat);
    expect(rest).toEqual([]);
    expect(flex).toMatchObject({ kind: "client", level: "warning", block: "Html 1", line: 13, lines: [13, 20], feature: "display:flex", support: "none" });
    expect(flex.clients).toEqual([
      { client: "outlook.windows", label: "Outlook (Windows)", support: "none" },
      { client: "gmail.ios", label: "Gmail (iOS)", support: "partial" },
    ]);
    expect(flex.message).toBe("`display:flex` isn't supported in Outlook (1 client) and only partly in Gmail (1 client): remove it or add a fallback.");
    expect(clientFindings({ applicable: false, reason: "a page" })).toEqual([]);

    const links = linkFindings({
      applicable: true,
      findings: [
        { kind: "link", level: "error", url: "javascript:alert(1)", message: "Email clients don't run javascript: links.", block: "Button 1", label: "Click me" },
        { kind: "email", level: "warning", url: "", message: "The HTML is 120 KB" },
        { kind: "image", level: "info", url: "/static/a.png", message: "Only the preview serves /static/ files" },
      ],
    });
    expect(links.map((f) => [f.kind, f.level, f.url])).toEqual([
      ["link", "error", "javascript:alert(1)"],
      ["size", "warning", undefined],
      ["image", "info", "/static/a.png"],
    ]);
    expect(findingLine(links[0])).toBe("Button 1 · “Click me” → javascript:alert(1) · Email clients don't run javascript: links.");
    expect(findingLine(flex)).toMatch(/^Html 1 · lines 13, 20 · `display:flex` isn't supported/);
    const [renderError] = renderingFindings({ ok: false, error: { message: "boom\n  at x", file: "emails/a.tsx", line: 3, column: 5, phase: "render" }, logs: [] });
    expect(findingLine(renderError)).toBe("emails/a.tsx:3:5 · boom");
  });
});

describe("Copy for AI", () => {
  it("lists what's to fix and to check, as the checks count them, and not the notes", () => {
    const failed = aiPrompt("a.tsx", { ok: false, error: { message: "boom", file: "emails/a.tsx", line: 3, column: 5, phase: "render" }, logs: [{ level: "warn", message: "careful" }], durationMs: 1, source: "x" });
    expect(failed).toContain("- It throws while rendering (emails/a.tsx:3:5): boom");
    expect(failed.match(/boom/g)).toHaveLength(1);
    expect(failed).toContain("- Warning: careful");

    const ok = aiPrompt(
      "b.tsx",
      { ok: true, html: "", text: "", json: null, jsonError: "bad", mode: "email", logs: [{ level: "log", message: "hello" }], durationMs: 1, source: "y" },
      { applicable: true, issues: [{ feature: "display:flex", support: "none", source: "template", clients: [{ client: "outlook.windows", label: "Outlook (Windows)", support: "none", notes: [] }], locations: [{ block: "Html 1" }], sourceLines: [4] }], templateCount: 1, checkedClients: [], durationMs: 1 },
      { applicable: true, findings: [{ kind: "link", level: "error", url: "#", message: "Goes nowhere.", block: "Button 1" }, { kind: "image", level: "info", url: "/static/a.png", message: "A note." }], links: 1, images: 1, network: false, durationMs: 1 }
    );
    expect(ok).toContain("- Error: No design JSON, so it won't open in the Unlayer editor: bad");
    expect(ok).not.toContain("hello");
    expect(ok).toContain("- `display:flex` in Html 1 (source lines 4): not supported in Outlook (Windows)");
    expect(ok).toContain("- Broken: Goes nowhere. (#) in Button 1");
    expect(ok).not.toContain("A note.");
  });
});

describe("browser detection", () => {
  const only = (...files: string[]) => (file: string) => files.includes(file);

  it("finds Chrome, Chromium, Edge or Brave where each OS installs them", () => {
    const mac = findBrowser(undefined, { platform: "darwin", env: { HOME: "/Users/ada" }, exists: only("/Applications/Brave Browser.app/Contents/MacOS/Brave Browser") });
    expect(mac).toMatchObject({ name: "Brave", path: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser", from: "detected" });
    expect(findBrowser(undefined, { platform: "darwin", env: { HOME: "/Users/ada" }, exists: only("/Users/ada/Applications/Chromium.app/Contents/MacOS/Chromium") }).name).toBe("Chromium");
    // Chrome first when there are several.
    const both = only("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge");
    expect(findBrowser(undefined, { platform: "darwin", env: {}, exists: both }).name).toBe("Chrome");

    const linux = findBrowser(undefined, { platform: "linux", env: { PATH: "/usr/local/bin:/usr/bin" }, exists: only("/usr/bin/chromium-browser") });
    expect(linux).toMatchObject({ name: "Chromium", path: "/usr/bin/chromium-browser" });
    expect(findBrowser(undefined, { platform: "linux", env: { PATH: "/usr/bin" }, exists: only("/snap/bin/chromium") }).path).toBe("/snap/bin/chromium");

    const windows = findBrowser(undefined, {
      platform: "win32",
      env: { PROGRAMFILES: "C:\\Program Files", "PROGRAMFILES(X86)": "C:\\Program Files (x86)", LOCALAPPDATA: "C:\\Users\\ada\\AppData\\Local" },
      exists: only("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"),
    });
    expect(windows).toMatchObject({ name: "Edge", path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" });
    expect(browserCandidates("win32", { LOCALAPPDATA: "C:\\L" }).map((c) => c.path)).toContain("C:\\L\\Google\\Chrome\\Application\\chrome.exe");
  });

  it("uses --browser, then CHROME_PATH: a path, a macOS app or a command on PATH", () => {
    const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    const env = { CHROME_PATH: "/opt/chrome/chrome", PATH: "/usr/bin" };
    const exists = only(chrome, "/opt/chrome/chrome", "/opt/edge/msedge", "/usr/bin/chromium");
    expect(findBrowser("/opt/edge/msedge", { platform: "linux", env, exists })).toMatchObject({ path: "/opt/edge/msedge", from: "--browser" });
    expect(findBrowser(undefined, { platform: "linux", env, exists })).toMatchObject({ path: "/opt/chrome/chrome", from: "CHROME_PATH" });
    expect(findBrowser("chromium", { platform: "linux", env, exists }).path).toBe("/usr/bin/chromium");
    expect(findBrowser("/Applications/Google Chrome.app", { platform: "darwin", env: {}, exists }).path).toBe(chrome);
    // One that isn't there is an error, not a silent fallback to another browser.
    expect(() => findBrowser("/nowhere/chrome", { platform: "linux", env, exists })).toThrow(/There's no browser at \/nowhere\/chrome \(from --browser\)/);
  });

  it("says how to get one when none is installed, without downloading any", () => {
    let error: unknown;
    try {
      findBrowser(undefined, { platform: "linux", env: { PATH: "/usr/bin" }, exists: () => false });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(UsageError);
    expect((error as Error).message).toMatch(/Chrome, Chromium, Edge or Brave/);
    expect((error as Error).message).toMatch(/--browser "\/path\/to\/chrome"/);
    expect((error as Error).message).toMatch(/CHROME_PATH=/);
  });
});

describe("screenshot files", () => {
  it("names each PNG after the template's path and the variant", () => {
    expect(screenshotFile("shots", "welcome.tsx", "desktop")).toBe(path.join("shots", "welcome.desktop.png"));
    expect(screenshotFile("shots", "billing/receipt.jsx", "phone")).toBe(path.join("shots", "billing", "receipt.phone.png"));
    expect(screenshotFile("/abs/out", "a.b/c.d.tsx", "dark")).toBe(path.join("/abs/out", "a.b", "c.d.dark.png"));
  });

  it("takes desktop, and phone and dark when asked", () => {
    expect(screenshotVariants({})).toEqual(["desktop"]);
    expect(screenshotVariants({ phone: true })).toEqual(["desktop", "phone"]);
    expect(screenshotVariants({ dark: true })).toEqual(["desktop", "dark"]);
    expect(screenshotVariants({ all: true })).toEqual(["desktop", "phone", "dark"]);
  });

  it("takes a Document at its page's width", () => {
    expect(documentPageWidth({ body: { values: { documentSize: "A4", documentOrientation: "portrait" } } })).toBe(794);
    expect(documentPageWidth({ body: { values: { documentSize: "Letter", documentOrientation: "landscape" } } })).toBe(1056);
    expect(documentPageWidth({ body: { values: { documentSize: "Legal" } } })).toBe(816);
    expect(documentPageWidth(null)).toBe(794);
  });
});

describe("project", () => {
  it("finds the project's Elements and React", () => {
    const project = inspectProject(EMAILS);
    expect(project.root).toBe(FIXTURE.replace(/\/$/, ""));
    expect(project.elementsVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(project.reactVersion).toMatch(/^18\./);
    expect(project.canRender).toBe(true);
    expect(project.warnings).toEqual([]);
  });

  it("compares versions", () => {
    expect(compareVersions("0.1.22", "0.2.0")).toBe(-1);
    expect(compareVersions("0.2.0", "0.2.0")).toBe(0);
    expect(compareVersions("0.10.0", "0.2.0")).toBe(1);
    expect(compareVersions("0.2.0-beta.1", "0.2.0")).toBe(0);
  });
});

describe("errors", () => {
  it("reads Oxc's syntax errors: the message, the file and position, and its drawing of the lines", () => {
    const message = [
      "Transform failed with 1 error:",
      "",
      "[PARSE_ERROR] Expected corresponding JSX closing tag for 'Heading'.",
      "    ╭─[ emails/welcome.tsx:15:37 ]",
      "    │",
      " 15 │           <Heading>Welcome, {name}</Headin>",
      "────╯",
    ].join("\n");
    // Oxc writes the path relative to the working directory; the preview shows it relative to the project.
    const error = formatError(new Error(message), process.cwd(), "load");
    expect(error).toMatchObject({ message: "Expected corresponding JSX closing tag for 'Heading'.", file: "emails/welcome.tsx", line: 15, column: 37, phase: "load" });
    expect(error.frame).toContain("<Heading>Welcome, {name}</Headin>");
  });

  it("points a runtime error at the first frame in the project's files", () => {
    const error = new Error("boom");
    error.stack = [
      "Error: boom",
      "    at render (/project/node_modules/react-dom/server.js:10:5)",
      "    at Welcome (/project/emails/welcome.tsx:27:21)",
    ].join("\n");
    expect(formatError(error, "/project", "render")).toMatchObject({ file: "emails/welcome.tsx", line: 27, column: 21 });
  });

  it("strips terminal colors and draws code frames", () => {
    expect(stripAnsi("\u001b[31mred\u001b[39m")).toBe("red");
    const frame = codeFrame(path.join(EMAILS, "welcome.tsx"), 3, 5);
    expect(frame).toContain("> 3 |");
    expect(frame).toMatch(/\|\s{5}\^/);
  });
});

describe("modes", () => {
  it("tells the mode from the document Elements renders", () => {
    expect(detectMode('<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN"><html xmlns:v="urn:schemas-microsoft-com:vml">')).toBe("email");
    expect(detectMode("<!doctype html>\n<html>")).toBe("web");
    expect(detectMode('<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN"><html xmlns="http://www.w3.org/1999/xhtml">')).toBe("document");
  });
});

describe("emulated dark mode", () => {
  const lightness = (color: string) => {
    const [r, g, b] = parseColor(color)!;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  it("reads the CSS colors emails use", () => {
    expect(parseColor("#fff")).toEqual([1, 1, 1, 1]);
    expect(parseColor("#00000080")?.[3]).toBeCloseTo(0.5, 2);
    expect(parseColor("rgb(255, 0, 0)")).toEqual([1, 0, 0, 1]);
    expect(parseColor("rgba(0 0 0 / 50%)")).toEqual([0, 0, 0, 0.5]);
    expect(parseColor("hsl(0, 100%, 50%)")?.slice(0, 3).map((c) => Math.round(c * 255))).toEqual([255, 0, 0]);
    expect(parseColor("white")).toEqual([1, 1, 1, 1]);
    expect(parseColor("currentColor")).toBeUndefined();
  });

  it("partial: darkens light backgrounds and lightens dark text, and leaves the rest", () => {
    expect(lightness(darkColor("#ffffff", "background", "partial"))).toBeLessThan(0.1);
    expect(lightness(darkColor("#000000", "text", "partial"))).toBeGreaterThan(0.7);
    // A dark brand background and light text are already readable on dark: unchanged.
    expect(darkColor("#1e1b4b", "background", "partial")).toBe("#1e1b4b");
    expect(darkColor("#ffffff", "text", "partial")).toBe("#ffffff");
  });

  it("full: flips every background and text color", () => {
    expect(lightness(darkColor("#1e1b4b", "background", "full"))).toBeGreaterThan(0.5);
    expect(lightness(darkColor("#ffffff", "text", "full"))).toBeLessThan(0.1);
    expect(lightness(darkColor("#ffffff", "background", "full"))).toBeLessThan(0.1);
  });

  it("keeps the hue and the transparency", () => {
    const [r, g, b, a] = parseColor(darkColor("rgba(79, 70, 229, 0.5)", "background", "full"))!;
    expect(a).toBeCloseTo(0.5, 2);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });
});

describe("compatibility source lines", () => {
  it("looks for a feature's property in both spellings, a value, or an element", () => {
    expect(featureTokens("background-image")).toEqual(expect.arrayContaining(["background-image", "backgroundImage"]));
    expect(featureTokens("display:flex")).toEqual(expect.arrayContaining(["display", "flex"]));
    expect(featureTokens("gap, column-gap, row-gap")).toEqual(expect.arrayContaining(["gap", "columnGap", "row-gap"]));
    expect(featureTokens("<body> element")).toEqual(["<body"]);
    expect(featureTokens("role attribute")).toEqual(["role="]);
  });

  it("finds the template lines that bring a feature in", () => {
    const source = ['import { Html } from "@unlayer/react-elements";', "", "<Html html={'<div style=\"display:flex;gap:8px\">'} />", "<Row backgroundImage={hero} />"].join("\n");
    expect(sourceLines("display:flex", source)).toEqual([3]);
    expect(sourceLines("gap, column-gap, row-gap", source)).toEqual([3]);
    expect(sourceLines("background-image", source)).toEqual([4]);
    expect(sourceLines("border-radius", source)).toEqual([]);
  });
});

describe("the design the editor gets", () => {
  const design = {
    body: {
      rows: [
        {
          values: { backgroundImage: { url: "/static/hero.png", fullWidth: true } },
          columns: [
            {
              contents: [
                { type: "image", values: { src: { url: "/static/logo.png", width: 120 }, altText: "/static/ in alt text stays" } },
                { type: "image", values: { src: { url: "https://cdn.example.com/static/remote.png" } } },
                { type: "html", values: { html: '<img src="/static/logo.png" alt=""><div style="background-image: url(\'/static/hero.png\')">' } },
              ],
            },
          ],
        },
      ],
      values: { backgroundColor: "#ffffff" },
    },
  };

  it("makes the /static/ URLs absolute on the preview, and nothing else", () => {
    const rewritten = absoluteStaticUrls(design, "http://localhost:3000/");
    const row = rewritten.body.rows[0];
    expect(row.values.backgroundImage).toEqual({ url: "http://localhost:3000/static/hero.png", fullWidth: true });
    const [image, remote, html] = row.columns[0].contents;
    expect(image.values.src).toEqual({ url: "http://localhost:3000/static/logo.png", width: 120 });
    expect(image.values.altText).toBe("/static/ in alt text stays");
    expect(remote.values.src?.url).toBe("https://cdn.example.com/static/remote.png");
    expect(html.values.html).toBe('<img src="http://localhost:3000/static/logo.png" alt=""><div style="background-image: url(\'http://localhost:3000/static/hero.png\')">');
    expect(rewritten.body.values).toEqual({ backgroundColor: "#ffffff" });
    // A copy: the render's design is unchanged.
    expect(design.body.rows[0].values.backgroundImage.url).toBe("/static/hero.png");
  });

  it("resolves them next to a static build, under any path", () => {
    const rewritten = absoluteStaticUrls(design, "https://example.com/emails/preview/");
    expect(rewritten.body.rows[0].values.backgroundImage.url).toBe("https://example.com/emails/preview/static/hero.png");
    expect(staticPaths(design)).toEqual(["/static/hero.png", "/static/logo.png"]);
  });

  it("copies the static files in as data: URLs, keeping the absolute URL of one it can't read", async () => {
    const requested: string[] = [];
    const fetcher = (async (url: string) => {
      requested.push(url);
      if (url.endsWith("/logo.png")) return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { "content-type": "image/png" } });
      return new Response("Not found", { status: 404 });
    }) as typeof fetch;
    const prepared = await prepareDesign(design, "http://localhost:3000/", fetcher);
    expect(requested.sort()).toEqual(["http://localhost:3000/static/hero.png", "http://localhost:3000/static/logo.png"]);
    const [image, , html] = prepared.body.rows[0].columns[0].contents;
    expect(image.values.src?.url).toBe("data:image/png;base64,iVBORw==");
    expect(html.values.html).toContain('<img src="data:image/png;base64,iVBORw=="');
    expect(prepared.body.rows[0].values.backgroundImage.url).toBe("http://localhost:3000/static/hero.png");
  });
});

describe("the checks' counts", () => {
  it("says what's to fix and what's to check, apart", async () => {
    const { combine, countLabel } = await import("../ui/components/checks/summary");
    expect(countLabel({ count: 4, fix: 3, tone: "bad", pending: false })).toBe("3 to fix, 1 to check");
    expect(countLabel({ count: 2, fix: 0, tone: "warn", pending: false })).toBe("2 to check");
    expect(countLabel({ count: 1, fix: 1, tone: "bad", pending: false })).toBe("1 to fix");
    const all = combine([{ count: 3, fix: 3, tone: "bad", pending: false }, { count: 1, fix: 0, tone: "warn", pending: false }]);
    expect(countLabel(all)).toBe("3 to fix, 1 to check");
  });
});
