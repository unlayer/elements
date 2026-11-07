import { Canvas, Column, Heading, Image, Layer, Paragraph } from "./index";

export default function LaunchCard() {
  return (
    <Canvas width={1200} height={630} style={{ border: { left: "16px solid #f97316" }, color: "#ffffff", fontFamily: "Inter" }}>
      <Layer style={{ height: 630, alignItems: "end" }}>
        <Image src={{ src: "https://example.com/hero.jpg", width: 1600, height: 900 }} alt="" />
        <Column style={{ padding: 64, gap: 16 }}>
          <Paragraph style={{ alignSelf: "start", backgroundColor: "#f97316", padding: [6, 16], borderRadius: 999, fontSize: 20 }}>New</Paragraph>
          <Heading style={{ fontSize: 64 }}>Launch week</Heading>
          <Paragraph style={{ fontSize: 28, color: "#e2e8f0" }}>Five days of new things, one a day.</Paragraph>
        </Column>
      </Layer>
    </Canvas>
  );
}
