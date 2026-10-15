// A Pages Router API route on the edge runtime that renders an email (see src/lib/email.ts). It has no react-server
// condition, so React here is the full one and react-dom renders with it: Elements must render, unlike in an App
// Router edge route (src/app/edge/route.ts).
import { emailCounts } from "@/lib/email";

export const config = { runtime: "edge" };

export default function handler() {
  try {
    return Response.json(emailCounts());
  } catch (error) {
    return Response.json({ error: (error as Error).message });
  }
}
