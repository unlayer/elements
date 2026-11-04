import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../compat/SideBySide";
import { Button, Column, Divider, Heading, Html, Image, LineBreak, Link, List, ListItem, Menu, MergeTag, Paragraph, Row, Section, Social, Span, Table, TableCell, TableRow, Video } from "../index";

const meta: Meta<Args> = {
  title: "Primitives/Components",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "The new components, from `@unlayer/react-elements/primitives`: styles in `style={{ }}`, phones in `mobile={{ }}`, under the pointer in `hover={{ }}`. Each is drawn as an Email and as a Page, from one template; \"Show code\" has it. The stories under Components are today's components, with their props, which stay supported.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

const INK = "#1F2933";
const MUTED = "#616E7C";
const BRAND = "#0F766E";
const FONT = "Arial, Helvetica, sans-serif";
const LINE = "1px solid #E4E7EB";
/** A flat color as a picture, drawn in the page (no network). */
const picture = (color: string, width = 400, height = 240) => ({
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${color}"/></svg>`)}`,
  width,
  height,
});

/** Headings and text: `Span` styles a run, `Link` links one, `LineBreak` breaks the line, `MergeTag` is filled in by the sender. */
export const Text = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Heading level={1} style={{ fontSize: 28 }}>Hello, <MergeTag name="first_name" /></Heading>
      <Heading level={2} style={{ fontSize: 18, color: BRAND }}>Your plan renews soon</Heading>
      <Paragraph style={{ fontSize: 15, lineHeight: 1.6 }}>
        Your <Span style={{ fontWeight: 700 }}>Pro plan</Span> renews on <Span style={{ color: BRAND }}>March 3</Span>.<LineBreak />
        Read <Link href="https://example.com/billing" style={{ color: BRAND }}>how billing works</Link>.
      </Paragraph>
    </Section>
  </Root>
));

/** A button's box and text in `style`, its colors under the pointer in `hover`, its size on phones in `mobile`. */
export const Buttons = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16, alignItems: "start" }}>
      <Button href="https://example.com" style={{ backgroundColor: BRAND, color: "#FFFFFF", padding: [12, 24], borderRadius: 6 }} hover={{ backgroundColor: "#115E59" }}>Start free trial</Button>
      <Button href="https://example.com" style={{ backgroundColor: "#FFFFFF", color: BRAND, padding: [12, 24], border: `1px solid ${BRAND}`, borderRadius: 6 }}>See pricing</Button>
      <Button href="https://example.com" style={{ width: 320, backgroundColor: INK, color: "#FFFFFF", padding: [12, 24] }} mobile={{ width: "100%" }}>320px wide, the whole width on phones</Button>
    </Section>
  </Root>
));

/** `src` has the file's size; `style.width` sets the size shown. In a `Link`, the image is the link. */
export const Images = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Image src={picture("#99D6CF")} alt="As wide as its place" />
      <Row style={{ gap: 16 }}>
        <Column><Image src={picture("#F5C6A5", 240, 160)} alt="A share of the row" style={{ width: "100%", borderRadius: 8 }} /></Column>
        <Column>
          <Link href="https://example.com"><Image src={picture("#C5CAE9", 240, 160)} alt="A linked image" style={{ width: 200 }} /></Link>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** A `Section` is a band across the window. A `Row` puts its `Column`s side by side, and stacks them on phones. Space is `gap` and `padding`, never margins. */
