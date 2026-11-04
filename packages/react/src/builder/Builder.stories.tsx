import type { Meta } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { args, argTypes, sideBySide, type Args } from "../compat/SideBySide";
import { airbnb, brew, digest, luma, mercury, nike, notion, spotify, stripe, warby } from "../primitives/testing/codemod-examples";
import { fromDesign, toDesign } from "./index";
import { HIDDEN } from "./manifest";
import type { Design } from "./write";

const meta: Meta<Args> = {
  title: "Builder",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Templates in the new components as they're written (left), and the template `fromDesign()` brings back from their design JSON after `toDesign()`, without its hidden properties, which the builder keeps but doesn't draw (right): each field read as the builder draws it.",
      },
    },
  },
};
export default meta;

/** The design without its hidden properties: only what the builder draws. */
function withoutHidden(design: Design): Design {
  const copy = JSON.parse(JSON.stringify(design)) as Design;
  const strip = (tool: string, values: Record<string, any>) => {
    for (const { key, path } of HIDDEN[tool] ?? []) {
      if (path.startsWith("hidden.")) delete values._override?.[path.slice(7)]?.[key];
      else {
        delete values[key];
        delete values._override?.mobile?.[key];
      }
    }
  };
  strip("body", copy.body.values);
  for (const rows of [copy.body.rows, copy.body.headers ?? [], copy.body.footers ?? []]) {
    for (const row of rows) {
      strip("row", row.values);
      for (const column of row.columns) {
        strip("column", column.values);
        for (const content of column.contents) strip(content.type, content.values);
      }
    }
  }
  return copy;
}

/** A template as it's written, next to the one that comes back from what the builder draws of its design. */
const builder = (template: ReactElement) => sideBySide({ label: "As written", template }, { label: "Back from the builder", template: fromDesign(withoutHidden(toDesign(template).design)).element });

// The examples as the codemod migrated them: what the builder gives back of them.
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
