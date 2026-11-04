import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Interactive button with **schema-driven defaults** and **CDN-loaded rendering**.

## Key Features
- 🚀 **Multiple Modes**: Web, Email, Document, AMP Web, Classic
- 🎨 **Rich Styling**: Colors, gradients, borders, shadows, fonts
- 📱 **Responsive**: Auto-width, mobile-optimized sizes  
- 🔗 **Smart Links**: Web URLs, email addresses, phone numbers
- ⚡ **Performance**: CDN-loaded with fallback rendering
- 🛡️ **Type-Safe**: Full TypeScript support with schema validation

## Common Use Cases
- Call-to-action buttons in emails and web pages
- Navigation links with custom styling
- Form submission buttons
- Social media and sharing buttons
- E-commerce "Add to Cart" / "Buy Now" buttons

## Usage

\`\`\`tsx
<Button backgroundColor="#3b82f6" color="white" padding="12px 24px">
  Click me
</Button>
\`\`\`

Pass your button text as children and use semantic props for styling!
        `
      }
    }
  },
  argTypes: {
    children: {
      description: "**Button Text** - The text to display on the button",
      control: "text",
      table: {
        type: { summary: "string | ReactNode" }
      }
    },
    backgroundColor: {
      description: "**Background Color** - Button background color",
      control: "color"
    },
    color: {
      description: "**Text Color** - Button text color",
      control: "color"
    },
    hoverBackgroundColor: {
      description: "**Hover Background** - Background color on hover",
      control: "color"
    },
    hoverColor: {
      description: "**Hover Text Color** - Text color on hover",
      control: "color"
    },
    padding: {
      description: "**Padding** - Internal spacing (e.g., '12px 24px')",
      control: "text"
    },
    borderRadius: {
      description: "**Border Radius** - Corner rounding (e.g., '8px')",
      control: "text"
    },
    fontSize: {
      description: "**Font Size** - Text size (e.g., '16px')",
      control: "text"
    },
    fontWeight: {
      description: "**Font Weight** - Text weight (e.g., '600')",
      control: "text"
    },
    href: {
      description: "**Link** - URL or link configuration",
      control: "text"
    },
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
// Simple Usage Examples (Recommended!)
// =============================================================================

export const SimpleButton: Story = {
  render: () => <Button>Click Me</Button>,
  parameters: {
    docs: {
      description: {
        story: `
**✨ Simplest Usage - Text as Children**

Just pass your button text as children - super clean and React-friendly:

\`\`\`tsx
<Button>Click Me</Button>
\`\`\`

Perfect for:
- Quick prototyping
- Simple buttons with default styling
- When you just need a basic button
        `
      }
    }
  }
};

export const WithSemanticProps: Story = {
  render: () => (
    <Button
      backgroundColor="#3b82f6"
      color="white"
      padding="14px 28px"
      borderRadius="8px"
      fontSize="16px"
      fontWeight="600"
    >
      Get Started
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**🎨 Semantic Props + Children (Recommended!)**

Combine semantic styling props with children text for a clean, readable API:

\`\`\`tsx
<Button
  backgroundColor="#3b82f6"
  color="white"
  padding="14px 28px"
  borderRadius="8px"
  fontSize="16px"
  fontWeight="600"
>
  Get Started
</Button>
\`\`\`

**✨ Automatic prop grouping:** Props are automatically grouped into nested structures (e.g., \`backgroundColor\` and \`color\` → \`buttonColors\`).

Available semantic props:
- \`backgroundColor\`, \`color\`, \`hoverBackgroundColor\`, \`hoverColor\`: Button colors
- \`padding\`: Internal spacing (e.g., "12px 24px")
- \`borderRadius\`: Corner rounding (e.g., "8px")
- \`fontSize\`, \`fontWeight\`, \`textAlign\`: Typography
- \`href\`: Link URL (string or link config)
- \`borderWidth\`, \`borderStyle\`, \`borderColor\`: Border styling
- \`width\`, \`height\`, \`autoWidth\`: Size configuration

**💡 TypeScript autocomplete:** Full IntelliSense support for all properties!
        `
      }
    }
  }
};

