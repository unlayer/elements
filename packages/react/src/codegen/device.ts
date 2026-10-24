/**
 * A design's device settings (`_override`) as props: `hideOnMobile`, `hideOnDesktop`, a Row's `noStackMobile`, and
 * the phone settings as `mobile={{ … }}` (an image's and a button's width as they take it). Checked with the
 * components' own mapper; what doesn't come back the same stays in `values._override`.
 */
import { mapSemanticProps } from "@unlayer-internal/shared-elements";
import { typeChecks, type Props } from "./props";
import { deepEqual, isPlainObject, type Plain } from "./values";

/** Phone settings blocks take in `mobile` (as the design keeps them). */
const BLOCK_PHONE = new Set(["padding", "containerPadding", "fontSize", "lineHeight", "textAlign"]);
const COLUMN_PHONE = new Set(["padding", "border"]);
const ROW_PHONE = new Set(["padding"]);

/** Device settings as the builder reads them: flags left off and empty settings dropped. */
export function deviceSettings(override: unknown): unknown {
  if (!isPlainObject(override)) return override;
  const out: Plain = {};
  for (const [device, settings] of Object.entries(override)) {
    if (!isPlainObject(settings)) {
      if (settings !== undefined) out[device] = settings;
      continue;
    }
    const kept = Object.fromEntries(Object.entries(settings).filter(([key, value]) => value !== undefined && !(value === false && /^(hideMobile|hideDesktop|noStackMobile)$/.test(key))));
    if (Object.keys(kept).length) out[device] = kept;
  }
  return Object.keys(out).length ? out : undefined;
}

/** An image's phone `src` sizing, or a button's `size`, as `mobile`'s width settings; undefined when it can't be. */
function phoneWidth(value: unknown, sizeKey: "maxWidth" | "width"): Plain | undefined {
  if (!isPlainObject(value) || Object.keys(value).some((key) => key !== "autoWidth" && key !== sizeKey)) return undefined;
  const { autoWidth } = value;
  const size = value[sizeKey];
  if (autoWidth === false && size !== undefined) return { width: size };
  return { ...(autoWidth !== undefined ? { autoWidth } : {}), ...(size !== undefined ? { [sizeKey]: size } : {}) };
}

/** Place a design node's `_override` on its props (`kind`: what the node is). */
export function placeDevice(override: unknown, props: Props, defaults: Plain, kind: "block" | "row" | "column"): void {
  const settings = deviceSettings(override);
  if (settings === undefined) return;
  if (!isPlainObject(settings)) {
    props.values._override = override;
    return;
  }
  const { mobile: phone = {}, desktop = {}, ...others } = settings as Record<string, Plain>;
  const attrs: Array<[string, unknown]> = [];
  const leftover: Plain = { ...others };
  const keep = (device: string, key: string, value: unknown) => ((leftover[device] ??= {})[key] = value);

  const mobile: Plain = {};
  for (const [key, value] of Object.entries(phone)) {
    if (key === "hideMobile" && kind !== "column" && typeof value === "boolean") attrs.push(["hideOnMobile", value]);
    else if (key === "noStackMobile" && kind === "row" && value === true) attrs.push(["noStackMobile", true]);
    else if (kind === "block" && props.component === "Image" && key === "src" && phoneWidth(value, "maxWidth")) Object.assign(mobile, phoneWidth(value, "maxWidth"));
    else if (kind === "block" && props.component === "Button" && key === "size" && phoneWidth(value, "width")) Object.assign(mobile, phoneWidth(value, "width"));
    else if ((kind === "block" ? BLOCK_PHONE : kind === "column" ? COLUMN_PHONE : ROW_PHONE).has(key) && typeChecks(key, value, props.component)) mobile[key] = value;
    else keep("mobile", key, value);
  }
  for (const [key, value] of Object.entries(desktop)) {
    if (key === "hideDesktop" && kind !== "column" && typeof value === "boolean") attrs.push(["hideOnDesktop", value]);
    else keep("desktop", key, value);
  }
  if (Object.keys(mobile).length) attrs.unshift(["mobile", mobile]);

  // As the component gives them back (with what's left in `values._override`).
  const given: Plain = { ...Object.fromEntries(attrs), ...(Object.keys(leftover).length ? { values: { _override: leftover } } : {}) };
  const back = (mapSemanticProps(given as never, defaults, props.component) as Plain)._override;
  if (deepEqual(deviceSettings(back), settings)) {
    for (const [name, value] of attrs) props.add(name, value);
    if (Object.keys(leftover).length) props.values._override = leftover;
  } else props.values._override = override;
}
