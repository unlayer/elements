/**
 * Email spacers: the markup that holds a gap where one shows (`at`, from gapShown in shared/gaps.ts). A row of its own
 * between an email's runs of content and its Sections; between a Row's children, an inline-block where they stack or
 * wrap, a cell where they stay side by side.
 */
import { Fragment, h, NotOutlook, Outlook, raw, type Html } from "../jsx";
import { px } from "../shared/css";
import { gapHidden, type GapAt } from "../shared/gaps";
import { hiding } from "./styles";

/** A gap as a row of its own: as tall as the gap, the phone gap on phones, hidden where there's none (and out of Outlook's view then). */
export function spacerRow(at: GapAt, gap: number, phoneGap: number): Html | null {
  if (!at.desktop && !at.phone) return null;
  const hidden = hiding({ hidden: gapHidden(at) }, "table-row");
  const row = (
    <tr class={hidden.class} style={hidden.style}>
      <td phone={at.phone && phoneGap !== gap ? { lineHeight: px(phoneGap) } : undefined} style={{ fontSize: 0, lineHeight: px(gap), msoLineHeightRule: "exactly" }}>
        {raw("&nbsp;")}
      </td>
    </tr>
  );
  return at.desktop ? row : <NotOutlook>{row}</NotOutlook>;
}

/**
 * The gap before a stacking or wrapping Row's child, where there is one (`at`, from gapShown): a cell in Outlook's
 * table on desktop; for the rest, an inline-block as wide as the gap, and as tall as the phone gap where the children
 * stack (as wide as it, where they wrap).
 */
export function spacer(at: GapAt, gap: number, phoneGap: number, stacks: boolean): Html | null {
  if (!at.desktop && !at.phone) return null;
  const hidden = hiding({ hidden: gapHidden(at) }, "inline-block");
  const phone = stacks ? { height: phoneGap } : phoneGap !== gap ? { width: phoneGap } : undefined;
  return (
    <>
      {at.desktop && (
        <Outlook>
          <td width={gap} style={{ width: gap }} />
        </Outlook>
      )}
      <NotOutlook>
        <div class={hidden.class} phone={phone} style={[{ display: "inline-block", width: gap || undefined }, hidden.style]} />
      </NotOutlook>
    </>
  );
}

/**
 * The gap before a side-by-side Row's child, where there is one, as a cell: the phone gap's width on phones, and kept
 * from Outlook where there's none on desktop. Beside cells that take all the room (`solid`: empty cells packing the
 * children, or the children's shares on phones), an empty cell would give its width up: a div as wide as the gap
 * holds it.
 */
export function gapCell(at: GapAt, gap: number, phoneGap: number, solid = false): Html | null {
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
