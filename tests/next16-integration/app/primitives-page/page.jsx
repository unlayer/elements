// A Server Component that renders a template in the new components (see lib/primitives.js).
import { primitiveCounts } from "@/lib/primitives";

export default async function PrimitivesPage() {
  return <pre id="counts">{JSON.stringify(await primitiveCounts())}</pre>;
}
