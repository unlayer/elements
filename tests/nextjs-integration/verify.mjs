// Starts the built app and checks that an email rendered on the server is one: email tables, not a web layout,
// and a design with its rows, from a route handler and from a Server Component. `next build` succeeding isn't
// enough: Elements once rendered rows as a web page there, and an empty design, without an error.
import { spawn } from "node:child_process";

const port = 3765;
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
const page = await get("/email-page");
const json = /<pre id="counts">([^<]*)<\/pre>/.exec(page)?.[1]?.replace(/&quot;/g, '"');
if (!json) fail("Server Component: no counts on the page");
check("Server Component", JSON.parse(json));
server.kill();
process.exit(0);
