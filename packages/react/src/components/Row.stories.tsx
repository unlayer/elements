import type { Meta, StoryObj } from "@storybook/react";
import Body from "./Body";
import type { RowProps } from "./Row";
import Row from "./Row";
import Column from "./Column";
import Paragraph from "./Paragraph";
import Heading from "./Heading";
import Button from "./Button";
import Image from "./Image";
import Divider from "./Divider";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

const {
  OneColumn,
  TwoEqual,
  TwoWideNarrow,
  ThreeEqual,
} = ColumnLayouts;

const sansFont = { label: "Sans Serif", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" };

const meta: Meta<typeof Row> = {
  title: "Layout/Row",
  component: Row,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Row layout component for building structured email and web content.",
      },
    },
  },
  argTypes: {
    backgroundColor: { control: "color" },
    padding: { control: "text" },
    columnsBackgroundColor: { control: "color" },
    mode: {
      control: "inline-radio",
      options: ["web", "email"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Playground -- Interactive controls for Row props
// ---------------------------------------------------------------------------

export const Playground: Story = {
  args: {
    backgroundColor: "#1e293b",
    padding: "48px 40px",
    columnsBackgroundColor: undefined,
    mode: "web",
  },
  render: (args: RowProps) => (
    <Body
      backgroundColor="#f0f4f8"
      contentAlign="center"
      contentWidth="800px"
      mode={args.mode}
    >
      <Row
        layout={TwoEqual}
        backgroundColor={args.backgroundColor}
        padding={args.padding}
        columnsBackgroundColor={args.columnsBackgroundColor}
        mode={args.mode}
      >
        <Column padding="0 16px 0 0">
          <Heading
            level="h2"
            fontSize="24px"
            fontWeight={700}
            color="#ffffff"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0 0 10px 0"
            fontFamily={sansFont}
            mode={args.mode}
          >
            Left Column
          </Heading>
          <Paragraph
            text="Change the Row's background colour, padding, and column background using the Controls panel below."
            fontSize="14px"
            color="#94a3b8"
            textAlign="left"
            lineHeight="1.65"
            containerPadding="0"
            fontFamily={sansFont}
            mode={args.mode}
          />
        </Column>
        <Column padding="0 0 0 16px">
          <Heading
            level="h2"
            fontSize="24px"
            fontWeight={700}
            color="#ffffff"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="0 0 10px 0"
            fontFamily={sansFont}
            mode={args.mode}
          >
            Right Column
          </Heading>
          <Paragraph
            text="Try setting a columnsBackgroundColor to see how it fills behind each column independently of the row background."
            fontSize="14px"
            color="#94a3b8"
            textAlign="left"
            lineHeight="1.65"
            containerPadding="0"
            fontFamily={sansFont}
            mode={args.mode}
          />
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Interactive playground -- use the Controls panel to tweak Row props and see changes in real time.",
      },
    },
  },
};

// ---------------------------------------------------------------------------
// 1. HeroBanner -- Bold dark hero section
// ---------------------------------------------------------------------------

export const HeroBanner: Story = {
  render: () => (
    <Body
      backgroundColor="#0f0a1e"
      contentWidth="900px"
      contentAlign="center"
      mode="web"
    >
      <Row
        layout={OneColumn}
        backgroundColor="#0f0a1e"
        padding="120px 40px 108px 40px"
        columnsBackgroundColor="transparent"
        mode="web"
      >
        <Column>
          <Paragraph
            text="INTRODUCING PHASE 2"
            fontSize="12px"
            fontWeight={700}
            color="#a78bfa"
            textAlign="center"
            letterSpacing="0.2em"
            lineHeight="1"
            containerPadding="0 0 28px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Heading
            level="h1"
            fontSize="58px"
            fontWeight={800}
            color="#ffffff"
            textAlign="center"
            lineHeight="1.1"
            letterSpacing="-0.03em"
            containerPadding="0 40px 28px 40px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            {"The Future of<br/>Design Systems"}
          </Heading>
          <Paragraph
            text="A unified toolkit for teams who build at scale. Ship polished interfaces in days instead of months -- with tokens, components, and patterns that stay in sync across every platform."
            fontSize="20px"
            color="#a1a1c7"
            textAlign="center"
            lineHeight="1.65"
            fontWeight={400}
            containerPadding="0 100px 52px 100px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
        </Column>
      </Row>
      <Row
        layout={TwoEqual}
        backgroundColor="#0f0a1e"
        padding="0 40px 120px 40px"
        columnsBackgroundColor="transparent"
        mode="web"
      >
        <Column>
          <Button
            backgroundColor="#7c3aed"
            color="#ffffff"
            padding="16px 36px"
            borderRadius="8px"
            fontSize="15px"
            fontWeight={600}
            textAlign="right"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            Get Early Access
          </Button>
        </Column>
        <Column>
          <Button
            backgroundColor="rgba(255,255,255,0.08)"
            color="#ffffff"
            padding="16px 36px"
            borderRadius="8px"
            fontSize="15px"
            fontWeight={600}
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            View Documentation
          </Button>
        </Column>
      </Row>
    </Body>
  ),
};

// ---------------------------------------------------------------------------
// 2. FeatureHighlight -- Two-column text + image
// ---------------------------------------------------------------------------

export const FeatureHighlight: Story = {
  render: () => (
    <Body
      backgroundColor="#ffffff"
      contentWidth="900px"
      contentAlign="center"
      mode="web"
    >
      <Row
        layout={TwoEqual}
        backgroundColor="#ffffff"
        padding="88px 48px"
        columnsBackgroundColor="transparent"
        mode="web"
      >
        {/* Left -- Editorial content */}
        <Column padding="0 32px 0 0">
          <Paragraph
            text="WORKFLOW"
            fontSize="12px"
            fontWeight={700}
            color="#4f46e5"
            textAlign="left"
            letterSpacing="0.14em"
            lineHeight="1"
            containerPadding="0 0 20px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Heading
            level="h2"
            fontSize="34px"
            fontWeight={700}
            color="#111827"
            textAlign="left"
            lineHeight="1.18"
            letterSpacing="-0.02em"
            containerPadding="0 0 20px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            Streamline Every Step of Your Pipeline
          </Heading>
          <Paragraph
            text="Automated triggers replace manual hand-offs. Data flows from ingestion to insight without waiting on anyone -- so your team spends time interpreting results, not chasing spreadsheets."
            fontSize="16px"
            color="#4b5563"
            textAlign="left"
            lineHeight="1.72"
            fontWeight={400}
            containerPadding="0 0 16px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="Teams report a 62% reduction in time from raw data to actionable dashboard, with fewer errors at every stage of the process."
            fontSize="15px"
            color="#6b7280"
            textAlign="left"
            lineHeight="1.7"
            fontWeight={400}
            containerPadding="0 0 28px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="Learn more -->"
            fontSize="15px"
            color="#4f46e5"
            fontWeight={600}
            textAlign="left"
            lineHeight="1"
            containerPadding="0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
        </Column>

        {/* Right -- Image */}
        <Column padding="0">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&h=480&fit=crop",
              width: 640,
              height: 480,
            }}
            altText="Data visualization dashboard showing analytics charts and graphs"
            textAlign="center"
            containerPadding="0"
            mode="web"
          />
        </Column>
      </Row>
    </Body>
  ),
};

