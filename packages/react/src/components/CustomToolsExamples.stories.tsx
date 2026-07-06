import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { registerTool } from "../utils/register-tool";
import { renderToHtmlParts } from "../utils/render-to-html";
import Email from "./Email";
import Page from "./Page";
import Row from "./Row";
import Column from "./Column";
import Heading from "./Heading";

/**
 * Complex custom tools ported from the public examples gallery
 * (examples.unlayer.com): an interactive accordion and a tab strip. They
 * exercise the heavy parts of the contract — array item values, per-value
 * head CSS, head JS for interactivity, font_family widget defaults — and
 * add what the originals leave out: per-instance CSS scoping (via
 * `values._meta.htmlID`), idempotent JS (safe when the head collects it
 * once per instance), and email exporters (panels render expanded — email
 * has no JS).
 */

// ---------------------------------------------------------------------------
// Accordion — items array, head css keyed on values, head js for toggling.
// ---------------------------------------------------------------------------
const accordionTool = {
  name: "accordion",
  label: "Accordion",
  icon: "fa-bars",
  options: {
    menu: {
      title: "Accordion Items",
      options: {
        accordionRow: {
          label: "Accordion Row",
          defaultValue: {
            items: [
              { title: "How long does shipping take?", description: "Orders ship within 24 hours and arrive in 3–5 business days. Express options are available at checkout." },
              { title: "What is the return policy?", description: "Everything can come back within 30 days, no questions asked. Returns are free in the continental US." },
              { title: "Do you offer support?", description: "Real humans answer within a few hours, seven days a week." },
            ],
          },
          widget: "accordion_editor", // custom property editor — editor-only
        },
      },
    },
    colors: {
      title: "Colors",
      options: {
        titleTextColor: { label: "Title Text Color", defaultValue: "#212121", widget: "color_picker" },
        descriptionTextColor: { label: "Description Text Color", defaultValue: "#212121", widget: "color_picker" },
        titleBackgroundColor: { label: "Title Background Color", defaultValue: "#FAFAFA", widget: "color_picker" },
        descriptionBackgroundColor: { label: "Description Background Color", defaultValue: "#ffffff", widget: "color_picker" },
        titleHoverBackground: { label: "Title Hover Background Color", defaultValue: "#ECEDEF", widget: "color_picker" },
      },
    },
    fontFamily: {
      title: "Fonts",
      options: {
        fontFamily: {
          label: "Title Font",
          defaultValue: { label: "Arial", value: "arial,helvetica,sans-serif" },
          widget: "font_family",
        },
      },
    },
  },
  values: {},
  renderer: {
    exporters: {
      web: (v: any) => {
        const items = v.accordionRow?.items ?? [];
        if (items.length === 0) {
          return `<div style="padding:15px;border:2px dashed #ccc;background:#eee;color:#999;text-align:center;">Empty Accordion</div>`;
        }
        const rows = items.map((item: any) => `
          <div>
            <div class="ua-acc-title" onclick="window.__uaAccordionToggle(this)">
              <span>${item.title}</span><span class="ua-acc-icon" style="font-size:20px;">+</span>
            </div>
            <div class="ua-acc-panel"><p style="margin:0;">${item.description}</p></div>
          </div>`).join("");
        return `<div id="${v._meta.htmlID}-root">${rows}</div>`;
      },
      // Email adaptation: no JS in email clients — render every panel open.
      email: (v: any) => {
        const items = v.accordionRow?.items ?? [];
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
          .map((item: any) => `
            <tr><td style="background-color:${v.titleBackgroundColor};color:${v.titleTextColor};font-family:${v.fontFamily.value};font-weight:bold;padding:14px 20px;border-top:3px solid #ffffff;">${item.title}</td></tr>
            <tr><td style="background-color:${v.descriptionBackgroundColor};color:${v.descriptionTextColor};font-family:${v.fontFamily.value};padding:12px 20px;font-size:14px;line-height:1.5;">${item.description}</td></tr>`)
          .join("")}</table>`;
      },
    },
    head: {
      // Scoped per instance via _meta.htmlID — two accordions with different
      // colors never clash (the gallery original uses global class names).
      css: (v: any) => `
        #${v._meta.htmlID}-root .ua-acc-title {
          display: flex; justify-content: space-between; align-items: center;
          background-color: ${v.titleBackgroundColor};
          color: ${v.titleTextColor};
          font-family: ${v.fontFamily.value};
          cursor: pointer; padding: 15px 20px; margin-top: 3px;
          font-size: 15px; transition: 0.3s;
        }
        #${v._meta.htmlID}-root .ua-acc-title:hover { background-color: ${v.titleHoverBackground}; }
        #${v._meta.htmlID}-root .ua-acc-panel {
          display: none; padding: 12px 20px;
          background-color: ${v.descriptionBackgroundColor};
          color: ${v.descriptionTextColor};
          font-family: ${v.fontFamily.value};
          border-top: 1px solid #f2f2f2; font-size: 14px; line-height: 1.5;
        }`,
      // Idempotent assignment — collected once per instance, safe to repeat.
      js: () => `window.__uaAccordionToggle = window.__uaAccordionToggle || function (el) {
        var panel = el.nextElementSibling;
        var open = panel.style.display === "block";
        panel.style.display = open ? "none" : "block";
        el.querySelector(".ua-acc-icon").textContent = open ? "+" : "\\u2212";
      };`,
    },
  },
};

// ---------------------------------------------------------------------------
// Tabs — active-state styling, per-instance panel ids, container-scoped js.
// ---------------------------------------------------------------------------
const tabTool = {
  name: "tab_strip",
  label: "Tabs",
  icon: "fa-folder",
  options: {
    tabs: {
      title: "Tabs",
      options: {
        tabItem: {
          label: "Tabs",
          defaultValue: {
            items: [
              { title: "Overview", content: "A desk lamp with a machined aluminum base and warm, dimmable light — designed to disappear into your desk setup." },
              { title: "Specs", content: "2700–4000K adjustable temperature, 850 lumens, USB-C powered, 5-year warranty." },
              { title: "Reviews", content: "4.9/5 across 1,200 reviews. “The hinge alone is worth it.” — a very reasonable customer." },
            ],
          },
          widget: "tab_editor", // custom property editor — editor-only
        },
        titleTextColor: { label: "Tab Text", defaultValue: "#000000", widget: "color_picker" },
        contentTextColor: { label: "Content Text", defaultValue: "#000000", widget: "color_picker" },
        titleBackgroundColor: { label: "Tab Background", defaultValue: "#FDFDFD", widget: "color_picker" },
        contentBackgroundColor: { label: "Content Background", defaultValue: "#FDFDFD", widget: "color_picker" },
        activeTabColor: { label: "Active Tab", defaultValue: "#18B2B3", widget: "color_picker" },
        tabTitleFontFamily: { label: "Tab Font", defaultValue: { label: "Arial", value: "arial,helvetica,sans-serif" }, widget: "font_family" },
      },
    },
  },
  values: {},
  renderer: {
    exporters: {
      web: (v: any) => {
        const items = v.tabItem?.items ?? [];
        const id = v._meta.htmlID;
        if (items.length === 0) {
          return `<div style="padding:15px;border:2px dashed #ccc;background:#eee;color:#999;text-align:center;">No Tabs</div>`;
        }
        const buttons = items.map((item: any, i: number) =>
          `<button class="ua-tablink${i === 0 ? " active" : ""}" onclick="window.__uaOpenTab(this,'${id}-panel-${i}')">${item.title}</button>`).join("");
        const panels = items.map((item: any, i: number) =>
          `<div id="${id}-panel-${i}" class="ua-tabcontent" style="display:${i === 0 ? "block" : "none"};"><p style="margin:0;">${item.content}</p></div>`).join("");
        return `<div id="${id}-root" class="ua-tabs"><div class="ua-tabbar">${buttons}</div>${panels}</div>`;
      },
      // Email adaptation: tabs become stacked titled sections.
      email: (v: any) => {
        const items = v.tabItem?.items ?? [];
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
          .map((item: any) => `
            <tr><td style="font-family:${v.tabTitleFontFamily.value};color:${v.activeTabColor};font-weight:bold;font-size:15px;padding:16px 20px 6px;border-bottom:2px solid ${v.activeTabColor};">${item.title}</td></tr>
            <tr><td style="font-family:${v.tabTitleFontFamily.value};background-color:${v.contentBackgroundColor};color:${v.contentTextColor};padding:12px 20px 18px;font-size:14px;line-height:1.5;">${item.content}</td></tr>`)
          .join("")}</table>`;
      },
    },
    head: {
      css: (v: any) => `
        #${v._meta.htmlID}-root .ua-tabbar { display: flex; overflow: hidden; background-color: ${v.titleBackgroundColor}; }
        #${v._meta.htmlID}-root .ua-tablink {
          flex: 1; background-color: inherit; border: none; outline: none; cursor: pointer;
          padding: 14px 16px; transition: 0.3s; font-size: 15px;
          color: ${v.titleTextColor}; border-bottom: 2px solid #e3e3e3;
          font-family: ${v.tabTitleFontFamily.value};
        }
        #${v._meta.htmlID}-root .ua-tablink:hover { background-color: #eeeeee; }
        #${v._meta.htmlID}-root .ua-tablink.active { border-bottom: 2px solid ${v.activeTabColor}; color: ${v.activeTabColor}; }
        #${v._meta.htmlID}-root .ua-tabcontent {
          padding: 15px 20px; color: ${v.contentTextColor};
          background-color: ${v.contentBackgroundColor};
          font-family: ${v.tabTitleFontFamily.value}; font-size: 14px; line-height: 1.5;
        }`,
      // Scoped to the tool's own container — multiple tab strips coexist.
      js: () => `window.__uaOpenTab = window.__uaOpenTab || function (btn, panelId) {
        var root = btn.closest(".ua-tabs");
        root.querySelectorAll(".ua-tabcontent").forEach(function (p) { p.style.display = "none"; });
        root.querySelectorAll(".ua-tablink").forEach(function (b) { b.classList.remove("active"); });
        document.getElementById(panelId).style.display = "block";
        btn.classList.add("active");
      };`,
    },
  },
};


