"use client";
// A Client Component that works out an email while it renders (a preview): its server render renders it, as 0.1.22 did
// (an early 0.2.0 build failed `next build` here). See src/lib/email.ts.
import { useMemo } from "react";
import { emailCounts } from "@/lib/email";

export default function ClientEmailPage() {
  const counts = useMemo(() => emailCounts(), []);
  return <pre id="counts">{JSON.stringify(counts)}</pre>;
}
