import type { Meta, StoryObj } from "@storybook/react";
import Video from "./Video";
import Body from "./Body";
import Row from "./Row";
import { Column } from "./Column";
import Heading from "./Heading";
import Paragraph from "./Paragraph";
import Button from "./Button";
import { UnlayerProvider } from "../context";
import { ColumnLayouts } from "../layouts/ColumnLayouts";

const meta: Meta<typeof Video> = {
  title: "Components/Video",
  component: Video,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Embeds video players with thumbnail fallbacks for email compatibility. " +
          "Supports YouTube and Vimeo sources with responsive sizing. " +
          "In email mode, renders a clickable thumbnail image instead of an iframe."
      }
    }
  },
  argTypes: {
    mode: {
      control: { type: "select" },
      options: ["web", "email", "document"],
      description: "Rendering mode. Email mode produces a clickable thumbnail instead of an iframe.",
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
// Default
// =============================================================================

// Shorthand API (recommended)
export const Default: Story = {
  name: "Default (Shorthand)",
  args: {
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
        story: `**Shorthand API** — pass a YouTube or Vimeo URL and the component auto-parses the video ID and thumbnail.

\`\`\`tsx
<Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
\`\`\``
      }
    }
  }
};

// Full props API
export const FullPropsAPI: Story = {
  name: "Full Props API",
  args: {
    video: {
      loading: false,
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    containerPadding: "10px",
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
        story: `**Full Control** — use individual props for complete control over video configuration.

\`\`\`tsx
<Video
  video={{
    loading: false,
    type: "youtube",
    videoId: "dQw4w9WgXcQ",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }}
  containerPadding="10px"
/>
\`\`\``
      }
    }
  }
};

// =============================================================================
// ProductDemo - Full product launch email with UnlayerProvider
// =============================================================================

export const ProductDemo: Story = {
  name: "Product Launch Email",
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
          backgroundColor="#0f172a"
          padding="48px 40px 40px"
        >
          <Column>
            <Heading
              level="h1"
              fontSize="36px"
              fontWeight="800"
              color="#ffffff"
              textAlign="center"
              fontFamily="Arial, sans-serif"
              containerPadding="0 0 8px 0"
            >
              Introducing Pulse 2.0
            </Heading>
            <Paragraph
              text="The fastest way to build, ship, and measure."
              fontSize="18px"
              color="#94a3b8"
              textAlign="center"
              lineHeight="1.5"
              fontFamily="Arial, sans-serif"
              containerPadding="0"
            />
          </Column>
        </Row>

        {/* Video */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="32px 40px 24px"
        >
          <Column>
            <Video
              video={{
                loading: false,
                type: "youtube",
                videoId: "dQw4w9WgXcQ",
                thumbnail:
                  "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              }}
              href={{
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                target: "_blank"
              }}
              textAlign="center"
              containerPadding="0"
            />
          </Column>
        </Row>

        {/* Description */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#ffffff"
          padding="0 40px 32px"
        >
          <Column>
            <Paragraph
              text="Watch the 2-minute walkthrough to see how Pulse 2.0 cuts your build-to-deploy cycle in half with real-time analytics, one-click staging, and zero-config CI."
              fontSize="16px"
              color="#475569"
              textAlign="center"
              lineHeight="1.7"
              fontFamily="Arial, sans-serif"
              containerPadding="0 0 28px 0"
            />
            <Button
              backgroundColor="#2563eb"
              color="white"
              padding="16px 40px"
              borderRadius="8px"
              fontSize="16px"
              fontWeight="700"
              href="https://example.com/get-started"
            >
              Start Free Trial
            </Button>
          </Column>
        </Row>

        {/* Footer */}
        <Row
          layout={ColumnLayouts.OneColumn}
          backgroundColor="#f8fafc"
          padding="24px 40px"
        >
          <Column>
            <Paragraph
              text="Pulse Inc. | San Francisco, CA | Unsubscribe"
              fontSize="12px"
              color="#94a3b8"
              textAlign="center"
              fontFamily="Arial, sans-serif"
              containerPadding="0"
            />
          </Column>
        </Row>
      </Body>
    </UnlayerProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A complete product launch email built with `UnlayerProvider`. " +
          "The provider sets `mode: \"email\"` once and every child component inherits it " +
          "-- zero mode props anywhere in the tree. " +
          "The video renders as a clickable thumbnail, safe for all email clients."
      }
    }
  }
};

// =============================================================================
// YouTubeEmbed
// =============================================================================

export const YouTubeEmbed: Story = {
  name: "YouTube Embed",
  args: {
    video: {
      loading: false,
      type: "youtube",
      videoId: "9bZkp7q19f0",
      thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=9bZkp7q19f0"
    },
    textAlign: "center",
    containerPadding: "0px",
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
          "A clean YouTube embed with zero padding, centered in a 600px container. " +
          "Renders as a live iframe player in web mode."
      }
    }
  }
};

// =============================================================================
// EmailVideo - Thumbnail fallback for email clients
// =============================================================================

export const EmailVideo: Story = {
  name: "Email Thumbnail Fallback",
  args: {
    video: {
      loading: false,
      type: "youtube",
      videoId: "jNQXAC9IVRw",
      thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
      url: "https://www.youtube.com/watch?v=jNQXAC9IVRw"
    },
    href: {
      url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      target: "_blank"
    },
    textAlign: "center",
    containerPadding: "20px",
    mode: "email"
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "600px",
          margin: "0 auto",
          backgroundColor: "#f1f5f9",
          padding: "24px",
          borderRadius: "8px"
        }}
      >
        <Story />
      </div>
    )
  ],
  parameters: {
    docs: {
      description: {
        story:
          "In email mode, the video renders as a thumbnail image with a play button overlay " +
          "that links to the video URL. This is the only reliable way to include video content " +
          "in email clients, since iframes are stripped by most providers."
      }
    }
  }
};
