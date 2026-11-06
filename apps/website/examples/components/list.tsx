import { Column, Email, List, ListItem } from "@hyper-elements/react";

export const meta = {
  title: "List",
  description: "Bulleted or numbered, with markers in a column of their own, and nesting.",
  group: "Data",
};

export default function Example() {
  return (
    <Email width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <List type="number" style={{ gap: 6 }}>
          <ListItem>Write the template in JSX</ListItem>
          <ListItem>
            Render it
            <List style={{ gap: 4 }}>
              <ListItem>HTML for the inbox</ListItem>
              <ListItem>Plain text, automatically</ListItem>
            </List>
          </ListItem>
          <ListItem>Send it with any provider</ListItem>
        </List>
      </Column>
    </Email>
  );
}