export const WithLinkAndHover: Story = {
  render: () => (
    <Button
      backgroundColor="#10b981"
      color="white"
      hoverBackgroundColor="#059669"
      padding="16px 32px"
      borderRadius="12px"
      fontSize="18px"
      fontWeight="600"
      href="https://unlayer.com"
    >
      Visit Our Website →
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**🔗 With Link and Hover Effects**

Add navigation and hover states with semantic props:

\`\`\`tsx
<Button
  href="https://unlayer.com"
  backgroundColor="#10b981"
  color="white"
  hoverBackgroundColor="#059669"
  padding="16px 32px"
  borderRadius="12px"
>
  Visit Our Website →
</Button>
\`\`\`

The \`href\` prop accepts:
- **String**: \`"https://example.com"\` (auto-converted to link config)
- **Link config object**: \`{ name: "web", values: { href: "...", target: "_blank" } }\`

**✨ Automatic mapping:** \`backgroundColor\`, \`color\`, \`hoverBackgroundColor\`, and \`hoverColor\` are automatically grouped into the \`buttonColors\` object!
        `
      }
    }
  }
};

// =============================================================================
// Additional Examples
// =============================================================================

export const MobileButton: Story = {
  render: () => (
    <Button
      backgroundColor="#10b981"
      color="white"
      hoverBackgroundColor="#059669"
      padding="16px 32px"
      borderRadius="12px"
      fontSize="18px"
      fontWeight="600"
      width="100%"
      autoWidth={false}
    >
      Tap to Continue
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**📱 Mobile-Optimized Button**

Full-width button optimized for mobile devices:

\`\`\`tsx
<Button
  backgroundColor="#10b981"
  padding="16px 32px"
  width="100%"
  autoWidth={false}
>
  Tap to Continue
</Button>
\`\`\`
        `
      }
    }
  }
};

export const EmailSafeButton: Story = {
  render: () => (
    <Button
      backgroundColor="#7c3aed"
      color="white"
      hoverBackgroundColor="#6d28d9"
      padding="14px 24px"
      borderRadius="6px"
      fontSize="16px"
      fontWeight="500"
      mode="email"
    >
      View in Browser
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**📧 Email-Safe Button**

Optimized for email clients with \`mode="email"\`:

\`\`\`tsx
<Button
  backgroundColor="#7c3aed"
  color="white"
  padding="14px 24px"
  borderRadius="6px"
  mode="email"
>
  View in Browser
</Button>
\`\`\`

Uses conservative styling that renders consistently across all email platforms.
        `
      }
    }
  }
};

// =============================================================================
// Link / URL Examples
// =============================================================================

export const LinkStringUrl: Story = {
  render: () => (
    <Button
      backgroundColor="#2563eb"
      color="white"
      padding="14px 28px"
      borderRadius="8px"
      fontSize="16px"
      fontWeight="600"
      href="https://example.com"
    >
      Open Website
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**🔗 String URL (Auto-Converted)**

Pass a plain URL string — it's automatically wrapped into a link config with \`target="_blank"\`:

\`\`\`tsx
<Button href="https://example.com">Open Website</Button>
\`\`\`

Internally becomes: \`{ name: "web", values: { href: "https://example.com", target: "_blank" } }\`
        `
      }
    }
  }
};

export const LinkConfigObject: Story = {
  render: () => (
    <Button
      backgroundColor="#059669"
      color="white"
      padding="14px 28px"
      borderRadius="8px"
      fontSize="16px"
      fontWeight="600"
      href={{ name: "web", values: { href: "https://example.com", target: "_self" } }}
    >
      Open in Same Tab
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**🔧 Full Config Object**

Use the config object form for full control over target, link type, etc.:

\`\`\`tsx
<Button href={{ name: "web", values: { href: "https://example.com", target: "_self" } }}>
  Open in Same Tab
</Button>
\`\`\`
        `
      }
    }
  }
};

export const LinkEmail: Story = {
  render: () => (
    <Button
      backgroundColor="#7c3aed"
      color="white"
      padding="14px 28px"
      borderRadius="8px"
      fontSize="16px"
      fontWeight="600"
      href={{ name: "email", values: { href: "mailto:hello@example.com" } }}
    >
      Send Email
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**📧 Email Link**

\`\`\`tsx
<Button href={{ name: "email", values: { href: "mailto:hello@example.com" } }}>
  Send Email
</Button>
\`\`\`
        `
      }
    }
  }
};

