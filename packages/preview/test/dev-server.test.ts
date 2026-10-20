import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { startDevServer, type DevServer } from "../src/server/dev-server";
import { fixtureCopy } from "./helpers";

let server: DevServer;
let fixture: Awaited<ReturnType<typeof fixtureCopy>>;

beforeAll(async () => {
  fixture = await fixtureCopy("dev");
  server = await startDevServer({ dir: fixture.emails, port: 0, uiDir: path.join(fixture.root, "no-ui") });
});

afterAll(async () => {
  await server?.close();
  await fixture?.cleanup();
});

async function post(route: string, body: unknown, on: DevServer = server) {
  const res = await fetch(on.url + route, { method: "POST", body: JSON.stringify(body) });
  return { status: res.status, body: (await res.json()) as any };
}

/** Resolves with the next `change` event's data. */
function nextChange(on: DevServer = server): Promise<{ files: string[]; templates: Array<{ path: string }> }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`${on.url}/api/events`, (res) => {
      let buffer = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => {
        buffer += chunk;
        const match = /event: change\ndata: (.*)\n\n/.exec(buffer);
        if (match) {
          req.destroy();
          resolve(JSON.parse(match[1]));
        }
      });
    });
    req.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code !== "ECONNRESET") reject(error);
    });
  });
}

