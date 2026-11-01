/**
 * A Row. One that stacks on phones is "fluid hybrid": each child is an
 * inline-block div as wide as its desktop width at most and 100% otherwise,
 * so the children sit side by side where there's room and stack where there
 * isn't, without media queries; Outlook, which ignores divs' sizes, gets a
 * table of the same widths in conditional comments. Gaps are spacers: a
 * cell for Outlook, an inline-block for the rest (as tall as the gap on
 * phones, where the children stack). A Row that stays side by side
 * (`wrap: "none"`) is a table row.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { close, Fragment, h, Merged, NotOutlook, open, Outlook, type Html } from "../jsx";
import { isNode, shown, type Context, type MobileText, type Writer } from "./context";
import { boxWidth, phoneWidth, VALIGN } from "./layout";
import { bgcolor, names, Table, TABLE } from "./markup";
import { hiding, mobileTextOf, phoneBox, phoneClass } from "./styles";

const JUSTIFY: Record<string, string | undefined> = { center: "center", end: "right" };

export const writeRow: Writer = (node, place, context) => {
  const mobile = mobileTextOf(node, place.mobile);
  const children = node.children.filter(isNode).filter(shown);
  const gap = typeof node.style.gap === "number" ? node.style.gap : 0;
  const align = (node.style.align as string | undefined) ?? "start";
  const wrap = node.style.wrap as string;
  const justify = node.style.justify as string | undefined;
  diagnose(node, children, context, align, wrap, justify);

  const columns = wrap === "none" ? sideBySide(node, children, context, mobile, gap, VALIGN[align]) : fluidHybrid(node, children, context, mobile, gap, VALIGN[align]);

  // On phones the children take the whole width, one under another (inline-blocks of 100%: each on a line of its own).
  const stack = wrap !== "none" ? context.sheet.classFor("phone", "&>div{width:100%!important;max-width:100%!important}") : undefined;
  const width = boxWidth(node, place.fill);
  const { style } = node;
  if (style.borderRadius !== undefined) {
    context.d.add("email/outlook-degraded", "info", "borderRadius on this Row shows square corners in classic Outlook", `${node.path}.style.borderRadius`, node.id);
  }
  const cellClass = names(stack, phoneClass(context, phoneBox(node)));
  const mobileWidth = node.mobile?.maxWidth ?? node.mobile?.width;
  const tableClass = mobileWidth !== undefined ? phoneClass(context, phoneWidth(mobileWidth)) : undefined;

  return (
    <Table id={node.id} class={tableClass} width={width.width} style={{ maxWidth: width.maxWidth }}>
      <tr>
        <td
          class={cellClass}
          align={justify ? JUSTIFY[justify] : undefined}
          bgcolor={bgcolor(style.backgroundColor)}
          style={{
            // No line boxes between the children: their inline-blocks touch.
            fontSize: wrap !== "none" ? 0 : undefined,
            padding: style.padding,
            backgroundColor: style.backgroundColor,
            border: style.border,
            borderRadius: style.borderRadius,
          }}
        >
          {columns}
        </td>
      </tr>
    </Table>
  );
};

/** Each child in a div of its width, beside the others where they fit; Outlook's table of the same widths around them. */
function fluidHybrid(node: ResolvedNode, children: ResolvedNode[], context: Context, mobile: MobileText, gap: number, valign: string): Html {
  const spacerClass = gap ? phoneClass(context, { height: typeof node.mobile?.gap === "number" ? node.mobile.gap : gap }) : undefined;
  const columns = children.map((child, index) => {
    const hidden = hiding(child, context, "inline-block");
    const content = context.render(child, { parent: node, fill: child.width !== null, mobile, inline: false });
    const width = child.width ?? undefined;
    const column = (
      <div class={hidden.className} style={[{ display: "inline-block", verticalAlign: valign, width: width !== undefined ? "100%" : undefined, maxWidth: width }, hidden.style]}>
        {content}
      </div>
    );
    // What's hidden on desktop isn't in Outlook's table.
    const outlook = !child.hidden?.desktop;
    return (
      <>
        {index > 0 && gap ? (
          <>
            {outlook && (
              <Outlook>
                <td width={gap} style={{ width: gap }} />
              </Outlook>
            )}
            <NotOutlook>
              <div class={spacerClass} style={{ display: "inline-block", width: gap }} />
            </NotOutlook>
          </>
        ) : null}
        {outlook ? (
          <>
            <Outlook>{open(<td width={width} valign={valign} style={{ width }} />)}</Outlook>
            {column}
            <Outlook>{close("td")}</Outlook>
          </>
        ) : (
          <NotOutlook>{column}</NotOutlook>
        )}
      </>
    );
  });

  return (
    <Merged>
      <Outlook>
        {open(<table {...TABLE} width="100%" />)}
        {open(<tr />)}
      </Outlook>
      {columns}
      <Outlook>
        {close("tr")}
        {close("table")}
      </Outlook>
    </Merged>
  );
}

/** A table row: the children side by side on phones too. */
function sideBySide(node: ResolvedNode, children: ResolvedNode[], context: Context, mobile: MobileText, gap: number, valign: string): Html {
  const cells = children.map((child, index) => {
    const hidden = hiding(child, context, "table-cell");
    const content = context.render(child, { parent: node, fill: child.width !== null, mobile, inline: false });
    const width = child.width ?? undefined;
    const cell = (
      <>
        {index > 0 && gap ? <td width={gap} style={{ width: gap }} /> : null}
        <td class={hidden.className} width={width} valign={valign} style={[{ width }, hidden.style]}>
          {content}
        </td>
      </>
    );
    return child.hidden?.desktop ? <NotOutlook>{cell}</NotOutlook> : cell;
  });
  return (
    <Table width="100%">
      <tr>{cells}</tr>
    </Table>
  );
}

/** What email can't do as the Row asks. */
function diagnose(node: ResolvedNode, children: ResolvedNode[], context: Context, align: string, wrap: string, justify: string | undefined): void {
  if (wrap === "wrap") {
    context.d.warning("email/unsupported", 'wrap: "wrap" isn\'t possible in email; this Row stacks on phones instead', `${node.path}.style.wrap`, node.id);
  }
  if (align === "stretch" && children.some((child) => child.style.backgroundColor !== undefined || child.style.border !== undefined)) {
    context.d.add("email/degraded", "info", "A Row's children aren't stretched to one height in email: each background or border ends with its content", `${node.path}.style.align`, node.id);
  }
  if (justify === "between") {
    context.d.warning("email/unsupported", 'justify: "between" isn\'t possible in email; the children start at the left', `${node.path}.style.justify`, node.id);
  }
  for (const child of children) {
    if (child.width === null) {
      context.d.warning("email/width", `This ${child.type} takes its own size in a Row, and its size isn't known: give it a width, so Outlook can lay the Row out`, `${child.path}.style.width`, child.id);
    }
  }
}
