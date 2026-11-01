/**
 * The email's body: a full-width table with the window's background, the
 * content at the content width, centered, and Sections as bands across the
 * window between runs of content.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, Html, raw } from "../jsx";
import { px } from "../shared/css";
import { isNode, shown, type Context } from "./context";
import { stackRows } from "./layout";
import { bgcolor, Table } from "./markup";
import { writeSection } from "./Section";
import { mobileTextOf } from "./styles";

export function writeEmail(root: ResolvedNode, context: Context): Html {
  const width = root.width ?? 600;
  const mobile = mobileTextOf(root, {});
  const gap = typeof root.style.gap === "number" ? root.style.gap : 0;
  const background = root.style.backgroundColor as string | undefined;

  // The content at the content width, centered; Sections span the window, in runs between them.
  const parts: Array<Html | ResolvedNode> = [];
  let run: ResolvedNode[] = [];
  const flush = () => {
    if (!run.length) return;
    const stack = stackRows({ ...root, children: run }, context, mobile);
    parts.push(
      <Table class={stack.className} width="100%" style={{ maxWidth: width }}>
        {stack.rows}
      </Table>
    );
    run = [];
  };
  for (const node of root.children.filter(isNode).filter(shown)) {
    if (node.type === "Section") {
      flush();
      parts.push(node);
    } else run.push(node);
  }
  flush();

  // Between a Section and its neighbours the gap is a row of its own, outside the Section's background.
  const spacer = gap ? (
    <tr>
      <td style={{ fontSize: 0, lineHeight: px(gap), msoLineHeightRule: "exactly" }}>{raw("&nbsp;")}</td>
    </tr>
  ) : null;
  const rows = parts.map((part, index) => (
    <>
      {index > 0 && spacer}
      {part instanceof Html ? (
        <tr>
          <td align="center">{part}</td>
        </tr>
      ) : (
        writeSection(part, { parent: root, fill: false, mobile, inline: false }, context)
      )}
    </>
  ));

  return (
    <Table width="100%" bgcolor={bgcolor(background)} style={{ backgroundColor: background }}>
      {rows}
    </Table>
  );
}
