import { Column, Divider, Paragraph, Row, Section } from "../index";

/**
 * The label and value line main's receipts repeat (a two-column Row, a hairline under each
 * Column), in the new components: the label on the left, the value in bold on the right.
 *
 * main's Columns are as tall as their Row on desktop, their hairlines in line, and stack on phones,
 * each with its own. The new email writer doesn't stretch a Row's children to its height (its
 * support data says so), so on desktop the hairline is a Divider under the Row, and on phones each
 * Column's border.
 */
export function lineRow(label: string, value: string, colors: { label: string; value: string; line: string }, last = false) {
  const line = `1px solid ${colors.line}`;
  const cell = { style: { padding: "14px 0" }, mobile: last ? undefined : { border: { bottom: line } } };
  return (
    <Section style={{ backgroundColor: "#FFFFFF" }}>
      <Row>
        <Column {...cell}>
          <Paragraph style={{ padding: 10, fontSize: 14, color: colors.label, lineHeight: "140%" }}>{label}</Paragraph>
        </Column>
        <Column {...cell}>
          <Paragraph style={{ padding: 10, fontSize: 14, fontWeight: 700, color: colors.value, textAlign: "right", lineHeight: "140%" }}>{value}</Paragraph>
        </Column>
      </Row>
      {!last && <Divider hidden={{ mobile: true }} style={{ borderTop: line }} />}
    </Section>
  );
}
