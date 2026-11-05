import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Image, Link, Section, Span, Table, TableCell, TableRow } from "../../index";
import { BRAND, FONT, INK, LINE, MUTED, picture, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Table",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A table of data: a `Table` of `TableRow`s of `TableCell`s. Columns take their cells' widths, and the rest share what's left. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** A `Table` of `TableRow`s of `TableCell`s: `header` on the first row, a cell's width sets its column's. */
export const Invoice = story((Root) => (
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

const PRODUCTS = [
  ["Headphones", "$199.99", "4.8", "In stock"],
  ["Smart watch", "$299.99", "4.5", "In stock"],
  ["Speaker", "$79.99", "4.9", "Low stock"],
  ["Laptop stand", "$49.99", "4.3", "Sold out"],
];

/** Stripes are a background on every other `TableRow`, and a header row is one more color. */
export const StripedRows = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Table style={{ fontSize: 14, cellPadding: 12, border: LINE }}>
        <TableRow header style={{ backgroundColor: INK, color: "#FFFFFF" }}>
          <TableCell>Product</TableCell>
          <TableCell>Price</TableCell>
          <TableCell>Rating</TableCell>
          <TableCell>Stock</TableCell>
        </TableRow>
        {PRODUCTS.map(([name, price, rating, stock], index) => (
          <TableRow key={name} style={index % 2 ? { backgroundColor: WASH } : undefined}>
            <TableCell>{name}</TableCell>
            <TableCell>{price}</TableCell>
            <TableCell>{rating}</TableCell>
            <TableCell style={stock === "Sold out" ? { color: "#B91C1C" } : undefined}>{stock}</TableCell>
          </TableRow>
        ))}
      </Table>
    </Section>
  </Root>
));

const FEATURES = [
  ["Projects", "3", "Unlimited"],
  ["Viewers", "Unlimited", "Unlimited"],
  ["Support", "Email", "Phone and email"],
];

/** Plans side by side: a cell can span columns (`colSpan`) and have a color of its own. */
export const PlanComparison = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Table style={{ fontSize: 14, cellPadding: [10, 12], rowBorder: LINE, textAlign: "center" }}>
        <TableRow header>
          <TableCell style={{ textAlign: "left", width: 160 }}>Feature</TableCell>
          <TableCell>Free</TableCell>
          <TableCell style={{ backgroundColor: BRAND, color: "#FFFFFF" }}>Pro</TableCell>
        </TableRow>
        {FEATURES.map(([feature, free, pro]) => (
          <TableRow key={feature}>
            <TableCell style={{ textAlign: "left" }}>{feature}</TableCell>
            <TableCell>{free}</TableCell>
            <TableCell style={{ backgroundColor: "#ECFDF5" }}>{pro}</TableCell>
          </TableRow>
        ))}
        <TableRow footer>
          <TableCell colSpan={3} style={{ fontSize: 12, color: MUTED }}>Prices don't include tax.</TableCell>
        </TableRow>
      </Table>
    </Section>
  </Root>
));

/** `border` goes around the table or a cell, `rowBorder` between its rows; `borderCollapse` is whether cells share theirs. */
export const Borders = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Table style={{ fontSize: 14, cellPadding: 10, borderCollapse: "collapse" }}>
        <TableRow header>
          <TableCell style={{ border: "1px solid #9AA5B1" }}>Cells share</TableCell>
          <TableCell style={{ border: "1px solid #9AA5B1" }}>their borders</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ border: "1px solid #9AA5B1" }}>collapse</TableCell>
          <TableCell style={{ border: "1px solid #9AA5B1" }}>collapse</TableCell>
        </TableRow>
      </Table>
      <Table style={{ fontSize: 14, cellPadding: 10, borderCollapse: "separate", border: `2px solid ${BRAND}` }}>
        <TableRow header>
          <TableCell style={{ border: LINE }}>Each cell draws</TableCell>
          <TableCell style={{ border: LINE }}>its own</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ border: LINE }}>separate</TableCell>
          <TableCell style={{ border: LINE }}>separate</TableCell>
        </TableRow>
      </Table>
    </Section>
  </Root>
));

/** Cells hold images and links; `verticalAlign` is where they sit in the row's `height`. */
export const ImagesAndLinks = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Table style={{ fontSize: 14, cellPadding: [8, 12], rowBorder: LINE }}>
        <TableRow style={{ height: 80 }}>
          <TableCell style={{ width: 72, verticalAlign: "middle" }}><Image src={picture("#99D6CF", 64, 64)} alt="A linen shirt" style={{ borderRadius: 6 }} /></TableCell>
          <TableCell style={{ verticalAlign: "middle" }}>
            <Span style={{ fontWeight: 700 }}>Linen shirt</Span>, <Link href="https://example.com/shirt" style={{ color: BRAND }}>see it</Link>
          </TableCell>
          <TableCell style={{ width: 80, textAlign: "right", verticalAlign: "top" }}>$68.00</TableCell>
        </TableRow>
        <TableRow style={{ height: 80 }}>
          <TableCell style={{ verticalAlign: "middle" }}><Image src={picture("#F5C6A5", 64, 64)} alt="A canvas tote" style={{ borderRadius: 6 }} /></TableCell>
          <TableCell style={{ verticalAlign: "middle" }}>
            <Span style={{ fontWeight: 700 }}>Canvas tote</Span>, <Link href="https://example.com/tote" style={{ color: BRAND }}>see it</Link>
          </TableCell>
          <TableCell style={{ textAlign: "right", verticalAlign: "bottom" }}>$34.00</TableCell>
        </TableRow>
      </Table>
    </Section>
  </Root>
));

/** `mobile` has its text and its cells' padding on phones: choose "phone" under width to see it. */
export const OnPhones = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Table style={{ fontSize: 16, rowBorder: LINE }} mobile={{ fontSize: 13 }}>
        <TableRow header>
          <TableCell style={{ padding: [14, 16] }} mobile={{ padding: [6, 4] }}>Month</TableCell>
          <TableCell style={{ padding: [14, 16], textAlign: "right" }} mobile={{ padding: [6, 4] }}>Orders</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ padding: [14, 16] }} mobile={{ padding: [6, 4] }}>March</TableCell>
          <TableCell style={{ padding: [14, 16], textAlign: "right" }} mobile={{ padding: [6, 4] }}>1,204</TableCell>
        </TableRow>
      </Table>
    </Section>
  </Root>
));
