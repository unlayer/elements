import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Column, Grid, Heading, Paragraph, Section, Text } from "../../index";
import { FONT, INK, LINE, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Grid",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Its children in columns of equal width, row after row, and on phones one under another. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** A flat tile with its number in it. */
const tile = (label: number | string, color = "#D9E2EC") => (
  <Column key={label} style={{ padding: 16, backgroundColor: color }}>
    <Text style={{ fontSize: 14, textAlign: "center" }}>{label}</Text>
  </Column>
);
const tiles = (count: number, color?: string) => Array.from({ length: count }, (_, index) => tile(index + 1, color));

/** `columns` is how many children to a row; a last row that's short keeps their width. */
export const Columns = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 24 }}>
      <Grid columns={2} style={{ gap: 12 }}>{tiles(4)}</Grid>
      <Grid columns={3} style={{ gap: 12 }}>{tiles(5, "#BCCCDC")}</Grid>
      <Grid columns={4} style={{ gap: 12 }}>{tiles(8, "#9FB3C8")}</Grid>
    </Section>
  </Root>
));

/** `gap` is the space across and down, unless `rowGap` sets the space between rows; `mobile` has others on phones. */
export const Gaps = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 24 }}>
      <Grid columns={3} style={{ gap: 4 }}>{tiles(6)}</Grid>
      <Grid columns={3} style={{ gap: 24 }}>{tiles(6, "#BCCCDC")}</Grid>
      <Grid columns={3} style={{ gap: 8, rowGap: 32 }} mobile={{ gap: 4 }}>{tiles(6, "#9FB3C8")}</Grid>
    </Section>
  </Root>
));

/** `alignItems` is where each child sits in its row's height. */
export const Alignment = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 24 }}>
      <Grid columns={2} style={{ gap: 12, alignItems: "start" }}>
        <Paragraph style={{ padding: 12, backgroundColor: WASH, fontSize: 14 }}>A cell with a good deal more text in it than the one beside it, at the top of the row.</Paragraph>
        <Paragraph style={{ padding: 12, backgroundColor: WASH, fontSize: 14 }}>At the top.</Paragraph>
      </Grid>
      <Grid columns={2} style={{ gap: 12, alignItems: "center" }}>
        <Paragraph style={{ padding: 12, backgroundColor: WASH, fontSize: 14 }}>A cell with a good deal more text in it than the one beside it, in the middle of the row.</Paragraph>
        <Paragraph style={{ padding: 12, backgroundColor: WASH, fontSize: 14 }}>In the middle.</Paragraph>
      </Grid>
      <Grid columns={2} style={{ gap: 12, alignItems: "end" }}>
        <Paragraph style={{ padding: 12, backgroundColor: WASH, fontSize: 14 }}>A cell with a good deal more text in it than the one beside it, at the bottom of the row.</Paragraph>
        <Paragraph style={{ padding: 12, backgroundColor: WASH, fontSize: 14 }}>At the bottom.</Paragraph>
      </Grid>
    </Section>
  </Root>
));

/** A grid goes one under another on phones unless `stackOnMobile={false}` keeps its columns: choose "phone" under width to see it. */
export const KeptOnPhones = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 24 }}>
      <Grid columns={3} style={{ gap: 12 }}>{tiles(3)}</Grid>
      <Grid columns={3} stackOnMobile={false} style={{ gap: 12 }}>{tiles(3, "#9FB3C8")}</Grid>
    </Section>
  </Root>
));

const SERVICES = [
  ["Design", "Templates and layouts, made to fit your brand."],
  ["Delivery", "Sent on time, to every inbox you care about."],
  ["Reporting", "What was opened and clicked, every morning."],
  ["Support", "A person who answers, the same day."],
];

/** A grid has a box of its own: here services in a tinted panel, two to a row. */
export const Services = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Grid columns={2} style={{ gap: 12, padding: 16, backgroundColor: WASH, borderRadius: 12, border: LINE }}>
        {SERVICES.map(([name, line]) => (
          <Column key={name} style={{ gap: 4, padding: 16, backgroundColor: "#FFFFFF", borderRadius: 8 }}>
            <Heading level={3} style={{ fontSize: 16 }}>{name}</Heading>
            <Paragraph style={{ fontSize: 13, color: MUTED }}>{line}</Paragraph>
          </Column>
        ))}
      </Grid>
    </Section>
  </Root>
));
