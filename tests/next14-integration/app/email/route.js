// A route handler that renders an email (see lib/email.js).
import { emailCounts } from "@/lib/email";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(emailCounts());
}
