export const reactSample = `import {
  Email, Column, Text, Heading, Button
} from "@hyper-elements/react";

export default function WelcomeEmail() {
  return (
    <Email width={560} style={{ backgroundColor: "#f4f4f5" }}>
      <Column style={{ backgroundColor: "#ffffff", padding: 32, gap: 16 }}>
        <Heading level={1} style={{ fontSize: 26, fontWeight: 700 }}>
          Welcome to Acme
        </Heading>
        <Text style={{ fontSize: 15, color: "#3f3f46" }}>
          Thanks for signing up! We're thrilled to have you on board.
        </Text>
        <Button
          href="https://example.com/dashboard"
          style={{
            backgroundColor: "#6366f1",
            color: "#ffffff",
            borderRadius: 8,
            padding: "14px 28px",
          }}
        >
          Go to Dashboard
        </Button>
      </Column>
    </Email>
  );
}`;

export interface FrameworkSample {
  id: string;
  name: string;
  language: string;
  code: string;
  packageName: string;
}

export const frameworks: FrameworkSample[] = [
  { id: "react", name: "React", language: "tsx", code: reactSample, packageName: "@hyper-elements/react" },
];
