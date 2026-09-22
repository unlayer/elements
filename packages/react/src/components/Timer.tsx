import { TimerExporters, TimerDefaults } from "@unlayer/exporters";
import type { TimerValues, SizeInput } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

/**
 * Timer semantic props.
 *
 * `width` is pulled out of the auto-flattened set on purpose: the Timer value
 * has TWO `width` fields — the display group (`width: { autoWidth, width }`)
 * and the countdown image's natural pixel width (`countdown.width`). A bare
 * flat `width` would be ambiguous, so it's mapped explicitly to the display
 * group below (the intent 99% of authors mean). Reach for the `values` escape
 * hatch to set the countdown image's natural dimensions.
 */
type TimerSemanticProps = Omit<SemanticProps<TimerValues>, "width"> & {
  /**
   * The countdown **image** URL (alias for `countdown.countdownUrl`).
   *
   * A countdown timer in email is just an `<img>` — real email clients
   * (Gmail, Outlook, Apple Mail) strip JavaScript, so the "ticking" is a
   * server-rendered animated GIF, not client-side JS. Point this at any
   * countdown-image provider — NiftyImages, Sendtric, MotionMail, Unlayer's
   * hosted service, or your own endpoint — and it renders everywhere.
   *
   * The URL is used verbatim as the image `src`, so bake the deadline/timezone
   * into the query string the way your provider expects
   * (e.g. `https://i.nifty.dev/abc?...&end=2026-12-31T23:59:59Z`).
   */
  imageUrl?: string;
  /** Alt text for the countdown image (alias for `altText`). */
  alt?: string;
  /** Link applied when the timer is clicked — a URL string (alias for `action`). */
  href?: string;
  /** Display width — "100%" (responsive, default) or a px value/number that pins the timer. */
  width?: SizeInput;
};

export interface TimerProps extends ItemComponentProps<TimerSemanticProps> {}

// Defaults from the editor schema. `countdown.countdownUrl` points at Unlayer's
// hosted countdown-image service, so a Timer renders a valid <img> even before
// an `endTime` is set.
const DEFAULT_VALUES = {
  ...TimerDefaults,
} as unknown as TimerValues;

/**
 * Timer - Renders a countdown timer as a plain, email-safe `<img>`.
 *
 * A first-class email-marketing element for sales, launches, and deadlines.
 * The countdown is a **server-rendered image** (typically an animated GIF), NOT
 * client-side JavaScript — so it survives Gmail, Outlook, and Apple Mail, which
 * all strip `<script>`. Supporting clients animate the GIF; the rest show the
 * frame the provider served.
 *
 * @example Bring your own countdown-image provider (Gmail/Outlook-safe)
 * ```tsx
 * // NiftyImages, Sendtric, MotionMail, etc. — the URL becomes the <img src>.
 * <Timer
 *   imageUrl="https://i.nifty.dev/abc123?end=2026-12-31T23:59:59Z&tz=America/Los_Angeles"
 *   alt="Sale ends December 31"
 *   href="https://example.com/sale"
 * />
 * ```
 *
 * @example Unlayer's hosted service (shorthand)
 * ```tsx
 * <Timer
 *   endTime="2026-12-31 23:59:59"
 *   timezone="America/Los_Angeles"
 *   digitColor="#111827"
 *   labelColor="#6b7280"
 * />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Timer values={{
 *   countdown: { countdownUrl: "https://…", endTime: "2026-12-31 23:59:59", showLabels: true },
 *   textAlign: "center",
 * }} />
 * ```
 */
const Timer = createItemComponent<TimerValues, TimerSemanticProps>({
  name: "Timer",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => {
    const { alt, href, imageUrl, width: widthProp, ...rest } = props;

    // Map the remaining flat props — the countdown.* fields (endTime, colors,
    // fonts, timezone, showLabels, countdownUrl, …) get grouped into `countdown`,
    // and top-level fields (textAlign, altText, action) stay flat.
    const base: Partial<TimerValues> = mapSemanticProps(
      rest as SemanticProps<TimerValues>,
      DEFAULT_VALUES,
      "Timer"
    );

    // imageUrl → countdown.countdownUrl. The exporter uses this verbatim as the
    // <img src>, so any provider's countdown image (NiftyImages, Sendtric, …)
    // renders as a plain, JS-free image that works in every email client.
    if (imageUrl !== undefined) {
      base.countdown = {
        ...(base.countdown as TimerValues["countdown"] | undefined),
        countdownUrl: imageUrl,
      } as TimerValues["countdown"];
    }

    // alt → altText
    if (alt !== undefined) {
      base.altText = alt;
    }

    // href → action (storage shape, so it round-trips through renderToJson into
    // the editor). Render-time normalization turns this into the exporter's
    // { url, target } shape.
    if (href !== undefined && base.action === undefined) {
      base.action = {
        name: "web",
        values: { href, target: "_blank" },
      } as TimerValues["action"];
    }

    // Display width → the `width` group. "100%" (or omitted) is responsive
    // (autoWidth:true); a number/px pins the timer (autoWidth:false).
    if (widthProp !== undefined) {
      const asString =
        typeof widthProp === "number" ? `${widthProp}px` : String(widthProp).trim();
      const isFull = asString === "100%" || asString === "";
      base.width = {
        autoWidth: isFull,
        width: isFull ? "100%" : asString,
      } as TimerValues["width"];
    }

    return base;
  },
  displayName: "Timer",
  exporters: TimerExporters,
});

export default Timer;
