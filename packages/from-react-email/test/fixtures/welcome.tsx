import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  firstName: string;
  productName: string;
  dashboardUrl: string;
  docsUrl: string;
  supportEmail: string;
}

export const WelcomeEmail = ({
  firstName,
  productName,
  dashboardUrl,
  docsUrl,
  supportEmail,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {productName}, {firstName}! Let's get you set up.</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-gray-100 font-sans">
          <Container className="mx-auto my-[40px] max-w-[560px] rounded-lg bg-white p-[32px]">
            <Section className="mt-[8px]">
              <Img
                src="https://placehold.co/120x40/4f46e5/ffffff?text=Acme"
                width="120"
                height="40"
                alt={productName}
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-semibold text-gray-900">
              Welcome to {productName}
            </Heading>
            <Text className="text-[15px] leading-[24px] text-gray-700">
              Hi {firstName},
            </Text>
            <Text className="text-[15px] leading-[24px] text-gray-700">
              Thanks for signing up! Your workspace is ready and you can start
              building right away. Here are three quick things to try on your
              first day:
            </Text>
            <Section className="my-[16px]">
              <Text className="m-0 text-[15px] leading-[28px] text-gray-700">
                1. Create your first project
              </Text>
              <Text className="m-0 text-[15px] leading-[28px] text-gray-700">
                2. Invite your teammates
              </Text>
              <Text className="m-0 text-[15px] leading-[28px] text-gray-700">
                3. Connect your favorite integrations
              </Text>
            </Section>
            <Section className="my-[28px] text-center">
              <Button
                href={dashboardUrl}
                className="rounded-md bg-indigo-600 px-[24px] py-[12px] text-center text-[15px] font-semibold text-white no-underline"
              >
                Go to your dashboard
              </Button>
            </Section>
            <Text className="text-[15px] leading-[24px] text-gray-700">
              Want to dig deeper? Our{' '}
              <Link href={docsUrl} className="text-indigo-600 underline">
                documentation
              </Link>{' '}
              covers everything from quickstarts to advanced guides.
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-gray-200" />
            <Text className="text-[12px] leading-[20px] text-gray-500">
              Questions? Just reply to this email or write to{' '}
              <Link href={`mailto:${supportEmail}`} className="text-gray-500 underline">
                {supportEmail}
              </Link>
              . We're always happy to help.
            </Text>
            <Text className="text-[12px] leading-[20px] text-gray-400">
              Acme, Inc. · 123 Market Street · San Francisco, CA 94105
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  firstName: 'Alex',
  productName: 'Acme',
  dashboardUrl: 'https://app.acme.com/dashboard',
  docsUrl: 'https://docs.acme.com',
  supportEmail: 'support@acme.com',
} as WelcomeEmailProps;

export default WelcomeEmail;
