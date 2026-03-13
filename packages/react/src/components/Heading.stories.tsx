import type { Meta, StoryObj } from "@storybook/react";
import Heading from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Components/Heading",
  component: Heading,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Semantic heading elements (H1-H6) with **schema-driven typography defaults** and **SEO optimization**.

## Key Features
- **Semantic HTML**: Proper H1, H2, H3, H4, H5, H6 elements
- **SEO Optimized**: Proper heading hierarchy for search engines
- **Rich Typography**: Custom fonts, sizes, colors, spacing
- **Responsive**: Mobile-optimized sizing and line heights
- **Email-Safe**: Conservative styling for email clients
- **Performance**: CDN-loaded with fallback rendering

## Heading Hierarchy
- **H1**: Main page title, primary heading (largest)
- **H2**: Section headings, major topics
- **H3**: Subsection headings, article titles
- **H4**: Minor headings, card titles
- **H5**: Small headings, labels
- **H6**: Smallest headings, captions

## Common Use Cases
- Article and blog post titles
- Section headers in emails and web pages
- Product names and feature headings
- Navigation and menu headings
- Card titles and callout headers
- Email newsletter section titles

## Usage

\`\`\`tsx
<Heading level="h1" color="#111827" fontSize="36px" fontWeight="800">
  Welcome to Our Platform
</Heading>
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
        "**Rendering Mode** - Controls output format and heading optimizations",
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

export const SimpleHeading: Story = {
  render: () => (
    <Heading level="h1">
      Welcome to Our Platform
    </Heading>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Simplest Usage - Text as Children**

Just pass your heading text as children with a semantic level:

\`\`\`tsx
<Heading level="h1">
  Welcome to Our Platform
</Heading>
\`\`\`

Perfect for:
- Quick prototyping
- Simple headings with default styling
- SEO-friendly semantic HTML
        `
      }
    }
  }
};

export const WithSemanticProps: Story = {
  render: () => (
    <Heading
      level="h2"
      color="#2563eb"
      fontSize="32px"
      fontWeight="700"
      textAlign="center"
      lineHeight="1.2"
      letterSpacing="-0.025em"
    >
      Features & Benefits
    </Heading>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Semantic Props + Children**

Combine semantic styling props with children text for a clean, readable API:

\`\`\`tsx
<Heading
  level="h2"
  color="#2563eb"
  fontSize="32px"
  fontWeight="700"
  textAlign="center"
  lineHeight="1.2"
>
  Features & Benefits
</Heading>
\`\`\`

Available semantic props:
- \`level\`: Semantic level ("h1" | "h2" | "h3" | "h4" | "h5" | "h6")
- \`color\`: Text color (any CSS color)
- \`fontSize\`: Text size (e.g., "32px", "2rem")
- \`fontWeight\`: Text weight (e.g., "700", "800", "bold")
- \`fontFamily\`: Font family object
- \`textAlign\`: "left" | "center" | "right"
- \`lineHeight\`: Line spacing (e.g., "1.2", "1.4")
- \`letterSpacing\`: Letter spacing (e.g., "-0.025em")
- \`containerPadding\`: Padding around heading
        `
      }
    }
  }
};

export const MultipleHeadingLevels: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px" }}>
      <Heading level="h1" fontSize="36px" fontWeight="800" color="#111827">
        H1 - Main Page Title
      </Heading>
      <Heading level="h2" fontSize="28px" fontWeight="700" color="#1f2937">
        H2 - Section Heading
      </Heading>
      <Heading level="h3" fontSize="24px" fontWeight="600" color="#374151">
        H3 - Subsection Title
      </Heading>
      <Heading level="h4" fontSize="20px" fontWeight="600" color="#4b5563">
        H4 - Component Title
      </Heading>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Complete Heading Hierarchy**

Shows all heading levels with semantic props:

\`\`\`tsx
<Heading level="h1" fontSize="36px" fontWeight="800">
  H1 - Main Page Title
</Heading>

<Heading level="h2" fontSize="28px" fontWeight="700">
  H2 - Section Heading
</Heading>

<Heading level="h3" fontSize="24px" fontWeight="600">
  H3 - Subsection Title
</Heading>
\`\`\`

Proper heading hierarchy improves SEO and accessibility!
        `
      }
    }
  }
};

