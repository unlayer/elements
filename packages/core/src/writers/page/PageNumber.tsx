/** A PageNumber: the number of the page the Document writer is writing (`numbering`), or how many pages there are. */
import { Fragment, h } from "../jsx";
import type { Component } from "./context";

let current = { page: 1, total: 1 };

/** Writes what `write` writes with `numbers` as the page a PageNumber is on. */
export function numbering<T>(numbers: { page: number; total: number }, write: () => T): T {
  const before = current;
  current = numbers;
  try {
    return write();
  } finally {
    current = before;
  }
}

export const PageNumber: Component = ({ node }) => <>{String(node.props.total ? current.total : current.page)}</>;
