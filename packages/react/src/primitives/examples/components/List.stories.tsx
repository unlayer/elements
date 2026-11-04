import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../compat/SideBySide";
import { Divider, Link, List, ListItem, MergeTag, Section, Span } from "../../index";
import { BRAND, FONT, INK, LINE, MUTED, WASH } from "./shared";

const meta: Meta<Args> = {
  title: "Components/List",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A bulleted or numbered `List` of `ListItem`s, whose text holds what any text holds. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

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

/** `type="number"` counts from 1, and `start` from another number. */
export const Numbers = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <List type="number">
        <ListItem>Create your account</ListItem>
        <ListItem>Invite your team</ListItem>
      </List>
      <List type="number" start={3}>
        <ListItem>Picks up at three</ListItem>
        <ListItem>Then four</ListItem>
      </List>
    </Section>
  </Root>
));

/** An item holds a `List` of its own, down as many levels as it needs. */
export const Nested = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <List style={{ fontSize: 15, gap: 6 }}>
        <ListItem>
          Fruit
          <List style={{ gap: 6 }}>
            <ListItem>Apples</ListItem>
            <ListItem>
              Citrus
              <List style={{ gap: 6 }}>
                <ListItem>Lemons</ListItem>
                <ListItem>Oranges</ListItem>
              </List>
            </ListItem>
          </List>
        </ListItem>
        <ListItem>Vegetables</ListItem>
      </List>
    </Section>
  </Root>
));

/** `gap` is the space between items, `indent` the markers' column, and a list has a box of its own. */
export const Styles = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <List style={{ gap: 12, indent: 40, fontSize: 15, color: BRAND }}>
        <ListItem>More space between items</ListItem>
        <ListItem>A wider column for the markers</ListItem>
      </List>
      <List type="number" style={{ padding: 16, backgroundColor: WASH, border: LINE, fontSize: 14, color: MUTED }}>
        <ListItem>In a box of its own</ListItem>
        <ListItem style={{ fontWeight: 700, color: INK }}>One item styled its own way</ListItem>
        <ListItem style={{ textDecoration: "line-through" }}>One item struck through</ListItem>
      </List>
    </Section>
  </Root>
));

/** An item's text holds what any text holds: a `Span`, a `Link`, a `MergeTag`. */
export const RunsInItems = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <List style={{ gap: 8, fontSize: 15 }} mobile={{ fontSize: 14, gap: 4 }}>
        <ListItem><Span style={{ fontWeight: 700 }}>Free shipping</Span> on your first order</ListItem>
        <ListItem>Read <Link href="https://example.com/returns" style={{ color: BRAND }}>how returns work</Link></ListItem>
        <ListItem>Your code is <MergeTag name="discount_code" /></ListItem>
      </List>
    </Section>
  </Root>
));
