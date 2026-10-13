// Starts the built app and checks that an email rendered on the server is one: email tables, not a web layout,
// and a design with its rows, from a route handler and from a Server Component; and what an edge route gets. `next build` succeeding isn't
// enough: Elements once rendered rows as a web page there, and an empty design, without an error.
import { spawn } from "node:child_process";

// Run in the app's folder (tests/next14-integration and tests/next16-integration run it too, without an edge route:
// Next.js 14 can't bundle Elements for the edge runtime, 0.1.22 neither, and Next.js 16 deprecates it), on a port of
// its own.
const port = Number(process.argv[2] ?? 3765);
const edgeRoute = !process.argv.includes("--no-edge");
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
  console.log(`✓ ${where}: ${counts.tables} tables, design rows ${JSON.stringify(counts.columns)}`);
};
check("route handler", JSON.parse(await get("/email")));
const counts = async (path, where) => {
  const json = /<pre id="counts">([^<]*)<\/pre>/.exec(await get(path))?.[1]?.replace(/&quot;/g, '"');
  if (!json) fail(`${where}: no counts on the page`);
  check(where, JSON.parse(json));
};
await counts("/email-page", "Server Component");
// A Client Component working the email out in useMemo, in its server render.
await counts("/client-email", "Client Component");
// An edge route: it renders the email, or (react-dom can't render with React Server Components' React) says where to.
const edge = edgeRoute ? JSON.parse(await get("/edge")) : undefined;
if (!edge);
else if (edge.error === undefined) check("edge route", edge);
else if (/render emails in the Node\.js runtime/.test(edge.error)) console.log(`✓ edge route: ${edge.error}`);
else fail(`edge route: ${edge.error}`);
server.kill();
process.exit(0);