describe("dev server", () => {
  it("lists the templates", async () => {
    const res = await fetch(`${server.url}/api/templates`);
    const { templates } = (await res.json()) as { templates: Array<{ path: string }> };
    expect(templates.map((t) => t.path)).toEqual(["billing/receipt.jsx", "landing.tsx", "plain.js", "welcome.tsx"]);
  });

  it("renders a template with its PreviewProps, in its mode, with HTML, text and design JSON", async () => {
    const { body } = await post("/api/render", { path: "welcome.tsx" });
    expect(body.ok).toBe(true);
    expect(body.mode).toBe("email");
    expect(body.previewProps).toEqual({ name: "Ada", company: "Acme" });
    expect(body.html).toContain("Welcome, Ada");
    expect(body.text).toContain("WELCOME, ADA");
    expect(body.json?.body?.rows?.length).toBe(1);
    expect(body.source).toContain("export default function Welcome");
    const landing = (await post("/api/render", { path: "landing.tsx" })).body;
    expect(landing.mode).toBe("web");
  });

  it("renders exactly what the project's Elements renders", async () => {
    const { body } = await post("/api/render", { path: "plain.js" });
    const require = createRequire(path.join(fixture.root, "package.json"));
    const React = require("react");
    const Elements = require("@unlayer/react-elements");
    const { default: Plain } = await import(path.join(fixture.emails, "plain.js"));
    const element = React.createElement(Plain, Plain.PreviewProps);
    expect(body.html).toBe(Elements.renderToHtml(element));
    expect(body.text).toBe(Elements.renderToPlainText(element));
  });

  it("renders with other props without changing the file", async () => {
    const { body } = await post("/api/render", { path: "welcome.tsx", props: { name: "Grace", company: "Initech" } });
    expect(body.html).toContain("Welcome, Grace");
    expect(body.props).toEqual({ name: "Grace", company: "Initech" });
  });

  it("resolves tsconfig path aliases and imports of the project's files", async () => {
    const { body } = await post("/api/render", { path: "billing/receipt.jsx" });
    expect(body.ok).toBe(true);
    expect(body.text).toContain("Total: $42.00");
  });

  it("only renders listed templates", async () => {
    expect((await post("/api/render", { path: "../package.json" })).status).toBe(404);
    expect((await post("/api/render", { path: "_components/footer.tsx" })).status).toBe(404);
    expect((await post("/api/render", { path: "helpers.ts" })).status).toBe(404);
  });

  it("serves the templates folder's static files, and nothing outside it", async () => {
    const ok = await fetch(`${server.url}/static/logo.png`);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("image/png");
    expect((await fetch(`${server.url}/static/..%2F..%2Fpackage.json`)).status).toBe(404);
    expect((await fetch(`${server.url}/static/../package.json`)).status).not.toBe(200);
    // A path that doesn't decode is a bad request, not the server's error.
    expect((await fetch(`${server.url}/static/%`)).status).toBe(400);
    expect((await fetch(`${server.url}/%E0%A4%A`)).status).toBe(400);
  });

  it("checks the render the app just got, without rendering the template again", async () => {
    const file = path.join(fixture.emails, "counted.tsx");
    const change = nextChange();
    await new Promise((r) => setTimeout(r, 100));
    await writeFile(
      file,
      'import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";\nexport default function Counted({ name }: { name: string }) {\n  (globalThis as any).__countedRenders = ((globalThis as any).__countedRenders ?? 0) + 1;\n  return <Email><Row><Column><Paragraph>Hi {name}</Paragraph></Column></Row></Email>;\n}\nCounted.PreviewProps = { name: "Ada" };\n'
    );
    await change;
    const renders = () => (globalThis as { __countedRenders?: number }).__countedRenders ?? 0;
    expect((await post("/api/render", { path: "counted.tsx" })).body.ok).toBe(true);
    const once = renders();
    expect(once).toBeGreaterThan(0);
    expect((await post("/api/compat", { path: "counted.tsx" })).body.applicable).toBe(true);
    expect((await post("/api/links", { path: "counted.tsx" })).body.applicable).toBe(true);
    expect(renders()).toBe(once);
    // Other props are another render.
    const links = await post("/api/links", { path: "counted.tsx", props: { name: "Grace" } });
    expect(links.body.applicable).toBe(true);
    expect(renders()).toBe(once * 2);
  });

  it("answers only requests addressed to localhost", async () => {
    const status = await new Promise<number>((resolve, reject) => {
      const req = http.request(`${server.url}/api/templates`, { headers: { host: "attacker.example" } }, (res) => resolve(res.statusCode ?? 0));
      req.on("error", reject);
      req.end();
    });
    expect(status).toBe(403);
  });

  it("refuses requests from other web pages", async () => {
    const other = await fetch(`${server.url}/api/templates`, { headers: { origin: "https://attacker.example" } });
    expect(other.status).toBe(403);
    const own = await fetch(`${server.url}/api/templates`, { headers: { origin: server.url } });
    expect(own.status).toBe(200);
  });

  it("serves static files to another site's images (the Unlayer editor's), but not the API", async () => {
    // An <img> on editor.unlayer.com sends no Origin, and its page as the Referer.
    const referer = { referer: "https://editor.unlayer.com/" };
    const image = await fetch(`${server.url}/static/logo.png`, { headers: referer });
    expect(image.status).toBe(200);
    expect(image.headers.get("content-type")).toBe("image/png");
    const api = await fetch(`${server.url}/api/templates`, { headers: { ...referer, origin: "https://editor.unlayer.com" } });
    expect(api.status).toBe(403);
    const render = await fetch(`${server.url}/api/render`, { method: "POST", body: "{}", headers: { ...referer, origin: "https://editor.unlayer.com" } });
    expect(render.status).toBe(403);
  });

  it("has no Unlayer project for the editor unless it's given one", async () => {
    const meta = (await (await fetch(`${server.url}/api/meta`)).json()) as { projectId?: number };
    expect(meta.projectId).toBeUndefined();
  });

  it("checks email client compatibility, separating the template's own CSS from Elements'", async () => {
    const receipt = (await post("/api/compat", { path: "billing/receipt.jsx" })).body;
    expect(receipt.applicable).toBe(true);
    const yours = receipt.issues.filter((i: any) => i.source === "template");
    expect(yours.map((i: any) => i.feature)).toEqual(expect.arrayContaining(["display:flex", "background-image"]));
    for (const issue of yours) expect(issue.locations.every((l: any) => l.block === "Html 1")).toBe(true);
    expect(receipt.issues.some((i: any) => i.source === "elements")).toBe(true);

    const welcome = (await post("/api/compat", { path: "welcome.tsx" })).body;
    expect(welcome.templateCount).toBe(0);

    const landing = (await post("/api/compat", { path: "landing.tsx" })).body;
    expect(landing.applicable).toBe(false);
  });

  it("tells the app when a file changes, and renders the new version", async () => {
    const footer = path.join(fixture.emails, "_components", "footer.tsx");
    const change = nextChange();
    await new Promise((r) => setTimeout(r, 100));
    // welcome.tsx imports the footer, and was rendered (and its modules loaded) by the tests above.
    expect((await post("/api/render", { path: "welcome.tsx" })).body.text).toContain("Sent with care by Acme");
    const source = await readFile(footer, "utf8");
    expect(source).toContain("Sent with care by");
    await writeFile(footer, source.replace("Sent with care by", "Sent with thanks by"));
    const event = await change;
    expect(event.files).toContain(path.join("_components", "footer.tsx"));
    const { body } = await post("/api/render", { path: "welcome.tsx" });
    expect(body.text).toContain("Sent with thanks by Acme");
    expect(body.text).not.toContain("Sent with care by");
  });

  it("lists a new template and drops a deleted one", async () => {
    const file = path.join(fixture.emails, "added.tsx");
    let change = nextChange();
    await new Promise((r) => setTimeout(r, 100));
    await writeFile(file, 'import { Email } from "@unlayer/react-elements";\nexport default function Added() { return <Email />; }\n');
    expect((await change).templates.map((t) => t.path)).toContain("added.tsx");
    change = nextChange();
    await new Promise((r) => setTimeout(r, 100));
    const { rm } = await import("node:fs/promises");
    await rm(file);
    expect((await change).templates.map((t) => t.path)).not.toContain("added.tsx");
  });

  it("reports a syntax error with its position, stays up, and recovers when it's fixed", async () => {
    const file = path.join(fixture.emails, "welcome.tsx");
    const original = await readFile(file, "utf8");
    let change = nextChange();
    await new Promise((r) => setTimeout(r, 100));
    await writeFile(file, original.replace("<Heading>Welcome, {name}</Heading>", "<Heading>Welcome, {name}</Headin>"));
    await change;
    const broken = (await post("/api/render", { path: "welcome.tsx" })).body;
    expect(broken.ok).toBe(false);
    expect(broken.error).toMatchObject({ phase: "load", file: "emails/welcome.tsx" });
    expect(broken.error.line).toBeGreaterThan(0);
    expect(broken.error.message).toMatch(/closing tag/i);

    change = nextChange();
    await new Promise((r) => setTimeout(r, 100));
    await writeFile(file, original);
    await change;
    expect((await post("/api/render", { path: "welcome.tsx" })).body.ok).toBe(true);
  });

  it("reports an error a template throws while rendering, pointing at its line", async () => {
    const file = path.join(fixture.emails, "throws.tsx");
    const change = nextChange();
    await new Promise((r) => setTimeout(r, 100));
    await writeFile(file, 'import { Email } from "@unlayer/react-elements";\n\nexport default function Throws(): never {\n  throw new Error("No data");\n}\n');
    await change;
    const { body } = await post("/api/render", { path: "throws.tsx" });
    // Elements leaves out a root that throws and says so; or React's error reaches the preview.
    if (body.ok) {
      expect(body.logs.map((l: any) => l.message).join("\n")).toMatch(/No data/);
    } else {
      expect(body.error).toMatchObject({ phase: "render", file: "emails/throws.tsx", line: 4 });
    }
  });
});

