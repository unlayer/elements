import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { UnlayerProvider } from "./UnlayerProvider";
import Body from "../components/Body";
import Row from "../components/Row";
import Column from "../components/Column";
import Button from "../components/Button";
import Paragraph from "../components/Paragraph";
import Heading from "../components/Heading";
import Social from "../components/Social";
import Table from "../components/Table";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

const meta: Meta<typeof UnlayerProvider> = {
  title: "Configuration/UnlayerProvider",
  component: UnlayerProvider,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# UnlayerProvider

Configure all Unlayer components from a single place. No more passing \`mode\`, \`cdnBaseUrl\`, or other config to every component.

## The Problem

Without the provider, you have to repeat config on every component:

\`\`\`tsx
<Body mode="email">
  <Row mode="email">
    <Column>
      <Button mode="email">Click</Button>
      <Paragraph mode="email" />
      <Social mode="email" />
    </Column>
  </Row>
</Body>
\`\`\`

## The Solution

Wrap once with \`UnlayerProvider\` and everything just works:

\`\`\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body>
    <Row>
      <Column>
        <Button>Click</Button>
        <Paragraph />
        <Social />
      </Column>
    </Row>
  </Body>
</UnlayerProvider>
\`\`\`

## Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`mode\` | \`"web" \\| "email" \\| "document"\` | \`"web"\` | Rendering mode for all components |
| \`cdnBaseUrl\` | \`string\` | \`"https://cdn.tools.unlayer.com"\` | CDN for icon assets (Social, etc.) |
| \`mergeTagState\` | \`Record<string, any>\` | \`undefined\` | Merge tag values for Table and dynamic content |
| \`toSafeHtml\` | \`(text: string) => string\` | \`undefined\` | HTML sanitizer function |
| \`textDirection\` | \`string\` | \`undefined\` | Text direction (\`"ltr"\` or \`"rtl"\`) |

## SSR / Server Rendering

Each \`UnlayerProvider\` is fully isolated via React context. Multiple concurrent \`renderToString()\` calls with different configs won't interfere:

\`\`\`tsx
// Request 1
renderToString(
  <UnlayerProvider config={{ mode: "email", cdnBaseUrl: "https://cdn1.example.com" }}>
    <Body>...</Body>
  </UnlayerProvider>
);

// Request 2 (concurrent, different config)
renderToString(
  <UnlayerProvider config={{ mode: "web" }}>
    <Body>...</Body>
  </UnlayerProvider>
);
\`\`\`

## Backward Compatibility

Components work without the provider — they fall back to defaults (\`mode: "web"\`, default CDN). Existing code doesn't break.
        `,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Core: Mode Cascading
// =============================================================================

export const ModeCascading: Story = {
  name: "Mode Cascading (Set Once)",
  render: () => (
    <UnlayerProvider config={{ mode: "email" }}>
      <Body
        backgroundColor="#f8fafc"
        contentAlign="center"
        contentWidth="600px"
      >
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="40px 30px"
        >
          <Column>
            <Heading
              values={{
                text: "Mode Set Once at Provider",
                headingType: "h2",
                fontSize: "28px",
                fontWeight: "700",
                color: "#1f2937",
                textAlign: "center",
                containerPadding: "0 0 12px 0",
              }}
            />
            <Paragraph
              values={{
                text: 'Every component here renders in "email" mode — table-based layouts, inline CSS — without a single mode prop on any child.',
                fontSize: "16px",
                color: "#64748b",
                textAlign: "center",
                lineHeight: "1.5",
                containerPadding: "0 0 24px 0",
              }}
            />
            <Button
              backgroundColor="#3b82f6"
              color="white"
              padding="14px 28px"
              borderRadius="6px"
              fontSize="16px"
              fontWeight="600"
            >
              Email-Safe Button
            </Button>
          </Column>
        </Row>

        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#f0fdf4"
          padding="20px 30px"
        >
          <Column>
            <Paragraph
              values={{
                text: "Zero mode props on Body, Row, Column, Heading, Text, or Button above.",
                fontSize: "14px",
                color: "#059669",
                textAlign: "center",
                lineHeight: "1.5",
              }}
            />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Set \`mode\` once on the provider, and it cascades to every component in the tree:

\`\`\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body>           {/* email mode */}
    <Row>          {/* email mode */}
      <Column>     {/* email mode */}
        <Button>   {/* email mode */}
        <Paragraph />   {/* email mode */}
      </Column>
    </Row>
  </Body>
</UnlayerProvider>
\`\`\`

Compare with the "Before" story to see how much repetition this eliminates.
        `,
      },
    },
  },
};

