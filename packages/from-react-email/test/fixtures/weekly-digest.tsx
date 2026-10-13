import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface Article {
  title: string;
  excerpt: string;
  url: string;
  thumbnailUrl: string;
  author: string;
  readTime: string;
}

interface WeeklyDigestEmailProps {
  subscriberName: string;
  weekOf: string;
  articles: Article[];
  unsubscribeUrl: string;
  preferencesUrl: string;
}

export const WeeklyDigestEmail = ({
  subscriberName,
  weekOf,
  articles,
  unsubscribeUrl,
  preferencesUrl,
}: WeeklyDigestEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {`${articles.length} stories worth your time this week: ${articles[0]?.title ?? ''}`}
      </Preview>
      <Tailwind>
        <Body className="bg-neutral-100 font-sans">
          <Container className="mx-auto my-[24px] max-w-[600px] bg-white">
            <Section className="bg-neutral-900 px-[32px] py-[28px]">
              <Text className="m-0 text-[12px] font-semibold uppercase tracking-[2px] text-neutral-400">
                The Weekly Dispatch
              </Text>
              <Heading className="m-0 mt-[6px] text-[26px] font-bold leading-[32px] text-white">
                Your week in review
              </Heading>
              <Text className="m-0 mt-[6px] text-[14px] text-neutral-400">
                Week of {weekOf}
              </Text>
            </Section>

            <Section className="px-[32px] pt-[28px]">
              <Text className="m-0 text-[15px] leading-[24px] text-neutral-700">
                Hi {subscriberName}, here are the {articles.length} stories our
                editors picked for you this week.
              </Text>
            </Section>

            {articles.map((article, index) => (
              <Section key={article.url} className="px-[32px] pt-[24px]">
                <Row>
                  <Column className="w-[132px] align-top">
                    <Img
                      src={article.thumbnailUrl}
                      width="112"
                      height="112"
                      alt={article.title}
                      className="rounded-lg object-cover"
                    />
                  </Column>
                  <Column className="align-top">
                    <Text className="m-0 text-[11px] font-semibold uppercase tracking-[1px] text-indigo-600">
                      {article.author} · {article.readTime}
                    </Text>
                    <Link
                      href={article.url}
                      className="mt-[4px] block text-[18px] font-bold leading-[24px] text-neutral-900 no-underline"
                    >
                      {article.title}
                    </Link>
                    <Text className="m-0 mt-[6px] text-[14px] leading-[21px] text-neutral-600">
                      {article.excerpt}
                    </Text>
                    <Link
                      href={article.url}
                      className="mt-[8px] block text-[14px] font-semibold text-indigo-600 underline"
                    >
                      Read more
                    </Link>
                  </Column>
                </Row>
                {index < articles.length - 1 ? (
                  <Hr className="mx-0 mb-0 mt-[24px] w-full border border-solid border-neutral-200" />
                ) : null}
              </Section>
            ))}

            <Section className="mt-[32px] bg-neutral-50 px-[32px] py-[24px] text-center">
              <Text className="m-0 text-[12px] leading-[20px] text-neutral-500">
                You're receiving this because you subscribed to The Weekly
                Dispatch.
              </Text>
              <Text className="m-0 mt-[8px] text-[12px] leading-[20px] text-neutral-500">
                <Link href={preferencesUrl} className="text-neutral-500 underline">
                  Email preferences
                </Link>
                {' · '}
                <Link href={unsubscribeUrl} className="text-neutral-500 underline">
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

WeeklyDigestEmail.PreviewProps = {
  subscriberName: 'Sam',
  weekOf: 'September 28, 2026',
  articles: [
    {
      title: 'How small teams ship faster with async-first habits',
      excerpt:
        'Three teams share the rituals that replaced their daily standups and what they measured along the way.',
      url: 'https://dispatch.example.com/posts/async-first',
      thumbnailUrl: 'https://picsum.photos/seed/async/224/224',
      author: 'Maya Chen',
      readTime: '6 min read',
    },
    {
      title: 'The quiet comeback of plain-text email',
      excerpt:
        'Designers are rediscovering the value of lightweight, accessible messages. Here is what the data says about engagement.',
      url: 'https://dispatch.example.com/posts/plain-text-email',
      thumbnailUrl: 'https://picsum.photos/seed/plaintext/224/224',
      author: 'Luis Ortega',
      readTime: '4 min read',
    },
    {
      title: 'A practical guide to database migrations without downtime',
      excerpt:
        'Expand, migrate, contract: a step-by-step walkthrough with real-world pitfalls and how to avoid them.',
      url: 'https://dispatch.example.com/posts/zero-downtime-migrations',
      thumbnailUrl: 'https://picsum.photos/seed/migrations/224/224',
      author: 'Anika Rao',
      readTime: '9 min read',
    },
    {
      title: 'Interview: building a design system that people actually use',
      excerpt:
        'The lead of a 40-person design org on governance, documentation, and saying no to one-off components.',
      url: 'https://dispatch.example.com/posts/design-system-interview',
      thumbnailUrl: 'https://picsum.photos/seed/designsystem/224/224',
      author: 'Tom Becker',
      readTime: '12 min read',
    },
  ],
  unsubscribeUrl: 'https://dispatch.example.com/unsubscribe?u=abc123',
  preferencesUrl: 'https://dispatch.example.com/preferences?u=abc123',
} as WeeklyDigestEmailProps;

export default WeeklyDigestEmail;
