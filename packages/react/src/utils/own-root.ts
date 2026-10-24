/**
 * The root a render renders its template with: this copy's Body, Email, Page or Document, whichever copy of Elements
 * the template's root is of (a package's ESM and CommonJS builds loaded together, as tsx and a CLI load them, or two
 * installs in a monorepo). The renderer that was called renders the whole template: its HTML, head, plain text and
 * design are made in its render's scope (what it collects once, leaves out and says once: see render-scope.ts), as
 * another copy's Rows, Columns and blocks are recorded by their markers and its blocks made this copy's by their names.
 * A root is known by its marker, or an older copy's by its name and code (see root-type.ts): a component of the user's
 * own named like one isn't one, and stays as it is.
 */
import type React from "react";
import Body from "../components/Body";
import Document from "../components/Document";
import Email from "../components/Email";
import Page from "../components/Page";
import { rootName } from "./root-type";

const ROOTS = new Map<string, unknown>([
  ["Body", Body],
  ["Email", Email],
  ["Page", Page],
  ["Document", Document],
]);

/** `root` as this copy's root of its name (the same props), when it's another copy's. */
export function ownRoot(root: React.ReactElement): React.ReactElement {
  const own = ROOTS.get(rootName(root.type) ?? "");
  return own && root.type !== own ? ({ ...root, type: own } as React.ReactElement) : root;
}