export const Layout = story((Root) => (
  <Root width={560} style={{ backgroundColor: "#F5F7FA", color: INK, fontFamily: FONT }}>
    <Section style={{ backgroundColor: BRAND, color: "#FFFFFF", padding: [20, 24] }}>
      <Heading level={2} style={{ fontSize: 20 }}>A band across the window</Heading>
    </Section>
    <Section style={{ backgroundColor: "#FFFFFF", padding: 24 }}>
      <Row style={{ gap: 16 }}>
        <Column style={{ width: 180, gap: 8 }}>
          <Paragraph style={{ fontWeight: 700 }}>180px</Paragraph>
          <Paragraph style={{ color: MUTED, fontSize: 14 }}>A set width.</Paragraph>
        </Column>
        <Column style={{ gap: 8, padding: 12, backgroundColor: "#F5F7FA", borderRadius: 6 }}>
          <Paragraph style={{ fontWeight: 700 }}>The rest</Paragraph>
          <Paragraph style={{ color: MUTED, fontSize: 14 }}>What's left of the row, with a box of its own.</Paragraph>
        </Column>
      </Row>
    </Section>
  </Root>
));

/** A `Divider` is a line, `List` bullets or numbers, and an item can hold a list of its own. */
export const ListsAndDividers = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <List>
        <ListItem>Three projects</ListItem>
        <ListItem>Unlimited viewers</ListItem>
      </List>
      <Divider style={{ borderTop: LINE }} />
      <List type="number">
        <ListItem>Choose a template</ListItem>
        <ListItem>Add your content<List><ListItem>Text and images</ListItem></List></ListItem>
        <ListItem>Send it</ListItem>
      </List>
    </Section>
  </Root>
));

/** A `Table` of `TableRow`s of `TableCell`s: `header` on the first row, a cell's width sets its column's. */
export const Tables = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Table style={{ fontSize: 14, cellPadding: [10, 12], rowBorder: LINE }}>
        <TableRow header style={{ backgroundColor: "#F5F7FA" }}>
          <TableCell>Item</TableCell>
          <TableCell style={{ width: 60, textAlign: "right" }}>Qty</TableCell>
          <TableCell style={{ width: 90, textAlign: "right" }}>Price</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Linen shirt</TableCell>
          <TableCell style={{ textAlign: "right" }}>2</TableCell>
          <TableCell style={{ textAlign: "right" }}>$136.00</TableCell>
        </TableRow>
        <TableRow footer style={{ fontWeight: 700 }}>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell style={{ textAlign: "right" }}>$136.00</TableCell>
        </TableRow>
      </Table>
    </Section>
  </Root>
));

/** `Menu` for a line of links, `Social` for profiles' icons. */
export const MenusAndSocial = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 20, alignItems: "center" }}>
      <Menu items={[{ text: "Pricing", href: "https://example.com/pricing" }, { text: "Docs", href: "https://example.com/docs" }, { text: "Blog", href: "https://example.com/blog" }]} separator="·" style={{ fontSize: 14, color: BRAND, padding: [4, 8] }} />
      <Social icons={[{ name: "x", href: "https://x.com/acme" }, { name: "instagram", href: "https://instagram.com/acme" }, { name: "youtube", href: "https://youtube.com/acme" }]} iconType="circle" size={32} style={{ gap: 12 }} />
    </Section>
  </Root>
));

/** A `Video` is its player on a page and its thumbnail, linked to it, in an email. */
export const Videos = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={picture("#334E68", 512, 288)} title="Product tour" />
    </Section>
  </Root>
));

/** `mobile` has a box's or text's styles on phones, and `hidden` leaves it out on one or the other. */
export const OnPhones = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 12 }}>
      <Heading level={1} style={{ fontSize: 34 }} mobile={{ fontSize: 24, textAlign: "center" }}>Smaller and centered on phones</Heading>
      <Paragraph hidden={{ mobile: true }} style={{ color: MUTED }}>Only on a wider window.</Paragraph>
      <Paragraph hidden={{ desktop: true }} style={{ color: MUTED }}>Only on a phone.</Paragraph>
    </Section>
  </Root>
));

/** `Html` is markup written as it is, for what no component says. */
export const YourOwnHtml = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Html html={'<div style="padding:12px;border:1px dashed #9AA5B1;font-size:14px">Written as it is, <b>nothing in it checked</b>.</div>'} />
    </Section>
  </Root>
));
