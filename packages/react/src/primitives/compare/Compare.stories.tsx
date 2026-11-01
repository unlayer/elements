import type { Meta } from "@storybook/react-vite";
import * as airbnb from "./AirbnbConfirmation";
import * as luma from "./LumaEventInvite";
import * as mercury from "./MercuryReceipt";
import * as brew from "./MorningBrewDigest";
import * as nike from "./NikeDrop";
import * as notion from "./NotionWelcome";
import * as phone from "./PhoneOverrides";
import * as digest from "./ProductDigest";
import { args, argTypes, compare, type Args } from "./story";
import * as menu from "./MenuLinks";
import * as social from "./SocialIcons";
import * as video from "./VideoPlayer";
import * as spotify from "./SpotifyWelcome";
import * as stripe from "./StripeReceipt";
import * as warby from "./WarbyOrderShipped";

const meta: Meta<Args> = {
  title: "Primitives/Compare with main",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Examples from main, each next to the same design written with the new components (`@unlayer/react-elements/primitives`) and rendered by the new engine, which doesn't use `@unlayer/exporters`. Each render is in a frame of its own; switch the width to phone to see each one's phone layout.",
      },
    },
  },
};
export default meta;

export const StripeReceipt = compare(stripe);
export const SpotifyWelcome = compare(spotify);
export const PhoneOverrides = compare(phone);
export const AirbnbConfirmation = compare(airbnb);
export const MercuryReceipt = compare(mercury);
export const LumaEventInvite = compare(luma);
export const WarbyOrderShipped = compare(warby);
export const NotionWelcome = compare(notion);
export const NikeDrop = compare(nike);
export const MorningBrewDigest = compare(brew);
export const ProductDigest = compare(digest);

// main's component stories, each with the new component.
export const SocialMediaBar = compare(social.bar);
export const SocialRounded = compare(social.rounded);
export const SocialSquared = compare(social.squared);
export const SocialEmailFooter = compare(social.footer);
export const MenuLinks = compare(menu.links);
export const MenuSeparatorColor = compare(menu.separators);
export const VideoInEmail = compare(video.email);
export const VideoOnPage = compare(video.page);