// =============================================================================
// Before vs After
// =============================================================================

export const BeforeProvider: Story = {
  name: "Before: mode Prop Everywhere",
  render: () => (
    <Body
      backgroundColor="#f8fafc"
      contentAlign="center"
      contentWidth="600px"
      mode="email"
    >
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#fff4f4"
        padding="40px 30px"
        mode="email"
      >
        <Column>
          <Heading
            values={{
              text: 'Without UnlayerProvider',
              headingType: "h2",
              fontSize: "28px",
              fontWeight: "700",
              color: "#dc2626",
              textAlign: "center",
              containerPadding: "0 0 12px 0",
            }}
            mode="email"
          />
          <Paragraph
            values={{
              text: "Every component needs mode=\"email\" explicitly. Miss one and it renders as web instead. This is what the existing stories all do.",
              fontSize: "16px",
              color: "#64748b",
              textAlign: "center",
              lineHeight: "1.5",
              containerPadding: "0 0 24px 0",
            }}
            mode="email"
          />
          <Button
            backgroundColor="#dc2626"
            color="white"
            padding="14px 28px"
            borderRadius="6px"
            fontSize="16px"
            fontWeight="600"
            mode="email"
          >
            mode="email" on every component
          </Button>
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**The old way** — pass \`mode\` to every component:

\`\`\`tsx
<Body mode="email">
  <Row mode="email">
    <Column>
      <Heading mode="email" values={{...}} />
      <Paragraph mode="email" values={{...}} />
      <Button mode="email">...</Button>
    </Column>
  </Row>
</Body>
\`\`\`

6 components = 6 mode props. Forget one and that component renders in the wrong mode.
        `,
      },
    },
  },
};

export const AfterProvider: Story = {
  name: "After: UnlayerProvider",
  render: () => (
    <UnlayerProvider config={{ mode: "email" }}>
      <Body
        backgroundColor="#f8fafc"
        contentAlign="center"
        contentWidth="600px"
      >
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#f0fdf4"
          padding="40px 30px"
        >
          <Column>
            <Heading
              values={{
                text: 'With UnlayerProvider',
                headingType: "h2",
                fontSize: "28px",
                fontWeight: "700",
                color: "#059669",
                textAlign: "center",
                containerPadding: "0 0 12px 0",
              }}
            />
            <Paragraph
              values={{
                text: "One config at the top. Zero mode props anywhere. Same email-safe output.",
                fontSize: "16px",
                color: "#64748b",
                textAlign: "center",
                lineHeight: "1.5",
                containerPadding: "0 0 24px 0",
              }}
            />
            <Button
              backgroundColor="#059669"
              color="white"
              padding="14px 28px"
              borderRadius="6px"
              fontSize="16px"
              fontWeight="600"
            >
              Zero mode props needed
            </Button>
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**The new way** — set it once:

\`\`\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body>
    <Row>
      <Column>
        <Heading values={{...}} />
        <Paragraph values={{...}} />
        <Button>...</Button>
      </Column>
    </Row>
  </Body>
</UnlayerProvider>
\`\`\`

1 config = done. Every component inherits the mode.
        `,
      },
    },
  },
};

// =============================================================================
// Social Icons with CDN
// =============================================================================