// Default story with schema-driven defaults
export const Default: Story = {
  render: () => (
    <Heading level="h2" mode="web">
      Default Heading Text
    </Heading>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Default Heading** - Uses children text with a semantic level prop for a clean, React-idiomatic API."
      }
    }
  }
};

// H1 HEADING - Main page title
export const H1Heading: Story = {
  name: "H1 Heading",
  render: () => (
    <Heading
      level="h1"
      fontSize="36px"
      fontWeight="800"
      color="#111827"
      textAlign="center"
      lineHeight="1.1"
      letterSpacing="-0.025em"
      mode="web"
    >
      Welcome to Our Platform
    </Heading>
  )
};

// H2 HEADING - Section title
export const H2Heading: Story = {
  name: "H2 Heading",
  render: () => (
    <Heading
      level="h2"
      fontSize="28px"
      fontWeight="700"
      color="#1f2937"
      textAlign="left"
      lineHeight="1.2"
      containerPadding="0 0 16px 0"
      mode="web"
    >
      Features & Benefits
    </Heading>
  )
};

// H3 HEADING - Subsection title
export const H3Heading: Story = {
  name: "H3 Heading",
  render: () => (
    <Heading
      level="h3"
      fontSize="24px"
      fontWeight="600"
      color="#374151"
      textAlign="left"
      lineHeight="1.3"
      mode="web"
    >
      Getting Started Guide
    </Heading>
  )
};

// H4 HEADING - Card/component title
export const H4Heading: Story = {
  name: "H4 Heading",
  render: () => (
    <Heading
      level="h4"
      fontSize="20px"
      fontWeight="600"
      color="#4b5563"
      textAlign="left"
      lineHeight="1.4"
      mode="web"
    >
      Advanced Configuration
    </Heading>
  )
};

// COLORED HEADING - Brand colored heading
export const ColoredHeading: Story = {
  render: () => (
    <Heading
      level="h2"
      fontSize="32px"
      fontWeight="700"
      color="#7c3aed"
      textAlign="center"
      lineHeight="1.2"
      textTransform="uppercase"
      letterSpacing="0.05em"
      mode="web"
    >
      Premium Features
    </Heading>
  )
};

// GRADIENT HEADING - Modern gradient-inspired text
export const GradientHeading: Story = {
  render: () => (
    <Heading
      level="h1"
      fontSize="40px"
      fontWeight="800"
      color="#8b5cf6"
      textAlign="center"
      lineHeight="1.1"
      letterSpacing="-0.02em"
      mode="web"
    >
      The Future is Here
    </Heading>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "**Gradient-Inspired Heading** - Uses a vibrant purple color that evokes gradient aesthetics while being compatible with Unlayer's renderer system."
      }
    }
  }
};

// EMAIL HEADING - Email-safe styling
export const EmailHeading: Story = {
  render: () => (
    <Heading
      level="h1"
      fontSize="28px"
      fontWeight="bold"
      color="#333333"
      textAlign="center"
      lineHeight="1.2"
      fontFamily={{
        label: "Arial",
        value: "Arial, Helvetica, sans-serif"
      }}
      mode="email"
    >
      Monthly Newsletter
    </Heading>
  )
};

// LINKED HEADING - Clickable heading
export const LinkedHeading: Story = {
  render: () => (
    <Heading
      level="h2"
      fontSize="26px"
      fontWeight="600"
      color="#2563eb"
      textAlign="left"
      lineHeight="1.3"
      linkStyle={{
        inherit: false,
        linkColor: "#2563eb",
        linkHoverColor: "#1d4ed8",
        linkUnderline: false,
        linkHoverUnderline: true
      }}
      mode="web"
    >
      Read Our Blog
    </Heading>
  )
};

// CORPORATE HEADING - Professional business style
export const CorporateHeading: Story = {
  render: () => (
    <Heading
      level="h2"
      fontSize="30px"
      fontWeight="600"
      color="#1f2937"
      textAlign="center"
      lineHeight="1.2"
      fontFamily={{
        label: "Source Sans Pro",
        value: "Source Sans Pro, Arial, sans-serif"
      }}
      letterSpacing="0.025em"
      mode="web"
    >
      Enterprise Solutions
    </Heading>
  )
};

