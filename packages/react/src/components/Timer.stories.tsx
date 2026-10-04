import type { Meta, StoryObj } from "@storybook/react";
import Timer from "./Timer";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Heading from "./Heading";
import Paragraph from "./Paragraph";
import Button from "./Button";
import { UnlayerProvider } from "../context";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

const meta: Meta<typeof Timer> = {
  title: "Components/Timer",
  component: Timer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A **countdown timer** — a first-class email-marketing element for flash sales,
launches, and deadlines. It renders an image served by Unlayer's countdown
service, so supporting email clients animate it and the rest show the snapshot.

## Key Features
- **Live countdown**: set \`endTime\` + \`timezone\` and the hosted service does the rest
- **Full styling**: digit/label colors, fonts, sizes, and background
- **Clickable**: pass \`href\` to link the timer (e.g. to the sale page)
- **Multi-Mode**: renders in web, email, and document modes
- **Type-Safe**: full TypeScript support via \`TimerValues\`

## Usage

\`\`\`tsx
<Timer
  endTime="2026-12-31 23:59:59"
  timezone="America/Los_Angeles"
  digitColor="#111827"
  labelColor="#6b7280"
/>
\`\`\`
        `
      }
    }
  },
  argTypes: {
    mode: {
      control: { type: "select" },
      options: ["web", "email", "document"],
      description:
        "**Rendering Mode** - Controls output format and optimizations",
      table: {
        defaultValue: { summary: "web" },
        type: { summary: "RenderMode" }
      }
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  name: "Default (Shorthand)",
  args: {
    endTime: "2026-12-31 23:59:59",
    timezone: "America/Los_Angeles",
    mode: "web"
  },
  decorators: [
    (Story) => (
      <div style={{ width: "600px", margin: "0 auto" }}>
        <Story />
      </div>
    )
  ],
  parameters: {
    docs: {
      description: {
        story: `**Shorthand API** — pass an \`endTime\` and \`timezone\` and the hosted countdown service renders the ticking image.

\`\`\`tsx
<Timer endTime="2026-12-31 23:59:59" timezone="America/Los_Angeles" />
\`\`\``
      }
    }
  }
};

export const Branded: Story = {
  args: {
    endTime: "2026-12-31 23:59:59",
    timezone: "America/Los_Angeles",
    backgroundColor: "#0f172a",
    digitColor: "#f8fafc",
    labelColor: "#94a3b8",
    digitFontSize: 44,
    labelFontSize: 14,
    showLabels: true,
    textAlign: "center",
    mode: "web"
  },
  decorators: [
    (Story) => (
      <div style={{ width: "600px", margin: "0 auto" }}>
        <Story />
      </div>
    )
  ],
  parameters: {
    docs: {
      description: {
        story: `**Branded Countdown** — dark background with light digits and muted labels.

\`\`\`tsx
<Timer
  endTime="2026-12-31 23:59:59"
  timezone="America/Los_Angeles"
  backgroundColor="#0f172a"
  digitColor="#f8fafc"
  labelColor="#94a3b8"
  digitFontSize={44}
/>
\`\`\``
      }
    }
  }
};

export const FullControl: Story = {
  name: "Full Control",
  args: {
    values: {
      countdown: {
        countdownUrl: "https://cdn.tools.unlayer.com/countdown/countdown.gif",
        endTime: "2026-12-31 23:59:59",
        timezone: "UTC",
        backgroundColor: "#ffffff",
        digitColor: "#404040",
        labelColor: "#a3a3a3",
        digitFontFamily: "Open Sans",
        labelFontFamily: "Open Sans",
        digitFontSize: 40,
        labelFontSize: 16,
        showLabels: true,
        width: 660,
        height: 147
      },
      textAlign: "center",
      altText: "Sale ends December 31"
    } as any,
    mode: "web"
  },
  decorators: [
    (Story) => (
      <div style={{ width: "600px", margin: "0 auto" }}>
        <Story />
      </div>
    )
  ],
  parameters: {
    docs: {
      description: {
        story:
          "**Full Control** — use the `values` escape hatch to set the entire `countdown` group, including the natural image dimensions and `countdownUrl`."
      }
    }
  }
};

export const CustomImageProvider: Story = {
  name: "Custom Image Provider (Gmail/Outlook-safe)",
  args: {
    imageUrl:
      "https://cdn.tools.unlayer.com/countdown/countdown.gif?end=2026-12-31T23:59:59Z&tz=America/Los_Angeles",
    alt: "Sale ends December 31",
    href: "https://example.com/sale",
    textAlign: "center",
    mode: "email"
  },
  decorators: [
    (Story) => (
      <div style={{ width: "600px", margin: "0 auto" }}>
        <Story />
      </div>
    )
  ],
  parameters: {
    docs: {
      description: {
        story: `**Bring your own countdown-image provider.** A countdown timer in email is just an \`<img>\` — email clients strip JavaScript, so the ticking is a server-rendered animated GIF. Pass \`imageUrl\` from any provider (NiftyImages, Sendtric, MotionMail, or your own endpoint) and it becomes the image \`src\` verbatim, rendering in Gmail, Outlook, and Apple Mail.

\`\`\`tsx
<Timer
  imageUrl="https://i.nifty.dev/abc123?end=2026-12-31T23:59:59Z&tz=America/Los_Angeles"
  alt="Sale ends December 31"
  href="https://example.com/sale"
/>
\`\`\``
      }
    }
  }
};

export const EmailMode: Story = {
  args: {
    endTime: "2026-12-31 23:59:59",
    timezone: "America/Los_Angeles",
    href: "https://example.com/sale",
    textAlign: "center",
    mode: "email"
  },
  parameters: {
    docs: {
      description: {
        story: `**Email Mode** — rendered with \`mode="email"\` and a clickable \`href\` linking to the sale page.

\`\`\`tsx
<Timer
  endTime="2026-12-31 23:59:59"
  timezone="America/Los_Angeles"
  href="https://example.com/sale"
  mode="email"
/>
\`\`\``
      }
    }
  }
};

// =============================================================================
// FlashSaleEmail - Full marketing email using the countdown timer
// =============================================================================

export const FlashSaleEmail: Story = {
  name: "Flash Sale Email",
  render: () => (
    <UnlayerProvider config={{ mode: "email" }}>
      <Body backgroundColor="#f1f5f9" contentAlign="center" contentWidth="600px">
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#dc2626"
          padding="40px 40px 24px"
        >
          <Column>
            <Heading
              level="h1"
              fontSize="34px"
              fontWeight="800"
              color="#ffffff"
              textAlign="center"
              fontFamily="Arial, sans-serif"
              containerPadding="0 0 8px 0"
            >
              48-Hour Flash Sale
            </Heading>
            <Paragraph
              text="Everything 40% off. Hurry — this ends soon."
              fontSize="16px"
              color="#fee2e2"
              textAlign="center"
              lineHeight="1.5"
              fontFamily="Arial, sans-serif"
              containerPadding="0"
            />
          </Column>
        </Row>

        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="32px 40px 8px"
        >
          <Column>
            <Timer
              endTime="2026-12-31 23:59:59"
              timezone="America/Los_Angeles"
              backgroundColor="#ffffff"
              digitColor="#dc2626"
              labelColor="#6b7280"
              textAlign="center"
              containerPadding="0"
            />
          </Column>
        </Row>

        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="8px 40px 40px"
        >
          <Column>
            <Button
              backgroundColor="#dc2626"
              color="white"
              padding="16px 40px"
              borderRadius="8px"
              fontSize="16px"
              fontWeight="700"
              href="https://example.com/sale"
            >
              Shop the Sale
            </Button>
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A complete flash-sale email built with `UnlayerProvider`. The provider sets " +
          "`mode: \"email\"` once and every child inherits it. The countdown timer drives " +
          "urgency right above the call-to-action button."
      }
    }
  }
};
