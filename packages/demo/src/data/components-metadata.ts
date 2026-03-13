export interface ComponentMeta {
  name: string;
  description: string;
  code: string;
  group: "Layout" | "Content" | "Interactive" | "Media" | "Data";
}

export const componentsMeta: ComponentMeta[] = [
  // Layout
  {
    name: "Body",
    description: "Root container with mode, fonts, and background",
    code: `<Body mode="email" contentWidth="560px" backgroundColor="#f4f4f5">
  <Row layout={ColumnLayouts.OneColumn} padding="24px 40px">
    <Column>
      <Heading text="Hello" fontSize="24px" fontWeight={700} />
      <Paragraph text="Welcome aboard." fontSize="15px" color="#555" />
      <Button text="Get Started" backgroundColor="#4f46e5" color="#fff" />
    </Column>
  </Row>
</Body>`,
    group: "Layout",
  },
  {
    name: "Row",
    description: "Horizontal row with column layout presets",
    code: `<Row layout={ColumnLayouts.TwoEqual} padding="16px">
  <Column>Left</Column>
  <Column>Right</Column>
</Row>`,
    group: "Layout",
  },
  {
    name: "Column",
    description: "Vertical container within a Row",
    code: `<Column>
  <Heading text="Title" fontSize="20px" />
  <Paragraph text="Column content" fontSize="14px" />
</Column>`,
    group: "Layout",
  },

  // Content
  {
    name: "Paragraph",
    description: "Plain text with typography props",
    code: `<Paragraph
  text="Hello world"
  fontSize="15px"
  color="#333"
  lineHeight="1.6"
/>`,
    group: "Content",
  },
  {
    name: "Paragraph",
    description: "Rich text via html prop (supports bold, italic, links)",
    code: `<Paragraph
  html="Thanks for joining <b>Acme</b>. <a href='#'>View dashboard</a>"
  fontSize="15px"
  color="#555"
/>`,
    group: "Content",
  },
  {
    name: "Heading",
    description: "Semantic heading (h1-h6) with typography",
    code: `<Heading
  text="Welcome"
  headingType="h1"
  fontSize="28px"
  fontWeight={700}
  color="#18181b"
/>`,
    group: "Content",
  },
  {
    name: "Html",
    description: "Raw HTML injection for custom content",
    code: `<Html html="<div class='custom'>Custom HTML</div>" />`,
    group: "Content",
  },

  // Interactive
  {
    name: "Button",
    description: "CTA button with colors, radius, and link",
    code: `<Button
  text="Get Started"
  backgroundColor="#6366f1"
  color="#ffffff"
  borderRadius="8px"
  padding="14px 28px"
  fontSize="14px"
  fontWeight={600}
/>`,
    group: "Interactive",
  },
  {
    name: "Menu",
    description: "Horizontal navigation menu with links",
    code: `<Menu
  items={[
    { text: "Home", href: { url: "/" } },
    { text: "About", href: { url: "/about" } },
  ]}
/>`,
    group: "Interactive",
  },

  // Media
  {
    name: "Image",
    description: "Responsive image with alt text and sizing",
    code: `<Image
  src={{ url: "https://example.com/hero.jpg", width: 600, height: 400 }}
  altText="Hero image"
  textAlign="center"
/>`,
    group: "Media",
  },
  {
    name: "Video",
    description: "Video thumbnail with play button overlay",
    code: `<Video
  src={{ url: "https://youtube.com/watch?v=..." }}
  altImage={{ url: "thumb.jpg", width: 600, height: 340 }}
/>`,
    group: "Media",
  },

  // Data
  {
    name: "Table",
    description: "Data table with headers and row styling",
    code: `<Table
  headers={["Item", "Qty", "Price"]}
  data={[
    ["Widget", "2", "$19.00"],
    ["Gadget", "1", "$49.00"],
  ]}
/>`,
    group: "Data",
  },
  {
    name: "Social",
    description: "Social media icon links (GitHub, Twitter, etc.)",
    code: `<Social
  icons={[
    { name: "github", href: { url: "https://github.com" } },
    { name: "twitter", href: { url: "https://twitter.com" } },
  ]}
/>`,
    group: "Data",
  },
  {
    name: "Divider",
    description: "Horizontal rule with border customization",
    code: `<Divider
  borderTopWidth="1px"
  borderTopColor="#e5e5e5"
  borderTopStyle="solid"
/>`,
    group: "Data",
  },
];

export const groupOrder: ComponentMeta["group"][] = [
  "Layout",
  "Content",
  "Interactive",
  "Media",
  "Data",
];
