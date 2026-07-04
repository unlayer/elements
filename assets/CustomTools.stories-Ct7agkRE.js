import{j as t}from"./jsx-runtime-D2ZJC-wS.js";import{r as f}from"./register-tool-B96bbTrj.js";import{E as d}from"./Email-Dh664Jm4.js";import{R as l,C as s}from"./Column-CMGpN7Qx.js";import{H as m}from"./Heading-CTJfljQV.js";import{P as x}from"./Paragraph-CwLmAEfb.js";import"./iframe-DkpgvZ61.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-DV90Kf58.js";import"./Body-ByfNbf5d.js";const h={name:"countdown",options:{timer:{title:"Timer",options:{headline:{label:"Headline",defaultValue:"Offer ends in",widget:"text"},days:{label:"Days",defaultValue:"02",widget:"text"},hours:{label:"Hours",defaultValue:"11",widget:"text"},minutes:{label:"Minutes",defaultValue:"45",widget:"text"},accent:{label:"Accent",defaultValue:"#e11d48",widget:"color_picker"}}}},values:{},renderer:{exporters:{web:e=>{const n=(c,p)=>`<div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:14px 0;width:76px;text-align:center;">
             <div style="font-size:30px;font-weight:800;color:#ffffff;font-variant-numeric:tabular-nums;">${c}</div>
             <div style="font-size:11px;letter-spacing:2px;color:#9ca3af;padding-top:2px;">${p}</div>
           </div>`;return`<div style="font-family:'Segoe UI',system-ui,sans-serif;text-align:center;">
          <div style="font-size:13px;letter-spacing:3px;font-weight:700;color:${e.accent};padding-bottom:12px;">${String(e.headline).toUpperCase()}</div>
          <div style="display:flex;gap:10px;justify-content:center;">${n(e.days,"DAYS")}${n(e.hours,"HOURS")}${n(e.minutes,"MINS")}</div>
        </div>`},email:e=>{const n=(c,p)=>`<td align="center" style="background-color:#111827;border-radius:10px;padding:12px 16px;">
             <div style="font-family:Arial,sans-serif;font-size:26px;font-weight:800;color:#ffffff;">${c}</div>
             <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#9ca3af;">${p}</div>
           </td>`;return`<table role="presentation" cellpadding="0" cellspacing="6" align="center" style="margin:0 auto;">
          <tr><td colspan="3" align="center" style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;font-weight:bold;color:${e.accent};padding-bottom:8px;">${String(e.headline).toUpperCase()}</td></tr>
          <tr>${n(e.days,"DAYS")}${n(e.hours,"HOURS")}${n(e.minutes,"MINS")}</tr>
        </table>`}},head:{css:()=>".countdown-digits { font-variant-numeric: tabular-nums; }"}}},w={name:"product_card",options:{product:{title:"Product",options:{image:{label:"Image",defaultValue:{url:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%236366f1'/><stop offset='1' stop-color='%23a855f7'/></linearGradient></defs><rect width='600' height='300' fill='url(%23g)'/><circle cx='300' cy='150' r='70' fill='white' opacity='.25'/><circle cx='300' cy='150' r='44' fill='white' opacity='.5'/></svg>"},widget:"image"},title:{label:"Title",defaultValue:"Aurora Desk Lamp",widget:"text"},description:{label:"Description",defaultValue:"Warm, dimmable light with a machined aluminum base.",widget:"rich_text"},price:{label:"Price",defaultValue:"89",widget:"text"},cta:{label:"Button",defaultValue:"Add to cart",widget:"text"},action:{label:"Link",defaultValue:{name:"web",values:{href:"https://example.com/lamp",target:"_blank"}},widget:"link"}}}},values:{},renderer:{exporters:{web:e=>`<div style="max-width:340px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 14px 34px rgba(17,24,39,.10);">
           <img src="${e.image.url}" alt="${e.title}" style="display:block;width:100%;height:170px;object-fit:cover;"/>
           <div style="padding:18px 20px 20px;">
             <div style="display:flex;justify-content:space-between;align-items:baseline;">
               <div style="font-size:18px;font-weight:700;color:#111827;">${e.title}</div>
               <div style="font-size:18px;font-weight:800;color:#6366f1;">$${e.price}</div>
             </div>
             <div style="font-size:14px;line-height:1.55;color:#6b7280;padding:8px 0 16px;">${e.description}</div>
             <a href="${e.action.url}" target="${e.action.target}" style="display:block;text-align:center;background:#6366f1;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;border-radius:10px;padding:12px 0;">${e.cta}</a>
           </div>
         </div>`,email:e=>`<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:340px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:14px;">
           <tr><td><img src="${e.image.url}" alt="${e.title}" width="338" style="display:block;width:100%;border-radius:14px 14px 0 0;"/></td></tr>
           <tr><td style="padding:16px 18px 6px;font-family:Arial,sans-serif;"><span style="font-size:17px;font-weight:bold;color:#111827;">${e.title}</span>
             <span style="font-size:17px;font-weight:bold;color:#6366f1;float:right;">$${e.price}</span></td></tr>
           <tr><td style="padding:0 18px 14px;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#6b7280;">${e.description}</td></tr>
           <tr><td style="padding:0 18px 18px;"><a href="${e.action.url}" target="${e.action.target}" style="display:block;text-align:center;background-color:#6366f1;color:#ffffff;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;text-decoration:none;border-radius:8px;padding:12px 0;">${e.cta}</a></td></tr>
         </table>`}}},u=f(h),g=f(w),V={title:"Custom Tools/Registered Tools",tags:["autodocs"],parameters:{layout:"padded",docs:{description:{component:'\nCustom tools created with `registerElementsTool` — the same tool definition\nobject embedders write for the editor\'s `unlayer.registerTool` ([Custom Tools\ndocs](https://docs.unlayer.com/builder/tools/custom)). Elements uses the\n`renderer.exporters`/`renderer.head` half; the editor uses the Viewer and\nproperty panel half. `renderToJson` emits `{ type: "custom", slug, values }`,\nso these designs open in the Builder as the real tool.\n\n```tsx\nconst Countdown = registerTool(countdownTool);\n\n<Email><Row><Column>\n  <Countdown headline="Offer ends in" days="02" accent="#e11d48" />\n</Column></Row></Email>\n```\n        '}}}},o={parameters:{docs:{source:{language:"tsx",code:`// The same definition you register in the editor (unlayer.registerTool)
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
</Email>`}}},render:()=>t.jsx(d,{backgroundColor:"#f8fafc",contentWidth:"560px",children:t.jsx(l,{backgroundColor:"#ffffff",padding:"10px 0px",children:t.jsx(s,{children:t.jsx(u,{containerPadding:"30px 20px"})})})})},a={parameters:{docs:{source:{language:"tsx",code:`// Flat props override the tool's option defaults, like any component
<Email backgroundColor="#0f172a" contentWidth="560px">
  <Row><Column>
    <Countdown
      headline="Kickoff in"
      days="00" hours="04" minutes="07"
      accent="#f6d365"
      containerPadding="34px 20px"
    />
  </Column></Row>
</Email>`}}},render:()=>t.jsx(d,{backgroundColor:"#0f172a",contentWidth:"560px",children:t.jsx(l,{padding:"10px 0px",children:t.jsx(s,{children:t.jsx(u,{headline:"Kickoff in",days:"00",hours:"04",minutes:"07",accent:"#f6d365",containerPadding:"34px 20px"})})})})},i={parameters:{docs:{source:{language:"tsx",code:`// Nested object values (image, link action) work like the editor:
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
</Email>`}}},render:()=>t.jsx(d,{backgroundColor:"#f1f5f9",contentWidth:"560px",children:t.jsx(l,{padding:"14px 0px",children:t.jsx(s,{children:t.jsx(g,{containerPadding:"24px 20px"})})})})},r={parameters:{docs:{source:{language:"tsx",code:`// Custom tools compose with built-ins; renderToJson emits
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
</Email>`}}},render:()=>t.jsx(d,{backgroundColor:"#f8fafc",contentWidth:"560px",children:t.jsx(l,{backgroundColor:"#ffffff",padding:"8px 0px",children:t.jsxs(s,{children:[t.jsx(m,{textAlign:"center",fontSize:"24px",fontWeight:700,containerPadding:"30px 24px 4px",children:"Summer drop is live"}),t.jsx(x,{textAlign:"center",color:"#6b7280",containerPadding:"0px 32px 8px",children:"One design, two runtimes — this card and timer are custom tools."}),t.jsx(g,{price:"79",cta:"Get the launch price",containerPadding:"14px 20px"}),t.jsx(u,{headline:"Launch price ends in",containerPadding:"18px 20px 34px"})]})})})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: \`// The same definition you register in the editor (unlayer.registerTool)
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
      web:   (v) => \\\`<div>…\\\${v.headline} \\\${v.days}:\\\${v.hours}:\\\${v.minutes}…</div>\\\`,
      email: (v) => \\\`<table role="presentation">…</table>\\\`,
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
</Email>\`
      }
    }
  },
  render: () => <Email backgroundColor="#f8fafc" contentWidth="560px">
      <Row backgroundColor="#ffffff" padding="10px 0px">
        <Column>
          <Countdown containerPadding="30px 20px" />
        </Column>
      </Row>
    </Email>
}`,...o.parameters?.docs?.source},description:{story:"The countdown tool with its option-widget defaults.",...o.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: \`// Flat props override the tool's option defaults, like any component
<Email backgroundColor="#0f172a" contentWidth="560px">
  <Row><Column>
    <Countdown
      headline="Kickoff in"
      days="00" hours="04" minutes="07"
      accent="#f6d365"
      containerPadding="34px 20px"
    />
  </Column></Row>
</Email>\`
      }
    }
  },
  render: () => <Email backgroundColor="#0f172a" contentWidth="560px">
      <Row padding="10px 0px">
        <Column>
          <Countdown headline="Kickoff in" days="00" hours="04" minutes="07" accent="#f6d365" containerPadding="34px 20px" />
        </Column>
      </Row>
    </Email>
}`,...a.parameters?.docs?.source},description:{story:"Flat props override the tool's option defaults, like any component.",...a.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: \`// Nested object values (image, link action) work like the editor:
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
    web:   (v) => \\\`…<a href="\\\${v.action.url}" target="\\\${v.action.target}">\\\${v.cta}</a>…\\\`,
    email: (v) => \\\`<table role="presentation">…</table>\\\`,
  }},
};

const ProductCard = registerTool(productTool);

<Email backgroundColor="#f1f5f9" contentWidth="560px">
  <Row><Column>
    <ProductCard containerPadding="24px 20px" />
  </Column></Row>
</Email>\`
      }
    }
  },
  render: () => <Email backgroundColor="#f1f5f9" contentWidth="560px">
      <Row padding="14px 0px">
        <Column>
          <ProductCard containerPadding="24px 20px" />
        </Column>
      </Row>
    </Email>
}`,...i.parameters?.docs?.source},description:{story:"A product card tool with nested object values (image, link action).",...i.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: \`// Custom tools compose with built-ins; renderToJson emits
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
</Email>\`
      }
    }
  },
  render: () => <Email backgroundColor="#f8fafc" contentWidth="560px">
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
}`,...r.parameters?.docs?.source},description:{story:"Custom tools compose with built-ins inside a full design.",...r.parameters?.docs?.description}}};const j=["CountdownTool","CountdownCustomized","ProductCardTool","InsideAFullDesign"];export{a as CountdownCustomized,o as CountdownTool,r as InsideAFullDesign,i as ProductCardTool,j as __namedExportsOrder,V as default};
