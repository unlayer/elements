"use client";
// A Client Component that works out an email while it renders (a preview), prerendered when the app builds: see lib/email.js.
import { useMemo } from "react";
import { emailCounts } from "@/lib/email";

export default function ClientEmailPage() {
  const counts = useMemo(() => emailCounts(), []);
  return <pre id="counts">{JSON.stringify(counts)}</pre>;
}
