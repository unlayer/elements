import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { registerElementsTool } from "../utils/register-tool";
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

const Accordion = registerElementsTool(accordionTool as any);
const Tabs = registerElementsTool(tabTool as any);

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

const Accordion = registerElementsTool(accordionTool);

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

const Tabs = registerElementsTool(tabTool);

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
