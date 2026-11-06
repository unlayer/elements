import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { InTheEditor } from "../stories/InTheEditor";
import { args, argTypes, noted, type Args } from "../stories/SideBySide";
import { gallery } from "../primitives/examples/gallery";
import { Document, Page, render } from "../primitives/index";
import { fromDesign, toDesign, type DisplayMode } from "./index";
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
          "The gallery's templates as Elements draws them, beside the template `fromDesign()` brings back from their `toDesign()` JSON without its hidden properties, which the builder keeps but doesn't draw: each field read as the builder draws it. Below them, the real Unlayer editor holding that JSON, live and editable. It loads from editor.unlayer.com as you reach it. Every gallery template but the Canvas card, which is an image the builder doesn't make.",
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

/** The builder's display mode for a template's root: a Page's is "web", a Document's "document", an Email's "email". */
const modeOf = (template: ReactElement): DisplayMode => (template.type === Page ? "web" : template.type === Document ? "document" : "email");

/** The window a template is meant for: a browser's for a Page, its paper's for a Document, an email client's otherwise. */
const windowOf = (template: ReactElement, width: Args["width"]) => (template.type === Page ? (width === "phone" ? 390 : 1280) : template.type === Document ? 842 : undefined);

/** A template as it's written, beside the one that comes back from what the builder draws of it, over the real editor holding its design. */
const builder = (template: ReactElement): StoryObj<Args> => {
  const { design, report } = toDesign(template);
  const back = fromDesign(withoutHidden(design), { displayMode: modeOf(template) });
  return {
    parameters: { docs: { source: { code: back.code, language: "tsx" } } },
    loaders: [
      async () => {
        const [written, returned] = await Promise.all([render(template), render(back.element)]);
        return { written: written.html, returned: returned.html, notes: [...noted(written), ...noted(returned)] };
      },
    ],
    render: ({ width }, { loaded }) => (
      <InTheEditor
        template={template}
        design={design}
        report={report}
        displayMode={modeOf(template)}
        written={loaded.written}
        back={loaded.returned}
        notes={loaded.notes}
        width={width}
        size={windowOf(template, width)}
      />
    ),
  };
};

// The gallery's templates, through the builder and back.
export const OyenLaunch = builder(gallery.oyenLaunch);
export const TarnShipped = builder(gallery.tarnShipped);
export const QuarryWelcome = builder(gallery.quarryWelcome);
export const PithWeekly = builder(gallery.pithWeekly);
export const SaltworksInvitation = builder(gallery.saltworksInvitation);
export const KeelSignInCode = builder(gallery.keelSignInCode);
export const CasaAlberoPage = builder(gallery.casaAlberoPage);
export const PellAshbyInvoice = builder(gallery.pellAshbyInvoice);
