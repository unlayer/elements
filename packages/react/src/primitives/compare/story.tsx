/**
 * A Storybook story drawing a design both ways, side by side: main's template with renderToHtml(), and the same
 * design in the new components with render(). The comparison gate (scripts/storybook-compare.mjs) checks the two
 * draw the same.
 */
import type { StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { renderToHtml } from "../../index";
import { render } from "../index";
import { SideBySide, type Width } from "./SideBySide";

export type Args = { width: Width; quirks: boolean };

export const args: Args = { width: "desktop", quirks: false };
export const argTypes = {
  width: { control: "inline-radio", options: ["desktop", "phone"] },
  quirks: { control: "boolean", name: "Draw main's quirks", description: "Where main draws something other than what its template asks, the new engine draws it as main does." },
} as const;

/** A design: main's template, the new one, and where main differs from what its template asks, the new one drawn as main does it. */
export interface Design {
  main: ReactElement;
  next: ReactElement;
  nextAsMain?: ReactElement;
  quirks?: string;
  /** How many px across and up or down its content may sit from main's (a menu's spaces and line height, which main leaves to the font). */
  allowance?: { x?: number; y?: number };
}

/** A story rendering a design both ways: main's template with renderToHtml(), the new one with render(). */
export const compare = (design: Design): StoryObj<Args> => ({
  loaders: [
    async ({ args }) => {
      const next = await render(args.quirks && design.nextAsMain ? design.nextAsMain : design.next);
      return { main: renderToHtml(design.main), next: next.html, notes: next.diagnostics.map((d) => `${d.code} at ${d.path}: ${d.message}`) };
    },
  ],
  render: ({ width, quirks }, { loaded }) => (
    <SideBySide
      main={loaded.main}
      next={loaded.next}
      notes={loaded.notes}
      width={width}
      quirks={design.quirks ? { what: design.quirks, drawn: quirks } : undefined}
      allowance={design.allowance}
    />
  ),
});

