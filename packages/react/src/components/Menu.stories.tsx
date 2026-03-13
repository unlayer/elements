import type { Meta, StoryObj } from "@storybook/react";
import Menu from "./Menu";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Heading from "./Heading";
import Paragraph from "./Paragraph";
import { UnlayerProvider } from "../context";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

const meta: Meta<typeof Menu> = {
  title: "Components/Menu",
  component: Menu,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Navigation menu for emails and web pages with horizontal/vertical layouts,
configurable separators, and full typographic control.

## Features
- **Horizontal & vertical** menu layouts
- **Separator characters** between items (|, -, etc.)
- **Link support** for web URLs, email addresses, and custom actions
- **Typography** control including font size, weight, color, and letter spacing
- **Email-safe** rendering optimized for all major email clients

## Quick Start

\`\`\`tsx
<Menu
  items={[
    { text: "Home", href: "/" },
    { text: "About", href: "/about" },
  ]}
  separator="|"
  linkColor="#2563eb"
/>
\`\`\`
        `
      }
    }
  },
  argTypes: {},
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Story 1: Default -- shorthand API (recommended)
// =============================================================================

export const Default: Story = {
  args: {
    items: [
      { text: "Home", href: "#home" },
      { text: "About", href: "#about" },
      { text: "Services", href: "#services" },
      { text: "Contact", href: "#contact" }
    ],
    layout: "horizontal",
    align: "center",
    separator: "|",
    padding: "10px 16px",
    fontSize: "14px",
    linkColor: "#2563eb",
  },
  parameters: {
    docs: {
      description: {
        story: `**Shorthand API** — pass \`items\` as a simple array of \`{ text, href }\` objects.

\`\`\`tsx
<Menu
  items={[
    { text: "Home", href: "/" },
    { text: "About", href: "/about" },
    { text: "Contact", href: "/contact" },
  ]}
  separator="|"
  linkColor="#2563eb"
/>
\`\`\``
      }
    }
  }
};

// =============================================================================
// Story 1b: Full Props API
// =============================================================================

export const FullPropsAPI: Story = {
  args: {
    menu: {
      items: [
        { text: "Home", link: { name: "web", values: { href: "#home", target: "_blank" } } },
        { text: "About", link: { name: "web", values: { href: "#about", target: "_blank" } } },
        { text: "Services", link: { name: "web", values: { href: "#services", target: "_blank" } } },
        { text: "Contact", link: { name: "web", values: { href: "#contact", target: "_blank" } } }
      ]
    },
    layout: "horizontal",
    align: "center",
    separator: "|",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "normal",
    linkColor: "#2563eb",
    textColor: "#374151",
    letterSpacing: "0px"
  },
  parameters: {
    docs: {
      description: {
        story: `**Full Control** — use the \`menu\` prop with full link config objects for complete control.

\`\`\`tsx
<Menu
  menu={{
    items: [
      { text: "Home", link: { name: "web", values: { href: "#home", target: "_blank" } } },
      { text: "About", link: { name: "web", values: { href: "#about", target: "_blank" } } },
    ]
  }}
  separator="|"
  linkColor="#2563eb"
/>
\`\`\``
      }
    }
  }
};

// =============================================================================
// Story 2: EmailHeader -- real email header with UnlayerProvider
// =============================================================================

