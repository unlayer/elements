// An edge route that renders an email (see src/lib/email.ts). The build must succeed: React 19's browser server
// build, which Elements once loaded, opens a MessageChannel there when it loads. React here is React Server
// Components', which react-dom can't render with: Elements says to render in the Node.js runtime.
import { emailCounts } from "@/lib/email";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return Response.json(emailCounts());
  } catch (error) {
    return Response.json({ error: (error as Error).message });
  }
}
