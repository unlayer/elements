import type { Meta, StoryObj } from "@storybook/react";
import Social from "./Social";

const meta: Meta<typeof Social> = {
  title: "Components/Social",
  component: Social,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Social media links and sharing buttons with **platform optimization**.

## Key Features
- 📱 **Social Platforms**: Facebook, Twitter, Instagram, LinkedIn, etc.
- 🎨 **Custom Icons**: Platform icons, custom styling, colors
- 📧 **Email-Safe**: Social links optimized for email clients
- 🔗 **Smart Links**: Profile links, sharing URLs, custom actions
- 📱 **Mobile-Optimized**: Touch-friendly sizing and spacing

## Usage

\`\`\`tsx
<Social
  icons={[
    { name: "Facebook", url: "https://facebook.com/unlayer" },
    { name: "X", url: "https://x.com/unlayer" },
  ]}
  iconType="circle"
  align="center"
  spacing={8}
  iconSize={32}
/>
\`\`\`

Available props: \`icons\`, \`iconType\`, \`align\`, \`spacing\`, \`iconSize\`, \`containerPadding\`

## Common Use Cases
- Social media links in email footers
- Follow buttons and social proof
- Share buttons for content
- Social media profiles and contact info
- Newsletter social sections
        `
      }
    }
  },
  argTypes: {
    mode: {
      control: { type: "select" },
      options: ["web", "email", "document"],
      description:
        "**Rendering Mode** - Controls output format and social optimizations",
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

export const Default: Story = {
  args: {
    icons: [
      { name: "Facebook", url: "https://facebook.com/unlayer" },
      { name: "X", url: "https://x.com/unlayer" },
      { name: "Instagram", url: "https://instagram.com/unlayer" }
    ],
    iconType: "circle",
    align: "center",
    spacing: 8,
    iconSize: 32,
    mode: "web"
  },
  parameters: {
    docs: {
      description: {
        story: `**Default Social Icons** — pass \`icons\` as a simple array of \`{ name, url }\` objects.

\`\`\`tsx
<Social
  icons={[
    { name: "Facebook", url: "https://facebook.com/unlayer" },
    { name: "X", url: "https://x.com/unlayer" },
  ]}
  iconType="circle"
/>
\`\`\``
      }
    }
  }
};

export const SocialMediaBar: Story = {
  args: {
    icons: [
      { name: "Facebook", url: "https://facebook.com/company" },
      { name: "X", url: "https://x.com/company" },
      { name: "Instagram", url: "https://instagram.com/company" },
      { name: "LinkedIn", url: "https://linkedin.com/company" },
      { name: "YouTube", url: "https://youtube.com/company" }
    ],
    iconType: "circle",
    align: "center",
    spacing: 12,
    iconSize: 40,
    containerPadding: "30px",
    mode: "web"
  }
};

export const ColorfulSocialIcons: Story = {
  args: {
    icons: [
      { name: "Facebook", url: "https://facebook.com/company" },
      { name: "X", url: "https://x.com/company" },
      { name: "YouTube", url: "https://youtube.com/company" },
      { name: "Instagram", url: "https://instagram.com/company" }
    ],
    iconType: "circle",
    align: "center",
    spacing: 15,
    iconSize: 40,
    containerPadding: "25px",
    mode: "web"
  }
};

export const RoundedSocialIcons: Story = {
  args: {
    icons: [
      { name: "Facebook", url: "https://facebook.com/company" },
      { name: "X", url: "https://x.com/company" },
      { name: "YouTube", url: "https://youtube.com/company" },
      { name: "Instagram", url: "https://instagram.com/company" }
    ],
    iconType: "rounded",
    align: "center",
    spacing: 15,
    iconSize: 40,
    containerPadding: "25px",
    mode: "web"
  }
};

export const SquaredSocialIcons: Story = {
  args: {
    icons: [
      { name: "Facebook", url: "https://facebook.com/company" },
      { name: "X", url: "https://x.com/company" },
      { name: "LinkedIn", url: "https://linkedin.com/company" },
      { name: "Instagram", url: "https://instagram.com/company" }
    ],
    iconType: "squared",
    align: "center",
    spacing: 12,
    iconSize: 36,
    containerPadding: "20px",
    mode: "web"
  }
};

export const EmailSocialIcons: Story = {
  args: {
    icons: [
      { name: "Facebook", url: "https://facebook.com/company" },
      { name: "X", url: "https://x.com/company" },
      { name: "Instagram", url: "https://instagram.com/company" },
      { name: "Email", url: "contact@company.com" }
    ],
    iconType: "circle",
    align: "center",
    spacing: 8,
    iconSize: 28,
    containerPadding: "16px",
    mode: "email"
  }
};
