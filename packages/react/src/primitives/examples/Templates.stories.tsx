import type { Meta } from "@storybook/react-vite";
import { args, argTypes, showing, type Args } from "../../compat/SideBySide";
import { airbnb, brew, digest, luma, mercury, nike, notion, spotify, stripe, warby } from "../testing/examples";

const meta: Meta<Args> = {
  title: "Templates",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Whole emails written with the new components. \"Show code\" has each one's template, with `style={{ }}` throughout.",
      },
    },
  },
};
export default meta;

export const StripeReceipt = showing("Email", stripe);
export const SpotifyWelcome = showing("Email", spotify);
export const AirbnbConfirmation = showing("Email", airbnb);
export const MercuryReceipt = showing("Email", mercury);
export const LumaEventInvite = showing("Email", luma);
export const WarbyOrderShipped = showing("Email", warby);
export const NotionWelcome = showing("Email", notion);
export const NikeDrop = showing("Email", nike);
export const MorningBrewDigest = showing("Email", brew);
export const ProductDigest = showing("Email", digest);
