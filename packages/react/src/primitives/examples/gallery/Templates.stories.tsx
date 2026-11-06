import type { Meta, StoryObj } from "@storybook/react-vite";
import { args, argTypes, browsed, drawn, printed, showing, type Args } from "../../../stories/SideBySide";
import { gallery } from "./index";

const meta: Meta<Args> = {
  title: "Templates",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Templates for fictional brands, each written with the new components and nothing else: emails, a web page, a printed document and an image. \"Show code\" has each one's template. The images the emails show are drawn from code, and served with Storybook from `gallery/`.",
      },
    },
  },
};
export default meta;

/** An Email: a product launch on drafting paper, with a technical drawing whose callouts are the list under it. Switch `width` to see it on a phone. */
export const OyenLaunch: StoryObj<Args> = { ...showing("Email", gallery.oyenLaunch), name: "Oyen FR-2 launch" };

/** An Email: a pottery's shipping confirmation, one calm card, each piece shown as its glaze. */
export const TarnShipped: StoryObj<Args> = { ...showing("Email", gallery.tarnShipped), name: "Tarn order shipped" };

/** An Email: a database's welcome, dark, with a terminal session, three steps and the free tier. */
export const QuarryWelcome: StoryObj<Args> = { ...showing("Email", gallery.quarryWelcome), name: "Quarry welcome" };

/** An Email: a weekly food newsletter with a newspaper's nameplate, a long read, the week's briefs and a recipe. */
export const PithWeekly: StoryObj<Args> = { ...showing("Email", gallery.pithWeekly), name: "Pith weekly" };

/** An Email: a gallery's invitation to a private view, a poster in ultramarine and the artist's drawing below it. */
export const SaltworksInvitation: StoryObj<Args> = { ...showing("Email", gallery.saltworksInvitation), name: "Saltworks invitation" };

/** An Email: a bank's sign-in code, in a narrow column of the system's own font. */
export const KeelSignInCode: StoryObj<Args> = { ...showing("Email", gallery.keelSignInCode), name: "Keel sign-in code" };

/** A Page: a guesthouse's landing page, the hills an SVG in one Image, in an arched window. Switch `width` to see it on a phone. */
export const CasaAlberoPage: StoryObj<Args> = { ...browsed(gallery.casaAlberoPage), name: "Casa Albero page" };

/** A Document: an architecture practice's invoice, and the hours behind it, drawn as charts on its second page. */
export const PellAshbyInvoice: StoryObj<Args> = { ...printed(gallery.pellAshbyInvoice), name: "Pell & Ashby invoice" };

/** A Canvas: a podcast episode's social card, 1200 by 630, with a lighthouse drawn in Svg shapes. */
export const SlowSignalsCard: StoryObj<Args> = { ...drawn(gallery.slowSignalsCard, 1200), name: "Slow Signals card" };
