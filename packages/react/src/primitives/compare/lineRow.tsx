import { Column, Paragraph, Row, Section } from "../index";

/**
 * The label and value line main's receipts repeat (a two-column Row, a hairline under each
 * Column), in the new components: the label on the left, the value in bold on the right.
 */
export function lineRow(label: string, value: string, colors: { label: string; value: string; line: string }, last = false) {
  const cell = { padding: "14px 0", border: last ? undefined : { bottom: `1px solid ${colors.line}` } };
  return (
    <Section style={{ backgroundColor: "#FFFFFF" }}>
      <Row>
        <Column style={cell}>
          <Paragraph style={{ padding: 10, fontSize: 14, color: colors.label, lineHeight: "140%" }}>{label}</Paragraph>
        </Column>
        <Column style={cell}>
          <Paragraph style={{ padding: 10, fontSize: 14, fontWeight: 700, color: colors.value, textAlign: "right", lineHeight: "140%" }}>{value}</Paragraph>
        </Column>
      </Row>
    </Section>
  );
}
