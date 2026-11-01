import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { renderToHtml } from "../../index";
import { render } from "../index";
import * as airbnb from "./AirbnbConfirmation";
import * as luma from "./LumaEventInvite";
import * as mercury from "./MercuryReceipt";
import * as brew from "./MorningBrewDigest";
import * as nike from "./NikeDrop";
import * as notion from "./NotionWelcome";
import * as phone from "./PhoneOverrides";
import * as digest from "./ProductDigest";
import { SideBySide, type Width } from "./SideBySide";
import * as menu from "./MenuLinks";
import * as social from "./SocialIcons";
import * as spotify from "./SpotifyWelcome";
import * as stripe from "./StripeReceipt";
import * as warby from "./WarbyOrderShipped";

type Args = { width: Width; quirks: boolean };

const meta: Meta<Args> = {
  title: "Primitives/Compare with main",
  args: { width: "desktop", quirks: false },
  argTypes: {
    width: { control: "inline-radio", options: ["desktop", "phone"] },
    quirks: { control: "boolean", name: "Draw main's quirks", description: "Where main draws something other than what its template asks, the new engine draws it as main does." },
  },
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

/** A design: main's template, the new one, and where main differs from what its template asks, the new one drawn as main does it. */
interface Design {
  main: ReactElement;
  next: ReactElement;
  nextAsMain?: ReactElement;
  quirks?: string;
}

/** A story rendering a design both ways: main's template with renderToHtml(), the new one with render(). */
const compare = (design: Design): StoryObj<Args> => ({
  loaders: [
    async ({ args }) => {
      const next = await render(args.quirks && design.nextAsMain ? design.nextAsMain : design.next);
      return { main: renderToHtml(design.main), next: next.html, notes: next.diagnostics.map((d) => `${d.code} at ${d.path}: ${d.message}`) };
    },
  ],
  render: ({ width, quirks }, { loaded }) => (
    <SideBySide main={loaded.main} next={loaded.next} notes={loaded.notes} width={width} quirks={design.quirks ? { what: design.quirks, drawn: quirks } : undefined} />
  ),
});

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
