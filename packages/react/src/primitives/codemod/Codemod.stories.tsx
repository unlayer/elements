import type { Meta } from "@storybook/react-vite";
import { AirbnbConfirmation as MainAirbnb } from "../../examples/AirbnbConfirmation.stories";
import { LumaEventInvite as MainLuma } from "../../examples/LumaEventInvite.stories";
import { MercuryReceipt as MainMercury } from "../../examples/MercuryReceipt.stories";
import { MorningBrewDigest as MainBrew } from "../../examples/MorningBrewDigest.stories";
import { NikeDrop as MainNike } from "../../examples/NikeDrop.stories";
import { NotionWelcome as MainNotion } from "../../examples/NotionWelcome.stories";
import { ProductDigest as MainDigest } from "../../examples/ProductDigest.stories";
import { StripeReceipt as MainStripe } from "../../examples/StripeReceipt.stories";
import { WarbyOrderShipped as MainWarby } from "../../examples/WarbyOrderShipped.stories";
import { SpotifyPremiumWelcome as MainSpotify } from "../../SpotifyWelcome.stories";
import { args, argTypes, compare, type Args } from "../compare/story";
import * as airbnb from "./AirbnbConfirmation";
import * as luma from "./LumaEventInvite";
import * as mercury from "./MercuryReceipt";
import * as brew from "./MorningBrewDigest";
import * as nike from "./NikeDrop";
import * as notion from "./NotionWelcome";
import * as digest from "./ProductDigest";
import * as spotify from "./SpotifyWelcome";
import * as stripe from "./StripeReceipt";
import * as warby from "./WarbyOrderShipped";

const meta: Meta<Args> = {
  title: "Primitives/Codemod of main",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Examples from main, each next to what `@unlayer/migrate`'s codemod makes of it: the same template, its props, helpers and loops kept, in the new components. The files in `src/primitives/codemod` are the codemod's output, unedited (a test checks it), with what it reported at the top of each.",
      },
    },
  },
};
export default meta;

export const StripeReceipt = compare({ main: <MainStripe />, next: <stripe.StripeReceipt /> });
export const SpotifyWelcome = compare({ main: <MainSpotify />, next: <spotify.SpotifyPremiumWelcome /> });
export const AirbnbConfirmation = compare({ main: <MainAirbnb />, next: <airbnb.AirbnbConfirmation /> });
export const MercuryReceipt = compare({ main: <MainMercury />, next: <mercury.MercuryReceipt /> });
export const LumaEventInvite = compare({ main: <MainLuma />, next: <luma.LumaEventInvite /> });
export const WarbyOrderShipped = compare({ main: <MainWarby />, next: <warby.WarbyOrderShipped /> });
export const NotionWelcome = compare({ main: <MainNotion />, next: <notion.NotionWelcome /> });
export const NikeDrop = compare({ main: <MainNike />, next: <nike.NikeDrop /> });
// main puts a space between its menu's links on top of their padding, in the font of what's around the menu, which the
// new Menu doesn't (the codemod reports it): their links sit up to a few px across from main's, more where the font's
// space is wider.
const menu = { x: 12, y: 3 };
export const MorningBrewDigest = compare({ main: <MainBrew />, next: <brew.MorningBrewDigest />, allowance: menu });
export const ProductDigest = compare({ main: <MainDigest />, next: <digest.ProductDigest />, allowance: menu });