export const SocialWithCDN: Story = {
  name: "Social Icons (CDN Config)",
  render: () => (
    <UnlayerProvider config={{ mode: "web" }}>
      <Body
        backgroundColor="#ffffff"
        contentAlign="center"
        contentWidth="600px"
      >
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#1e293b"
          padding="40px 30px"
        >
          <Column>
            <Heading
              values={{
                text: "Social Icons via CDN",
                headingType: "h2",
                fontSize: "24px",
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center",
                containerPadding: "0 0 8px 0",
              }}
            />
            <Paragraph
              values={{
                text: "Icons load from cdnBaseUrl set in the provider config. Change it to point to your own CDN.",
                fontSize: "14px",
                color: "#94a3b8",
                textAlign: "center",
                lineHeight: "1.5",
                containerPadding: "0 0 20px 0",
              }}
            />
            <Social
              values={{
                icons: {
                  iconType: "circle",
                  icons: [
                    { name: "Facebook", url: "https://facebook.com" },
                    { name: "X", url: "https://x.com" },
                    { name: "Instagram", url: "https://instagram.com" },
                    { name: "LinkedIn", url: "https://linkedin.com" },
                  ],
                },
                align: "center",
                spacing: 12,
                iconSize: 36,
                containerPadding: "0",
              }}
            />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Social icons load from the \`cdnBaseUrl\` in the provider config:

\`\`\`tsx
<UnlayerProvider config={{ cdnBaseUrl: "https://my-cdn.example.com" }}>
  <Body>
    <Row><Column>
      <Social values={{ icons: { ... } }} />
      {/* Icon URLs resolve to: https://my-cdn.example.com/... */}
    </Column></Row>
  </Body>
</UnlayerProvider>
\`\`\`

Default: \`https://cdn.tools.unlayer.com\`
        `,
      },
    },
  },
};

// =============================================================================
// Table with mergeTagState
// =============================================================================

export const TableWithMergeTags: Story = {
  name: "Table (mergeTagState)",
  render: () => (
    <UnlayerProvider
      config={{
        mode: "web",
        mergeTagState: {
          first_name: "Jane",
          company: "Acme Corp",
        },
      }}
    >
      <Body
        backgroundColor="#f8fafc"
        contentAlign="center"
        contentWidth="600px"
      >
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="30px"
        >
          <Column>
            <Heading
              values={{
                text: "mergeTagState via Provider",
                headingType: "h2",
                fontSize: "24px",
                fontWeight: "700",
                color: "#1f2937",
                textAlign: "center",
                containerPadding: "0 0 8px 0",
              }}
            />
            <Paragraph
              values={{
                text: "Pass merge tag values through the provider so Table and other components can resolve dynamic content.",
                fontSize: "14px",
                color: "#64748b",
                textAlign: "center",
                lineHeight: "1.5",
                containerPadding: "0 0 20px 0",
              }}
            />
            <Table
              values={{
                table: {
                  headers: [
                    {
                      cells: [{ text: "Field" }, { text: "Value" }],
                    },
                  ],
                  rows: [
                    {
                      cells: [{ text: "Name" }, { text: "Jane" }],
                    },
                    {
                      cells: [{ text: "Company" }, { text: "Acme Corp" }],
                    },
                    {
                      cells: [{ text: "Plan" }, { text: "Enterprise" }],
                    },
                  ],
                },
                enableHeader: true,
                backgroundColor: "#ffffff",
                border: {
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "#e5e7eb",
                },
                headerBackgroundColor: "#f8fafc",
                headerColor: "#374151",
                headerFontSize: "14px",
                headerFontWeight: "600",
                contentColor: "#6b7280",
                contentFontSize: "14px",
                cellPadding: "12px",
              }}
            />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Pass merge tag values through the provider config:

\`\`\`tsx
<UnlayerProvider config={{
  mergeTagState: {
    first_name: "Jane",
    company: "Acme Corp",
  }
}}>
  <Body>
    <Row><Column>
      <Table values={{ ... }} />
    </Column></Row>
  </Body>
</UnlayerProvider>
\`\`\`

Previously \`mergeTagState\` was always \`undefined\` — now it flows from the provider to every component that needs it.
        `,
      },
    },
  },
};

// =============================================================================
// Backward Compatibility
// =============================================================================

