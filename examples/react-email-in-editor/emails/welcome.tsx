import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name?: string;
  workspace?: string;
  dashboardUrl?: string;
}

const steps = [
  { title: "Invite your team", body: "Bring teammates in with one link." },
  { title: "Connect your data", body: "Import from a spreadsheet or an API." },
  { title: "Share a report", body: "Send a live dashboard to anyone." },
];

export default function WelcomeEmail({
  name = "Ada",
  workspace = "Northwind",
  dashboardUrl = "https://example.com/dashboard",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>Welcome to {workspace}, {name}</Preview>
        <Body className="bg-slate-100 font-sans">
          <Container className="mx-auto my-10 max-w-[600px] rounded-lg bg-white px-10 py-8 max-sm:px-6">
            <Heading className="m-0 text-2xl font-semibold text-slate-900">Welcome to {workspace}, {name}</Heading>
            <Text className="text-base leading-6 text-slate-600">
              Your workspace is ready. Here are three things most teams do in their first week.
            </Text>
            <Section className="my-6">
              <Row>
                {steps.map((step) => (
                  <Column key={step.title} className="w-1/3 px-2 align-top max-sm:block max-sm:w-full max-sm:px-0">
                    <Text className="m-0 text-sm font-semibold text-slate-900">{step.title}</Text>
                    <Text className="mt-1 text-sm leading-5 text-slate-600">{step.body}</Text>
                  </Column>
                ))}
              </Row>
            </Section>
            <Button href={dashboardUrl} className="rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
              Open your dashboard
            </Button>
            <Hr className="my-8 border-slate-200" />
            <Text className="m-0 text-xs leading-5 text-slate-500">
              You're receiving this because you created a {workspace} workspace.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Ada",
  workspace: "Northwind",
  dashboardUrl: "https://example.com/dashboard",
} satisfies WelcomeEmailProps;
