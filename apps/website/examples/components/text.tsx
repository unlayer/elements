import { Column, Email, LineBreak, Link, MergeTag, Text, Span } from "@hyper-elements/react";

export const meta = {
  title: "Text",
  description: "Text is components: Span styles a run, Link links one, MergeTag leaves a value for your sending service.",
  group: "Text",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 16, lineHeight: 1.6 }}>
          Hi <MergeTag name="first_name" />, your build <Span style={{ fontFamily: "Menlo, monospace", backgroundColor: "#f1f5f9" }}>#2705</Span> passed.
          <LineBreak />
          <Span style={{ fontWeight: 700 }}>3 templates</Span> changed. <Link href="https://example.com/diff">See the diff</Link>.
        </Text>
      </Column>
    </Email>
  );
}
