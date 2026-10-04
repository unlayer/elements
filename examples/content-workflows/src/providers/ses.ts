import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { deliveryMessage, requireEnv } from "../message";

const client = new SESv2Client({ region: requireEnv("AWS_REGION") });
const { from, to, subject, html, text } = deliveryMessage();
try {
  const result = await client.send(new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: { Data: text, Charset: "UTF-8" },
        },
      },
    },
  }));
  console.log("SES accepted:", result.MessageId);
} finally {
  client.destroy();
}