// A template whose data never comes: its async component waits for a promise that never settles.
const STUCK = `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";

async function Order() {
  console.log("Fetching the order");
  await new Promise(() => {});
  return <Paragraph>Never shown</Paragraph>;
}

export default function Stuck() {
  return <Email><Row><Column><Order /></Column></Row></Email>;
}
`;

// A module that takes longer to load than the render timeout, and logs when it's done.
const SLOW_DATA = `console.log("Loading the order");
await new Promise((resolve) => setTimeout(resolve, 4500));
console.log("Loaded the order late");
export const order = { id: "late" };
`;

const LATE = `import { Email, Row, Column, Paragraph } from "@unlayer/react-elements";
import { order } from "./_data/order";

export default function Late() {
  return <Email><Row><Column><Paragraph>Order {order.id}</Paragraph></Column></Row></Email>;
}
`;

describe("dev server, with a template that doesn't finish rendering", () => {
  let stuckServer: DevServer;
  let stuckFixture: Awaited<ReturnType<typeof fixtureCopy>>;
  const RENDER_TIMEOUT_MS = 3000;

  beforeAll(async () => {
    stuckFixture = await fixtureCopy("dev-stuck");
    await writeFile(path.join(stuckFixture.emails, "stuck.tsx"), STUCK);
    stuckServer = await startDevServer({ dir: stuckFixture.emails, port: 0, uiDir: path.join(stuckFixture.root, "no-ui"), renderTimeoutMs: RENDER_TIMEOUT_MS });
  });

  afterAll(async () => {
    await stuckServer?.close();
    await stuckFixture?.cleanup();
  });

  it("drops what a render that timed out returns or logs later", async () => {
    // Before any render: what a render logs is captured on top of this, and what isn't a render's reaches it.
    const printed = vi.spyOn(console, "log");
    try {
      await mkdir(path.join(stuckFixture.emails, "_data"), { recursive: true });
      await writeFile(path.join(stuckFixture.emails, "_data", "order.ts"), SLOW_DATA);
      await writeFile(path.join(stuckFixture.emails, "late.tsx"), LATE);
      // Until the server lists it.
      while (!(await (await fetch(`${stuckServer.url}/api/templates`)).json()).templates.some((t: { path: string }) => t.path === "late.tsx")) {
        await new Promise((r) => setTimeout(r, 50));
      }
      const late = (await post("/api/render", { path: "late.tsx" }, stuckServer)).body;
      expect(late).toMatchObject({ ok: false, error: { timedOut: true }, logs: [{ level: "log", message: "Loading the order" }] });

      const change = nextChange(stuckServer);
      await new Promise((r) => setTimeout(r, 100));
      await writeFile(path.join(stuckFixture.emails, "_data", "order.ts"), 'export const order = { id: "fixed" };\n');
      await change;
      const fixed = (await post("/api/render", { path: "late.tsx" }, stuckServer)).body;
      expect(fixed).toMatchObject({ ok: true, logs: [] });
      expect(fixed.text).toContain("Order fixed");

      // Once the first load is done, the template still renders with the fixed module, and what the first load logged is nowhere.
      await new Promise((r) => setTimeout(r, 2500));
      const after = (await post("/api/render", { path: "late.tsx" }, stuckServer)).body;
      expect(after).toMatchObject({ ok: true, logs: [] });
      expect(after.text).toContain("Order fixed");
      expect(printed.mock.calls.flat().join("\n")).not.toMatch(/Loading the order|Loaded the order late/);
    } finally {
      printed.mockRestore();
    }
  });

  it("fails it after the render timeout, renders the others, and renders it again once it's fixed", async () => {
    const stuck = (await post("/api/render", { path: "stuck.tsx" }, stuckServer)).body;
    expect(stuck).toMatchObject({ ok: false, error: { phase: "render", timedOut: true, file: "emails/stuck.tsx" } });
    expect(stuck.error.message).toMatch(/^The template didn't finish rendering in 3 seconds/);
    expect(stuck.logs).toEqual([{ level: "log", message: "Fetching the order" }]);
    // Its checks don't render it again.
    expect((await post("/api/links", { path: "stuck.tsx" }, stuckServer)).body.applicable).toBe(false);

    // The others aren't held up behind it.
    expect((await post("/api/render", { path: "welcome.tsx" }, stuckServer)).body.ok).toBe(true);

    const change = nextChange(stuckServer);
    await new Promise((r) => setTimeout(r, 100));
    await writeFile(path.join(stuckFixture.emails, "stuck.tsx"), STUCK.replace("await new Promise(() => {});", "await Promise.resolve();").replace("Never shown", "Order 42"));
    await change;
    const fixed = (await post("/api/render", { path: "stuck.tsx" }, stuckServer)).body;
    expect(fixed.ok).toBe(true);
    expect(fixed.text).toContain("Order 42");
  });
});
