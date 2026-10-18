// A route handler that renders an email with the async renderers (see lib/async-email.js), when it's requested.
import { connection } from "next/server";
import { asyncEmailCounts } from "@/lib/async-email";

export async function GET() {
  await connection();
  return Response.json(await asyncEmailCounts());
}
