import type { Meta, StoryObj } from "@storybook/react";
import Image from "./Image";

const meta: Meta<typeof Image> = {
  title: "Components/Image",
  component: Image,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Responsive image rendering with **automatic optimization** and **flexible styling options**.

## Key Features
- **Responsive**: Automatic sizing and mobile optimization
- **Performance**: Lazy loading and optimization support
- **Flexible Styling**: Borders, shadows, filters, and effects
- **Smart Links**: Clickable images with link configuration
- **Email-Safe**: Conservative styling for email clients
- **Alt Text**: Accessibility support with alt text

## Display Options
- **Sizing**: Auto-width, fixed dimensions, responsive scaling
- **Alignment**: Left, center, right positioning
- **Borders**: Custom borders, rounded corners, shadows
- **Effects**: Hover states, filters, overlays
- **Links**: Navigate to URLs, emails, or phone numbers

## Common Use Cases
- Hero banners and featured images
- Product photos in e-commerce emails
- Profile pictures and avatars
- Decorative graphics and icons
- Email headers and footers
- Social media post images
        `
      }
    }
  },
  argTypes: {
    mode: {
      control: { type: "select" },
      options: ["web", "email", "document"],
      description:
        "**Rendering Mode** - Controls output format and image optimizations",
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

// Shorthand API (recommended)
export const Default: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
    alt: "Beautiful landscape",
    textAlign: "center",
    mode: "web"
  },
  parameters: {
    docs: {
      description: {
        story: `**Shorthand API** — pass \`src\` as a string and \`alt\` instead of \`altText\`.

\`\`\`tsx
<Image src="https://example.com/photo.jpg" alt="A photo" />
\`\`\``
      }
    }
  }
};

// Hero Image - Large banner style
export const HeroImage: Story = {
  args: {
    src: {
      url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600",
      width: 1200,
      height: 600
    },
    altText: "Beautiful landscape for hero section",
    textAlign: "center",
    containerPadding: "0px",
    action: {
      url: "#hero",
      target: "_self"
    },
    mode: "web"
  }
};

// Avatar Image - Profile picture style
export const AvatarImage: Story = {
  args: {
    src: {
      url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      width: 150,
      height: 150
    },
    altText: "User profile avatar",
    textAlign: "center",
    borderWidth: "3px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "50%",
    containerPadding: "10px",
    mode: "web"
  }
};

// Product Image - E-commerce style
export const ProductImage: Story = {
  args: {
    src: {
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      width: 400,
      height: 400
    },
    altText: "Premium headphones product image",
    textAlign: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: "12px",
    containerPadding: "16px",
    backgroundColor: "#f9fafb",
    mode: "web"
  }
};

// Thumbnail Image - Article/card thumbnail
export const ThumbnailImage: Story = {
  args: {
    src: {
      url: "https://images.unsplash.com/photo-1486312338219-ce68e2c6b7d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200",
      width: 300,
      height: 200
    },
    altText: "Technology article thumbnail",
    textAlign: "left",
    borderRadius: "8px",
    action: {
      url: "https://example.com/article",
      target: "_blank"
    },
    mode: "web"
  }
};

// Styled Image - Creative borders and effects
export const StyledImage: Story = {
  args: {
    src: {
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      width: 400,
      height: 300
    },
    altText: "Creative styled image",
    textAlign: "center",
    borderWidth: "4px",
    borderStyle: "solid",
    borderColor: "#7c3aed",
    borderRadius: "20px",
    containerPadding: "20px",
    backgroundColor: "#faf5ff",
    mode: "web"
  }
};

// Email Image - Email-safe styling
export const EmailImage: Story = {
  args: {
    src: {
      url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
      width: 600,
      height: 300
    },
    altText: "Email newsletter image",
    textAlign: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#d1d5db",
    containerPadding: "16px",
    mode: "email"
  }
};

// Mobile Image - Mobile optimized
export const MobileImage: Story = {
  args: {
    src: {
      url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=350&h=250",
      width: 350,
      height: 250
    },
    altText: "Mobile optimized image",
    textAlign: "center",
    borderRadius: "12px",
    containerPadding: "12px",
    fullWidth: true,
    mode: "web"
  }
};

// Logo Image - Brand/company logo
export const LogoImage: Story = {
  args: {
    src: {
      url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=80",
      width: 200,
      height: 80
    },
    altText: "Company logo",
    textAlign: "center",
    containerPadding: "20px 0",
    backgroundColor: "#ffffff",
    action: {
      url: "https://company.com",
      target: "_blank"
    },
    mode: "web"
  }
};

// Image Showcase - Various image styles
export const ImageShowcase: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "40px",
        padding: "20px",
        background: "#f8fafc"
      }}
    >
      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Hero & Banner Images
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=300&fit=crop",
              width: 800,
              height: 300
            }}
            altText="Hero landscape"
            textAlign="center"
            borderRadius="12px"
            mode="web"
          />
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Profile & Avatar Images
        </h3>
        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
              width: 100,
              height: 100
            }}
            altText="Avatar 1"
            textAlign="center"
            borderRadius="50%"
            borderWidth="3px"
            borderStyle="solid"
            borderColor="#3b82f6"
            mode="web"
          />
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
              width: 100,
              height: 100
            }}
            altText="Avatar 2"
            textAlign="center"
            borderRadius="50%"
            borderWidth="3px"
            borderStyle="solid"
            borderColor="#10b981"
            mode="web"
          />
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1494790108755-2616b612b742?w=100&h=100&fit=crop",
              width: 100,
              height: 100
            }}
            altText="Avatar 3"
            textAlign="center"
            borderRadius="50%"
            borderWidth="3px"
            borderStyle="solid"
            borderColor="#f59e0b"
            mode="web"
          />
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Product Images
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px"
          }}
        >
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
              width: 200,
              height: 200
            }}
            altText="Headphones"
            textAlign="center"
            borderRadius="12px"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="#e5e7eb"
            backgroundColor="#f9fafb"
            containerPadding="16px"
            mode="web"
          />
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop",
              width: 200,
              height: 200
            }}
            altText="Sneakers"
            textAlign="center"
            borderRadius="12px"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="#e5e7eb"
            backgroundColor="#f9fafb"
            containerPadding="16px"
            mode="web"
          />
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
              width: 200,
              height: 200
            }}
            altText="Watch"
            textAlign="center"
            borderRadius="12px"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="#e5e7eb"
            backgroundColor="#f9fafb"
            containerPadding="16px"
            mode="web"
          />
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Creative Styled Images
        </h3>
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}
        >
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=250&h=200&fit=crop",
              width: 250,
              height: 200
            }}
            altText="Creative 1"
            textAlign="center"
            borderRadius="20px"
            borderWidth="4px"
            borderStyle="solid"
            borderColor="#7c3aed"
            backgroundColor="#faf5ff"
            containerPadding="16px"
            mode="web"
          />
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=250&h=200&fit=crop",
              width: 250,
              height: 200
            }}
            altText="Creative 2"
            textAlign="center"
            borderRadius="0px"
            borderWidth="6px"
            borderStyle="solid"
            borderColor="#ef4444"
            backgroundColor="#fef2f2"
            containerPadding="16px"
            mode="web"
          />
        </div>
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Email-Safe Images
        </h3>
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb"
          }}
        >
          <Image
            src={{
              url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=200&fit=crop",
              width: 500,
              height: 200
            }}
            altText="Email image"
            textAlign="center"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="#d1d5db"
            containerPadding="16px"
            mode="email"
          />
        </div>
      </div>
    </div>
  )
};
