import { createClient } from "@scaleway/sdk-client";
import { Temv1alpha1 } from "@scaleway/sdk-tem";
import { deliveryMessage, requireEnv } from "../message";

const client = createClient({
  accessKey: requireEnv("SCW_ACCESS_KEY"),
  secretKey: requireEnv("SCW_SECRET_KEY"),
  defaultProjectId: requireEnv("SCW_DEFAULT_PROJECT_ID"),
  // Transactional Email runs in the fr-par region.
  defaultRegion: "fr-par",
});
const tem = new Temv1alpha1.API(client);
const { from, to, subject, html, text } = deliveryMessage();
const { emails } = await tem.createEmail({
  from: { email: from },
  to: [{ email: to }],
  subject,
  html,
  text,
});
console.info("Scaleway accepted:", emails.map((email) => email.id).join(", "));
