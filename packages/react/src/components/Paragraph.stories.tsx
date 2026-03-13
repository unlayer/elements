import type { Meta, StoryObj } from "@storybook/react";
import Paragraph from "./Paragraph";

const meta: Meta<typeof Paragraph> = {
  title: "Components/Paragraph",
  component: Paragraph,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Rich paragraph text with **advanced typography** and **formatting options**.

## Key Features
- 📄 **Clean API**: Simple, React-friendly props
- 🎨 **Advanced Styling**: Fonts, colors, spacing, line heights
- 📱 **Responsive**: Mobile-optimized text sizing and spacing
- 📧 **Email-Safe**: Conservative formatting for email clients

## How to Use

Pass text as children with optional semantic props:

\`\`\`tsx
<Paragraph>Your paragraph text here</Paragraph>

<Paragraph
  fontSize="18px"
  color="#1f2937"
  lineHeight="1.6"
  textAlign="center"
>
  Styled paragraph with semantic props!
</Paragraph>
\`\`\`

Available props: \`fontSize\`, \`color\`, \`lineHeight\`, \`fontWeight\`, \`fontFamily\`, \`textAlign\`, \`letterSpacing\`

## Common Use Cases
- Article content and blog posts
- Email newsletter paragraphs
- Product descriptions and details
- Terms of service and legal text
- Marketing copy and messaging
        `
      }
    }
  },
  argTypes: {
    mode: {
      control: { type: "select" },
      options: ["web", "email", "document"],
      description:
        "**Rendering Mode** - Controls output format and paragraph optimizations",
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

export const SimpleText: Story = {
  render: () => (
    <Paragraph>
      This is the simplest way to use Paragraph - just pass text as children!
    </Paragraph>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**✨ Simplest Usage - Text as Children**

Just pass your text as children - it automatically gets converted to the proper format:

\`\`\`tsx
<Paragraph>
  This is the simplest way to use Paragraph - just pass text as children!
</Paragraph>
\`\`\`

Perfect for:
- Quick prototyping
- Simple content that doesn't need special formatting
- When you just want plain text with default styling
        `
      }
    }
  }
};

export const WithSemanticProps: Story = {
  render: () => (
    <Paragraph
      fontSize="18px"
      color="#2563eb"
      lineHeight="1.8"
      textAlign="center"
    >
      This paragraph uses semantic props for styling! It's centered, blue, and
      has custom spacing.
    </Paragraph>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**🎨 Semantic Props + Children**

Combine semantic styling props with text children for a clean, readable API:

\`\`\`tsx
<Paragraph
  fontSize="18px"
  color="#2563eb"
  lineHeight="1.8"
  textAlign="center"
  containerPadding="24px"
>
  This paragraph uses semantic props for styling!
</Paragraph>
\`\`\`

Available semantic props:
- \`fontSize\`: Text size (e.g., "16px", "1.2rem")
- \`color\`: Text color (any CSS color)
- \`lineHeight\`: Line height (e.g., "1.6", "140%")
- \`textAlign\`: "left" | "center" | "right"
- \`fontWeight\`: Text weight (e.g., "400", "bold")
- \`fontFamily\`: Font family object
- \`letterSpacing\`: Letter spacing
        `
      }
    }
  }
};

export const StyledParagraph: Story = {
  render: () => (
    <Paragraph
      fontSize="18px"
      color="#059669"
      lineHeight="1.7"
      textAlign="center"
    >
      This paragraph showcases the clean semantic props API with custom styling!
    </Paragraph>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**🎨 Styled with Semantic Props**

Use semantic props for clean, readable code:

\`\`\`tsx
<Paragraph
  fontSize="18px"
  color="#059669"
  lineHeight="1.7"
  textAlign="center"
>
  Styled paragraph text
</Paragraph>
\`\`\`

All styling is done through props - no complex value objects needed!
        `
      }
    }
  }
};

// =============================================================================
// Practical Examples
// =============================================================================

export const ArticleParagraph: Story = {
  render: () => (
    <Paragraph
      fontSize="16px"
      lineHeight="1.6"
      color="#374151"
    >
      This is a well-formatted paragraph that demonstrates beautiful typography and readable content. It shows how text flows naturally with proper line height, spacing, and font choices for optimal reading experience.
    </Paragraph>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Article Paragraph** - Standard content paragraph with optimized typography for readability. Perfect for articles, blog posts, and content blocks."
      }
    }
  }
};

export const EmailParagraph: Story = {
  render: () => (
    <Paragraph
      fontSize="16px"
      lineHeight="1.5"
      color="#333333"
      fontFamily={{
        label: "Arial",
        value: "Arial, Helvetica, sans-serif"
      }}
      mode="email"
    >
      This email-safe paragraph uses web-safe fonts and styling that renders consistently across all major email clients including Gmail, Outlook, and Apple Mail.
    </Paragraph>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Email-Safe Paragraph** - Optimized for email clients with `mode='email'`. Uses web-safe fonts and conservative styling for maximum compatibility."
      }
    }
  }
};

export const CalloutParagraph: Story = {
  render: () => (
    <Paragraph
      fontSize="18px"
      lineHeight="1.7"
      color="#1f2937"
      textAlign="center"
    >
      This paragraph showcases the semantic props API with clean, readable code. Perfect for callouts, highlights, and featured content!
    </Paragraph>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Callout Paragraph** - Custom typography with semantic props. Simple and maintainable!"
      }
    }
  }
};

export const LongContent: Story = {
  render: () => (
    <div style={{ maxWidth: "600px" }}>
      <Paragraph
        fontSize="16px"
        color="#1f2937"
        lineHeight="1.7"
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur.
      </Paragraph>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**📝 Long Content Example**

Shows how longer paragraphs render with proper line breaks and spacing.

Perfect for:
- Article bodies
- Blog post content
- Product descriptions
- Terms and conditions
        `
      }
    }
  }
};
