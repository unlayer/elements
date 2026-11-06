import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { render } from "../../index";
import { args, argTypes, code, showing, type Args } from "../../../stories/SideBySide";
import { oyenLaunch } from "./oyen-launch";
import { pellAshbyInvoice } from "./pell-ashby-invoice";

const meta: Meta<Args> = {
  title: "Templates",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Templates for fictional brands, each written with the new components and nothing else. \"Show code\" has each one's template. The images they show are drawn from code, and served with Storybook from `gallery/`.",
      },
    },
  },
};
export default meta;

/** A Document's print HTML in a frame as tall as its pages. */
const printed = (template: ReactElement): StoryObj<Args> => ({
  argTypes: { width: { table: { disable: true } } },
  parameters: { docs: { source: { code: code(template), language: "tsx" } } },
  loaders: [async () => ({ html: (await render(template)).html })],
  render: (_, { loaded }) => (
    <iframe
      title="Print HTML"
      srcDoc={loaded.html as string}
      style={{ width: "100%", height: 2400, border: 0 }}
      onLoad={(event) => {
        const frame = event.currentTarget;
        frame.style.height = `${frame.contentDocument?.documentElement.scrollHeight ?? 2400}px`;
      }}
    />
  ),
});

/** An Email: a product launch on drafting paper, with a technical drawing whose callouts are the list under it. Switch `width` to see it on a phone. */
export const OyenLaunch: StoryObj<Args> = { ...showing("Email", oyenLaunch), name: "Oyen FR-2 launch" };

/** A Document: an architecture practice's invoice, and the hours behind it, drawn as charts on its second page. */
export const PellAshbyInvoice: StoryObj<Args> = { ...printed(pellAshbyInvoice), name: "Pell & Ashby invoice" };
