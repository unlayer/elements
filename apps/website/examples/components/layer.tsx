import { Column, Email, Heading, Image, Layer, Text } from "@hyper-elements/react";

export const meta = {
  title: "Layer",
  description: "Words over an image, in email too.",
  group: "Layout",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Layer style={{ borderRadius: 12, alignItems: "end" }}>
          <Image src={{ src: "https://hyperelements.dev/img/gradient.png", width: 1200, height: 500 }} alt="" />
          <Column style={{ padding: 24, gap: 4 }}>
            <Text style={{ color: "#ef4638", fontSize: 12, fontWeight: 700 }}>LIVE ON MARCH 18</Text>
            <Heading level={2} style={{ color: "#ffffff", fontSize: 24 }}>Text over the picture</Heading>
          </Column>
        </Layer>
      </Column>
    </Email>
  );
}
