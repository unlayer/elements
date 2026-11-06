import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import type { TailwindConfig } from '@react-email/components';
import * as React from 'react';

// A theme's own phone variant and type scale, written as a Tailwind plugin.
const config: TailwindConfig = {
  plugins: [
    {
      handler: ({ addUtilities, addVariant }: { addUtilities: (rules: Record<string, Record<string, string>>) => void; addVariant: (name: string, rule: string) => void }) => {
        addVariant('mobile', '@media (max-width: 600px)');
        addUtilities({
          '.display': { fontSize: '48px', lineHeight: '1.1' },
          '.display-small': { fontSize: '32px', lineHeight: '1.15' },
        });
      },
      config: {},
    },
  ],
};

interface LaunchEmailProps {
  product: string;
  features: Array<{ title: string; body: string }>;
}

export const LaunchEmail = ({ product, features }: LaunchEmailProps) => (
  <Html>
    <Tailwind config={config}>
      <Head />
      <Preview>{product} is here</Preview>
      <Body className="m-0 bg-gray-100 font-sans">
        <Container className="mx-auto my-[32px] max-w-[600px] bg-white px-[40px] py-[32px] mobile:px-[16px]">
          <Heading as="h1" className="display mobile:display-small m-0 text-gray-900">
            Meet {product}, the calmest way to plan your week
          </Heading>
          <Text className="mt-[16px] text-[18px] leading-[28px] text-gray-700 mobile:text-[16px] mobile:leading-[24px]">
            Everything your team needs to agree on the plan, in one place, without another meeting.
          </Text>
          <Section className="mt-[24px]">
            <Row>
              {features.map((feature) => (
                <Column key={feature.title} className="w-1/2 pr-[16px] align-top mobile:block mobile:w-full mobile:pr-0">
                  <Text className="m-0 text-[16px] font-semibold text-gray-900">{feature.title}</Text>
                  <Text className="mt-[4px] text-[14px] leading-[22px] text-gray-600">{feature.body}</Text>
                </Column>
              ))}
            </Row>
          </Section>
          <Button href="https://example.com/start" className="mt-[24px] rounded-[6px] bg-indigo-600 px-[20px] py-[12px] text-[16px] font-semibold text-white mobile:block mobile:text-center">
            Start planning
          </Button>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

LaunchEmail.PreviewProps = {
  product: 'Northwind Plan',
  features: [
    { title: 'Shared calendar', body: 'See every deadline your team has agreed to, side by side.' },
    { title: 'Quiet updates', body: 'One weekly summary instead of a stream of notifications.' },
  ],
} satisfies LaunchEmailProps;

export default LaunchEmail;
