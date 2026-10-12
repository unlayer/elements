// A Server Component that renders an email (see src/lib/email.ts).
import { emailCounts } from "@/lib/email";

export const dynamic = "force-dynamic";

export default function EmailPage() {
  return <pre id="counts">{JSON.stringify(emailCounts())}</pre>;
}
