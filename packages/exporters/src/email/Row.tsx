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
const valignOf = (props: Props) => VALIGN[(props.style.alignItems as string | undefined) ?? "start"];

/** Each child in a div of its width, beside the others where they fit; Outlook's table of the same widths around them. */
function fluidHybrid(props: Props): Html {
  const { node, mobile, render } = props;
  const gap = gapOf(props);
  const valign = valignOf(props);
  return (
    <Merged>
      <Outlook>
        {open(<table {...TABLE} width="100%" />)}
        {open(<tr />)}
      </Outlook>
      {node.children
        .filter(isNode)
        .filter(shown)
        .map((child, index) => {
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
              {index > 0 && gap ? (
                <>
                  {inOutlook && (
                    <Outlook>
                      <td width={gap} style={{ width: gap }} />
                    </Outlook>
                  )}
                  <NotOutlook>
                    <div phone={{ height: typeof mobile.gap === "number" ? mobile.gap : gap }} style={{ display: "inline-block", width: gap }} />
                  </NotOutlook>
                </>
              ) : null}
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
  const gap = gapOf(props);
  const valign = valignOf(props);
  // Room the children leave: an empty cell takes it (where the Row's justify puts it), else a table spreads it over them.
  const placed = node.children.filter(isNode).filter((child) => shown(child) && !child.hidden?.desktop);
  const used = placed.reduce((sum, child) => sum + (child.width ?? 0), 0) + gap * Math.max(0, placed.length - 1);
  const left = node.contentWidth !== null && placed.every((child) => child.width !== null) && used < node.contentWidth - 0.5;
  const justify = node.style.justifyContent as string | undefined;
  const filler = <td />;
  return (
    <Table width="100%">
      <tr>
        {left && (justify === "end" || justify === "center") && filler}
        {node.children
          .filter(isNode)
          .filter(shown)
          .map((child, index) => {
            const width = child.width ?? undefined;
            const hidden = hiding(child, "table-cell");
            const cell = (
              <>
                {index > 0 && gap ? <td width={gap} style={{ width: gap }} /> : null}
                <td class={hidden.class} width={width} valign={valign} style={[{ width }, hidden.style]}>
                  {render(child, { fill: width !== undefined })}
                </td>
              </>
            );
            return child.hidden?.desktop ? <NotOutlook>{cell}</NotOutlook> : cell;
          })}
        {left && justify !== "end" && filler}
      </tr>
    </Table>
  );
}
