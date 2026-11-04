import type { Meta } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { args, argTypes, compare, type Args } from "../compat/SideBySide";
import { airbnb, brew, digest, luma, mercury, nike, notion, spotify, stripe, warby } from "../primitives/testing/codemod-examples";
import { fromDesign, toDesign } from "./index";
import { legacyOf, withoutHidden } from "./testing/legacy";

const meta: Meta<Args> = {
  title: "Primitives/Builder",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Templates in the new components as the builder draws their design JSON after `toDesign()` (left: today's components given each item's values, written by today's exporters, as the builder's are), and as the new engine draws the template `fromDesign()` brings back from that JSON without its hidden properties (right), which the builder keeps but doesn't draw. The comparison gate checks the two draw the same: each field is read as the builder draws it.",
      },
    },
  },
};
export default meta;

/** What the builder draws of a template's design, next to the template that comes back from its fields. */
const builder = (template: ReactElement, allowance?: { x?: number; y?: number }) => {
  const { design } = toDesign(template);
  return compare({ main: legacyOf(design), next: fromDesign(withoutHidden(design)).element, allowance });
};

// main's examples as the codemod migrated them: what the builder draws of them, and what it gives back.
export const StripeReceipt = builder(<stripe.StripeReceipt />);
export const SpotifyWelcome = builder(<spotify.SpotifyPremiumWelcome />);
export const AirbnbConfirmation = builder(<airbnb.AirbnbConfirmation />);
export const MercuryReceipt = builder(<mercury.MercuryReceipt />);
export const LumaEventInvite = builder(<luma.LumaEventInvite />);
export const WarbyOrderShipped = builder(<warby.WarbyOrderShipped />);
export const NotionWelcome = builder(<notion.NotionWelcome />);
export const NikeDrop = builder(<nike.NikeDrop />);
export const MorningBrewDigest = builder(<brew.MorningBrewDigest />);
export const ProductDigest = builder(<digest.ProductDigest />);
