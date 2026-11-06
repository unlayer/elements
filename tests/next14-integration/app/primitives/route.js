// A route handler that renders a template in the new components (see lib/primitives.js).
import { primitiveCounts } from "@/lib/primitives";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await primitiveCounts());
}