// ---------------------------------------------------------------------------
// 3. ServiceCards -- Three service cards with colored accents
// ---------------------------------------------------------------------------

export const ServiceCards: Story = {
  render: () => (
    <Body
      backgroundColor="#f8fafc"
      contentWidth="960px"
      contentAlign="center"
      mode="web"
    >
      <Row
        layout={ThreeEqual}
        backgroundColor="#f8fafc"
        padding="88px 24px"
        columnsBackgroundColor="#ffffff"
        mode="web"
      >
        {/* Card 1 -- Indigo */}
        <Column padding="0" borderRadius="0">
          <Divider
            borderTopWidth="4px"
            borderTopColor="#4f46e5"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Heading
            level="h3"
            fontSize="22px"
            fontWeight={700}
            color="#111827"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="28px 24px 14px 24px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            Brand Strategy
          </Heading>
          <Paragraph
            text="Positioning, voice, and visual identity grounded in audience research. We build brand systems that compound over years, not campaigns that expire in weeks."
            fontSize="15px"
            color="#6b7280"
            textAlign="left"
            lineHeight="1.68"
            containerPadding="0 24px 28px 24px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="Learn more -->"
            fontSize="14px"
            color="#4f46e5"
            fontWeight={600}
            textAlign="left"
            lineHeight="1"
            containerPadding="0 24px 28px 24px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
        </Column>

        {/* Card 2 -- Rose */}
        <Column padding="0" borderRadius="0">
          <Divider
            borderTopWidth="4px"
            borderTopColor="#e11d48"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Heading
            level="h3"
            fontSize="22px"
            fontWeight={700}
            color="#111827"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="28px 24px 14px 24px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            Growth Engineering
          </Heading>
          <Paragraph
            text="Full-funnel experimentation from acquisition to retention. We instrument, test, and iterate so every change is backed by data -- not hunches or best practices from 2019."
            fontSize="15px"
            color="#6b7280"
            textAlign="left"
            lineHeight="1.68"
            containerPadding="0 24px 28px 24px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="Learn more -->"
            fontSize="14px"
            color="#e11d48"
            fontWeight={600}
            textAlign="left"
            lineHeight="1"
            containerPadding="0 24px 28px 24px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
        </Column>

        {/* Card 3 -- Emerald */}
        <Column padding="0" borderRadius="0">
          <Divider
            borderTopWidth="4px"
            borderTopColor="#059669"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Heading
            level="h3"
            fontSize="22px"
            fontWeight={700}
            color="#111827"
            textAlign="left"
            lineHeight="1.2"
            containerPadding="28px 24px 14px 24px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            Design Systems
          </Heading>
          <Paragraph
            text="Tokens, components, and documentation that keep design and engineering in lockstep. We deliver living systems that evolve with your product, not static Figma libraries."
            fontSize="15px"
            color="#6b7280"
            textAlign="left"
            lineHeight="1.68"
            containerPadding="0 24px 28px 24px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="Learn more -->"
            fontSize="14px"
            color="#059669"
            fontWeight={600}
            textAlign="left"
            lineHeight="1"
            containerPadding="0 24px 28px 24px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
        </Column>
      </Row>
    </Body>
  ),
};