export const LinkPhone: Story = {
  render: () => (
    <Button
      backgroundColor="#dc2626"
      color="white"
      padding="14px 28px"
      borderRadius="8px"
      fontSize="16px"
      fontWeight="600"
      href={{ name: "phone", values: { href: "tel:+1234567890" } }}
    >
      Call Us
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**📞 Phone Link**

\`\`\`tsx
<Button href={{ name: "phone", values: { href: "tel:+1234567890" } }}>
  Call Us
</Button>
\`\`\`
        `
      }
    }
  }
};

export const LinkEmailMode: Story = {
  render: () => (
    <Button
      backgroundColor="#6366f1"
      color="white"
      padding="14px 28px"
      borderRadius="8px"
      fontSize="16px"
      fontWeight="600"
      href="https://example.com/dashboard"
      mode="email"
    >
      Go to Dashboard
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**📧 Link in Email Mode**

Verify that \`href\` renders correctly in email-safe HTML output:

\`\`\`tsx
<Button href="https://example.com/dashboard" mode="email">
  Go to Dashboard
</Button>
\`\`\`
        `
      }
    }
  }
};

// =============================================================================
// Showcase
// =============================================================================

export const ButtonShowcase: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "**Complete Button Gallery** - Showcase of various button styles and use cases using semantic props. All examples use the clean, React-friendly API."
      }
    }
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        padding: "20px",
        background: "#f8fafc"
      }}
    >
      <div>
        <h3
          style={{
            margin: "0 0 16px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          🎯 Call-to-Action Buttons
        </h3>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Button
            backgroundColor="#2563eb"
            color="white"
            hoverBackgroundColor="#1d4ed8"
            padding="14px 28px"
            borderRadius="8px"
            fontSize="16px"
            fontWeight="600"
          >
            Get Started Free
          </Button>
          <Button
            backgroundColor="#059669"
            color="white"
            hoverBackgroundColor="#047857"
            padding="14px 28px"
            borderRadius="8px"
            fontSize="16px"
            fontWeight="600"
          >
            Start Free Trial
          </Button>
          <Button
            backgroundColor="#7c3aed"
            color="white"
            hoverBackgroundColor="#6d28d9"
            padding="14px 28px"
            borderRadius="8px"
            fontSize="16px"
            fontWeight="600"
          >
            Join Premium
          </Button>
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 16px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          🌟 Secondary Actions
        </h3>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Button
            backgroundColor="transparent"
            color="#2563eb"
            hoverBackgroundColor="#2563eb"
            hoverColor="white"
            borderWidth="2px"
            borderStyle="solid"
            borderColor="#2563eb"
            padding="12px 24px"
            borderRadius="8px"
            fontSize="16px"
          >
            Learn More
          </Button>
          <Button
            backgroundColor="#f9fafb"
            color="#6b7280"
            hoverBackgroundColor="#f3f4f6"
            hoverColor="#374151"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="#d1d5db"
            padding="12px 24px"
            borderRadius="8px"
            fontSize="16px"
          >
            Watch Demo
          </Button>
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 16px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          🎨 Creative Styles
        </h3>
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <Button
            backgroundColor="#8b5cf6"
            color="white"
            hoverBackgroundColor="#7c3aed"
            padding="16px 32px"
            borderRadius="16px"
            fontSize="16px"
            fontWeight="700"
          >
            Gradient Magic
          </Button>
          <Button
            backgroundColor="#f59e0b"
            color="white"
            hoverBackgroundColor="#d97706"
            padding="12px 28px"
            borderRadius="50px"
            fontSize="16px"
            fontWeight="600"
          >
            Rounded Pill
          </Button>
          <Button
            backgroundColor="#ef4444"
            color="white"
            hoverBackgroundColor="#dc2626"
            padding="12px 24px"
            borderRadius="0px"
            fontSize="16px"
            fontWeight="600"
          >
            Sharp Edge
          </Button>
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 16px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          📧 Email-Safe Buttons
        </h3>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Button
            backgroundColor="#3b82f6"
            color="white"
            padding="14px 24px"
            borderRadius="6px"
            fontSize="16px"
            mode="email"
          >
            View Email
          </Button>
          <Button
            backgroundColor="white"
            color="#6b7280"
            hoverBackgroundColor="#f9fafb"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="#d1d5db"
            padding="10px 20px"
            borderRadius="4px"
            fontSize="14px"
            mode="email"
          >
            Unsubscribe
          </Button>
        </div>
      </div>
    </div>
  )
};
