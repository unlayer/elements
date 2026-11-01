// A Pages Router API route on the edge runtime that renders an email (see src/lib/email.ts). It has no react-server
// condition, so React here is the full one and react-dom renders with it: Elements must render, unlike in an App
// Router edge route (src/app/edge/route.ts).
import { renderToHtml as renderToHtmlAsync } from "@unlayer/react-elements/async";
import { emailCounts, welcome } from "@/lib/email";

// webpack (Next.js 15's default bundler) fails an edge API route's build for code that could evaluate a string:
// @unlayer/exporters has lodash's `Function("return this")()`, which the edge runtime never reaches (it has globalThis).
export const config = { runtime: "edge", unstable_allowDynamic: ["**/node_modules/@unlayer/exporters/**"] };

export default async function handler() {
  try {
    // The async renderers too: the edge runtime's `setImmediate` throws (a Node.js API it doesn't have), and they
    // waited for it forever.
    const late = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("the async renderer didn't settle")), 10_000));
    const html = await Promise.race([renderToHtmlAsync(welcome()), late]);
    return Response.json({ ...emailCounts(), async: html.includes("Hello Ada") });
  } catch (error) {
    return Response.json({ error: (error as Error).message });
  }
}
