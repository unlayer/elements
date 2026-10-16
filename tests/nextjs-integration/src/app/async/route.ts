// A route handler that renders an email with the async renderers (see src/lib/async-email.ts).
import { asyncEmailCounts } from "@/lib/async-email";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await asyncEmailCounts());
}
