import type { Meta, StoryObj } from "@storybook/react";
import type { BodyProps } from "./Body";
import Body from "./Body";
import Row from "./Row";
import Column from "./Column";
import Paragraph from "./Paragraph";
import Heading from "./Heading";
import Button from "./Button";
import Divider from "./Divider";
import Image from "./Image";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

const sansFont = { label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" };

const meta: Meta<typeof Body> = {
  title: "Layout/Body",
  component: Body,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Body component is the root container for email, web, and document layouts.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    backgroundColor: { control: "color" },
    textColor: { control: "color" },
    contentWidth: { control: "text" },
    contentAlign: {
      control: "inline-radio",
      options: ["left", "center", "right"],
    },
    mode: {
      control: "inline-radio",
      options: ["web", "email"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Playground -- Interactive controls for Body props
// ---------------------------------------------------------------------------

export const Playground: Story = {
  args: {
    backgroundColor: "#f0f4f8",
    textColor: "#1e293b",
    contentWidth: "600px",
    contentAlign: "center",
    mode: "web",
  },
  render: (args: BodyProps) => (
    <Body {...args}>
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="48px 40px"
        mode={args.mode}
      >
        <Column>
          <Heading
            level="h1"
            fontSize="28px"
            fontWeight={700}
            color="#0f172a"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0 0 12px 0"
            fontFamily={sansFont}
            mode={args.mode}
          >
            Welcome to the Playground
          </Heading>
          <Paragraph
            text="Use the Controls panel below to change the Body's background colour, content width, alignment, and rendering mode. The content area above will update in real time."
            fontSize="15px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.7"
            containerPadding="0 0 24px 0"
            fontFamily={sansFont}
            mode={args.mode}
          />
          <Button
            backgroundColor="#4f46e5"
            color="#ffffff"
            padding="14px 32px"
            borderRadius="8px"
            fontSize="14px"
            fontWeight={600}
            textAlign="left"
            fontFamily={sansFont}
            mode={args.mode}
          >
            Call to Action
          </Button>
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Interactive playground -- use the Controls panel to tweak Body props and see changes in real time.",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Receipt -- Stripe-inspired payment confirmation
// ---------------------------------------------------------------------------

export const Receipt: Story = {
  render: () => (
    <Body
      backgroundColor="#f6f6f6"
      textColor="#111827"
      contentAlign="center"
      contentWidth="560px"
      mode="email"
    >
      {/* Green accent bar */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#10b981"
        padding="0"
        mode="email"
      >
        <Column>
          <Divider
            borderTopWidth="4px"
            borderTopColor="#10b981"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Header + Amount */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="44px 48px 0 48px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="ACME INC"
            fontSize="11px"
            color="#9ca3af"
            textAlign="left"
            letterSpacing="0.2em"
            fontWeight={600}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 28px 0"
            lineHeight="1"
          />
          <Paragraph
            text="Receipt from Acme Inc"
            fontSize="22px"
            color="#111827"
            textAlign="left"
            fontWeight={400}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 6px 0"
            lineHeight="1.3"
          />
          <Paragraph
            text="Receipt #0042-8291"
            fontSize="14px"
            color="#9ca3af"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 32px 0"
            lineHeight="1.4"
          />
        </Column>
      </Row>

      {/* Amount paid */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="0 48px"
        mode="email"
      >
        <Column
          backgroundColor="#f9fafb"
          padding="28px 32px"
          borderRadius="8px"
        >
          <Paragraph
            text="Amount paid"
            fontSize="13px"
            color="#6b7280"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 4px 0"
            lineHeight="1"
          />
          <Heading
            level="h1"
            fontSize="40px"
            fontWeight={700}
            color="#111827"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            lineHeight="1.15"
            containerPadding="0"
            letterSpacing="-0.02em"
          >
            $2,450.00
          </Heading>
        </Column>
      </Row>

      {/* Payment details: Date + Method side by side */}
      <Row
        layout={ColumnLayouts.TwoEqual}
        backgroundColor="#ffffff"
        padding="32px 48px 0 48px"
        mode="email"
      >
        <Column padding="0 12px 0 0">
          <Paragraph
            text="Date paid"
            fontSize="12px"
            color="#9ca3af"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 4px 0"
            lineHeight="1.3"
          />
          <Paragraph
            text="February 7, 2026"
            fontSize="14px"
            color="#374151"
            textAlign="left"
            fontWeight={500}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.4"
          />
        </Column>
        <Column padding="0 0 0 12px">
          <Paragraph
            text="Payment method"
            fontSize="12px"
            color="#9ca3af"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 4px 0"
            lineHeight="1.3"
          />
          <Paragraph
            text="Visa ending in 4242"
            fontSize="14px"
            color="#374151"
            textAlign="left"
            fontWeight={500}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.4"
          />
        </Column>
      </Row>

      {/* Divider before line items */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="32px 48px 0 48px"
        mode="email"
      >
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e7eb"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Line items summary */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="24px 48px 0 48px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="SUMMARY"
            fontSize="11px"
            color="#9ca3af"
            textAlign="left"
            letterSpacing="0.12em"
            fontWeight={600}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 20px 0"
            lineHeight="1"
          />
        </Column>
      </Row>

      {/* Item rows - using two-column layout for description + amount */}
      <Row
        layout={ColumnLayouts.TwoWideNarrow}
        backgroundColor="#ffffff"
        padding="0 48px 10px 48px"
        mode="email"
      >
        <Column padding="0">
          <Paragraph
            text="Platform license -- Pro tier"
            fontSize="14px"
            color="#374151"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
        <Column padding="0">
          <Paragraph
            text="$1,200.00"
            fontSize="14px"
            color="#374151"
            textAlign="right"
            fontWeight={500}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.TwoWideNarrow}
        backgroundColor="#ffffff"
        padding="0 48px 10px 48px"
        mode="email"
      >
        <Column padding="0">
          <Paragraph
            text="Additional seats (5)"
            fontSize="14px"
            color="#374151"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
        <Column padding="0">
          <Paragraph
            text="$750.00"
            fontSize="14px"
            color="#374151"
            textAlign="right"
            fontWeight={500}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.TwoWideNarrow}
        backgroundColor="#ffffff"
        padding="0 48px 10px 48px"
        mode="email"
      >
        <Column padding="0">
          <Paragraph
            text="Priority support add-on"
            fontSize="14px"
            color="#374151"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
        <Column padding="0">
          <Paragraph
            text="$300.00"
            fontSize="14px"
            color="#374151"
            textAlign="right"
            fontWeight={500}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.TwoWideNarrow}
        backgroundColor="#ffffff"
        padding="0 48px"
        mode="email"
      >
        <Column padding="0">
          <Paragraph
            text="Data migration service"
            fontSize="14px"
            color="#374151"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
        <Column padding="0">
          <Paragraph
            text="$200.00"
            fontSize="14px"
            color="#374151"
            textAlign="right"
            fontWeight={500}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
      </Row>

      {/* Divider + Total */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="24px 48px 0 48px"
        mode="email"
      >
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e7eb"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.TwoWideNarrow}
        backgroundColor="#ffffff"
        padding="16px 48px 44px 48px"
        mode="email"
      >
        <Column padding="0">
          <Paragraph
            text="Total"
            fontSize="14px"
            color="#111827"
            textAlign="left"
            fontWeight={600}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
        <Column padding="0">
          <Paragraph
            text="$2,450.00"
            fontSize="14px"
            color="#111827"
            textAlign="right"
            fontWeight={700}
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="0 48px"
        mode="email"
      >
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#f3f4f6"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="24px 48px 44px 48px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="If you have any questions, contact us at support@acme.com or reply directly to this email."
            fontSize="13px"
            color="#9ca3af"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 16px 0"
            lineHeight="1.6"
          />
          <Paragraph
            text="Acme Inc. / 354 Oyster Point Blvd, Suite 200 / South San Francisco, CA 94080"
            fontSize="12px"
            color="#d1d5db"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
      </Row>
    </Body>
  ),
};

// ---------------------------------------------------------------------------
// 2. SaaSLanding -- Dark mode product page ("Velox")
// ---------------------------------------------------------------------------

export const SaaSLanding: Story = {
  name: "SaaS Landing",
  render: () => (
    <Body
      backgroundColor="#09090b"
      textColor="#fafafa"
      contentAlign="center"
      contentWidth="800px"
      mode="web"
    >
      {/* Nav / Brand */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#09090b"
        padding="56px 48px 0 48px"
        mode="web"
      >
        <Column>
          <Paragraph
            text="velox"
            fontSize="15px"
            color="#71717a"
            textAlign="left"
            fontFamily={{ label: "Courier", value: "'Courier New', Courier, monospace" }}
            fontWeight={700}
            letterSpacing="0.08em"
            containerPadding="0 0 72px 0"
            lineHeight="1"
          />
        </Column>
      </Row>

      {/* Hero Headline */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#09090b"
        padding="0 48px 24px 48px"
        mode="web"
      >
        <Column>
          <Heading
            level="h1"
            fontSize="56px"
            fontWeight={800}
            color="#fafafa"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
            lineHeight="1.08"
            letterSpacing="-0.03em"
            containerPadding="0 0 24px 0"
          >
            {"Ship faster.<br/>Break nothing."}
          </Heading>
          <Paragraph
            text="The deployment platform for teams who refuse to choose between speed and reliability. CI/CD, preview environments, and zero-downtime releases -- all from one CLI."
            fontSize="18px"
            color="#a1a1aa"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={{ label: "Sans Serif", value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 80px 0 0"
          />
        </Column>
      </Row>

      {/* CTA Buttons */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#09090b"
        padding="40px 48px 72px 48px"
        mode="web"
      >
        <Column>
          <Button
            backgroundColor="#2563eb"
            color="#ffffff"
            padding="16px 40px"
            borderRadius="8px"
            fontSize="15px"
            fontWeight={600}
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
            mode="web"
          >
            Start deploying
          </Button>
        </Column>
      </Row>

      {/* Terminal Block */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#111113"
        padding="40px 48px"
        mode="web"
      >
        <Column
          padding="32px"
          backgroundColor="#0c0c0e"
          borderRadius="12px"
        >
          <Paragraph
            text="$ velox deploy --prod"
            fontSize="14px"
            color="#2563eb"
            textAlign="left"
            fontFamily={{ label: "Courier", value: "'Courier New', Courier, monospace" }}
            fontWeight={700}
            containerPadding="0 0 12px 0"
            lineHeight="1.6"
          />
          <Paragraph
            text="Compiling 847 modules... Running 1,204 tests... all passed. Building optimized bundle... 2.4s. Deploying to 12 edge regions... 890ms. Ready https://app.example.com"
            fontSize="13px"
            color="#52525b"
            textAlign="left"
            fontFamily={{ label: "Courier", value: "'Courier New', Courier, monospace" }}
            containerPadding="0"
            lineHeight="1.85"
          />
        </Column>
      </Row>

      {/* Stats */}
      <Row
        layout={ColumnLayouts.ThreeEqual}
        backgroundColor="#09090b"
        padding="64px 48px 80px 48px"
        mode="web"
      >
        <Column padding="0 24px 0 0">
          <Paragraph
            text="140ms"
            fontSize="40px"
            fontWeight={800}
            color="#fafafa"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 8px 0"
            lineHeight="1"
            letterSpacing="-0.02em"
          />
          <Paragraph
            text="Avg. deploy time"
            fontSize="14px"
            color="#52525b"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.4"
          />
        </Column>
        <Column padding="0 12px">
          <Paragraph
            text="99.99%"
            fontSize="40px"
            fontWeight={800}
            color="#fafafa"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 8px 0"
            lineHeight="1"
            letterSpacing="-0.02em"
          />
          <Paragraph
            text="Uptime SLA"
            fontSize="14px"
            color="#52525b"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.4"
          />
        </Column>
        <Column padding="0 0 0 24px">
          <Paragraph
            text="12,000+"
            fontSize="40px"
            fontWeight={800}
            color="#fafafa"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0 0 8px 0"
            lineHeight="1"
            letterSpacing="-0.02em"
          />
          <Paragraph
            text="Teams shipping daily"
            fontSize="14px"
            color="#52525b"
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
            containerPadding="0"
            lineHeight="1.4"
          />
        </Column>
      </Row>

      {/* Bottom border accent */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#27272a"
        padding="0"
        mode="web"
      >
        <Column>
          <Divider
            borderTopWidth="2px"
            borderTopColor="#2563eb"
            borderTopStyle="solid"
          />
        </Column>
      </Row>
    </Body>
  ),
};

// ---------------------------------------------------------------------------
// 3. Ecommerce -- Luxury product email ("Maison")
// ---------------------------------------------------------------------------

export const Ecommerce: Story = {
  render: () => (
    <Body
      backgroundColor="#f5f5f5"
      textColor="#1a1a1a"
      contentAlign="center"
      contentWidth="600px"
      mode="email"
    >
      {/* Top Banner */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#1a1a1a"
        padding="14px 30px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="NEW COLLECTION"
            fontSize="10px"
            color="#d4d4d4"
            textAlign="center"
            fontWeight={500}
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            letterSpacing="0.25em"
            containerPadding="0"
            lineHeight="1"
          />
        </Column>
      </Row>

      {/* Brand Name */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="36px 30px 32px 30px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="MAISON"
            fontSize="28px"
            color="#1a1a1a"
            textAlign="center"
            fontWeight={300}
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            letterSpacing="0.35em"
            containerPadding="0"
            lineHeight="1"
          />
        </Column>
      </Row>

      {/* Hero Image */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="0"
        mode="email"
      >
        <Column>
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
              width: 600,
              height: 400,
            }}
            altText="Curated interior design store with warm lighting"
            textAlign="center"
            containerPadding="0"
          />
        </Column>
      </Row>

      {/* Hero Text */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="40px 40px 12px 40px"
        mode="email"
      >
        <Column>
          <Heading
            level="h1"
            fontSize="28px"
            fontWeight={300}
            color="#1a1a1a"
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            lineHeight="1.2"
            letterSpacing="0.04em"
            containerPadding="0 0 12px 0"
          >
            The Autumn Edit
          </Heading>
          <Paragraph
            text="A considered selection of pieces designed for the way you live. Thoughtfully sourced, beautifully made, built to last."
            fontSize="15px"
            color="#9ca3af"
            textAlign="center"
            lineHeight="1.7"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0 20px"
          />
        </Column>
      </Row>

      {/* Divider */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="28px 60px"
        mode="email"
      >
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e7eb"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Two-Column Product Grid */}
      <Row
        layout={ColumnLayouts.TwoEqual}
        backgroundColor="#ffffff"
        padding="0 30px 40px 30px"
        mode="email"
      >
        <Column padding="0 10px 0 0">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
              width: 400,
              height: 400,
            }}
            altText="Minimalist wristwatch on neutral background"
            textAlign="center"
            containerPadding="0 0 16px 0"
          />
          <Paragraph
            text="The Arc Watch"
            fontSize="14px"
            color="#1a1a1a"
            textAlign="center"
            fontWeight={400}
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            letterSpacing="0.04em"
            containerPadding="0 0 4px 0"
            lineHeight="1.3"
          />
          <Paragraph
            text="$285"
            fontSize="14px"
            color="#9ca3af"
            textAlign="center"
            fontWeight={400}
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0"
            lineHeight="1.4"
          />
        </Column>
        <Column padding="0 0 0 10px">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
              width: 400,
              height: 400,
            }}
            altText="Minimalist sunglasses on gradient background"
            textAlign="center"
            containerPadding="0 0 16px 0"
          />
          <Paragraph
            text="The Riviera Sunglasses"
            fontSize="14px"
            color="#1a1a1a"
            textAlign="center"
            fontWeight={400}
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            letterSpacing="0.04em"
            containerPadding="0 0 4px 0"
            lineHeight="1.3"
          />
          <Paragraph
            text="$165"
            fontSize="14px"
            color="#9ca3af"
            textAlign="center"
            fontWeight={400}
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0"
            lineHeight="1.4"
          />
        </Column>
      </Row>

      {/* Dark CTA Block */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#1a1a1a"
        padding="48px 40px"
        mode="email"
      >
        <Column>
          <Heading
            level="h2"
            fontSize="22px"
            fontWeight={300}
            color="#ffffff"
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            letterSpacing="0.04em"
            containerPadding="0 0 8px 0"
            lineHeight="1.3"
          >
            Timeless by design
          </Heading>
          <Paragraph
            text="Pieces that outlast seasons."
            fontSize="14px"
            color="#737373"
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0 0 28px 0"
            lineHeight="1.6"
          />
          <Button
            backgroundColor="#ffffff"
            color="#1a1a1a"
            padding="14px 36px"
            borderRadius="0"
            fontSize="12px"
            fontWeight={500}
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
          >
            Explore the Collection
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="28px 30px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="Maison / 18 Rue du Faubourg, Paris / Unsubscribe"
            fontSize="11px"
            color="#c4c4c4"
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            letterSpacing="0.04em"
            containerPadding="0"
            lineHeight="1.6"
          />
        </Column>
      </Row>
    </Body>
  ),
};

// ---------------------------------------------------------------------------
// 4. Magazine -- Editorial with hero ("Meridian Journal")
// ---------------------------------------------------------------------------

export const Magazine: Story = {
  render: () => (
    <Body
      backgroundColor="#f5f0eb"
      textColor="#1a1a1a"
      contentAlign="center"
      contentWidth="960px"
      mode="web"
    >
      {/* Full-bleed Hero Image */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundImage={{
          url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=700&fit=crop&q=80",
          fullWidth: true,
          repeat: "no-repeat",
          size: "cover",
          position: "center",
        }}
        padding="0"
        mode="web"
      >
        <Column>
          <Paragraph
            text=" "
            fontSize="1px"
            containerPadding="220px 0 0 0"
          />
        </Column>
      </Row>

      {/* Dark Overlay with Title */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="rgba(18, 12, 8, 0.88)"
        padding="64px 80px"
        mode="web"
      >
        <Column>
          <Paragraph
            text="MERIDIAN JOURNAL"
            fontSize="11px"
            color="#c9a87c"
            textAlign="center"
            letterSpacing="0.3em"
            fontWeight={600}
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0 0 32px 0"
            lineHeight="1"
          />
          <Heading
            level="h1"
            fontSize="52px"
            fontWeight={300}
            color="#ffffff"
            textAlign="center"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            lineHeight="1.15"
            containerPadding="0 0 24px 0"
          >
            {"The Last Light<br/>on the Dolomites"}
          </Heading>
          <Paragraph
            text="Words by Elena Marchetti  --  Photography by Luca Bianchi"
            fontSize="13px"
            color="#a09080"
            textAlign="center"
            lineHeight="1.5"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0 0 28px 0"
          />
          <Paragraph
            text="In the fading hours of an October afternoon, the peaks of the Italian Alps hold the kind of light that photographers wait years to capture. A thin band of gold clings to the ridgeline, then dissolves into violet and slate. This is the story of one such evening -- and the landscape that refused to let us leave."
            fontSize="17px"
            color="#d4c8b8"
            textAlign="center"
            lineHeight="1.75"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0 60px"
          />
        </Column>
      </Row>

      {/* Latest Features Label + Divider */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#f5f0eb"
        padding="56px 60px 8px 60px"
        mode="web"
      >
        <Column>
          <Paragraph
            text="LATEST FEATURES"
            fontSize="11px"
            color="#8a7560"
            textAlign="center"
            letterSpacing="0.2em"
            fontWeight={700}
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0 0 12px 0"
            lineHeight="1"
          />
          <Divider
            borderTopWidth="2px"
            borderTopColor="#2c1810"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Three-Column Article Grid */}
      <Row
        layout={ColumnLayouts.ThreeEqual}
        backgroundColor="#f5f0eb"
        padding="24px 40px 64px 40px"
        mode="web"
      >
        <Column padding="0 16px">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400&h=260&fit=crop&q=80",
              width: 400,
              height: 260,
            }}
            altText="River winding through a mossy canyon"
            textAlign="center"
            containerPadding="0 0 20px 0"
          />
          <Heading
            level="h3"
            fontSize="19px"
            fontWeight={700}
            color="#2c1810"
            textAlign="left"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0 0 10px 0"
            lineHeight="1.3"
          >
            Hidden Valleys of Iceland
          </Heading>
          <Paragraph
            text="Beyond the tourist trail lies a landscape that feels untouched by the modern world. Three weeks walking the highlands revealed something unexpected."
            fontSize="14px"
            color="#5c4a3a"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0"
          />
        </Column>
        <Column padding="0 16px">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&h=260&fit=crop&q=80",
              width: 400,
              height: 260,
            }}
            altText="Traditional Japanese architecture at dusk"
            textAlign="center"
            containerPadding="0 0 20px 0"
          />
          <Heading
            level="h3"
            fontSize="19px"
            fontWeight={700}
            color="#2c1810"
            textAlign="left"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0 0 10px 0"
            lineHeight="1.3"
          >
            Kyoto After Dark
          </Heading>
          <Paragraph
            text="When the temples close and the crowds disperse, a different city emerges. Lantern-lit alleys, quiet tea houses, and gardens that belong to no one."
            fontSize="14px"
            color="#5c4a3a"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0"
          />
        </Column>
        <Column padding="0 16px">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=400&h=260&fit=crop&q=80",
              width: 400,
              height: 260,
            }}
            altText="Vibrant spice market in Morocco"
            textAlign="center"
            containerPadding="0 0 20px 0"
          />
          <Heading
            level="h3"
            fontSize="19px"
            fontWeight={700}
            color="#2c1810"
            textAlign="left"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0 0 10px 0"
            lineHeight="1.3"
          >
            The Spice Roads of Fez
          </Heading>
          <Paragraph
            text="Saffron, cumin, and centuries of tradition. A deep dive into the ancient trading routes that shaped Moroccan cuisine, culture, and identity."
            fontSize="14px"
            color="#5c4a3a"
            textAlign="left"
            lineHeight="1.65"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0"
          />
        </Column>
      </Row>

      {/* Footer */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#2c1810"
        padding="28px 60px"
        mode="web"
      >
        <Column>
          <Paragraph
            text="Meridian Journal  --  Stories worth the journey. Published from Milan."
            fontSize="12px"
            color="#8a7560"
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            letterSpacing="0.04em"
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
      </Row>
    </Body>
  ),
};

// ---------------------------------------------------------------------------
// 5. Newsletter -- Tech newsletter ("Signal Weekly")
// ---------------------------------------------------------------------------

export const Newsletter: Story = {
  render: () => (
    <Body
      backgroundColor="#eef2f7"
      textColor="#1e293b"
      contentAlign="center"
      contentWidth="600px"
      mode="email"
    >
      {/* Navy Header */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#0f2b5b"
        padding="36px 30px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="SIGNAL"
            fontSize="22px"
            color="#ffffff"
            textAlign="center"
            fontWeight={800}
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            letterSpacing="0.22em"
            containerPadding="0 0 6px 0"
            lineHeight="1"
          />
          <Paragraph
            text="Weekly Technology Brief  /  Issue No. 147  /  Feb 7, 2026"
            fontSize="11px"
            color="#7b9acc"
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0"
            lineHeight="1.4"
          />
        </Column>
      </Row>

      {/* Featured Article */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="40px 36px 12px 36px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="FEATURED ANALYSIS"
            fontSize="10px"
            color="#0f2b5b"
            textAlign="left"
            fontWeight={700}
            letterSpacing="0.15em"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0 0 14px 0"
            lineHeight="1"
          />
          <Heading
            level="h1"
            fontSize="28px"
            fontWeight={800}
            color="#0f2b5b"
            textAlign="left"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            lineHeight="1.25"
            containerPadding="0 0 14px 0"
          >
            The Quiet Revolution in Edge Computing
          </Heading>
          <Paragraph
            text="While AI dominates headlines, a fundamental shift in compute infrastructure is reshaping how we build software. Edge nodes now process 40% of enterprise workloads -- and the number is climbing fast. We spoke with three CTOs leading the transition about latency budgets, data sovereignty, and the architecture decisions that will define the next decade."
            fontSize="15px"
            color="#475569"
            textAlign="left"
            lineHeight="1.7"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0 0 24px 0"
          />
          <Button
            backgroundColor="#0f2b5b"
            color="#ffffff"
            padding="13px 28px"
            borderRadius="4px"
            fontSize="13px"
            fontWeight={700}
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
          >
            Read Full Article
          </Button>
        </Column>
      </Row>

      {/* Divider */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="28px 36px 8px 36px"
        mode="email"
      >
        <Column>
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e2e8f0"
            borderTopStyle="solid"
          />
        </Column>
      </Row>

      {/* Latest Dispatches Label */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="12px 36px 20px 36px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="LATEST DISPATCHES"
            fontSize="10px"
            color="#0f2b5b"
            textAlign="left"
            fontWeight={700}
            letterSpacing="0.15em"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0"
            lineHeight="1"
          />
        </Column>
      </Row>

      {/* Three-Column Articles */}
      <Row
        layout={ColumnLayouts.ThreeEqual}
        backgroundColor="#ffffff"
        padding="0 28px 40px 28px"
        mode="email"
      >
        <Column padding="0 8px">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&h=180&fit=crop&q=80",
              width: 300,
              height: 180,
            }}
            altText="Server room with blue ambient lighting"
            textAlign="center"
            containerPadding="0 0 14px 0"
          />
          <Heading
            level="h3"
            fontSize="15px"
            fontWeight={700}
            color="#0f2b5b"
            textAlign="left"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0 0 6px 0"
            lineHeight="1.35"
          >
            Why Postgres Won the Database Wars
          </Heading>
          <Paragraph
            text="From niche relational DB to the backbone of modern infrastructure."
            fontSize="13px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0"
          />
        </Column>
        <Column padding="0 8px">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=180&fit=crop&q=80",
              width: 300,
              height: 180,
            }}
            altText="Analytics dashboard with data visualizations"
            textAlign="center"
            containerPadding="0 0 14px 0"
          />
          <Heading
            level="h3"
            fontSize="15px"
            fontWeight={700}
            color="#0f2b5b"
            textAlign="left"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0 0 6px 0"
            lineHeight="1.35"
          >
            The Real Cost of Observability Tooling
          </Heading>
          <Paragraph
            text="Teams spend 18% of cloud budgets on monitoring. Is it worth it?"
            fontSize="13px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0"
          />
        </Column>
        <Column padding="0 8px">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=300&h=180&fit=crop&q=80",
              width: 300,
              height: 180,
            }}
            altText="Code on a laptop screen"
            textAlign="center"
            containerPadding="0 0 14px 0"
          />
          <Heading
            level="h3"
            fontSize="15px"
            fontWeight={700}
            color="#0f2b5b"
            textAlign="left"
            fontFamily={{ label: "Georgia", value: "Georgia, 'Times New Roman', serif" }}
            containerPadding="0 0 6px 0"
            lineHeight="1.35"
          >
            Rust in Production: A Two-Year Look Back
          </Heading>
          <Paragraph
            text="One team's honest account of rewriting their core services in Rust."
            fontSize="13px"
            color="#64748b"
            textAlign="left"
            lineHeight="1.5"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0"
          />
        </Column>
      </Row>

      {/* Navy Footer */}
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#0f2b5b"
        padding="32px 30px"
        mode="email"
      >
        <Column>
          <Paragraph
            text="Signal Weekly / Delivered every Tuesday at 8am EST"
            fontSize="12px"
            color="#7b9acc"
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0 0 4px 0"
            lineHeight="1.5"
          />
          <Paragraph
            text="You are receiving this at reader@example.com"
            fontSize="11px"
            color="#4a6a9a"
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0 0 16px 0"
            lineHeight="1.5"
          />
          <Paragraph
            text="Unsubscribe / Manage preferences / View in browser"
            fontSize="11px"
            color="#4a6a9a"
            textAlign="center"
            fontFamily={{ label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
            containerPadding="0"
            lineHeight="1.5"
          />
        </Column>
      </Row>
    </Body>
  ),
};
