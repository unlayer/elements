export interface ComponentMeta {
  name: string;
  description: string;
  code: string;
  group: "Layout" | "Content" | "Interactive" | "Media" | "Data";
}

export const componentsMeta: ComponentMeta[] = [
  // Layout
  {
    name: "Email",
    description: "Root of an email, with its width, fonts, and background. Page and Document are the other roots",
    code: `<Email width={560} style={{ backgroundColor: "#f4f4f5" }}>
  <Column style={{ padding: [24, 40], gap: 16 }}>
    <Heading style={{ fontSize: 24, fontWeight: 700 }}>Hello</Heading>
    <Paragraph style={{ fontSize: 15, color: "#555555" }}>Welcome aboard.</Paragraph>
    <Button href="/start" style={{ backgroundColor: "#4f46e5", color: "#ffffff" }}>
      Get Started
    </Button>
  </Column>
</Email>`,
    group: "Layout",
  },
  {
    name: "Row",
    description: "Columns side by side, stacked on phones",
    code: `<Row style={{ padding: 16, gap: 16 }}>
  <Column><Paragraph>Left</Paragraph></Column>
  <Column><Paragraph>Right</Paragraph></Column>
</Row>`,
    group: "Layout",
  },
  {
    name: "Column",
    description: "Stacks its children, with its own spacing and box",
    code: `<Column style={{ gap: 8 }}>
  <Heading style={{ fontSize: 20 }}>Title</Heading>
  <Paragraph style={{ fontSize: 14 }}>Column content</Paragraph>
</Column>`,
    group: "Layout",
  },

  // Content
  {
    name: "Paragraph",
    description: "Plain text with typography styles",
    code: `<Paragraph style={{ fontSize: 15, color: "#333333", lineHeight: 1.6 }}>
  Hello world
</Paragraph>`,
    group: "Content",
  },
  {
    name: "Paragraph",
    description: "Rich text with Span and Link (bold, italic, links)",
    code: `<Paragraph style={{ fontSize: 15, color: "#555555" }}>
  Thanks for joining <Span style={{ fontWeight: 700 }}>Acme</Span>.{" "}
  <Link href="/dashboard">View dashboard</Link>
</Paragraph>`,
    group: "Content",
  },
  {
    name: "Heading",
    description: "Semantic heading (level 1-6) with typography",
    code: `<Heading level={1} style={{ fontSize: 28, fontWeight: 700, color: "#18181b" }}>
  Welcome
</Heading>`,
    group: "Content",
  },
  {
    name: "Html",
    description: "Markup written as it is, for what no component says",
    code: `<Html html="<div class='custom'>Custom HTML</div>" />`,
    group: "Content",
  },

  // Interactive
  {
    name: "Button",
    description: "A link drawn as a button, with colors and radius",
    code: `<Button
  href="/start"
  style={{
    backgroundColor: "#6366f1",
    color: "#ffffff",
    borderRadius: 8,
    padding: "14px 28px",
    fontSize: 14,
    fontWeight: 600,
  }}
>
  Get Started
</Button>`,
    group: "Interactive",
  },
  {
    name: "Menu",
    description: "Horizontal navigation menu with links",
    code: `<Menu
  items={[
    { text: "Home", href: "/" },
    { text: "About", href: "/about" },
  ]}
/>`,
    group: "Interactive",
  },

  // Media
  {
    name: "Image",
    description: "Responsive image with alt text and sizing",
    code: `<Image
  src={{ src: "https://example.com/hero.jpg", width: 600, height: 400 }}
  alt="Hero image"
  style={{ alignSelf: "center" }}
/>`,
    group: "Media",
  },
  {
    name: "Video",
    description: "A YouTube or Vimeo video: its player on a page, its linked thumbnail in an email",
    code: `<Video
  src="https://www.youtube.com/watch?v=aqz-KE-bpKQ"
  thumbnail={{ src: "https://example.com/thumb.jpg", width: 600, height: 340 }}
/>`,
    group: "Media",
  },

  // Data
  {
    name: "Table",
    description: "Data table with a header row and row styling",
    code: `<Table style={{ cellPadding: 8, rowBorder: "1px solid #e4e4e7" }}>
  <TableRow header>
    <TableCell>Item</TableCell>
    <TableCell>Price</TableCell>
  </TableRow>
  <TableRow>
    <TableCell>Widget</TableCell>
    <TableCell>$19.00</TableCell>
  </TableRow>
</Table>`,
    group: "Data",
  },
  {
    name: "Social",
    description: "Social media icon links (Instagram, LinkedIn, etc.)",
    code: `<Social
  icons={[
    { name: "Instagram", href: "https://instagram.com" },
    { name: "LinkedIn", href: "https://linkedin.com" },
  ]}
/>`,
    group: "Data",
  },
  {
    name: "Divider",
    description: "Horizontal rule with border customization",
    code: `<Divider style={{ borderTop: "1px solid #e5e5e5" }} />`,
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
