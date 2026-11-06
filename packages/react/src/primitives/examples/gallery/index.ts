/**
 * The gallery's templates, by name: each written for a fictional brand with the new components
 * only. Storybook shows them under Templates; gallery.test.tsx renders every one.
 */
import { casaAlberoPage } from "./casa-albero-page";
import { keelSignInCode } from "./keel-sign-in-code";
import { oyenLaunch } from "./oyen-launch";
import { pellAshbyInvoice } from "./pell-ashby-invoice";
import { pithWeekly } from "./pith-weekly";
import { quarryWelcome } from "./quarry-welcome";
import { saltworksInvitation } from "./saltworks-invitation";
import { slowSignalsCard } from "./slow-signals-card";
import { tarnShipped } from "./tarn-shipped";

export const gallery = {
  oyenLaunch,
  tarnShipped,
  quarryWelcome,
  pithWeekly,
  saltworksInvitation,
  keelSignInCode,
  casaAlberoPage,
  pellAshbyInvoice,
  slowSignalsCard,
};
