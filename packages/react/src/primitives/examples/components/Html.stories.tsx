import type { Meta } from "@storybook/react-vite";
import { args, argTypes, asEmailAndPage, type Args } from "../../../stories/SideBySide";
import { Heading, Html, Section } from "../../index";
import { FONT, INK } from "./shared";

const meta: Meta<Args> = {
  title: "Components/Html",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Markup written as it is, for what no component says: nothing in it is checked or escaped, so only markup you trust. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it.",
      },
    },
  },
};
export default meta;

const story = asEmailAndPage;

/** Nothing around it styles what an email's markup holds, so the markup says its own font. */
const TYPE = "font-family:Arial,Helvetica,sans-serif;color:#1f2933;line-height:1.5";

/** `Html` is markup written as it is, for what no component says. */
export const YourOwnHtml = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Html html={`<div style="${TYPE};padding:12px;border:1px dashed #9AA5B1;font-size:14px">Written as it is, <b>nothing in it checked</b>.</div>`} />
    </Section>
  </Root>
));

/** A card with a gradient and a shadow, which `style` doesn't have. */
export const GradientCard = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Html
        html={`<div style="${TYPE};padding:32px;border-radius:16px;color:#ffffff;text-align:center;background:linear-gradient(135deg,#0f766e 0%,#334e68 100%);box-shadow:0 10px 25px rgba(15,118,110,.3)">
  <h2 style="margin:0 0 12px;font-size:24px">A card of your own</h2>
  <p style="margin:0;line-height:1.6;opacity:.9">A gradient and a shadow, written as CSS.</p>
</div>`}
      />
    </Section>
  </Root>
));

const bar = (label: string, percent: number, color: string) => `<div style="margin-bottom:16px">
  <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px"><span>${label}</span><span style="color:#616e7c">${percent}%</span></div>
  <div style="height:8px;overflow:hidden;border-radius:10px;background:#e4e7eb"><div style="width:${percent}%;height:100%;border-radius:10px;background:${color}"></div></div>
</div>`;

/** Progress bars, next to a heading that's a component: `Html` is one block among others. */
export const ProgressBars = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24, gap: 16 }}>
      <Heading level={3} style={{ fontSize: 18 }}>This week's goals</Heading>
      <Html html={`<div style="${TYPE}">${bar("Orders", 90, "#0f766e") + bar("Signups", 75, "#334e68") + bar("Reviews", 40, "#b7791f")}</div>`} />
    </Section>
  </Root>
));

/** A table of figures in markup every mail client reads: `text` says what it reads as in the plain-text version. */
export const PlainTextVersion = story((Root) => (
  <Root width={560} style={{ color: INK, fontFamily: FONT }}>
    <Section style={{ padding: 24 }}>
      <Html
        text="12k subscribers, 48% opened, 9% clicked"
        html={`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${TYPE};text-align:center">
  <tr>
    <td style="padding:16px;background:#f5f7fa"><div style="font-size:28px;font-weight:bold;color:#0f766e">12k</div><div style="font-size:12px;color:#616e7c">subscribers</div></td>
    <td style="padding:16px"><div style="font-size:28px;font-weight:bold;color:#0f766e">48%</div><div style="font-size:12px;color:#616e7c">opened</div></td>
    <td style="padding:16px;background:#f5f7fa"><div style="font-size:28px;font-weight:bold;color:#0f766e">9%</div><div style="font-size:12px;color:#616e7c">clicked</div></td>
  </tr>
</table>`}
      />
    </Section>
  </Root>
));
