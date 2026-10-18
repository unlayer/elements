// A Server Component that renders an email (see lib/email.js), prerendered when the app builds, then calls a hook:
// Elements' renders put React's dispatcher (Next.js's Flight renderer's) back as they found it.
import { useId } from "react";
import { emailCounts } from "@/lib/email";

export default function EmailPage() {
  const counts = emailCounts();
  return (
    <>
      <pre id="counts">{JSON.stringify(counts)}</pre>
      <i id="hook-after">{useId()}</i>
    </>
  );
}
