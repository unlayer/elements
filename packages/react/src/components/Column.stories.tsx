import type { Meta, StoryObj } from "@storybook/react";
import Body from "./Body";
import Row from "./Row";
import type { ColumnProps } from "./Column";
import Column from "./Column";
import Paragraph from "./Paragraph";
import Heading from "./Heading";
import Button from "./Button";
import Image from "./Image";
import Divider from "./Divider";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

const sansFont = { label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" };
const georgiaFont = { label: "Georgia", value: "Georgia, 'Times New Roman', serif" };

const meta: Meta<typeof Column> = {
  title: "Layout/Column",
  component: Column,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A layout container representing a single column within a Row.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Playground -- Interactive controls for Column props
// ---------------------------------------------------------------------------

export const Playground: Story = {
  args: {
    backgroundColor: "#4f46e5",
    padding: "40px 32px",
    borderRadius: "16px",
  },
  argTypes: {
    backgroundColor: { control: "color" },
    padding: { control: "text" },
    borderRadius: { control: "text" },
  },
  render: (args: ColumnProps) => (
    <Body
      backgroundColor="#f0f4f8"
      contentAlign="center"
      contentWidth="480px"
      mode="web"
    >
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="transparent"
        padding="48px 24px"
        mode="web"
      >
        <Column
          backgroundColor={args.backgroundColor}
          padding={args.padding}
          borderRadius={args.borderRadius}
        >
          <Heading
            level="h2"
            fontSize="26px"
            fontWeight={700}
            color="#ffffff"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0 0 12px 0"
            fontFamily={sansFont}
            mode="web"
          >
            Column Playground
          </Heading>
          <Paragraph
            text="Use the Controls panel to change this column's background colour, padding, and border radius. The column is the styled container wrapping this content."
            fontSize="15px"
            color="#e0e7ff"
            textAlign="left"
            lineHeight="1.65"
            containerPadding="0 0 24px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Button
            backgroundColor="#ffffff"
            color="#4f46e5"
            padding="12px 28px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="left"
            fontFamily={sansFont}
            mode="web"
          >
            Example Button
          </Button>
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Interactive playground -- use the Controls panel to tweak Column props and see changes in real time.",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// PricingCards -- Three-tier pricing table with gradient featured center
// ---------------------------------------------------------------------------

export const PricingCards: Story = {
  render: () => (
    <Body
      backgroundColor="#f0f4f8"
      contentAlign="center"
      contentWidth="960px"
      textColor="#333333"
      mode="web"
    >
      {/* Section header */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="transparent"
        padding="56px 40px 8px 40px"
        mode="web"
      >
        <Column>
          <Paragraph
            text="PRICING"
            fontSize="11px"
            color="#6366f1"
            textAlign="center"
            letterSpacing="0.2em"
            fontWeight={700}
            fontFamily={sansFont}
            containerPadding="0 0 12px 0"
            lineHeight="1"
            mode="web"
          />
          <Heading
            level="h1"
            fontSize="36px"
            fontWeight={800}
            color="#0f172a"
            textAlign="center"
            lineHeight="1.15"
            containerPadding="0 0 8px 0"
            fontFamily={sansFont}
            letterSpacing="-0.02em"
            mode="web"
          >
            Simple, transparent pricing
          </Heading>
          <Paragraph
            text="Start free. Upgrade when you're ready. No surprises."
            fontSize="16px"
            color="#64748b"
            textAlign="center"
            lineHeight="1.5"
            containerPadding="0 0 0 0"
            fontFamily={sansFont}
            mode="web"
          />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.ThreeEqual}
        backgroundColor="transparent"
        padding="32px 16px 56px 16px"
        columnsBackgroundColor="#ffffff"
        mode="web"
      >
        {/* Starter */}
        <Column
          padding="36px 28px"
          borderRadius="16px"
        >
          <Paragraph
            text="Starter"
            fontSize="15px"
            color="#475569"
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 24px 0"
            fontFamily={sansFont}
            fontWeight={600}
            mode="web"
          />
          <Heading
            level="h2"
            fontSize="48px"
            fontWeight={800}
            color="#0f172a"
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 4px 0"
            fontFamily={sansFont}
            letterSpacing="-0.02em"
            mode="web"
          >
            $0
          </Heading>
          <Paragraph
            text="Free forever"
            fontSize="14px"
            color="#94a3b8"
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 32px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Paragraph
            text="3 projects, 1 GB storage, Basic analytics, Community support"
            fontSize="14px"
            color="#475569"
            textAlign="center"
            lineHeight="2.3"
            containerPadding="0 0 32px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Button
            backgroundColor="#f1f5f9"
            color="#334155"
            padding="14px 28px"
            borderRadius="10px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
            mode="web"
          >
            Get Started
          </Button>
        </Column>

        {/* Pro -- featured */}
        <Column
          backgroundColor="#4f46e5"
          padding="36px 28px"
          borderRadius="16px"
        >
          <Paragraph
            text="Pro"
            fontSize="15px"
            color="#c7d2fe"
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 24px 0"
            fontFamily={sansFont}
            fontWeight={600}
            mode="web"
          />
          <Heading
            level="h2"
            fontSize="48px"
            fontWeight={800}
            color="#ffffff"
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 4px 0"
            fontFamily={sansFont}
            letterSpacing="-0.02em"
            mode="web"
          >
            $29
          </Heading>
          <Paragraph
            text="per month"
            fontSize="14px"
            color="#a5b4fc"
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 32px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Paragraph
            text="Unlimited projects, 50 GB storage, Advanced analytics, Priority support"
            fontSize="14px"
            color="#e0e7ff"
            textAlign="center"
            lineHeight="2.3"
            containerPadding="0 0 32px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Button
            backgroundColor="#ffffff"
            color="#4f46e5"
            padding="14px 28px"
            borderRadius="10px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
            mode="web"
          >
            Start Free Trial
          </Button>
        </Column>

        {/* Enterprise */}
        <Column
          padding="36px 28px"
          borderRadius="16px"
        >
          <Paragraph
            text="Enterprise"
            fontSize="15px"
            color="#475569"
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 24px 0"
            fontFamily={sansFont}
            fontWeight={600}
            mode="web"
          />
          <Heading
            level="h2"
            fontSize="48px"
            fontWeight={800}
            color="#0f172a"
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 4px 0"
            fontFamily={sansFont}
            letterSpacing="-0.02em"
            mode="web"
          >
            $99
          </Heading>
          <Paragraph
            text="per month"
            fontSize="14px"
            color="#94a3b8"
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 32px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Paragraph
            text="Everything in Pro, Unlimited storage, Custom integrations, Dedicated manager"
            fontSize="14px"
            color="#475569"
            textAlign="center"
            lineHeight="2.3"
            containerPadding="0 0 32px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Button
            backgroundColor="#f1f5f9"
            color="#334155"
            padding="14px 28px"
            borderRadius="10px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
            mode="web"
          >
            Contact Sales
          </Button>
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Three-tier pricing table with an indigo featured center card. The colour contrast immediately draws the eye to the recommended plan.",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// 2. FeatureShowcase -- Asymmetric two-column with image + content
// ---------------------------------------------------------------------------

export const FeatureShowcase: Story = {
  render: () => (
    <Body
      backgroundColor="#ffffff"
      contentAlign="center"
      contentWidth="880px"
      textColor="#1a1a1a"
      mode="web"
    >
      {/* Row 1: Image left, text right */}
      <Row
        layout={ColumnLayouts.TwoEqual}
        backgroundColor="#ffffff"
        padding="64px 24px 0 24px"
        mode="web"
      >
        <Column padding="0 20px 0 0">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=440&fit=crop",
              width: 600,
              height: 440,
            }}
            altText="Team collaborating at a modern workspace"
            textAlign="center"
            containerPadding="0"
            mode="web"
          />
        </Column>
        <Column padding="24px 0 24px 20px">
          <Paragraph
            text="COLLABORATION"
            fontSize="11px"
            color="#6366f1"
            textAlign="left"
            letterSpacing="0.18em"
            fontWeight={700}
            fontFamily={sansFont}
            containerPadding="0 0 14px 0"
            lineHeight="1"
            mode="web"
          />
          <Heading
            level="h2"
            fontSize="32px"
            fontWeight={800}
            color="#0f172a"
            textAlign="left"
            lineHeight="1.15"
            containerPadding="0 0 16px 0"
            fontFamily={sansFont}
            letterSpacing="-0.02em"
            mode="web"
          >
            {"Work together,<br/>in real time"}
          </Heading>
          <Paragraph
            text="See changes from your team as they happen. Comments, cursors, and edits -- all in sync, all the time. No more version conflicts or merge nightmares."
            fontSize="15px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.7"
            containerPadding="0 0 24px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Button
            backgroundColor="#4f46e5"
            color="#ffffff"
            padding="12px 24px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
            mode="web"
          >
            Learn More
          </Button>
        </Column>
      </Row>

      {/* Row 2: Text left, image right (mirrored) */}
      <Row
        layout={ColumnLayouts.TwoEqual}
        backgroundColor="#ffffff"
        padding="64px 24px 64px 24px"
        mode="web"
      >
        <Column padding="24px 20px 24px 0">
          <Paragraph
            text="ANALYTICS"
            fontSize="11px"
            color="#059669"
            textAlign="left"
            letterSpacing="0.18em"
            fontWeight={700}
            fontFamily={sansFont}
            containerPadding="0 0 14px 0"
            lineHeight="1"
            mode="web"
          />
          <Heading
            level="h2"
            fontSize="32px"
            fontWeight={800}
            color="#0f172a"
            textAlign="left"
            lineHeight="1.15"
            containerPadding="0 0 16px 0"
            fontFamily={sansFont}
            letterSpacing="-0.02em"
            mode="web"
          >
            {"Insights that<br/>drive decisions"}
          </Heading>
          <Paragraph
            text="Track opens, clicks, and conversions with pixel-perfect accuracy. Our dashboard turns raw data into clear stories that help you make better choices, faster."
            fontSize="15px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.7"
            containerPadding="0 0 24px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Button
            backgroundColor="#059669"
            color="#ffffff"
            padding="12px 24px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="center"
            fontFamily={sansFont}
            mode="web"
          >
            See Dashboard
          </Button>
        </Column>
        <Column padding="0 0 0 20px">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=440&fit=crop",
              width: 600,
              height: 440,
            }}
            altText="Analytics dashboard with charts and graphs"
            textAlign="center"
            containerPadding="0"
            mode="web"
          />
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Alternating image-and-text feature sections. The mirrored layout keeps the page dynamic while maintaining a consistent rhythm.",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// 3. TestimonialCards -- Three testimonial cards with accent top borders
// ---------------------------------------------------------------------------

export const TestimonialCards: Story = {
  render: () => (
    <Body
      backgroundColor="#fafafa"
      contentAlign="center"
      contentWidth="960px"
      textColor="#333333"
      mode="web"
    >
      {/* Section header */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="transparent"
        padding="56px 40px 8px 40px"
        mode="web"
      >
        <Column>
          <Paragraph
            text="TESTIMONIALS"
            fontSize="11px"
            color="#94a3b8"
            textAlign="center"
            letterSpacing="0.2em"
            fontWeight={700}
            fontFamily={sansFont}
            containerPadding="0 0 12px 0"
            lineHeight="1"
            mode="web"
          />
          <Heading
            level="h1"
            fontSize="36px"
            fontWeight={800}
            color="#0f172a"
            textAlign="center"
            lineHeight="1.15"
            containerPadding="0"
            fontFamily={sansFont}
            letterSpacing="-0.02em"
            mode="web"
          >
            Loved by teams everywhere
          </Heading>
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.ThreeEqual}
        backgroundColor="transparent"
        padding="32px 16px 56px 16px"
        columnsBackgroundColor="#ffffff"
        mode="web"
      >
        {/* Card 1 */}
        <Column
          padding="0"
          borderRadius="12px"
        >
          <Divider
            borderTopWidth="3px"
            borderTopColor="#6366f1"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Paragraph
            text={"\u201cSwitching to this platform cut our deployment time from hours to minutes. The team hasn\u2019t looked back since.\u201d"}
            fontSize="16px"
            color="#334155"
            textAlign="left"
            lineHeight="1.7"
            containerPadding="28px 28px 24px 28px"
            fontFamily={georgiaFont}
            mode="web"
          />
          <Divider
            borderTopWidth="1px"
            borderTopColor="#f1f5f9"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Paragraph
            text="Sarah Chen"
            fontSize="14px"
            color="#0f172a"
            textAlign="left"
            fontWeight={700}
            fontFamily={sansFont}
            containerPadding="20px 28px 2px 28px"
            lineHeight="1.3"
            mode="web"
          />
          <Paragraph
            text="CTO, Streamline"
            fontSize="13px"
            color="#94a3b8"
            textAlign="left"
            fontFamily={sansFont}
            containerPadding="0 28px 28px 28px"
            lineHeight="1.4"
            mode="web"
          />
        </Column>

        {/* Card 2 */}
        <Column
          padding="0"
          borderRadius="12px"
        >
          <Divider
            borderTopWidth="3px"
            borderTopColor="#f59e0b"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Paragraph
            text={"\u201cThe API is so well-designed that our junior devs were productive on day one. Documentation is genuinely excellent.\u201d"}
            fontSize="16px"
            color="#334155"
            textAlign="left"
            lineHeight="1.7"
            containerPadding="28px 28px 24px 28px"
            fontFamily={georgiaFont}
            mode="web"
          />
          <Divider
            borderTopWidth="1px"
            borderTopColor="#f1f5f9"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Paragraph
            text="Marcus Rivera"
            fontSize="14px"
            color="#0f172a"
            textAlign="left"
            fontWeight={700}
            fontFamily={sansFont}
            containerPadding="20px 28px 2px 28px"
            lineHeight="1.3"
            mode="web"
          />
          <Paragraph
            text="Lead Engineer, Parallel"
            fontSize="13px"
            color="#94a3b8"
            textAlign="left"
            fontFamily={sansFont}
            containerPadding="0 28px 28px 28px"
            lineHeight="1.4"
            mode="web"
          />
        </Column>

        {/* Card 3 */}
        <Column
          padding="0"
          borderRadius="12px"
        >
          <Divider
            borderTopWidth="3px"
            borderTopColor="#10b981"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Paragraph
            text={"\u201cWe evaluated six platforms before choosing this one. Best developer experience by far, and the support team actually responds.\u201d"}
            fontSize="16px"
            color="#334155"
            textAlign="left"
            lineHeight="1.7"
            containerPadding="28px 28px 24px 28px"
            fontFamily={georgiaFont}
            mode="web"
          />
          <Divider
            borderTopWidth="1px"
            borderTopColor="#f1f5f9"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Paragraph
            text="Aisha Patel"
            fontSize="14px"
            color="#0f172a"
            textAlign="left"
            fontWeight={700}
            fontFamily={sansFont}
            containerPadding="20px 28px 2px 28px"
            lineHeight="1.3"
            mode="web"
          />
          <Paragraph
            text="VP Engineering, Kinetic"
            fontSize="13px"
            color="#94a3b8"
            textAlign="left"
            fontFamily={sansFont}
            containerPadding="0 28px 28px 28px"
            lineHeight="1.4"
            mode="web"
          />
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Three testimonial cards with colour-coded accent borders. The serif quote text contrasts with sans-serif attribution for clear hierarchy.",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// 4. SidebarArticle -- Long-form article with a tinted navigation sidebar
// ---------------------------------------------------------------------------

export const SidebarArticle: Story = {
  render: () => (
    <Body
      backgroundColor="#f1f5f9"
      contentAlign="center"
      contentWidth="860px"
      textColor="#333333"
      mode="web"
    >
      <Row
        layout={ColumnLayouts.TwoWideNarrow}
        backgroundColor="#ffffff"
        padding="0"
        mode="web"
      >
        {/* Wide column -- Article content */}
        <Column padding="48px 40px">
          <Paragraph
            text="ESSAY"
            fontSize="11px"
            color="#6366f1"
            textAlign="left"
            letterSpacing="0.18em"
            fontWeight={700}
            fontFamily={sansFont}
            containerPadding="0 0 16px 0"
            lineHeight="1"
            mode="web"
          />
          <Heading
            level="h1"
            fontSize="30px"
            fontWeight={700}
            color="#0f172a"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0 0 20px 0"
            fontFamily={georgiaFont}
            mode="web"
          >
            Designing for Clarity
          </Heading>
          <Paragraph
            text="Good design is about removing everything that does not serve the reader. Each element on the page should earn its place -- if it does not inform, orient, or delight, it is noise."
            fontSize="16px"
            color="#334155"
            textAlign="left"
            lineHeight="1.75"
            containerPadding="0 0 20px 0"
            fontFamily={georgiaFont}
            mode="web"
          />
          <Paragraph
            text="The temptation to add more is always present, but restraint is what separates competent layouts from truly excellent ones. When you strip a composition down to its essentials, what remains communicates with a force that decoration never achieves."
            fontSize="16px"
            color="#334155"
            textAlign="left"
            lineHeight="1.75"
            containerPadding="0 0 24px 0"
            fontFamily={georgiaFont}
            mode="web"
          />
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e2e8f0"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Paragraph
            text="White space is not empty space. It is the breathing room that lets content speak. Margins, line height, and padding are design decisions just as deliberate as colour or typography."
            fontSize="16px"
            color="#334155"
            textAlign="left"
            lineHeight="1.75"
            containerPadding="24px 0 0 0"
            fontFamily={georgiaFont}
            mode="web"
          />
        </Column>

        {/* Narrow column -- Sidebar navigation */}
        <Column
          backgroundColor="#f8fafc"
          padding="48px 28px"
        >
          <Paragraph
            text="CONTENTS"
            fontSize="11px"
            color="#94a3b8"
            textAlign="left"
            letterSpacing="0.15em"
            fontWeight={700}
            fontFamily={sansFont}
            containerPadding="0 0 24px 0"
            lineHeight="1"
            mode="web"
          />
          <Paragraph
            text="Principles"
            fontSize="14px"
            color="#6366f1"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0 0 16px 0"
            fontFamily={sansFont}
            fontWeight={600}
            mode="web"
          />
          <Paragraph
            text="Typography"
            fontSize="14px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0 0 16px 0"
            fontFamily={sansFont}
            fontWeight={500}
            mode="web"
          />
          <Paragraph
            text="Colour Systems"
            fontSize="14px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0 0 16px 0"
            fontFamily={sansFont}
            fontWeight={500}
            mode="web"
          />
          <Paragraph
            text="Spacing & Grid"
            fontSize="14px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0 0 16px 0"
            fontFamily={sansFont}
            fontWeight={500}
            mode="web"
          />
          <Paragraph
            text="Accessibility"
            fontSize="14px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0"
            fontFamily={sansFont}
            fontWeight={500}
            mode="web"
          />
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e2e8f0"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            containerPadding="24px 0"
            mode="web"
          />
          <Paragraph
            text="Published Feb 2026"
            fontSize="12px"
            color="#94a3b8"
            textAlign="left"
            lineHeight="1.4"
            containerPadding="0 0 4px 0"
            fontFamily={sansFont}
            mode="web"
          />
          <Paragraph
            text="8 min read"
            fontSize="12px"
            color="#94a3b8"
            textAlign="left"
            lineHeight="1.4"
            containerPadding="0"
            fontFamily={sansFont}
            mode="web"
          />
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Asymmetric two-column layout pairing a serif article with a sidebar navigation. The active nav item uses indigo to orient the reader.",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// 5. StatsBar -- Four-column metrics dashboard strip
// ---------------------------------------------------------------------------

export const StatsBar: Story = {
  render: () => (
    <Body
      backgroundColor="#0f172a"
      contentAlign="center"
      contentWidth="960px"
      textColor="#ffffff"
      mode="web"
    >
      <Row
        layout={ColumnLayouts.FourEqual}
        backgroundColor="#0f172a"
        padding="56px 24px"
        mode="web"
      >
        <Column padding="0 16px">
          <Paragraph
            text="2.4M"
            fontSize="44px"
            fontWeight={800}
            color="#ffffff"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0 0 8px 0"
            lineHeight="1"
            letterSpacing="-0.02em"
            mode="web"
          />
          <Paragraph
            text="Emails sent"
            fontSize="14px"
            color="#64748b"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0 0 4px 0"
            lineHeight="1.4"
            mode="web"
          />
          <Paragraph
            text="+12% this month"
            fontSize="12px"
            color="#22c55e"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0"
            lineHeight="1.4"
            fontWeight={600}
            mode="web"
          />
        </Column>
        <Column padding="0 16px">
          <Paragraph
            text="68.4%"
            fontSize="44px"
            fontWeight={800}
            color="#ffffff"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0 0 8px 0"
            lineHeight="1"
            letterSpacing="-0.02em"
            mode="web"
          />
          <Paragraph
            text="Open rate"
            fontSize="14px"
            color="#64748b"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0 0 4px 0"
            lineHeight="1.4"
            mode="web"
          />
          <Paragraph
            text="+3.2% vs industry"
            fontSize="12px"
            color="#22c55e"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0"
            lineHeight="1.4"
            fontWeight={600}
            mode="web"
          />
        </Column>
        <Column padding="0 16px">
          <Paragraph
            text="14.2%"
            fontSize="44px"
            fontWeight={800}
            color="#ffffff"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0 0 8px 0"
            lineHeight="1"
            letterSpacing="-0.02em"
            mode="web"
          />
          <Paragraph
            text="Click-through"
            fontSize="14px"
            color="#64748b"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0 0 4px 0"
            lineHeight="1.4"
            mode="web"
          />
          <Paragraph
            text="+1.8% vs last week"
            fontSize="12px"
            color="#22c55e"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0"
            lineHeight="1.4"
            fontWeight={600}
            mode="web"
          />
        </Column>
        <Column padding="0 16px">
          <Paragraph
            text="0.02%"
            fontSize="44px"
            fontWeight={800}
            color="#ffffff"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0 0 8px 0"
            lineHeight="1"
            letterSpacing="-0.02em"
            mode="web"
          />
          <Paragraph
            text="Bounce rate"
            fontSize="14px"
            color="#64748b"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0 0 4px 0"
            lineHeight="1.4"
            mode="web"
          />
          <Paragraph
            text="Industry best"
            fontSize="12px"
            color="#a78bfa"
            textAlign="center"
            fontFamily={sansFont}
            containerPadding="0"
            lineHeight="1.4"
            fontWeight={600}
            mode="web"
          />
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Four-column metrics strip on a dark background. Green accent text highlights positive trends while purple marks exceptional performance.",
      },
    },
  },
};
