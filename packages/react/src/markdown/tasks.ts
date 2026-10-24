/**
 * A list's task items (`- [ ] …`, `- [x] …`), read as marked (18.0.14's, the version built in) reads them, in time
 * linear in the list. marked takes each task item's `[ ]` out of the text its inline syntax is read from by looking
 * for it from the end of everything left to read, for each item again, so a list of n task items took time growing
 * with n squared (0.8 s for 100 KB of `- [ ] a`). Here marked's tokenizer is given a rule that finds no task (see
 * limits.ts), and the list it returns is given its tasks after, as marked gives them: the same `[ ]` taken out of the
 * same texts, in the same order (each from the end, where the one before was), so the tokens are the same.
 */
import type { Tokens } from "marked";

/** A list item's task, as marked finds one (`listIsTask`, `listReplaceTask`, `listTaskCheckbox`). */
const TASK = /^\[[ xX]\] +\S/;
const MARK = /^\[[ xX]\] +/;
const CHECKBOX = /\[[ xX]\]/;

/** `list` (as marked returns it with no task found) given its tasks; `queue`: the texts left to read (marked's `inlineQueue`). */
export function addTasks(list: Tokens.List, queue: { src: string }[]): void {
  // Where the last `[ ]` was taken out: nothing after it has one.
  let from = queue.length - 1;
  for (const item of list.items) {
    item.task = TASK.test(item.text);
    if (!item.task) continue;
    const first = item.tokens[0];
    if (first?.type !== "text" && first?.type !== "paragraph") {
      item.task = false;
      continue;
    }
    item.text = item.text.replace(MARK, "");
    first.raw = first.raw.replace(MARK, "");
    first.text = first.text.replace(MARK, "");
    for (; from >= 0; from--) {
      if (TASK.test(queue[from].src)) {
        queue[from].src = queue[from].src.replace(MARK, "");
        break;
      }
    }
    const mark = CHECKBOX.exec(item.raw);
    if (!mark) continue;
    const checkbox: Tokens.Checkbox = { type: "checkbox", raw: `${mark[0]} `, checked: mark[0] !== "[ ]" };
    item.checked = checkbox.checked;
    if (!list.loose) item.tokens.unshift(checkbox);
    else if ("tokens" in first && first.tokens) {
      first.raw = checkbox.raw + first.raw;
      first.text = checkbox.raw + first.text;
      first.tokens.unshift(checkbox);
    } else item.tokens.unshift({ type: "paragraph", raw: checkbox.raw, text: checkbox.raw, tokens: [checkbox] });
  }
}
