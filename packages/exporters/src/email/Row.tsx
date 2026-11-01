/**
 * A Row. One that stacks on phones is "fluid hybrid": each child is an
 * inline-block div as wide as its desktop width at most and 100% otherwise,
 * so the children sit side by side where there's room and stack where there
 * isn't, without media queries; Outlook, which ignores divs' sizes, gets a
 * table of the same widths in conditional comments. Gaps are spacers: a
 * cell for Outlook, an inline-block for the rest (as tall as the gap on
 * phones, where the children stack). A Row that stays side by side
 * (`stackOnMobile` false) is a table row.
 */
import { close, Fragment, h, Merged, NotOutlook, open, Outlook, rule, type Html } from "../jsx";
import { isNode, shown, type Props, type Component } from "./context";
import { boxWidth, phoneWidth, toNumber, VALIGN } from "./layout";
import { bgcolor, Table, TABLE } from "./markup";
import { hiding } from "./styles";
import { gapHidden, gapsBefore, gapShown, type GapAt } from "../shared/gaps";

const JUSTIFY: Record<string, string | undefined> = { center: "center", end: "right" };

export const Row: Component = (props) => {
  const { node, style, mobile, fill } = props;
  const stacks = node.props.stackOnMobile !== false;
  const width = boxWidth(node, fill);
  return (
    <Table id={node.id} phone={phoneWidth(mobile.maxWidth ?? mobile.width)} width={width.width} style={{ maxWidth: width.maxWidth }}>
      <tr>
        <td
          // On phones the children take the whole width, one under another (inline-blocks of 100%: each on a line of its own).
          class={stacks ? rule("phone", "&>div{width:100%!important;max-width:100%!important}", "layout") : undefined}
          phone={{ padding: mobile.padding, border: mobile.border, backgroundColor: mobile.backgroundColor }}
          align={JUSTIFY[style.justifyContent as string]}
          bgcolor={bgcolor(style.backgroundColor)}
          height={style.height !== undefined ? toNumber(style.height) : undefined}
          style={{
            // No line boxes between the children: their inline-blocks touch.
            fontSize: stacks ? 0 : undefined,
            padding: style.padding,
            backgroundColor: style.backgroundColor,
            border: style.border,
            borderRadius: style.borderRadius,
            height: style.height !== undefined ? toNumber(style.height) : undefined,
            overflow: style.overflow === "hidden" ? "hidden" : undefined,
          }}
        >
          {stacks ? fluidHybrid(props) : sideBySide(props)}
        </td>
      </tr>
    </Table>
  );
};

const gapOf = (props: Props) => (typeof props.style.gap === "number" ? props.style.gap : 0);
/** The gap on phones: the Row's phone gap, else its gap. */
const phoneGapOf = (props: Props) => (typeof props.mobile.gap === "number" ? props.mobile.gap : gapOf(props));
const valignOf = (props: Props) => VALIGN[(props.style.alignItems as string | undefined) ?? "start"];

