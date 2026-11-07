import { Column, Email, Heading } from "@hyper-elements/react";

export const meta = {
  title: "Heading",
  description: "Headings from level 1 to 6, with their own size on phones.",
  group: "Text",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Column style={{ gap: 6 }}>
          <Heading level={1} style={{ fontSize: 32, letterSpacing: -0.5 }} mobile={{ fontSize: 26 }}>
            Ship emails like code
          </Heading>
          <Heading level={2} style={{ fontSize: 20, color: "#475569", fontWeight: 500 }}>
            A level-2 heading under it
          </Heading>
      </Column>
      </Column>
    </Email>
  );
}
