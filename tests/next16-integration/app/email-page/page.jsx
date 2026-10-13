// A Server Component that renders an email (see lib/email.js), prerendered when the app builds.
import { emailCounts } from "@/lib/email";

export default function EmailPage() {
  return <pre id="counts">{JSON.stringify(emailCounts())}</pre>;
}
