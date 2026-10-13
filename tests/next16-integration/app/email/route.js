// A route handler that renders an email (see lib/email.js), prerendered when the app builds: it reads no request data.
import { emailCounts } from "@/lib/email";

export function GET() {
  return Response.json(emailCounts());
}
