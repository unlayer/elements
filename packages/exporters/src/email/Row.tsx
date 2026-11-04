/**
 * A Row. One that stacks on phones is "fluid hybrid": each child is an
 * inline-block div as wide as its desktop width at most and 100% otherwise,
 * so the children sit side by side where there's room and stack where there
 * isn't, without media queries; Outlook, which ignores divs' sizes, gets a
 * table of the same widths in conditional comments. Gaps are spacers: a
 * cell for Outlook, an inline-block for the rest (as tall as the gap on
 * phones, where the children stack). A Row that stays side by side
 * (`stackOnMobile` false) is a table row; one that wraps (`flexWrap`, a
 * Menu's) is the same inline-blocks, onto another line where they don't fit
 * (classic Outlook's table keeps them on one). Where they wrap as words do,
 * they're a space of the text's font apart, on lines at least as tall as its.
 * Today's components' columns (`compat.stretch`) are the cells of a table row,
 * their boxes on the cells, as tall as the row; those that stack are blocks on
 * phones.
 */
import { close, Fragment, h, Merged, NotOutlook, open, Outlook, rule, type Html } from "../jsx";
import { isNode, shown, type Props, type Component } from "./context";
import { boxWidth, gapOf, phoneGapOf, phoneShares, phoneWidth, toNumber, valignOf } from "./layout";
import { bgcolor, compatPicture, Table, TABLE } from "./markup";
import { gapCell, spacer } from "./spacers";
import { hiding } from "./styles";
import { fontFamily } from "../shared/css";
import { gapsBefore, gapShown } from "../shared/gaps";

const JUSTIFY: Record<string, string | undefined> = { center: "center", end: "right" };

export const Row: Component = (props) => {
  const { node, style, mobile, fill } = props;
  const stacks = node.props.stackOnMobile !== false;
  const words = !stacks && style.flexWrap === "words";
  const wraps = (!stacks && style.flexWrap === "wrap") || words;
  const width = boxWidth(node, fill);
  const stretched = !!node.compat?.stretch;
  const picture = compatPicture(node.compat, node.width ?? 600);
  return (
    <Table id={node.id} phone={phoneWidth(mobile.maxWidth ?? mobile.width)} width={width.width} style={{ maxWidth: width.maxWidth }}>
      <tr>
        <td
          // On phones the children take the whole width, one under another (inline-blocks of 100%: each on a line of its own).
          class={stacks && !stretched ? rule("phone", "&>div{width:100%!important;max-width:100%!important}", "layout") : undefined}
          phone={{ padding: mobile.padding, border: mobile.border, backgroundColor: mobile.backgroundColor }}
          align={JUSTIFY[style.justifyContent as string]}
          dir={node.props.dir as string | undefined}
          background={picture?.background}
          bgcolor={bgcolor(style.backgroundColor)}
          height={style.height !== undefined ? toNumber(style.height) : undefined}
          style={{
            // No line boxes between the children: their inline-blocks touch. (Words have this font's spaces between them.)
            fontFamily: words ? fontFamily(node.text.fontFamily) : undefined,
            fontSize: words ? node.text.fontSize : !stretched && (stacks || wraps) ? 0 : undefined,
            letterSpacing: words ? node.text.letterSpacing || undefined : undefined,
            textAlign: wraps ? (JUSTIFY[style.justifyContent as string] ?? "left") : undefined,
            padding: style.padding,
            backgroundColor: style.backgroundColor,
            ...picture?.style,
            border: style.border,
            borderRadius: style.borderRadius,
            height: style.height !== undefined ? toNumber(style.height) : undefined,
            overflow: style.overflow === "hidden" ? "hidden" : undefined,
          }}
        >
          {picture?.open}
          {stretched ? boxedCells(props, stacks) : stacks || wraps ? fluidHybrid(props, stacks, words) : sideBySide(props)}
          {picture?.close}
        </td>
      </tr>
    </Table>
  );
};

/**
 * Each child a cell with its box on it, so its background and lines are as tall as the row; at least its share wide,
 * however much of the row's width its neighbours' content takes (a table shares it out by their content), or its
 * `compat.minWidth` (on phones its `phoneMinWidth`). Markup among them (`Raw`) is as wide as its content lets it be.
 */
