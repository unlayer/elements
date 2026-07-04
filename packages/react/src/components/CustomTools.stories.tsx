import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { registerTool } from "../utils/register-tool";
import Email from "./Email";
import Row from "./Row";
import Column from "./Column";
import Heading from "./Heading";
import Paragraph from "./Paragraph";

/**
 * Custom tools rendered from code. The definitions below use the same
 * config shape as the editor's `unlayer.registerTool` — one definition
 * powers both the Builder (Viewer, property panel) and Elements
 * (renderer.exporters, renderer.head).
 */

// ---------------------------------------------------------------------------
// Countdown — the canonical custom-tool example, styled for real use.
// Defaults live on the option widgets (the common real-world shape).
// ---------------------------------------------------------------------------
const countdownTool = {
  name: "countdown",
  label: "Countdown",
  icon: "fa-clock",
  options: {
    timer: {
      title: "Timer",
      options: {
        headline: { label: "Headline", defaultValue: "Offer ends in", widget: "text" },
        days: { label: "Days", defaultValue: "02", widget: "text" },
        hours: { label: "Hours", defaultValue: "11", widget: "text" },
        minutes: { label: "Minutes", defaultValue: "45", widget: "text" },
        accent: { label: "Accent", defaultValue: "#e11d48", widget: "color_picker" },
      },
    },
  },
  values: {},
  renderer: {
    exporters: {
      web: (v: any) => {
        const cell = (num: string, label: string) =>
          `<div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:14px 0;width:76px;text-align:center;">
             <div style="font-size:30px;font-weight:800;color:#ffffff;font-variant-numeric:tabular-nums;">${num}</div>
             <div style="font-size:11px;letter-spacing:2px;color:#9ca3af;padding-top:2px;">${label}</div>
           </div>`;
        return `<div style="font-family:'Segoe UI',system-ui,sans-serif;text-align:center;">
          <div style="font-size:13px;letter-spacing:3px;font-weight:700;color:${v.accent};padding-bottom:12px;">${String(v.headline).toUpperCase()}</div>
          <div style="display:flex;gap:10px;justify-content:center;">${cell(v.days, "DAYS")}${cell(v.hours, "HOURS")}${cell(v.minutes, "MINS")}</div>
        </div>`;
      },
      email: (v: any) => {
        const cell = (num: string, label: string) =>
          `<td align="center" style="background-color:#111827;border-radius:10px;padding:12px 16px;">
             <div style="font-family:Arial,sans-serif;font-size:26px;font-weight:800;color:#ffffff;">${num}</div>
             <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#9ca3af;">${label}</div>
           </td>`;
        return `<table role="presentation" cellpadding="0" cellspacing="6" align="center" style="margin:0 auto;">
          <tr><td colspan="3" align="center" style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;font-weight:bold;color:${v.accent};padding-bottom:8px;">${String(v.headline).toUpperCase()}</td></tr>
          <tr>${cell(v.days, "DAYS")}${cell(v.hours, "HOURS")}${cell(v.minutes, "MINS")}</tr>
        </table>`;
      },
    },
    head: {
      css: () => ".countdown-digits { font-variant-numeric: tabular-nums; }",
    },
  },
};

