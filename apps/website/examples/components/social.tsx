import { Column, Email, Social } from "@hyper-elements/react";

export const meta = {
  title: "Social",
  description: "Each network's icon by name, linked to its profile.",
  group: "Blocks",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Social
          icons={[
            { name: "X", href: "https://x.com/example" },
            { name: "GitHub", href: "https://github.com/example" },
            { name: "LinkedIn", href: "https://linkedin.com/company/example" },
            { name: "YouTube", href: "https://youtube.com/@example" },
          ]}
          iconType="rounded"
          size={32}
          style={{ gap: 10 }}
        />
      </Column>
    </Email>
  );
}