/** Each child in a div of its width, beside the others where they fit; Outlook's table of the same widths around them. */
function fluidHybrid(props: Props): Html {
  const { node, render } = props;
  const [gap, phoneGap] = [gapOf(props), phoneGapOf(props)];
  const valign = valignOf(props);
  const children = node.children.filter(isNode).filter(shown);
  const gaps = gapsBefore(children);
  return (
    <Merged>
      <Outlook>
        {open(<table {...TABLE} width="100%" />)}
        {open(<tr />)}
      </Outlook>
      {children.map((child, index) => {
        const width = child.width ?? undefined;
        const hidden = hiding(child, "inline-block");
        const column = (
          <div class={hidden.class} style={[{ display: "inline-block", verticalAlign: valign, width: width !== undefined ? "100%" : undefined, maxWidth: width }, hidden.style]}>
            {render(child, { fill: width !== undefined })}
          </div>
        );
        // What's hidden on desktop isn't in Outlook's table.
        const inOutlook = !child.hidden?.desktop;
        return (
          <>
            {spacer(gapShown(gaps[index], gap, phoneGap), gap, phoneGap)}
            {inOutlook ? (
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
      })}
      <Outlook>
        {close("tr")}
        {close("table")}
      </Outlook>
    </Merged>
  );
}

/** A table row: the children side by side on phones too. */
function sideBySide(props: Props): Html {
  const { node, render } = props;
  const [gap, phoneGap] = [gapOf(props), phoneGapOf(props)];
  const valign = valignOf(props);
  // Room the children leave: an empty cell takes it (where the Row's justify puts it), else a table spreads it over them.
  const placed = node.children.filter(isNode).filter((child) => shown(child) && !child.hidden?.desktop);
  const used = placed.reduce((sum, child) => sum + (child.width ?? 0), 0) + gap * Math.max(0, placed.length - 1);
  const left = node.contentWidth !== null && used < node.contentWidth - 0.5;
  const justify = node.style.justifyContent as string | undefined;
  // A child of its own size whose size only the client knows (a Link, a Button) takes no room above. Where there's
  // one, the empty cells take all the room (half each, around centered children) and the gaps can't give theirs
  // up, so the table packs the children where flexbox does.
  const packed = left && placed.some((child) => child.width === null);
  const filler = <td width={packed ? (justify === "center" ? "50%" : "100%") : undefined} />;
  const children = node.children.filter(isNode).filter(shown);
  const gaps = gapsBefore(children);
  const cells = children.map((child, index) => {
    const width = child.width ?? undefined;
    const hidden = hiding(child, "table-cell");
    const cell = (
      <td class={hidden.class} width={width} valign={valign} style={[{ width }, hidden.style]}>
        {render(child, { fill: width !== undefined })}
      </td>
    );
    return (
      <>
        {gapCell(gapShown(gaps[index], gap, phoneGap), gap, phoneGap, packed)}
        {child.hidden?.desktop ? <NotOutlook>{cell}</NotOutlook> : cell}
      </>
    );
  });
  return (
    <Table width="100%">
      <tr>
        {left && (justify === "end" || justify === "center") && filler}
        {cells}
        {left && justify !== "end" && filler}
      </tr>
    </Table>
  );
}

/**
 * The gap before a stacking Row's child, where there is one (`at`, from gapShown): a cell in Outlook's table on
 * desktop; for the rest, an inline-block as wide as the gap, and as tall as the phone gap where the children stack.
 */
function spacer(at: GapAt, gap: number, phoneGap: number): Html | null {
  if (!at.desktop && !at.phone) return null;
  const hidden = hiding({ hidden: gapHidden(at) }, "inline-block");
  return (
    <>
      {at.desktop && (
        <Outlook>
          <td width={gap} style={{ width: gap }} />
        </Outlook>
      )}
      <NotOutlook>
        <div class={hidden.class} phone={{ height: phoneGap }} style={[{ display: "inline-block", width: gap || undefined }, hidden.style]} />
      </NotOutlook>
    </>
  );
}

/**
 * The gap before a side-by-side Row's child, where there is one, as a cell: the phone gap's width on phones, and kept
 * from Outlook where there's none on desktop. Beside cells that take all the room (`solid`), an empty cell would give
 * its width up: a div as wide as the gap holds it.
 */
function gapCell(at: GapAt, gap: number, phoneGap: number, solid = false): Html | null {
  if (!at.desktop && !at.phone) return null;
  const hidden = hiding({ hidden: gapHidden(at) }, "table-cell");
  const phone = at.phone && phoneGap !== gap ? { width: phoneGap } : undefined;
  const cell = (
    <td class={hidden.class} width={gap || undefined} phone={phone} style={[{ width: gap || undefined }, hidden.style]}>
      {solid && <div phone={phone} style={{ width: gap || undefined }} />}
    </td>
  );
  return at.desktop ? cell : <NotOutlook>{cell}</NotOutlook>;
}
