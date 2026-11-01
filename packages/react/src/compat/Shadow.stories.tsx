import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { renderToHtml } from "../index";
import * as airbnb from "../primitives/compare/AirbnbConfirmation";
import * as luma from "../primitives/compare/LumaEventInvite";
import * as mercury from "../primitives/compare/MercuryReceipt";
import * as brew from "../primitives/compare/MorningBrewDigest";
import * as nike from "../primitives/compare/NikeDrop";
import * as notion from "../primitives/compare/NotionWelcome";
import * as phone from "../primitives/compare/PhoneOverrides";
import * as digest from "../primitives/compare/ProductDigest";
import { SideBySide, type Width } from "../primitives/compare/SideBySide";
import * as spotify from "../primitives/compare/SpotifyWelcome";
import * as stripe from "../primitives/compare/StripeReceipt";
import * as warby from "../primitives/compare/WarbyOrderShipped";
import { renderWithNewEngine } from "./shadow";

type Args = { width: Width };

const meta: Meta<Args> = {
  title: "Primitives/Main through the new engine",
  args: { width: "desktop" },
  argTypes: { width: { control: "inline-radio", options: ["desktop", "phone"] } },
  parameters: {
    docs: {
      description: {
        component:
          "Each of main's examples as main renders it, next to the same template rendered by the new engine: its design lowered into the new components (RFC 0001, step 7), each block still the HTML today's exporter writes for it until its component moves over.",
      },
    },
  },
};
export default meta;

/** A story rendering one of main's templates both ways: renderToHtml(), and through the new engine. */
const shadow = (design: { main: ReactElement }): StoryObj<Args> => ({
  loaders: [
    async () => {
      const next = renderWithNewEngine(design.main);
      return { main: renderToHtml(design.main), next: next.html, notes: next.diagnostics.map((d) => `${d.code} at ${d.path}: ${d.message}`) };
    },
  ],
  render: ({ width }, { loaded }) => <SideBySide main={loaded.main} next={loaded.next} notes={loaded.notes} width={width} labels={["main: today's components", "New engine: main's design, lowered"]} />,
});

export const StripeReceipt = shadow(stripe);
export const SpotifyWelcome = shadow(spotify);
export const PhoneOverrides = shadow(phone);
export const AirbnbConfirmation = shadow(airbnb);
export const MercuryReceipt = shadow(mercury);
export const LumaEventInvite = shadow(luma);
export const WarbyOrderShipped = shadow(warby);
export const NotionWelcome = shadow(notion);
export const NikeDrop = shadow(nike);
export const MorningBrewDigest = shadow(brew);
export const ProductDigest = shadow(digest);