// ---------------------------------------------------------------------------
// 4. ProductShowcase -- E-commerce product display
// ---------------------------------------------------------------------------

export const ProductShowcase: Story = {
  render: () => (
    <Body
      backgroundColor="#ffffff"
      contentWidth="800px"
      contentAlign="center"
      mode="web"
    >
      <Row
        layout={TwoEqual}
        backgroundColor="#ffffff"
        padding="64px 40px"
        columnsBackgroundColor="transparent"
        mode="web"
      >
        {/* Left -- Product image */}
        <Column padding="0 24px 0 0">
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=560&h=560&fit=crop",
              width: 560,
              height: 560,
            }}
            altText="Minimalist wristwatch on a light background"
            textAlign="center"
            containerPadding="0"
            mode="web"
          />
        </Column>

        {/* Right -- Product details */}
        <Column padding="8px 0 0 16px">
          <Paragraph
            text="NEW ARRIVAL"
            fontSize="11px"
            fontWeight={700}
            color="#9ca3af"
            textAlign="left"
            letterSpacing="0.14em"
            lineHeight="1"
            containerPadding="0 0 14px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Heading
            level="h2"
            fontSize="30px"
            fontWeight={700}
            color="#111827"
            textAlign="left"
            lineHeight="1.15"
            letterSpacing="-0.015em"
            containerPadding="0 0 10px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            Meridian Classic
          </Heading>
          <Paragraph
            text="$245.00"
            fontSize="22px"
            fontWeight={600}
            color="#111827"
            textAlign="left"
            lineHeight="1"
            containerPadding="0 0 22px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Divider
            borderTopWidth="1px"
            borderTopColor="#e5e7eb"
            borderTopStyle="solid"
            width={{ width: "100%", autoWidth: false }}
            mode="web"
          />
          <Paragraph
            text="Swiss automatic movement housed in a 40mm brushed steel case. Sapphire crystal glass, Italian leather strap, and water resistance to 100 meters. Designed in Zurich, assembled by hand."
            fontSize="15px"
            color="#6b7280"
            textAlign="left"
            lineHeight="1.72"
            fontWeight={400}
            containerPadding="22px 0 32px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Button
            backgroundColor="#111827"
            color="#ffffff"
            padding="14px 32px"
            borderRadius="6px"
            fontSize="15px"
            fontWeight={600}
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            Add to Cart
          </Button>
        </Column>
      </Row>
    </Body>
  ),
};

