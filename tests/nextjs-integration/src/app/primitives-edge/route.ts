// An edge route that renders a template in the new components (see src/lib/primitives.ts): it renders, or says to
// render in the Node.js runtime, as today's components do (see ../edge/route.ts).
import { primitiveCounts } from "@/lib/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await primitiveCounts());
  } catch (error) {
    return Response.json({ error: (error as Error).message });
  }
}
