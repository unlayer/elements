import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { renderToHtml } from "../../index";
import { render } from "../index";
import * as airbnb from "./AirbnbConfirmation";
import * as luma from "./LumaEventInvite";
import * as mercury from "./MercuryReceipt";
import * as phone from "./PhoneOverrides";
import { SideBySide, type Width } from "./SideBySide";
import * as spotify from "./SpotifyWelcome";
import * as stripe from "./StripeReceipt";
import * as warby from "./WarbyOrderShipped";

type Args = { width: Width };

const meta: Meta<Args> = {
  title: "Primitives/Compare with main",
  args: { width: "desktop" },
  argTypes: { width: { control: "inline-radio", options: ["desktop", "phone"] } },
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

/** A story rendering a design both ways: main's template with renderToHtml(), the new one with render(). */
const compare = (design: { main: ReactElement; next: ReactElement }): StoryObj<Args> => ({
  loaders: [
    async () => {
      const next = await render(design.next);
      return { main: renderToHtml(design.main), next: next.html, notes: next.diagnostics.map((d) => `${d.code} at ${d.path}: ${d.message}`) };
    },
  ],
  render: ({ width }, { loaded }) => <SideBySide main={loaded.main} next={loaded.next} notes={loaded.notes} width={width} />,
});

export const StripeReceipt = compare(stripe);
export const SpotifyWelcome = compare(spotify);
export const PhoneOverrides = compare(phone);
export const AirbnbConfirmation = compare(airbnb);
export const MercuryReceipt = compare(mercury);
export const LumaEventInvite = compare(luma);
export const WarbyOrderShipped = compare(warby);
