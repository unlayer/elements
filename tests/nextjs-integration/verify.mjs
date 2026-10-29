// Starts the built app and checks that an email rendered on the server is one: email tables, not a web layout,
// and a design with its rows (and an UnlayerProvider's config in both), from a route handler and from a Server
// Component; what an App Router edge route gets, and an email from Pages Router API routes (Node.js and edge).
// `next build` succeeding isn't enough: Elements once rendered rows as a web page there, and an empty design, without
// an error. The app is built with Turbopack and with webpack (`npm run build:webpack`), and checked after each.
import { spawn } from "node:child_process";

// Run in the app's folder (tests/next14-integration and tests/next16-integration run it too, without an edge route:
// Next.js 14 can't bundle Elements for the edge runtime, 0.1.22 neither, and Next.js 16 deprecates it), on a port of
// its own; with `--async`, the async renderers' route handler and Server Component too, and with `--pages-api`, a
// Pages Router API route in the Node.js runtime.
const port = Number(process.argv[2] ?? 3765);
const edgeRoute = !process.argv.includes("--no-edge");
const asyncRoutes = process.argv.includes("--async");
const pagesApi = process.argv.includes("--pages-api");
const server = spawn("npx", ["next", "start", "-p", String(port)], { stdio: "inherit" });
const fail = (message) => {
  console.error(`✗ ${message}`);
  server.kill();
  process.exit(1);
};
const get = async (path) => {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(`http://localhost:${port}${path}`);
      if (response.ok) return response.text();
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  fail(`${path} didn't respond`);
};
const check = (where, counts) => {
  // Two rows of an email: Elements writes each as tables (a web layout has none), and the design keeps both.
  if (!(counts.tables >= 8)) fail(`${where}: ${counts.tables} tables in the email (rows came out as a web layout)`);
  if (!counts.text) fail(`${where}: the email's text is missing`);
  if (counts.rows !== 2 || counts.columns.join() !== "1,2") fail(`${where}: the design has rows ${JSON.stringify(counts.columns)}, not [1,2]`);
  if (counts.provider !== true) fail(`${where}: an UnlayerProvider's textDirection didn't reach the email and its design`);
  // The app's every-entry check (tests/nextjs-integration/src/lib/entries.ts), where it has one.
  const entries = Object.entries(counts.entries ?? {});
  const failed = entries.filter(([, ok]) => ok !== true).map(([entry]) => entry);
  if (failed.length) fail(`${where}: Elements' ${failed.join(", ")} entry didn't render`);
  console.log(`✓ ${where}: ${counts.tables} tables, design rows ${JSON.stringify(counts.columns)}${entries.length ? `, ${entries.length} entries` : ""}`);
};
check("route handler", JSON.parse(await get("/email")));
const counts = async (path, where, checked = check) => {
  const page = await get(path);
  const json = /<pre id="counts">([^<]*)<\/pre>/.exec(page)?.[1]?.replace(/&quot;/g, '"');
  if (!json) fail(`${where}: no counts on the page`);
  checked(where, JSON.parse(json));
  return page;
};
// The Server Component's own hook after Elements' renders: React's dispatcher (Flight's) was put back.
const serverComponent = await counts("/email-page", "Server Component");
if (!/<i id="hook-after">[^<]+<\/i>/.test(serverComponent)) fail("Server Component: its useId() after Elements' renders gave nothing");
console.log(`✓ Server Component: its hook after Elements' renders works (${/<i id="hook-after">([^<]+)<\/i>/.exec(serverComponent)[1]})`);
// A Client Component working the email out in useMemo, in its server render.
await counts("/client-email", "Client Component");
// The async renderers, on the same email with its greeting loaded as it renders: the same email as the synchronous
// renderers give. Elements' React isn't react-dom's in a route handler or a Server Component, and 0.3.0's async
// renderers gave 3 tables (a web layout) and a design without rows there.
if (asyncRoutes) {
  const same = (where, counts) => {
    if (counts.tables !== counts.syncTables) fail(`${where}: ${counts.tables} tables in the email, where the synchronous renderers give ${counts.syncTables}`);
    check(where, counts);
  };
  same("async route handler", JSON.parse(await get("/async")));
  await counts("/async-page", "async Server Component", same);
}
// An App Router edge route: React there is React Server Components', which react-dom can't render with; Elements
// renders the email without it.
const edge = edgeRoute ? JSON.parse(await get("/edge")) : undefined;
if (!edge);
else if (edge.error === undefined) check("edge route", edge);
else fail(`edge route: ${edge.error}`);
// A Pages Router API route in the Node.js runtime.
if (pagesApi) check("Pages Router API route", JSON.parse(await get("/api/email")));
// A Pages Router API route on the edge runtime: React there is the full one, so the email renders.
if (edgeRoute) {
  const pages = JSON.parse(await get("/api/edge-email"));
  if (pages.error !== undefined) fail(`Pages Router edge API route: ${pages.error}`);
  check("Pages Router edge API route", pages);
}
server.kill();
process.exit(0);
