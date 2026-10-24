// An async Server Component that renders an email with the async renderers (see src/lib/async-email.ts).
import { asyncEmailCounts } from "@/lib/async-email";

export const dynamic = "force-dynamic";

export default async function AsyncEmailPage() {
  return <pre id="counts">{JSON.stringify(await asyncEmailCounts())}</pre>;
}
