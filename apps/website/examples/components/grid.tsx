import { Column, Email, Grid, Text } from "@hyper-elements/react";

export const meta = {
  title: "Grid",
  description: "Equal columns, row after row; one under another on phones.",
  group: "Layout",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Grid columns={3} style={{ gap: 12 }}>
          {["Email", "Page", "Document", "Canvas", "PDF", "Image"].map((name) => (
            <Column key={name} style={{ backgroundColor: "#f1f5f9", borderRadius: 8, padding: 16 }}>
              <Text style={{ fontWeight: 600, textAlign: "center" }}>{name}</Text>
            </Column>
          ))}
        </Grid>
      </Column>
    </Email>
  );
}
