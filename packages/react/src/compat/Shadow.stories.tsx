import type { Meta } from "@storybook/react-vite";
import * as spotify from "../SpotifyWelcome.stories";
import * as airbnb from "../examples/AirbnbConfirmation.stories";
import * as luma from "../examples/LumaEventInvite.stories";
import * as mercury from "../examples/MercuryReceipt.stories";
import * as brew from "../examples/MorningBrewDigest.stories";
import * as nike from "../examples/NikeDrop.stories";
import * as notion from "../examples/NotionWelcome.stories";
import * as digest from "../examples/ProductDigest.stories";
import * as stripe from "../examples/StripeReceipt.stories";
import * as warby from "../examples/WarbyOrderShipped.stories";
import { phone } from "../primitives/testing/examples";
import { args, argTypes, shadow, shadowOf, type Args } from "./story";

const meta: Meta<Args> = {
  title: "Primitives/Main through the new engine",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Each of main's examples as main renders it, next to the same template rendered by the new engine: its design lowered into the new components (RFC 0001, step 7), each block in its new component where its tool has moved over, else the HTML today's exporter writes for it.",
      },
    },
  },
};
export default meta;

export const StripeReceipt = shadow(stripe, "Default");
export const SpotifyWelcome = shadow(spotify, "Default");
// Its story renders its template with renderToHtmlParts() inside a component of its own: the same template as here.
export const PhoneOverrides = shadowOf(() => phone.main);
export const AirbnbConfirmation = shadow(airbnb, "Default");
export const MercuryReceipt = shadow(mercury, "Default");
export const LumaEventInvite = shadow(luma, "Default");
export const WarbyOrderShipped = shadow(warby, "Default");
export const NotionWelcome = shadow(notion, "Default");
export const NikeDrop = shadow(nike, "Default");
export const MorningBrewDigest = shadow(brew, "Default");
export const ProductDigest = shadow(digest, "Default");
