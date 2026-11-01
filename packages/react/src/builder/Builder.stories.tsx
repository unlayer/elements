import type { Meta } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { args, argTypes, compare, type Args } from "../primitives/compare/story";
import * as airbnb from "../primitives/codemod/AirbnbConfirmation";
import * as luma from "../primitives/codemod/LumaEventInvite";
import * as mercury from "../primitives/codemod/MercuryReceipt";
import * as brew from "../primitives/codemod/MorningBrewDigest";
import * as nike from "../primitives/codemod/NikeDrop";
import * as notion from "../primitives/codemod/NotionWelcome";
import * as digest from "../primitives/codemod/ProductDigest";
import * as spotify from "../primitives/codemod/SpotifyWelcome";
import * as stripe from "../primitives/codemod/StripeReceipt";
import * as warby from "../primitives/codemod/WarbyOrderShipped";
import { raise } from "./raise";

const meta: Meta<Args> = {
  title: "Primitives/Builder",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Templates in the new components, as the builder draws them after `toDesign()` (left: today's components, which write the builder's design JSON, rendered as the builder renders them) and as the new engine draws them (right). The comparison gate checks the two draw the same.",
      },
    },
  },
};
export default meta;

/** A template next to what the builder draws of it. */
const builder = (template: ReactElement, allowance?: { x?: number; y?: number }) => compare({ main: raise(template).element!, next: template, allowance });

// main's examples as the codemod migrated them: the builder gets back what main had.
export const StripeReceipt = builder(<stripe.StripeReceipt />);
export const SpotifyWelcome = builder(<spotify.SpotifyPremiumWelcome />);
export const AirbnbConfirmation = builder(<airbnb.AirbnbConfirmation />);
export const MercuryReceipt = builder(<mercury.MercuryReceipt />);
export const LumaEventInvite = builder(<luma.LumaEventInvite />);
export const WarbyOrderShipped = builder(<warby.WarbyOrderShipped />);
export const NotionWelcome = builder(<notion.NotionWelcome />);
export const NikeDrop = builder(<nike.NikeDrop />);
// The builder's Menu puts a space between its links on top of their padding (see "Codemod of main").
export const MorningBrewDigest = builder(<brew.MorningBrewDigest />, { x: 12, y: 3 });
export const ProductDigest = builder(<digest.ProductDigest />, { x: 12, y: 3 });
