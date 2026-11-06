import { Canvas, Column, Heading, Image, Layer, Text, Row } from "@hyper-elements/react";

export const meta = { title: "Launch graphic", root: "Canvas", component: "LaunchCard", file: "orbit-launch.png" };

export default function LaunchCard() {
  return (
    <Canvas width={1200} height={630} style={{ backgroundColor: "#1d1670", fontFamily: "Helvetica, Arial, sans-serif", color: "#ffffff" }}>
      <Layer style={{ width: 1200, height: 630 }}>
        <Image src={{ src: "https://hyperelements.dev/img/orbit-card-bg.png", width: 1200, height: 630 }} alt="" />
        <Row style={{ padding: [64, 40, 64, 80], gap: 40, alignItems: "center", height: 630 }}>
          <Column style={{ width: 480, flex: "none", gap: 22 }}>
            <Row>
              <Text style={{ flex: "none", fontSize: 16, fontWeight: 700, letterSpacing: 3, color: "#3b2bd1", backgroundColor: "#ffffff", borderRadius: 999, padding: [9, 18] }}>
                NOW AVAILABLE
              </Text>
            </Row>
            <Heading level={1} style={{ fontSize: 108, lineHeight: 0.95, letterSpacing: -4, color: "#ffffff" }}>
              Orbit 2.0
            </Heading>
            <Text style={{ fontSize: 30, lineHeight: 1.25, color: "#d9dcff" }}>Ship every surface from one codebase.</Text>
            <Row style={{ alignItems: "center", gap: 16, padding: [26, 0, 0, 0] }}>
              <Image src={{ src: "https://hyperelements.dev/img/orbit-logo-white.png", width: 252, height: 128 }} alt="Orbit" style={{ width: 110, flex: "none" }} />
              <Text style={{ fontSize: 22, color: "#a5abff" }}>orbit.dev</Text>
            </Row>
          </Column>
          <Image
            src={{ src: "https://hyperelements.dev/img/orbit-app.png", width: 1200, height: 700 }}
            alt="The Orbit 2.0 dashboard"
            style={{ width: 560, borderRadius: 16, border: "6px solid rgba(255,255,255,0.18)" }}
          />
        </Row>
      </Layer>
    </Canvas>
  );
}
