// An async Server Component that renders an email with the async renderers (see lib/async-email.js), when it's
// requested (in a Suspense boundary, as Cache Components asks of what waits for a request).
import { Suspense } from "react";
import { connection } from "next/server";
import { asyncEmailCounts } from "@/lib/async-email";

async function Counts() {
  await connection();
  return <pre id="counts">{JSON.stringify(await asyncEmailCounts())}</pre>;
}

export default function AsyncEmailPage() {
  return (
    <Suspense fallback={null}>
      <Counts />
    </Suspense>
  );
}
