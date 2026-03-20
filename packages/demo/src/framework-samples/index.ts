export const reactSample = `import {
  Email, Row, Column, Paragraph, Heading, Button, ColumnLayouts
} from "@unlayer/react-elements";

export default function WelcomeEmail() {
  return (
    <Email contentWidth="560px" backgroundColor="#f4f4f5">
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#ffffff">
        <Column>
          <Heading
            text="Welcome to Acme"
            headingType="h1"
            fontSize="26px"
            fontWeight={700}
          />
          <Paragraph
            text="Thanks for signing up! We're thrilled to have you on board."
            fontSize="15px"
            color="#3f3f46"
          />
          <Button
            text="Go to Dashboard"
            backgroundColor="#6366f1"
            color="#ffffff"
            borderRadius="8px"
            padding="14px 28px"
          />
        </Column>
      </Row>
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
  { id: "react", name: "React", language: "tsx", code: reactSample, packageName: "@unlayer/react-elements" },
];
