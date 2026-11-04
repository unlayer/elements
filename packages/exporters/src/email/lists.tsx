/**
 * What a List and its items work out besides their markup: each item's number where it shows, counted apart on
 * desktop and on phones, and a nested List's hiding.
 */
import type { ResolvedNode } from "@unlayer-internal/elements-core";
import { Fragment, h, NotOutlook, type Html } from "../jsx";
import { shown, type Props } from "./context";
import { hiding } from "./styles";

/** Each item's number on desktop and on phones: the start, and one more for each item shown before it there. */
export function numbersOf(items: readonly ResolvedNode[], start: number): Array<{ desktop: number; phone: number }> {
  let [desktop, phone] = [start, start];
  return items.map((item) => {
    const at = { desktop, phone };
    if (!item.hidden?.desktop) desktop += 1;
    if (!item.hidden?.mobile) phone += 1;
    return at;
  });
}

/** An item's number, or where desktop and phones count it differently, each one where it shows (desktop's in Outlook). */
export function numberOf(item: ResolvedNode, at: { desktop: number; phone: number }): Html | string {
  if (item.hidden?.desktop) return `${at.phone}.`;
  if (item.hidden?.mobile || at.desktop === at.phone) return `${at.desktop}.`;
  const [desktop, phone] = [hiding({ hidden: { mobile: true } }, "inline"), hiding({ hidden: { desktop: true } }, "inline")];
  return (
    <>
      <span class={desktop.class}>{at.desktop}.</span>
      <NotOutlook>
        <span class={phone.class} style={phone.style}>
          {at.phone}.
        </span>
      </NotOutlook>
    </>
  );
}

/** A List nested in an item, hidden where it's hidden itself (a List takes no hiding of its own, its parent's row does that elsewhere). */
export function nested(list: ResolvedNode, render: Props["render"]): Html | null {
  if (!shown(list)) return null;
  if (!list.hidden?.desktop && !list.hidden?.mobile) return render(list);
  const hidden = hiding(list, "block");
  const block = (
    <div class={hidden.class} style={hidden.style}>
      {render(list)}
    </div>
  );
  return list.hidden?.desktop ? <NotOutlook>{block}</NotOutlook> : block;
}
