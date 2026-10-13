// A route handler that renders an email (see src/lib/email.ts).
import { emailCounts } from "@/lib/email";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(emailCounts());
}
