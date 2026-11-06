import type { Meta, StoryObj } from "@storybook/react-vite";
import { throughTheBuilder } from "../../../stories/InTheEditor";
import { args, argTypes, drawn, type Args } from "../../../stories/SideBySide";
import { gallery } from "./index";

const meta: Meta<Args> = {
  title: "Templates",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Templates for fictional brands, each written with the new components and nothing else: emails, a web page, a printed document and an image. Each is drawn as Elements draws it, beside the template `fromDesign()` brings back from its `toDesign()` JSON without its hidden properties, which the builder keeps but doesn't draw. Below them, the real Unlayer editor holding that JSON, live and editable. It loads from editor.unlayer.com as you reach it. \"Show code\" has each template.",
      },
    },
  },
};
export default meta;

/** An Email: a product launch on drafting paper, with a technical drawing whose callouts are the list under it. Switch `width` to see it on a phone. */
export const OyenLaunch: StoryObj<Args> = { ...throughTheBuilder(gallery.oyenLaunch), name: "Oyen FR-2 launch" };

/** An Email: a pottery's shipping confirmation, one calm card, each piece shown as its glaze. */
export const TarnShipped: StoryObj<Args> = { ...throughTheBuilder(gallery.tarnShipped), name: "Tarn order shipped" };

/** An Email: a database's welcome, dark, with a terminal session, three steps and the free tier. */
export const QuarryWelcome: StoryObj<Args> = { ...throughTheBuilder(gallery.quarryWelcome), name: "Quarry welcome" };

/** An Email: a weekly food newsletter with a newspaper's nameplate, a long read, the week's briefs and a recipe. */
export const PithWeekly: StoryObj<Args> = { ...throughTheBuilder(gallery.pithWeekly), name: "Pith weekly" };

/** An Email: a gallery's invitation to a private view, a poster in ultramarine and the artist's drawing below it. */
export const SaltworksInvitation: StoryObj<Args> = { ...throughTheBuilder(gallery.saltworksInvitation), name: "Saltworks invitation" };

/** An Email: a bank's sign-in code, in a narrow column of the system's own font. */
export const KeelSignInCode: StoryObj<Args> = { ...throughTheBuilder(gallery.keelSignInCode), name: "Keel sign-in code" };

/** A Page: a guesthouse's landing page, the hills an SVG in one Image, in an arched window. Switch `width` to see it on a phone. */
export const CasaAlberoPage: StoryObj<Args> = { ...throughTheBuilder(gallery.casaAlberoPage), name: "Casa Albero page" };

/** A Document: an architecture practice's invoice, and the hours behind it, drawn as charts on its second page. */
export const PellAshbyInvoice: StoryObj<Args> = { ...throughTheBuilder(gallery.pellAshbyInvoice), name: "Pell & Ashby invoice" };

/** A Canvas: a podcast episode's social card, 1200 by 630, with a lighthouse drawn in Svg shapes. */
export const SlowSignalsCard: StoryObj<Args> = { ...drawn(gallery.slowSignalsCard, 1200), name: "Slow Signals card" };