// ---------------------------------------------------------------------------
// 5. EditorialWithStats -- Asymmetric editorial + data
// ---------------------------------------------------------------------------

export const EditorialWithStats: Story = {
  render: () => (
    <Body
      backgroundColor="#0f172a"
      contentWidth="900px"
      contentAlign="center"
      mode="web"
    >
      <Row
        layout={TwoWideNarrow}
        backgroundColor="#0f172a"
        padding="88px 48px"
        columnsBackgroundColor="transparent"
        mode="web"
      >
        {/* Wide -- Editorial content */}
        <Column padding="0 40px 0 0">
          <Paragraph
            text="PERSPECTIVE"
            fontSize="12px"
            fontWeight={700}
            color="#38bdf8"
            textAlign="left"
            letterSpacing="0.16em"
            lineHeight="1"
            containerPadding="0 0 22px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Heading
            level="h2"
            fontSize="38px"
            fontWeight={700}
            color="#ffffff"
            textAlign="left"
            lineHeight="1.18"
            letterSpacing="-0.02em"
            containerPadding="0 0 24px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            The Case for Restraint in Interface Design
          </Heading>
          <Paragraph
            text="Most products fail not because they lack features, but because they have too many. The discipline of removing what does not serve the user is harder than adding what might. Every element on screen must earn its place through clear utility or genuine delight -- anything less is noise."
            fontSize="17px"
            color="#cbd5e1"
            textAlign="left"
            lineHeight="1.75"
            fontWeight={400}
            containerPadding="0 0 40px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Button
            backgroundColor="#38bdf8"
            color="#0f172a"
            padding="14px 28px"
            borderRadius="6px"
            fontSize="15px"
            fontWeight={600}
            textAlign="left"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          >
            Read the Full Essay
          </Button>
        </Column>

        {/* Narrow -- Stats */}
        <Column padding="8px 0 0 0">
          <Paragraph
            text="73%"
            fontSize="52px"
            color="#38bdf8"
            fontWeight={800}
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 10px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="of users prefer fewer, well-crafted features"
            fontSize="13px"
            color="#94a3b8"
            textAlign="center"
            lineHeight="1.5"
            fontWeight={400}
            containerPadding="0 12px 44px 12px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="2.4x"
            fontSize="52px"
            color="#a78bfa"
            fontWeight={800}
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 10px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="higher retention for focused products"
            fontSize="13px"
            color="#94a3b8"
            textAlign="center"
            lineHeight="1.5"
            fontWeight={400}
            containerPadding="0 12px 44px 12px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="18 mo."
            fontSize="52px"
            color="#34d399"
            fontWeight={800}
            textAlign="center"
            lineHeight="1"
            containerPadding="0 0 10px 0"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
          <Paragraph
            text="avg. time-to-payback for design investment"
            fontSize="13px"
            color="#94a3b8"
            textAlign="center"
            lineHeight="1.5"
            fontWeight={400}
            containerPadding="0 12px 0 12px"
            fontFamily={{ label: "Sans Serif", value: "system-ui, -apple-system, sans-serif" }}
            mode="web"
          />
        </Column>
      </Row>
    </Body>
  ),
};
