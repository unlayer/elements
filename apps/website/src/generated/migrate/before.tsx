import { Body, Button, Container, Head, Heading, Html, Preview, Tailwind, Text } from "@react-email/components";

export default function Welcome({ name = "Ada" }: { name?: string }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Orbit</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-[520px] rounded-lg bg-white p-8">
            <Heading className="m-0 text-2xl font-bold text-gray-900">Welcome, {name}</Heading>
            <Text className="text-base text-gray-600">Your workspace is ready.</Text>
            <Button href="https://example.com/start" className="rounded-md bg-indigo-600 px-5 py-3 text-white">
              Open your workspace
            </Button>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

Welcome.PreviewProps = { name: "Ada" };