export const BackwardCompatible: Story = {
  name: "No Provider (Backward Compatible)",
  render: () => (
    <Body
      backgroundColor="#f8fafc"
      contentAlign="center"
      contentWidth="600px"
      mode="web"
    >
      <Row
        layout={ColumnLayouts.OneColumn}
        backgroundColor="#ffffff"
        padding="40px 30px"
        mode="web"
      >
        <Column>
          <Heading
            values={{
              text: "No Provider Needed",
              headingType: "h2",
              fontSize: "28px",
              fontWeight: "700",
              color: "#1f2937",
              textAlign: "center",
              containerPadding: "0 0 12px 0",
            }}
            mode="web"
          />
          <Paragraph
            values={{
              text: "Existing code works without any changes. Components fall back to defaults (mode: web, default CDN). Nothing breaks.",
              fontSize: "16px",
              color: "#64748b",
              textAlign: "center",
              lineHeight: "1.5",
              containerPadding: "0 0 24px 0",
            }}
            mode="web"
          />
          <Button
            backgroundColor="#6b7280"
            color="white"
            padding="14px 28px"
            borderRadius="6px"
            fontSize="16px"
            fontWeight="600"
            mode="web"
          >
            Works As Before
          </Button>
        </Column>
      </Row>
    </Body>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**No migration required.** Components work exactly as before without the provider:

\`\`\`tsx
// This still works — no provider needed
<Body mode="web">
  <Row mode="web">
    <Column>
      <Button mode="web">Click</Button>
    </Column>
  </Row>
</Body>
\`\`\`

Defaults: \`mode: "web"\`, \`cdnBaseUrl: "https://cdn.tools.unlayer.com"\`
        `,
      },
    },
  },
};

// =============================================================================
// Mode Override
// =============================================================================

export const ModeOverride: Story = {
  name: "Local Mode Override",
  render: () => (
    <UnlayerProvider config={{ mode: "email" }}>
      <Body
        backgroundColor="#f8fafc"
        contentAlign="center"
        contentWidth="600px"
      >
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="30px"
        >
          <Column>
            <Heading
              values={{
                text: "Provider says email...",
                headingType: "h2",
                fontSize: "24px",
                fontWeight: "700",
                color: "#1f2937",
                textAlign: "center",
                containerPadding: "0 0 12px 0",
              }}
            />
            <Paragraph
              values={{
                text: "This section renders in email mode from the provider.",
                fontSize: "15px",
                color: "#64748b",
                textAlign: "center",
                lineHeight: "1.5",
                containerPadding: "0 0 16px 0",
              }}
            />
            <Button
              backgroundColor="#3b82f6"
              color="white"
              padding="14px 28px"
              borderRadius="6px"
              fontSize="16px"
              fontWeight="600"
            >
              Email Mode (from provider)
            </Button>
          </Column>
        </Row>

        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#fefce8"
          padding="30px"
          mode="web"
        >
          <Column>
            <Heading
              values={{
                text: "...but this Row overrides to web",
                headingType: "h3",
                fontSize: "20px",
                fontWeight: "700",
                color: "#854d0e",
                textAlign: "center",
                containerPadding: "0 0 12px 0",
              }}
              mode="web"
            />
            <Paragraph
              values={{
                text: 'An explicit mode="web" prop on a component overrides the provider. The prop always wins.',
                fontSize: "15px",
                color: "#a16207",
                textAlign: "center",
                lineHeight: "1.5",
              }}
              mode="web"
            />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: `
The explicit \`mode\` prop always wins over the provider:

\`\`\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body>
    <Row>          {/* email (from provider) */}
      <Column>
        <Button>   {/* email (from provider) */}
      </Column>
    </Row>
    <Row mode="web">  {/* web (explicit override) */}
      <Column>
        <Paragraph mode="web" /> {/* web (explicit override) */}
      </Column>
    </Row>
  </Body>
</UnlayerProvider>
\`\`\`

Resolution order: **explicit prop > provider config > default ("web")**
        `,
      },
    },
  },
};

// =============================================================================
// Full Email Template
// =============================================================================