// HEADING HIERARCHY - Complete heading system
export const HeadingHierarchy: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "40px",
        background: "#ffffff",
        maxWidth: "800px"
      }}
    >
      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "24px",
            fontWeight: "700"
          }}
        >
          Heading Hierarchy
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Heading
            level="h1"
            fontSize="36px"
            fontWeight="800"
            color="#111827"
            textAlign="left"
            lineHeight="1.1"
            mode="web"
          >
            H1 - Main Page Title
          </Heading>
          <Heading
            level="h2"
            fontSize="28px"
            fontWeight="700"
            color="#1f2937"
            textAlign="left"
            lineHeight="1.2"
            mode="web"
          >
            H2 - Section Heading
          </Heading>
          <Heading
            level="h3"
            fontSize="24px"
            fontWeight="600"
            color="#374151"
            textAlign="left"
            lineHeight="1.3"
            mode="web"
          >
            H3 - Subsection Title
          </Heading>
          <Heading
            level="h4"
            fontSize="20px"
            fontWeight="600"
            color="#4b5563"
            textAlign="left"
            lineHeight="1.4"
            mode="web"
          >
            H4 - Component Title
          </Heading>
          <Heading
            level="h5"
            fontSize="18px"
            fontWeight="600"
            color="#6b7280"
            textAlign="left"
            lineHeight="1.4"
            mode="web"
          >
            H5 - Small Section
          </Heading>
          <Heading
            level="h6"
            fontSize="16px"
            fontWeight="600"
            color="#9ca3af"
            textAlign="left"
            lineHeight="1.5"
            mode="web"
          >
            H6 - Minor Heading
          </Heading>
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "24px",
            fontWeight: "700"
          }}
        >
          Styled Headings
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Heading
            level="h2"
            fontSize="24px"
            fontWeight="700"
            color="#7c3aed"
            textAlign="center"
            textTransform="uppercase"
            letterSpacing="0.1em"
            mode="web"
          >
            PREMIUM FEATURES
          </Heading>
          <Heading
            level="h2"
            fontSize="32px"
            fontWeight="800"
            color="#667eea"
            textAlign="center"
            lineHeight="1.2"
            mode="web"
          >
            Gradient Magic Heading
          </Heading>
          <Heading
            level="h3"
            fontSize="26px"
            fontWeight="600"
            color="#1f2937"
            textAlign="left"
            letterSpacing="0.025em"
            fontFamily={{
              label: "Source Sans Pro",
              value: "Source Sans Pro, Arial, sans-serif"
            }}
            mode="web"
          >
            Professional Business Title
          </Heading>
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "24px",
            fontWeight: "700"
          }}
        >
          Color Variations
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px"
          }}
        >
          <Heading
            level="h3"
            fontSize="24px"
            fontWeight="600"
            color="#2563eb"
            textAlign="center"
            mode="web"
          >
            Primary Blue
          </Heading>
          <Heading
            level="h3"
            fontSize="24px"
            fontWeight="600"
            color="#059669"
            textAlign="center"
            mode="web"
          >
            Success Green
          </Heading>
          <Heading
            level="h3"
            fontSize="24px"
            fontWeight="600"
            color="#d97706"
            textAlign="center"
            mode="web"
          >
            Warning Orange
          </Heading>
          <Heading
            level="h3"
            fontSize="24px"
            fontWeight="600"
            color="#dc2626"
            textAlign="center"
            mode="web"
          >
            Danger Red
          </Heading>
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "24px",
            fontWeight: "700"
          }}
        >
          Email-Safe Headings
        </h3>
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "24px",
            borderRadius: "8px"
          }}
        >
          <Heading
            level="h1"
            fontSize="28px"
            fontWeight="bold"
            color="#333333"
            textAlign="center"
            lineHeight="1.2"
            fontFamily={{
              label: "Arial",
              value: "Arial, Helvetica, sans-serif"
            }}
            mode="email"
          >
            Email Newsletter Title
          </Heading>
        </div>
      </div>
    </div>
  )
};
