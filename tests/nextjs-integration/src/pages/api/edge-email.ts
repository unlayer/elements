// A Pages Router API route on the edge runtime that renders an email (see src/lib/email.ts). It has no react-server
// condition, so React here is the full one and react-dom renders with it: Elements must render, unlike in an App
// Router edge route (src/app/edge/route.ts).
import { emailCounts } from "@/lib/email";

// webpack (Next.js 15's default bundler) fails an edge API route's build for code that could evaluate a string:
// @unlayer/exporters has lodash's `Function("return this")()`, which the edge runtime never reaches (it has globalThis).
export const config = { runtime: "edge", unstable_allowDynamic: ["**/node_modules/@unlayer/exporters/**"] };

export default function handler() {
  try {
    return Response.json(emailCounts());
  } catch (error) {
    return Response.json({ error: (error as Error).message });
  }
}