// ---------------------------------------------------------------------------
// Product card — nested object values (image, link action), rich defaults.
// ---------------------------------------------------------------------------
const productTool = {
  name: "product_card",
  label: "Product",
  icon: "fa-tag",
  options: {
    product: {
      title: "Product",
      options: {
        image: {
          label: "Image",
          defaultValue: {
            // single-quoted SVG attributes — double quotes would terminate
            // the src="..." attribute this URI is interpolated into
            url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%236366f1'/><stop offset='1' stop-color='%23a855f7'/></linearGradient></defs><rect width='600' height='300' fill='url(%23g)'/><circle cx='300' cy='150' r='70' fill='white' opacity='.25'/><circle cx='300' cy='150' r='44' fill='white' opacity='.5'/></svg>",
          },
          widget: "image",
        },
        title: { label: "Title", defaultValue: "Aurora Desk Lamp", widget: "text" },
        description: { label: "Description", defaultValue: "Warm, dimmable light with a machined aluminum base.", widget: "rich_text" },
        price: { label: "Price", defaultValue: "89", widget: "text" },
        cta: { label: "Button", defaultValue: "Add to cart", widget: "text" },
        action: {
          label: "Link",
          defaultValue: { name: "web", values: { href: "https://example.com/lamp", target: "_blank" } },
          widget: "link",
        },
      },
    },
  },
  values: {},
  renderer: {
    exporters: {
      web: (v: any) =>
        `<div style="max-width:340px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 14px 34px rgba(17,24,39,.10);">
           <img src="${v.image.url}" alt="${v.title}" style="display:block;width:100%;height:170px;object-fit:cover;"/>
           <div style="padding:18px 20px 20px;">
             <div style="display:flex;justify-content:space-between;align-items:baseline;">
               <div style="font-size:18px;font-weight:700;color:#111827;">${v.title}</div>
               <div style="font-size:18px;font-weight:800;color:#6366f1;">$${v.price}</div>
             </div>
             <div style="font-size:14px;line-height:1.55;color:#6b7280;padding:8px 0 16px;">${v.description}</div>
             <a href="${v.action.url}" target="${v.action.target}" style="display:block;text-align:center;background:#6366f1;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:10px;padding:12px 0;">${v.cta}</a>
           </div>
         </div>`,
      email: (v: any) =>
        `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:340px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:14px;">
           <tr><td><img src="${v.image.url}" alt="${v.title}" width="338" style="display:block;width:100%;border-radius:14px 14px 0 0;"/></td></tr>
           <tr><td style="padding:16px 18px 6px;font-family:Arial,sans-serif;"><span style="font-size:17px;font-weight:bold;color:#111827;">${v.title}</span>
             <span style="font-size:17px;font-weight:bold;color:#6366f1;float:right;">$${v.price}</span></td></tr>
           <tr><td style="padding:0 18px 14px;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#6b7280;">${v.description}</td></tr>
           <tr><td style="padding:0 18px 18px;"><a href="${v.action.url}" target="${v.action.target}" style="display:block;text-align:center;background-color:#6366f1;color:#ffffff;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;text-decoration:none;border-radius:8px;padding:12px 0;">${v.cta}</a></td></tr>
         </table>`,
    },
  },
};

const Countdown = registerTool(countdownTool as any);
const ProductCard = registerTool(productTool as any);

const meta: Meta = {
  title: "Custom Tools/Registered Tools",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
Custom tools created with \`registerElementsTool\` — the same tool definition
object embedders write for the editor's \`unlayer.registerTool\` ([Custom Tools
docs](https://docs.unlayer.com/builder/tools/custom)). Elements uses the
\`renderer.exporters\`/\`renderer.head\` half; the editor uses the Viewer and
property panel half. \`renderToJson\` emits \`{ type: "custom", slug, values }\`,
so these designs open in the Builder as the real tool.

\`\`\`tsx
const Countdown = registerTool(countdownTool);

<Email><Row><Column>
  <Countdown headline="Offer ends in" days="02" accent="#e11d48" />
</Column></Row></Email>
\`\`\`
        `,
      },
    },
  },
};
export default meta;
type Story = StoryObj;

/** The countdown tool with its option-widget defaults. */
export const CountdownTool: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: `// The same definition you register in the editor (unlayer.registerTool)
const countdownTool = {
  name: "countdown",
  options: { timer: { title: "Timer", options: {
    headline: { label: "Headline", defaultValue: "Offer ends in", widget: "text" },
    days:     { label: "Days",     defaultValue: "02", widget: "text" },
    hours:    { label: "Hours",    defaultValue: "11", widget: "text" },
    minutes:  { label: "Minutes",  defaultValue: "45", widget: "text" },
    accent:   { label: "Accent",   defaultValue: "#e11d48", widget: "color_picker" },
  }}},
  values: {},
  renderer: {
    exporters: {
      web:   (v) => \`<div>…\${v.headline} \${v.days}:\${v.hours}:\${v.minutes}…</div>\`,
      email: (v) => \`<table role="presentation">…</table>\`,
    },
    head: { css: () => ".countdown-digits { font-variant-numeric: tabular-nums; }" },
  },
};

const Countdown = registerTool(countdownTool);

// Option-widget defaults render without any props:
<Email backgroundColor="#f8fafc" contentWidth="560px">
  <Row backgroundColor="#ffffff"><Column>
    <Countdown containerPadding="30px 20px" />
  </Column></Row>
</Email>`,
      },
    },
  },
  render: () => (
    <Email backgroundColor="#f8fafc" contentWidth="560px">
      <Row backgroundColor="#ffffff" padding="10px 0px">
        <Column>
          <Countdown containerPadding="30px 20px" />
        </Column>
      </Row>
    </Email>
  ),
};