// ---------------------------------------------------------------------------
// Product library card — the gallery's flagship tool: nested image/link
// values, per-part colors, rich-text description, split price/CTA footer.
// ---------------------------------------------------------------------------
const productLibraryTool = {
  name: "product_library",
  label: "Product",
  icon: "fa-shopping-cart",
  options: {
    productContent: {
      title: "Product Content",
      options: {
        productImage: {
          label: "Product Image",
          defaultValue: { url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='340'><defs><linearGradient id='p' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%230ea5e9'/><stop offset='1' stop-color='%236366f1'/></linearGradient></defs><rect width='600' height='340' fill='url(%23p)'/><rect x='210' y='90' width='180' height='160' rx='14' fill='white' opacity='.92'/><rect x='240' y='120' width='120' height='14' rx='7' fill='%236366f1' opacity='.7'/><rect x='240' y='150' width='90' height='10' rx='5' fill='%2394a3b8'/><rect x='240' y='170' width='104' height='10' rx='5' fill='%2394a3b8'/><rect x='240' y='200' width='70' height='22' rx='11' fill='%230ea5e9'/></svg>" },
          widget: "image",
        },
        productTitle: { label: "Product Title", defaultValue: "Studio Headphones X2", widget: "text" },
        productTitleColor: { label: "Product Title Color", defaultValue: "#111827", widget: "color_picker" },
        productDescription: {
          label: "Product Description",
          defaultValue: "Closed-back studio headphones with a detachable cable, memory-foam pads, and a case that survives checked luggage.",
          widget: "rich_text",
        },
        productPrice: { label: "Product Price", defaultValue: "149.00", widget: "text" },
        productPriceColor: { label: "Price Color", defaultValue: "#111827", widget: "color_picker" },
        productPriceBackgroundColor: { label: "Price Background", defaultValue: "#f8fafc", widget: "color_picker" },
        productCTA: { label: "Button Name", defaultValue: "Buy Now", widget: "text" },
        productCTAColor: { label: "Button Color", defaultValue: "#0ea5e9", widget: "color_picker" },
        productCTATextColor: { label: "Button Text Color", defaultValue: "#ffffff", widget: "color_picker" },
        productCTAAction: {
          label: "Action Type",
          defaultValue: { name: "web", values: { href: "https://example.com/headphones", target: "_blank" } },
          widget: "link",
        },
      },
    },
  },
  values: {},
  renderer: {
    exporters: {
      web: (v: any) =>
        `<div style="position:relative;display:table;min-width:0;word-wrap:break-word;background-color:#fff;background-clip:border-box;border:1px solid rgba(0,0,0,.125);border-radius:6px;margin:auto;text-align:center;max-width:360px;overflow:hidden;">
          <img src="${v.productImage.url}" alt="${v.productTitle}" style="width:100%;object-fit:contain;display:block;"/>
          <div style="padding:0 16px 16px;text-align:left;">
            <h3 style="margin:12px 0;color:${v.productTitleColor};">${v.productTitle}</h3>
            <div style="color:#6b7280;font-size:14px;line-height:1.5;">${v.productDescription}</div>
          </div>
          <div style="display:flex;border-top:1px solid rgba(0,0,0,.125);align-items:center;font-weight:bold;background-color:${v.productPriceBackgroundColor};">
            <div style="width:50%;padding:12px;font-size:16px;line-height:1.5;color:${v.productPriceColor};">$${v.productPrice}</div>
            <a href="${v.productCTAAction.url}" target="${v.productCTAAction.target}" style="width:50%;text-decoration:none;background-color:${v.productCTAColor};color:${v.productCTATextColor};display:inline-block;font-weight:400;text-align:center;vertical-align:middle;padding:12px;font-size:16px;line-height:1.5;cursor:pointer;">${v.productCTA}</a>
          </div>
        </div>`,
      email: (v: any) =>
        `<table cellspacing="0" cellpadding="0" role="presentation" style="min-width:0;word-wrap:break-word;background-color:#fff;border:1px solid rgba(0,0,0,.125);border-radius:6px;margin:auto;text-align:center;max-width:360px;">
          <tbody>
            <tr><td width="100%"><img src="${v.productImage.url}" alt="${v.productTitle}" style="width:100%;object-fit:contain;border-top-left-radius:6px;border-top-right-radius:6px;"/></td></tr>
            <tr><td width="100%"><h3 style="text-align:left;margin:8px 0 12px 0;padding:0 16px;color:${v.productTitleColor};">${v.productTitle}</h3></td></tr>
            <tr><td width="100%"><div style="text-align:left;padding:0 16px;margin:0 0 12px 0;color:#6b7280;font-size:14px;line-height:1.5;">${v.productDescription}</div></td></tr>
            <tr><td width="100%">
              <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="border-top:1px solid rgba(0,0,0,.125);font-weight:bold;background-color:${v.productPriceBackgroundColor};">
                <tbody><tr>
                  <td width="50%" style="text-align:center;padding:12px;font-size:16px;line-height:1.5;"><div style="color:${v.productPriceColor};">$${v.productPrice}</div></td>
                  <td width="50%" style="background-color:${v.productCTAColor};text-align:center;vertical-align:middle;padding:12px 0;font-size:16px;line-height:1.5;"><a href="${v.productCTAAction.url}" target="${v.productCTAAction.target}" style="width:100%;color:${v.productCTATextColor};text-decoration:none;">${v.productCTA}</a></td>
                </tr></tbody>
              </table>
            </td></tr>
          </tbody>
        </table>`,
    },
  },
};

// ---------------------------------------------------------------------------
// QR code — in the Builder a property-editor widget generates the data URL
// client-side; from code any generator works (here a hosted generator URL).
// ---------------------------------------------------------------------------
const qrTool = {
  name: "qr_tool",
  label: "QR Code",
  icon: "fa-qrcode",
  options: {
    qr: {
      title: "QR Content",
      options: {
        qr: {
          label: "QR URL",
          defaultValue: {
            srcUrl: "https://unlayer.com",
            qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Funlayer.com",
          },
          widget: "qr_generator", // custom property editor — editor-only
        },
        width: { label: "Width", defaultValue: "50", widget: "counter" },
        alignment: { label: "Alignment", defaultValue: "center", widget: "alignment" },
      },
    },
  },
  values: {},
  renderer: {
    exporters: {
      web: (v: any) =>
        `<div class="qr-tool" style="margin:auto;text-align:${v.alignment};">${
          v.qr?.qrCode
            ? `<img src="${v.qr.qrCode}" alt="QR code for ${v.qr.srcUrl}" style="width:${v.width}%;"/>`
            : `<h3>Enter url and QR Code will be generated here</h3>`
        }</div>`,
      // QR in email is a prime use case (tickets, menus) — same markup works
      email: (v: any) =>
        `<div style="margin:auto;text-align:${v.alignment};">${
          v.qr?.qrCode
            ? `<img src="${v.qr.qrCode}" alt="QR code for ${v.qr.srcUrl}" width="${Math.round(3 * Number(v.width))}" style="width:${v.width}%;"/>`
            : ""
        }</div>`,
    },
  },
};

// ---------------------------------------------------------------------------
// Map — the gallery original builds a Google Static Maps URL (with an API
// key). This port stays keyless: the exporter computes OpenStreetMap tile
// coordinates from lat/lon/zoom — real exporter logic, deterministic output.
// ---------------------------------------------------------------------------
const mapTool = {
  name: "map_tool",
  label: "Map",
  icon: "fa-map",
  options: {
    location: {
      title: "Location",
      options: {
        latitude: { label: "Latitude", widget: "text", defaultValue: "37.785343" },
        longitude: { label: "Longitude", widget: "text", defaultValue: "-122.3978088" },
        caption: { label: "Caption", widget: "text", defaultValue: "Mission St, San Francisco" },
      },
    },
    zoom: {
      title: "Zoom level",
      options: { zoom: { label: "Zoom Level", widget: "counter", defaultValue: "15" } },
    },
  },
  values: {},
  renderer: {
    exporters: {
      // A table of OSM tiles works in web AND email (remote images), so one
      // template serves both; the marker overlay is web-only (absolute css).
      web: (v: any) => mapMarkup(v, true),
      email: (v: any) => mapMarkup(v, false),
    },
  },
};

/** Slippy-map tile math: 3x2 tile grid around the point, plus marker. */
function mapMarkup(v: any, withMarker: boolean): string {
  const lat = parseFloat(v.latitude);
  const lon = parseFloat(v.longitude);
  const z = parseInt(v.zoom, 10);
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const latR = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n;
  const x0 = Math.floor(x) - 1;
  const y0 = Math.floor(y) - (y % 1 < 0.5 ? 1 : 0);
  const rows = [0, 1].map((dy) =>
    `<tr>${[0, 1, 2].map((dx) =>
      `<td style="padding:0;line-height:0;"><img src="https://tile.openstreetmap.org/${z}/${x0 + dx}/${y0 + dy}.png" width="200" height="200" alt="" style="display:block;width:100%;"/></td>`).join("")}</tr>`).join("");
  const markerLeft = (((x - x0) / 3) * 100).toFixed(2);
  const markerTop = (((y - y0) / 2) * 100).toFixed(2);
  const marker = withMarker
    ? `<div style="position:absolute;left:${markerLeft}%;top:${markerTop}%;transform:translate(-50%,-100%);font-size:30px;line-height:1;">&#128205;</div>`
    : "";
  return `<div style="max-width:600px;margin:auto;${withMarker ? "position:relative;" : ""}border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>${marker}
  </div>
  <div style="text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#6b7280;padding-top:8px;">${v.caption} &middot; &copy; OpenStreetMap contributors</div>`;
}

const ProductLibrary = registerTool(productLibraryTool as any);
const QrCode = registerTool(qrTool as any);
const OsmMap = registerTool(mapTool as any);

const Accordion = registerTool(accordionTool as any);
const Tabs = registerTool(tabTool as any);

/**
 * Head-dependent tools need their head css/js to display properly, and
 * Storybook renders bare components. This helper renders the tree through
 * renderToHtmlParts — exactly what an app ships — and mounts head + body,
 * executing the collected scripts so interactivity works in the canvas.
 */
const LiveParts: React.FC<{ tree: React.ReactElement }> = ({ tree }) => {
  const { head, body } = React.useMemo(() => renderToHtmlParts(tree), [tree]);
  const css = [...head.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  const js = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
  React.useEffect(() => {
    if (!js) return;
    const el = document.createElement("script");
    el.textContent = js;
    document.body.appendChild(el);
    return () => el.remove();
  }, [js]);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: body }} />
    </>
  );
};

