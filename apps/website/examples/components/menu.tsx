import { Column, Email, Menu } from "@hyper-elements/react";

export const meta = {
  title: "Menu",
  description: "A line of links with separators, onto more lines where they don't fit.",
  group: "Blocks",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Menu
          items={[
            { text: "Product", href: "https://example.com/product" },
            { text: "Pricing", href: "https://example.com/pricing" },
            { text: "Docs", href: "https://example.com/docs" },
            { text: "Blog", href: "https://example.com/blog" },
          ]}
          separator="·"
          style={{ fontSize: 14, color: "#0f172a", separatorColor: "#94a3b8", justifyContent: "center" }}
        />
      </Column>
    </Email>
  );
}
