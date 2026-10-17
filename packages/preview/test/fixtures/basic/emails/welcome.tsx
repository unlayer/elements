import { Email, Row, Column, Heading, Paragraph, Button, Image } from "@unlayer/react-elements";
import { Footer } from "./_components/footer";

interface WelcomeProps {
  name: string;
  company: string;
}

export default function Welcome({ name, company }: WelcomeProps) {
  return (
    <Email backgroundColor="#f4f4f5" previewText={`Welcome, ${name}`}>
      <Row padding="24px">
        <Column>
          <Image src="/static/logo.png" alt={company} />
          <Heading>Welcome, {name}</Heading>
          <Paragraph>Thanks for joining {company}.</Paragraph>
          <Button href="https://example.com/start" backgroundColor="#4f46e5">Get started</Button>
          <Footer company={company} />
        </Column>
      </Row>
    </Email>
  );
}

Welcome.PreviewProps = { name: "Ada", company: "Acme" } satisfies WelcomeProps;