/** Flat props override the tool's option defaults, like any component. */
export const CountdownCustomized: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: `// Flat props override the tool's option defaults, like any component
<Email backgroundColor="#0f172a" contentWidth="560px">
  <Row><Column>
    <Countdown
      headline="Kickoff in"
      days="00" hours="04" minutes="07"
      accent="#f6d365"
      containerPadding="34px 20px"
    />
  </Column></Row>
</Email>`,
      },
    },
  },
  render: () => (
    <Email backgroundColor="#0f172a" contentWidth="560px">
      <Row padding="10px 0px">
        <Column>
          <Countdown headline="Kickoff in" days="00" hours="04" minutes="07" accent="#f6d365" containerPadding="34px 20px" />
        </Column>
      </Row>
    </Email>
  ),
};

/** A product card tool with nested object values (image, link action). */
export const ProductCardTool: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: `// Nested object values (image, link action) work like the editor:
// link-widget values reach exporters in render shape ({ url, target })
const productTool = {
  name: "product_card",
  options: { product: { title: "Product", options: {
    image:  { label: "Image",  defaultValue: { url: "https://…" }, widget: "image" },
    title:  { label: "Title",  defaultValue: "Aurora Desk Lamp", widget: "text" },
    price:  { label: "Price",  defaultValue: "89", widget: "text" },
    cta:    { label: "Button", defaultValue: "Add to cart", widget: "text" },
    action: { label: "Link",   defaultValue: { name: "web", values: { href: "https://…", target: "_blank" } }, widget: "link" },
  }}},
  values: {},
  renderer: { exporters: {
    web:   (v) => \`…<a href="\${v.action.url}" target="\${v.action.target}">\${v.cta}</a>…\`,
    email: (v) => \`<table role="presentation">…</table>\`,
  }},
};

const ProductCard = registerTool(productTool);

<Email backgroundColor="#f1f5f9" contentWidth="560px">
  <Row><Column>
    <ProductCard containerPadding="24px 20px" />
  </Column></Row>
</Email>`,
      },
    },
  },
  render: () => (
    <Email backgroundColor="#f1f5f9" contentWidth="560px">
      <Row padding="14px 0px">
        <Column>
          <ProductCard containerPadding="24px 20px" />
        </Column>
      </Row>
    </Email>
  ),
};

/** Custom tools compose with built-ins inside a full design. */
export const InsideAFullDesign: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: `// Custom tools compose with built-ins; renderToJson emits
// { type: "custom", slug, values } so this opens in the Builder
<Email backgroundColor="#f8fafc" contentWidth="560px">
  <Row backgroundColor="#ffffff"><Column>
    <Heading textAlign="center" fontSize="24px" fontWeight={700}>Summer drop is live</Heading>
    <Paragraph textAlign="center" color="#6b7280">
      One design, two runtimes — this card and timer are custom tools.
    </Paragraph>
    <ProductCard price="79" cta="Get the launch price" containerPadding="14px 20px" />
    <Countdown headline="Launch price ends in" containerPadding="18px 20px 34px" />
  </Column></Row>
</Email>`,
      },
    },
  },
  render: () => (
    <Email backgroundColor="#f8fafc" contentWidth="560px">
      <Row backgroundColor="#ffffff" padding="8px 0px">
        <Column>
          <Heading textAlign="center" fontSize="24px" fontWeight={700} containerPadding="30px 24px 4px">
            Summer drop is live
          </Heading>
          <Paragraph textAlign="center" color="#6b7280" containerPadding="0px 32px 8px">
            One design, two runtimes — this card and timer are custom tools.
          </Paragraph>
          <ProductCard price="79" cta="Get the launch price" containerPadding="14px 20px" />
          <Countdown headline="Launch price ends in" containerPadding="18px 20px 34px" />
        </Column>
      </Row>
    </Email>
  ),
};
