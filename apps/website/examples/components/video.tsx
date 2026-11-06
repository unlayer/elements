import { Column, Page, Video } from "@hyper-elements/react";

export const meta = {
  title: "Video",
  description: "A player on a page; in an email, its thumbnail linked to it.",
  group: "Blocks",
  root: "Page",
};

export default function Example() {
  return (
    <Page width={520} style={{ backgroundColor: "#ffffff", fontFamily: "Inter, Helvetica, Arial, sans-serif", color: "#0f172a", gap: 16 }}>
      <Column style={{ padding: 24, gap: 16 }}>
        <Video
          src="https://www.youtube.com/watch?v=eCHaiEjCDFM"
          title="Watch the keynote"
        />
      </Column>
    </Page>
  );
}