export const EmailHeader: Story = {
  render: () => (
    <UnlayerProvider config={{ mode: "email" }}>
      <Body
        backgroundColor="#f4f4f5"
        contentAlign="center"
        contentWidth="600px"
        fontFamily={{
          label: "Arial",
          value: "Arial, Helvetica, sans-serif"
        }}
        textColor="#1f2937"
      >
        {/* Header bar */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="32px 24px 16px 24px"
        >
          <Column>
            <Heading
              level="h2"
              fontSize="28px"
              fontWeight="700"
              color="#111827"
              textAlign="center"
              fontFamily="Arial, Helvetica, sans-serif"
              lineHeight="110%"
              containerPadding="0 0 4px 0"
            >
              Acme Inc.
            </Heading>
          </Column>
        </Row>

        {/* Navigation menu */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="0px 24px 24px 24px"
        >
          <Column>
            <Menu
              menu={{
                items: [
                  {
                    text: "Products",
                    link: {
                      name: "web",
                      values: {
                        href: "https://example.com/products",
                        target: "_blank"
                      }
                    }
                  },
                  {
                    text: "Pricing",
                    link: {
                      name: "web",
                      values: {
                        href: "https://example.com/pricing",
                        target: "_blank"
                      }
                    }
                  },
                  {
                    text: "Blog",
                    link: {
                      name: "web",
                      values: {
                        href: "https://example.com/blog",
                        target: "_blank"
                      }
                    }
                  },
                  {
                    text: "Support",
                    link: {
                      name: "web",
                      values: {
                        href: "https://example.com/support",
                        target: "_blank"
                      }
                    }
                  }
                ]
              }}
              layout="horizontal"
              align="center"
              separator="|"
              padding="8px 14px"
              fontSize="14px"
              fontWeight="normal"
              linkColor="#4b5563"
              textColor="#9ca3af"
              letterSpacing="0px"
              fontFamily={{
                label: "Arial",
                value: "Arial, Helvetica, sans-serif"
              }}
              containerPadding="0"
            />
          </Column>
        </Row>

        {/* Thin accent divider */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#2563eb"
          padding="0px"
        >
          <Column padding="2px">
            <Paragraph
              text=" "
              fontSize="1px"
              lineHeight="1px"
              containerPadding="0"
            />
          </Column>
        </Row>

        {/* Email body content */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="40px 32px"
        >
          <Column>
            <Heading
              level="h1"
              fontSize="24px"
              fontWeight="700"
              color="#111827"
              textAlign="left"
              fontFamily="Arial, Helvetica, sans-serif"
              lineHeight="130%"
              containerPadding="0 0 16px 0"
            >
              Your weekly digest is here
            </Heading>
            <Paragraph
              text="Here is a summary of what happened this week across your projects and teams. Click on any section to dive deeper."
              fontSize="15px"
              color="#4b5563"
              textAlign="left"
              lineHeight="160%"
              fontFamily="Arial, Helvetica, sans-serif"
              containerPadding="0"
            />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: `
**Email Header with UnlayerProvider**

A realistic email header layout wrapped in \`UnlayerProvider\` with
\`config={{ mode: "email" }}\`. The mode propagates automatically to every
child -- no \`mode\` prop needed on individual components.

Key points:
- \`UnlayerProvider\` sets mode once at the top level
- Company heading centered above the navigation
- Four links separated by pipe characters
- Thin blue accent divider separating header from body content

\`\`\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body contentWidth="600px">
    <Row><Column>
      <Heading level="h2">Acme Inc.</Heading>
    </Column></Row>
    <Row><Column>
      <Menu
        menu={{ items: [...] }}
        separator="|"
      />
    </Column></Row>
  </Body>
</UnlayerProvider>
\`\`\`
        `
      }
    }
  }
};

// =============================================================================
// Story 3: FooterLinks -- unsubscribe / privacy links in email footer
// =============================================================================

export const FooterLinks: Story = {
  render: () => (
    <UnlayerProvider config={{ mode: "email" }}>
      <Body
        backgroundColor="#f9fafb"
        contentAlign="center"
        contentWidth="600px"
        fontFamily={{
          label: "Arial",
          value: "Arial, Helvetica, sans-serif"
        }}
        textColor="#6b7280"
      >
        {/* Spacer / end-of-email visual break */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#e5e7eb"
          padding="0px"
        >
          <Column padding="1px">
            <Paragraph
              text=" "
              fontSize="1px"
              lineHeight="1px"
              containerPadding="0"
            />
          </Column>
        </Row>

        {/* Footer content */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#f9fafb"
          padding="28px 24px 12px 24px"
        >
          <Column>
            <Paragraph
              text="Acme Inc. | 123 Main Street, San Francisco, CA 94105"
              fontSize="12px"
              color="#9ca3af"
              textAlign="center"
              lineHeight="150%"
              fontFamily="Arial, Helvetica, sans-serif"
              containerPadding="0 0 12px 0"
            />
          </Column>
        </Row>

        {/* Footer menu links */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#f9fafb"
          padding="0px 24px 28px 24px"
        >
          <Column>
            <Menu
              menu={{
                items: [
                  {
                    text: "View Online",
                    link: {
                      name: "web",
                      values: {
                        href: "https://example.com/view",
                        target: "_blank"
                      }
                    }
                  },
                  {
                    text: "Unsubscribe",
                    link: {
                      name: "web",
                      values: {
                        href: "https://example.com/unsubscribe",
                        target: "_blank"
                      }
                    }
                  },
                  {
                    text: "Privacy Policy",
                    link: {
                      name: "web",
                      values: {
                        href: "https://example.com/privacy",
                        target: "_blank"
                      }
                    }
                  },
                  {
                    text: "Terms",
                    link: {
                      name: "web",
                      values: {
                        href: "https://example.com/terms",
                        target: "_blank"
                      }
                    }
                  }
                ]
              }}
              layout="horizontal"
              align="center"
              separator="-"
              padding="6px 10px"
              fontSize="12px"
              fontWeight="normal"
              linkColor="#6b7280"
              textColor="#d1d5db"
              letterSpacing="0px"
              fontFamily={{
                label: "Arial",
                value: "Arial, Helvetica, sans-serif"
              }}
              containerPadding="0"
            />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: `
**Email Footer Links**

Standard email footer with unsubscribe, privacy, and legal links.
Uses muted gray tones and a compact font size to keep the footer
unobtrusive while remaining accessible.

\`\`\`tsx
<Menu
  menu={{ items: [
    { text: "Unsubscribe", link: { ... } },
    { text: "Privacy Policy", link: { ... } },
  ]}}
  separator="-"
  fontSize="12px"
  linkColor="#6b7280"
/>
\`\`\`
        `
      }
    }
  }
};

// =============================================================================
// Story 4: StyledNavigation -- bold navigation bar
// =============================================================================

export const StyledNavigation: Story = {
  render: () => (
    <UnlayerProvider config={{ mode: "web" }}>
      <Body
        backgroundColor="#0f172a"
        contentAlign="center"
        contentWidth="800px"
        fontFamily={{
          label: "Inter",
          value: "Inter, system-ui, -apple-system, sans-serif"
        }}
        textColor="#ffffff"
      >
        {/* Dark navigation bar */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#1e293b"
          padding="20px 32px"
        >
          <Column>
            <Menu
              menu={{
                items: [
                  {
                    text: "DASHBOARD",
                    link: {
                      name: "web",
                      values: { href: "/dashboard", target: "_self" }
                    }
                  },
                  {
                    text: "ANALYTICS",
                    link: {
                      name: "web",
                      values: { href: "/analytics", target: "_self" }
                    }
                  },
                  {
                    text: "TEMPLATES",
                    link: {
                      name: "web",
                      values: { href: "/templates", target: "_self" }
                    }
                  },
                  {
                    text: "INTEGRATIONS",
                    link: {
                      name: "web",
                      values: { href: "/integrations", target: "_self" }
                    }
                  },
                  {
                    text: "SETTINGS",
                    link: {
                      name: "web",
                      values: { href: "/settings", target: "_self" }
                    }
                  }
                ]
              }}
              layout="horizontal"
              align="center"
              separator=""
              padding="10px 20px"
              fontSize="12px"
              fontWeight="700"
              linkColor="#94a3b8"
              textColor="#475569"
              letterSpacing="1.5px"
              fontFamily={{
                label: "Inter",
                value: "Inter, system-ui, -apple-system, sans-serif"
              }}
              containerPadding="0"
            />
          </Column>
        </Row>

        {/* Hero content below nav */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#0f172a"
          padding="64px 40px 48px 40px"
        >
          <Column>
            <Heading
              level="h1"
              fontSize="44px"
              fontWeight="800"
              color="#f8fafc"
              textAlign="center"
              fontFamily="Inter, system-ui, sans-serif"
              lineHeight="110%"
              containerPadding="0 0 20px 0"
            >
              Ship faster with Unlayer
            </Heading>
            <Paragraph
              text="Drag-and-drop email and page builders you can embed in your SaaS in minutes, not months."
              fontSize="18px"
              color="#94a3b8"
              textAlign="center"
              lineHeight="160%"
              fontFamily="Inter, system-ui, sans-serif"
              containerPadding="0"
            />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: `
**Bold Styled Navigation Bar**

An uppercase, letter-spaced navigation bar on a dark slate background.
No separators -- spacing alone distinguishes links. Paired with a hero
section to show how the menu fits into a full-page layout.

Key styling choices:
- \`fontWeight: "700"\` and \`letterSpacing: "1.5px"\` for bold, airy uppercase text
- \`separator: ""\` removes dividers for a minimal look
- \`linkColor: "#94a3b8"\` (slate-400) for muted links on dark backgrounds

\`\`\`tsx
<Menu
  menu={{ items: [...] }}
  separator=""
  fontSize="12px"
  fontWeight="700"
  letterSpacing="1.5px"
  linkColor="#94a3b8"
/>
\`\`\`
        `
      }
    }
  }
};