const meta: Meta = {
  title: "Custom Tools/Examples Gallery",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
Complex custom tools ported from the public examples gallery
([examples.unlayer.com](https://examples.unlayer.com)) — an interactive
**accordion** and a **tab strip**. Beyond the basics, these exercise:

- **Array item values** managed by a custom property editor in the Builder
- **Head CSS keyed on values** — colors and fonts flow into the stylesheet,
  scoped per instance via \`values._meta.htmlID\`
- **Head JS** for interactivity (idempotent, instance-safe)
- **Email adaptations** — no JS in email clients, so panels render expanded
  and tabs become stacked sections

The stories render through \`renderToHtmlParts\` (head + body), exactly what
an app ships — that's also why the interactivity works in this canvas.
        `,
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const sourceFor = (code: string) => ({
  docs: { source: { language: "tsx" as const, code } },
});

/** Interactive accordion — click a title to toggle its panel. */
export const AccordionTool: Story = {
  parameters: sourceFor(`const accordionTool = {
  name: "accordion",
  options: {
    menu: { title: "Accordion Items", options: {
      accordionRow: { defaultValue: { items: [{ title, description }, …] }, widget: "accordion_editor" },
    }},
    colors: { title: "Colors", options: { titleTextColor, titleBackgroundColor, titleHoverBackground, … }},
    fontFamily: { title: "Fonts", options: { fontFamily: { defaultValue: { label: "Arial", value: "arial,…" }, widget: "font_family" }}},
  },
  values: {},
  renderer: {
    exporters: {
      web:   (v) => /* clickable titles + hidden panels */,
      email: (v) => /* every panel rendered open — email has no JS */,
    },
    head: {
      css: (v) => \\\`#\\\${v._meta.htmlID}-root .ua-acc-title { background: \\\${v.titleBackgroundColor}; … }\\\`,
      js:  () => \\\`window.__uaAccordionToggle = window.__uaAccordionToggle || function (el) { … }\\\`,
    },
  },
};

const Accordion = registerTool(accordionTool);

<Page><Row><Column><Accordion /></Column></Row></Page>`),
  render: () => (
    <LiveParts
      tree={
        <Page backgroundColor="#f8fafc" contentWidth="600px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Heading fontSize="20px" fontWeight={700} containerPadding="24px 20px 6px">
                Frequently asked questions
              </Heading>
              <Accordion containerPadding="10px 20px 28px" />
            </Column>
          </Row>
        </Page>
      }
    />
  ),
};

/** Interactive tabs — per-instance panel ids, container-scoped switching. */
export const TabsTool: Story = {
  parameters: sourceFor(`const tabTool = {
  name: "tab_strip",
  options: { tabs: { title: "Tabs", options: {
    tabItem: { defaultValue: { items: [{ title, content }, …] }, widget: "tab_editor" },
    activeTabColor: { defaultValue: "#18B2B3", widget: "color_picker" },
    tabTitleFontFamily: { defaultValue: { label: "Arial", value: "arial,…" }, widget: "font_family" },
    /* + text/background colors */
  }}},
  values: {},
  renderer: {
    exporters: {
      web:   (v) => /* tab bar + panels with per-instance ids (\\\${v._meta.htmlID}-panel-N) */,
      email: (v) => /* stacked titled sections */,
    },
    head: {
      css: (v) => /* scoped: #\\\${v._meta.htmlID}-root .ua-tablink.active { color: \\\${v.activeTabColor}; } */,
      js:  () => /* window.__uaOpenTab — switches panels within the tool's own container */,
    },
  },
};

const Tabs = registerTool(tabTool);

<Page><Row><Column><Tabs /></Column></Row></Page>`),
  render: () => (
    <LiveParts
      tree={
        <Page backgroundColor="#f8fafc" contentWidth="600px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Tabs containerPadding="24px 20px 30px" />
            </Column>
          </Row>
        </Page>
      }
    />
  ),
};

/** Two instances with different colors — per-instance scoping means no clashes. */
export const TwoIndependentAccordions: Story = {
  parameters: sourceFor(`// Same tool, two instances, different values — the head css is scoped
// per instance (via values._meta.htmlID), so styles never bleed across.
<Page><Row><Column>
  <Accordion />
  <Accordion
    titleBackgroundColor="#111827"
    titleTextColor="#f9fafb"
    titleHoverBackground="#1f2937"
    descriptionBackgroundColor="#f9fafb"
  />
</Column></Row></Page>`),
  render: () => (
    <LiveParts
      tree={
        <Page backgroundColor="#f8fafc" contentWidth="600px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Accordion containerPadding="20px 20px 8px" />
              <Accordion
                titleBackgroundColor="#111827"
                titleTextColor="#f9fafb"
                titleHoverBackground="#1f2937"
                descriptionBackgroundColor="#f9fafb"
                containerPadding="8px 20px 28px"
              />
            </Column>
          </Row>
        </Page>
      }
    />
  ),
};

/** The email renders: accordion panels expanded, tabs as stacked sections. */
export const EmailAdaptations: Story = {
  parameters: sourceFor(`// Email clients strip JS, so the email exporters adapt the interaction
// away: accordion panels render expanded; tabs become stacked sections.
renderToHtml(
  <Email><Row><Column>
    <Accordion />
    <Tabs />
  </Column></Row></Email>
);`),
  render: () => (
    <LiveParts
      tree={
        <Email backgroundColor="#f8fafc" contentWidth="600px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Heading fontSize="18px" fontWeight={700} containerPadding="24px 20px 4px">
                As an email — no JS, everything visible
              </Heading>
              <Accordion containerPadding="12px 20px" />
              <Tabs containerPadding="6px 20px 28px" />
            </Column>
          </Row>
        </Email>
      }
    />
  ),
};

/** The gallery's product card: image, rich description, price/CTA footer. */
export const ProductLibraryTool: Story = {
  parameters: sourceFor(`const productLibraryTool = {
  name: "product_library",
  options: { productContent: { title: "Product Content", options: {
    productImage:      { defaultValue: { url: "https://…" }, widget: "image" },
    productTitle:      { defaultValue: "Studio Headphones X2", widget: "text" },
    productTitleColor: { defaultValue: "#111827", widget: "color_picker" },
    productDescription:{ defaultValue: "…", widget: "rich_text" },
    productPrice:      { defaultValue: "149.00", widget: "text" },
    productPriceBackgroundColor: { defaultValue: "#f8fafc", widget: "color_picker" },
    productCTA:        { defaultValue: "Buy Now", widget: "text" },
    productCTAColor:   { defaultValue: "#0ea5e9", widget: "color_picker" },
    productCTAAction:  { defaultValue: { name: "web", values: { href: "…", target: "_blank" } }, widget: "link" },
  }}},
  values: {},
  renderer: { exporters: {
    web:   (v) => { /* card div: image, title, description, split price/CTA footer;
                       the link arrives in render shape: v.productCTAAction.url */ },
    email: (v) => { /* the same card as nested tables */ },
  }},
};

const ProductLibrary = registerTool(productLibraryTool);

<Email><Row><Column>
  <ProductLibrary productPrice="129.00" productCTA="Preorder" />
</Column></Row></Email>`),
  render: () => (
    <LiveParts
      tree={
        <Email backgroundColor="#f1f5f9" contentWidth="600px">
          <Row padding="14px 0px">
            <Column>
              <ProductLibrary containerPadding="24px 20px" />
            </Column>
          </Row>
        </Email>
      }
    />
  ),
};

/** QR code — the Builder generates the code via a property-editor widget. */
export const QrCodeTool: Story = {
  parameters: sourceFor(`const qrTool = {
  name: "qr_tool",
  options: { qr: { title: "QR Content", options: {
    // In the Builder, a custom property editor generates qr.qrCode
    // client-side as the user types; from code, any generator works.
    qr:        { defaultValue: { srcUrl: "https://unlayer.com", qrCode: "…" }, widget: "qr_generator" },
    width:     { defaultValue: "50", widget: "counter" },
    alignment: { defaultValue: "center", widget: "alignment" },
  }}},
  values: {},
  renderer: { exporters: {
    web:   (v) => { /* <img src={v.qr.qrCode} style=width:{v.width}% /> */ },
    email: (v) => { /* same — QR in email is the prime use case (tickets, menus) */ },
  }},
};

const QrCode = registerTool(qrTool);

<Email><Row><Column><QrCode width="35" /></Column></Row></Email>`),
  render: () => (
    <LiveParts
      tree={
        <Email backgroundColor="#ffffff" contentWidth="600px">
          <Row>
            <Column>
              <Heading fontSize="18px" fontWeight={700} textAlign="center" containerPadding="26px 20px 2px">
                Scan for your ticket
              </Heading>
              <QrCode width="35" containerPadding="8px 20px 30px" />
            </Column>
          </Row>
        </Email>
      }
    />
  ),
};

/** Map — keyless OpenStreetMap tiles computed from lat/lon/zoom in the exporter. */
export const MapTool: Story = {
  parameters: sourceFor(`// The gallery original builds a Google Static Maps URL (needs an API
// key). This port computes OpenStreetMap tile coordinates instead —
// keyless, and the same table-of-tiles markup works in web AND email.
const mapTool = {
  name: "map_tool",
  options: {
    location: { title: "Location", options: {
      latitude:  { defaultValue: "37.785343",    widget: "text" },
      longitude: { defaultValue: "-122.3978088", widget: "text" },
      caption:   { defaultValue: "Mission St, San Francisco", widget: "text" },
    }},
    zoom: { title: "Zoom level", options: { zoom: { defaultValue: "15", widget: "counter" } } },
  },
  values: {},
  renderer: { exporters: {
    web:   (v) => mapMarkup(v, true),   // + marker overlay
    email: (v) => mapMarkup(v, false),  // tiles table renders in email too
  }},
};

// slippy-map math in the exporter: lat/lon/zoom -> tile grid + marker offset
// x = ((lon + 180) / 360) * 2^z
// y = ((1 - ln(tan(latR) + sec(latR)) / PI) / 2) * 2^z

<Page><Row><Column><OsmMap zoom="15" /></Column></Row></Page>`),
  render: () => (
    <LiveParts
      tree={
        <Page backgroundColor="#f8fafc" contentWidth="640px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Heading fontSize="20px" fontWeight={700} containerPadding="24px 20px 4px">
                Find us here
              </Heading>
              <OsmMap containerPadding="12px 20px 28px" />
            </Column>
          </Row>
        </Page>
      }
    />
  ),
};