export const FullEmailTemplate: Story = {
  name: "Full Email Template",
  render: () => (
    <UnlayerProvider config={{ mode: "email" }}>
      <Body
        backgroundColor="#f1f5f9"
        contentAlign="center"
        contentWidth="600px"
      >
        {/* Header */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#1e40af"
          padding="40px 30px"
        >
          <Column>
            <Heading
              values={{
                text: "Welcome to Acme",
                headingType: "h1",
                fontSize: "32px",
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center",
                fontFamily: "Arial, sans-serif",
              }}
            />
          </Column>
        </Row>

        {/* Body */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="40px 30px"
        >
          <Column>
            <Paragraph
              values={{
                text: "Hi there! Thanks for signing up. Here's what you can do next:",
                fontSize: "16px",
                color: "#334155",
                lineHeight: "1.6",
                containerPadding: "0 0 24px 0",
                fontFamily: "Arial, sans-serif",
              }}
            />
            <Button
              backgroundColor="#2563eb"
              color="white"
              padding="14px 28px"
              borderRadius="6px"
              fontSize="16px"
              fontWeight="600"
            >
              Get Started
            </Button>
          </Column>
        </Row>

        {/* Features */}
        <Row
          layout={ColumnLayouts.ThreeEqual}
          backgroundColor="#f8fafc"
          padding="30px"
        >
          <Column>
            <Paragraph
              values={{
                text: "Templates",
                fontSize: "16px",
                fontWeight: "700",
                color: "#1e293b",
                textAlign: "center",
                containerPadding: "0 0 8px 0",
                fontFamily: "Arial, sans-serif",
              }}
            />
            <Paragraph
              values={{
                text: "50+ ready-to-use email designs",
                fontSize: "13px",
                color: "#64748b",
                textAlign: "center",
                fontFamily: "Arial, sans-serif",
              }}
            />
          </Column>
          <Column>
            <Paragraph
              values={{
                text: "Analytics",
                fontSize: "16px",
                fontWeight: "700",
                color: "#1e293b",
                textAlign: "center",
                containerPadding: "0 0 8px 0",
                fontFamily: "Arial, sans-serif",
              }}
            />
            <Paragraph
              values={{
                text: "Track opens, clicks, and conversions",
                fontSize: "13px",
                color: "#64748b",
                textAlign: "center",
                fontFamily: "Arial, sans-serif",
              }}
            />
          </Column>
          <Column>
            <Paragraph
              values={{
                text: "Support",
                fontSize: "16px",
                fontWeight: "700",
                color: "#1e293b",
                textAlign: "center",
                containerPadding: "0 0 8px 0",
                fontFamily: "Arial, sans-serif",
              }}
            />
            <Paragraph
              values={{
                text: "24/7 help from our team",
                fontSize: "13px",
                color: "#64748b",
                textAlign: "center",
                fontFamily: "Arial, sans-serif",
              }}
            />
          </Column>
        </Row>

        {/* Footer */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#1e293b"
          padding="30px"
        >
          <Column>
            <Social
              values={{
                icons: {
                  iconType: "circle",
                  icons: [
                    { name: "Facebook", url: "https://facebook.com" },
                    { name: "X", url: "https://x.com" },
                    { name: "Instagram", url: "https://instagram.com" },
                  ],
                },
                align: "center",
                spacing: 10,
                iconSize: 28,
                containerPadding: "0 0 16px 0",
              }}
            />
            <Paragraph
              values={{
                text: "Acme Inc. | 123 Main St | hello@acme.com",
                fontSize: "12px",
                color: "#94a3b8",
                textAlign: "center",
                fontFamily: "Arial, sans-serif",
              }}
            />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: `
A complete email template with zero \`mode\` props on any component. The provider sets \`mode: "email"\` once and every component — Body, Row, Column, Heading, Text, Button, Social — renders email-safe HTML automatically.

\`\`\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body>
    <Row>...</Row>       {/* header */}
    <Row>...</Row>       {/* body with CTA */}
    <Row>...</Row>       {/* 3-col features */}
    <Row>...</Row>       {/* footer with Social */}
  </Body>
</UnlayerProvider>
\`\`\`
        `,
      },
    },
  },
};
