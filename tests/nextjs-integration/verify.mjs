// Starts the built app and checks that an email rendered on the server is one: email tables, not a web layout,
// and a design with its rows, from a route handler and from a Server Component; and what an edge route gets. `next build`
// succeeding isn't enough: Elements once rendered rows as a web page there, and an empty design, without an error.
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
// A template in the new components (the main entry), and its design for the builder (/builder): an email (tables) with
// its words in the HTML and the plain text, and a design with its rows, from a route handler and a Server Component.
const checkPrimitives = (where, counts) => {
  if (!(counts.tables >= 2)) fail(`${where} (new components): ${counts.tables} tables in the email`);
  if (!counts.text) fail(`${where} (new components): the email's words are missing from its HTML or its plain text`);
  if (!(counts.rows >= 1)) fail(`${where} (new components): the design has no rows`);
  console.log(`✓ ${where} (new components): ${counts.tables} tables, ${counts.rows} design rows`);
};
checkPrimitives("route handler", JSON.parse(await get("/primitives")));
const primitivesJson = /<pre id="counts">([^<]*)<\/pre>/.exec(await get("/primitives-page"))?.[1]?.replace(/&quot;/g, '"');
if (!primitivesJson) fail("Server Component (new components): no counts on the page");
checkPrimitives("Server Component", JSON.parse(primitivesJson));
const primitivesEdge = edgeRoute ? JSON.parse(await get("/primitives-edge")) : undefined;
if (!primitivesEdge);
else if (primitivesEdge.error === undefined) checkPrimitives("edge route", primitivesEdge);
else if (/render emails in the Node\.js runtime/.test(primitivesEdge.error)) console.log(`✓ edge route (new components): ${primitivesEdge.error}`);
else fail(`edge route (new components): ${primitivesEdge.error}`);
server.kill();
process.exit(0);
