/**
 * How `<Head>` and `<Font>` record what they give the head while a template is collected.
 */
import type React from "react";
import { renderToHtml } from "@unlayer/react-elements";

interface Internals {
  collecting(): { recorded: unknown[] } | undefined;
  whileCollecting(record: () => React.ReactNode, real: () => React.ReactNode, name: string): React.ReactElement;
}

/**
 * Records `entry` in the collection of the template it renders in, and renders nothing. It finds that collection as
 * Rows and blocks do, by the render's ids (see the main entry's record.tsx): with async templates under way at once,
 * the top of the shared stack can be another template's.
 */
export function recordForHead(entry: unknown, name: string): React.ReactElement {
  const { collecting, whileCollecting } = (renderToHtml as unknown as Record<symbol, Internals>)[Symbol.for("@unlayer/react-elements/internals")];
  return whileCollecting(
    () => {
      collecting()?.recorded.push(entry);
      return null;
    },
    () => null,
    name
  );
}
