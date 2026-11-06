import type { Meta, StoryObj } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, drawn, printed, showing, type Args } from "../../../stories/SideBySide";
import { stress, type Stress } from "./index";

const meta: Meta<Args> = {
  title: "Stress",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "What could fail: small templates that each push on one thing most likely to break, drawn as an Email and as a Page (and a Document and a Canvas of their own). Storybook's smoke test and the visual baseline see every one, so a change that breaks one shows.",
      },
    },
  },
};
export default meta;

/** A stress template written for any screen, as an Email beside a Page. */
const both = (entry: Stress): StoryObj<Args> => {
  if (entry.roots !== "screen") throw new Error("A screen template draws as an Email and a Page");
  return asEmailAndPage(entry.template as never);
};
const own = (entry: Stress) => {
  if (entry.roots !== "own") throw new Error("Not a template of its own root");
  return entry.template;
};

export const LongWords = both(stress.longWords);
export const RightToLeft = both(stress.rightToLeft);
export const MergeTags = both(stress.mergeTags);
export const ManyColumns = both(stress.manyColumns);
export const HiddenBlocks = both(stress.hiddenBlocks);
export const Nested = both(stress.nested);
export const Tables = both(stress.tables);
export const Images = both(stress.images);
export const Buttons = both(stress.buttons);
export const EmptyAndOptional = both(stress.emptyAndOptional);
export const EmojiAndCjk: StoryObj<Args> = { ...both(stress.emojiAndCjk), name: "Emoji and CJK" };
export const Fonts = both(stress.fonts);
export const LinksAndColors = both(stress.linksAndColors);
export const PageShapes = showing("Page", own(stress.pageShapes));
export const DocumentPages = printed(own(stress.documentPages));
export const CanvasShapes = drawn(own(stress.canvasShapes), 600);