function boxedCells(props: Props, stacks: boolean): Html {
  const { node, render } = props;
  const valign = valignOf(props);
  const stack = stacks ? rule("phone", "&{display:block!important;width:100%!important;min-width:0!important}", "layout") : undefined;
  return (
    <Table width="100%">
      <tr>
        {node.children
          .filter(isNode)
          .filter(shown)
          .map((child) => {
            const { padding, border, borderRadius, backgroundColor, ...style } = child.style;
            const width = child.type === "Raw" || child.width === null ? undefined : child.width;
            return (
              <td
                id={child.id}
                class={[stack, child.compat?.className as string | undefined]}
                width={width}
                valign={valign}
                bgcolor={bgcolor(backgroundColor)}
                // (Stacked, what it holds can still run past the window: a node's rule comes after the stacking's.)
                phone={stacks ? { minWidth: child.compat?.phoneMinWidth as number | undefined } : { width: child.style.width, minWidth: (child.compat?.phoneMinWidth as number | undefined) ?? 0 }}
                style={{ width, minWidth: Math.max(width ?? 0, (child.compat?.minWidth as number | undefined) ?? 0) || undefined, boxSizing: "border-box", padding, backgroundColor, border, borderRadius }}
              >
                {render({ ...child, id: undefined, style, mobile: undefined, compat: undefined }, { fill: true })}
              </td>
            );
          })}
      </tr>
    </Table>
  );
}

/** Each child in a div of its width, beside the others where they fit; Outlook's table of the same widths around them. */
function fluidHybrid(props: Props, stacks: boolean, words: boolean): Html {
  const { node, render } = props;
  const [gap, phoneGap] = [gapOf(props), phoneGapOf(props)];
  const valign = valignOf(props);
  const children = node.children.filter(isNode).filter(shown);
  const gaps = gapsBefore(children);
  // The cell's text is 0px (no line boxes between the children): each child gets the Row's size back, for what it
  // holds that sets no size of its own (a Video's link, an Image's alternate text).
  const phoneSize = props.phoneText.filter(([property]) => property === "font-size");
  return (
    <Merged>
      <Outlook>
        {/* Where they wrap, as wide as they are (placed by the cell's align), not spread across the Row. */}
        {open(<table {...TABLE} width={stacks ? "100%" : undefined} />)}
        {open(<tr />)}
      </Outlook>
      {children.map((child, index) => {
        const width = child.width ?? undefined;
        const hidden = hiding(child, "inline-block");
        const column = (
          <div class={hidden.class} phone={phoneSize} style={[{ display: "inline-block", verticalAlign: valign, width: width !== undefined ? "100%" : undefined, maxWidth: width, fontSize: node.text.fontSize }, hidden.style]}>
            {render(child, { fill: width !== undefined })}
          </div>
        );
        // What's hidden on desktop isn't in Outlook's table.
        const inOutlook = !child.hidden?.desktop;
        return (
          <>
            {words && index > 0 && " "}
            {spacer(gapShown(gaps[index], gap, phoneGap), gap, phoneGap, stacks)}
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
  const shares = packed ? undefined : phoneShares(children, phoneGap);
  const cells = children.map((child, index) => {
    const width = child.width ?? undefined;
    const hidden = hiding(child, "table-cell");
    // A child whose size only the client knows is as wide as its content on one line, as a flex item of its own size
    // is on the page: beside the empty cells that take the room, its cell would otherwise shrink to its longest word.
    const cell = (
      <td
        class={hidden.class}
        width={width}
        valign={valign}
        phone={shares?.get(child)}
        style={[{ width, whiteSpace: child.width === null ? "nowrap" : undefined }, hidden.style]}
      >
        {render(child, { fill: width !== undefined })}
      </td>
    );
    return (
      <>
        {/* With the shares, the gaps on phones are the cells' padding. */}
        {gapCell(gapShown(shares ? { ...gaps[index], phone: false } : gaps[index], gap, phoneGap), gap, phoneGap, packed)}
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
