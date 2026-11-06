/**
 * A gallery template through the builder: as Elements draws it, beside what comes back from its design JSON without
 * its hidden properties (each field read as the builder draws it), and under them the real editor holding that JSON.
 */
import type { StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { fromDesign, toDesign } from "../builder";
import { HIDDEN } from "../builder/manifest";
import type { Design } from "../builder/write";
import { Document, Page, render } from "../primitives/index";
import { LiveEditor, modeOf } from "./LiveEditor";
import { Reported, type Note, type Width } from "./Reported";
import { code, Frame, GAP, noted, WIDTHS, type Args } from "./SideBySide";

/** The design without its hidden properties: only what the builder draws. It draws a root's fonts, from the stylesheet on each font. */
export function withoutHidden(design: Design): Design {
  const copy = JSON.parse(JSON.stringify(design)) as Design;
  const strip = (tool: string, values: Record<string, any>) => {
    for (const { key, path } of HIDDEN[tool] ?? []) {
      if (path === "props.fonts") continue;
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

/** The window a template is meant for: a browser's for a Page, its paper's for a Document, an email client's otherwise. */
const windowOf = (template: ReactElement, width: Width) => (template.type === Page ? (width === "phone" ? 390 : 1280) : template.type === Document ? 842 : WIDTHS[width]);

function WrittenAndBack({ written, back, notes, page }: { written: string; back: string; notes: Note[]; page: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(Infinity);
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setRoom(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(1, (room - GAP) / (page * 2));
  return (
    <div ref={box}>
      <div style={{ display: "flex", gap: GAP, alignItems: "flex-start" }}>
        <Frame label="As written, in Elements" html={written} width={page} scale={scale} />
        <Frame label="Back from the builder" html={back} width={page} scale={scale} />
      </div>
      <Reported notes={notes} />
    </div>
  );
}

/** A story of a template as it's written, beside the one that comes back from what the builder draws of it, over the real editor. */
export const throughTheBuilder = (template: ReactElement): StoryObj<Args> => {
  const { design } = toDesign(template);
  const back = fromDesign(withoutHidden(design), { displayMode: modeOf(template) });
  return {
    parameters: { docs: { source: { code: code(template), language: "tsx" } } },
    loaders: [
      async () => {
        const [written, returned] = await Promise.all([render(template), render(back.element)]);
        return { written: written.html, returned: returned.html, notes: [...noted(written), ...noted(returned)] };
      },
    ],
    render: ({ width }, { loaded }) => (
      <>
        <WrittenAndBack written={loaded.written} back={loaded.returned} notes={loaded.notes} page={windowOf(template, width)} />
        <LiveEditor template={template} width={width} tall={900} />
      </>
    ),
  };
};
