import WelcomeEmail from "@/emails/welcome-email";
import { renderEmailToHtml, renderEmailToPlainText } from "@/utils/render-server";
import PreviewDashboard from "./PreviewDashboard";

export const metadata = { title: "Email preview" };

const recipient = {
  name: "Ada",
  plan: "Pro",
  dashboardUrl: "https://example.com/dashboard",
};

export default function EmailPreviewPage() {
  const email = <WelcomeEmail {...recipient} />;

  // Render on the server using type-bridged helpers
  const html = renderEmailToHtml(email, { title: `Welcome, ${recipient.name}` });
  const text = renderEmailToPlainText(email);

  return (
    <PreviewDashboard
      initialHtml={html}
      initialText={text}
      recipientName={recipient.name}
    />
  );
}
