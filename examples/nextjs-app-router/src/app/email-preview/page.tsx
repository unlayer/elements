import { render } from "@unlayer/react-elements";
import WelcomeEmail from "@/emails/welcome-email";
import PreviewDashboard from "./PreviewDashboard";

export const metadata = { title: "Email preview" };

const recipient = {
  name: "Ada",
  plan: "Pro",
  dashboardUrl: "https://example.com/dashboard",
};

export default async function EmailPreviewPage() {
  // Rendered on the server: only the strings reach the browser
  const { html, text } = await render(<WelcomeEmail {...recipient} />);

  return (
    <PreviewDashboard
      initialHtml={html}
      initialText={text}
      recipientName={recipient.name}
    />
  );
}
