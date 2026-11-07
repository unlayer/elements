import { Column, Email, Image, Text } from "@hyper-elements/react";

export const meta = {
  title: "Image",
  description: "src takes the file's size, style.width the size shown, so Outlook draws it right.",
  group: "Blocks",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Image
          src={{ src: "https://hyperelements.dev/img/event-hero.png", width: 1200, height: 600 }}
          alt="Lumen Conf 2027"
          style={{ borderRadius: 10 }}
        />
        <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>1200 × 600 file, shown at the column's width.</Text>
      </Column>
    </Email>
  );
}
