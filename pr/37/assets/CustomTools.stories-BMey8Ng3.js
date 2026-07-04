import{j as o}from"./jsx-runtime-B9okGr-Y.js";import{c as w,n as b}from"./create-component-CpS-uDO3.js";import{E as f}from"./Email-BWZVLN_M.js";import{R as u,C as m}from"./Column-DGgxGOFG.js";import{H as y}from"./Heading-Ts81pNzb.js";import{P as C}from"./Paragraph-BjHd4Ysh.js";import"./iframe-CcJJrRrQ.js";import"./preload-helper-PPVm8Dsz.js";import"./Body-Cd1W7hz4.js";function k(e){const t={};for(const i of Object.values(e??{}))for(const[n,r]of Object.entries(i?.options??{}))!r||r.enabled===!1||typeof r.defaultValue<"u"&&(t[n]=r.defaultValue);return t}function $(e){return(t,...i)=>{const n=String(e(t,...i)??""),a=i[i.length-1]?.exporterConfig?.toSafeHtml;return typeof a=="function"?a(n):n}}function j(e,t){return t.length===0?e:(i,...n)=>{const r={...i};for(const a of t){const p=b(r[a]);p!==void 0&&(r[a]=p)}return e(r,...n)}}function v(e){const t=[];for(const i of Object.values(e??{}))for(const[n,r]of Object.entries(i?.options??{}))r&&r.widget==="link"&&t.push(n);return t}function g(e){if(!e?.name||typeof e.name!="string")throw new Error("[Unlayer] registerElementsTool: `name` is required");const t=e.renderer?.exporters;if(!t||!t.web&&!t.email)throw new Error(`[Unlayer] registerElementsTool("${e.name}"): \`renderer.exporters\` needs at least a \`web\` or \`email\` exporter`);const i=v(e.options),n={};for(const r of["web","email","document"]){const a=t[r];a&&(n[r]=$(j(a,i)))}return!n.web&&n.email&&(n.web=n.email),w({name:e.name,displayName:e.displayName??e.name,defaultValues:{...k(e.options),...e.values??{}},propMapper:({children:r,values:a,...p})=>({...a??{},...p}),exporters:n,contentType:"custom",slug:e.name,metaName:`custom_${e.name}`,head:e.renderer.head})}const P={name:"countdown",options:{timer:{title:"Timer",options:{headline:{label:"Headline",defaultValue:"Offer ends in",widget:"text"},days:{label:"Days",defaultValue:"02",widget:"text"},hours:{label:"Hours",defaultValue:"11",widget:"text"},minutes:{label:"Minutes",defaultValue:"45",widget:"text"},accent:{label:"Accent",defaultValue:"#e11d48",widget:"color_picker"}}}},values:{},renderer:{exporters:{web:e=>{const t=(i,n)=>`<div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:14px 0;width:76px;text-align:center;">
             <div style="font-size:30px;font-weight:800;color:#ffffff;font-variant-numeric:tabular-nums;">${i}</div>
             <div style="font-size:11px;letter-spacing:2px;color:#9ca3af;padding-top:2px;">${n}</div>
           </div>`;return`<div style="font-family:'Segoe UI',system-ui,sans-serif;text-align:center;">
          <div style="font-size:13px;letter-spacing:3px;font-weight:700;color:${e.accent};padding-bottom:12px;">${String(e.headline).toUpperCase()}</div>
          <div style="display:flex;gap:10px;justify-content:center;">${t(e.days,"DAYS")}${t(e.hours,"HOURS")}${t(e.minutes,"MINS")}</div>
        </div>`},email:e=>{const t=(i,n)=>`<td align="center" style="background-color:#111827;border-radius:10px;padding:12px 16px;">
             <div style="font-family:Arial,sans-serif;font-size:26px;font-weight:800;color:#ffffff;">${i}</div>
             <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#9ca3af;">${n}</div>
           </td>`;return`<table role="presentation" cellpadding="0" cellspacing="6" align="center" style="margin:0 auto;">
          <tr><td colspan="3" align="center" style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;font-weight:bold;color:${e.accent};padding-bottom:8px;">${String(e.headline).toUpperCase()}</td></tr>
          <tr>${t(e.days,"DAYS")}${t(e.hours,"HOURS")}${t(e.minutes,"MINS")}</tr>
        </table>`}},head:{css:()=>".countdown-digits { font-variant-numeric: tabular-nums; }"}}},z={name:"product_card",options:{product:{title:"Product",options:{image:{label:"Image",defaultValue:{url:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%236366f1'/><stop offset='1' stop-color='%23a855f7'/></linearGradient></defs><rect width='600' height='300' fill='url(%23g)'/><circle cx='300' cy='150' r='70' fill='white' opacity='.25'/><circle cx='300' cy='150' r='44' fill='white' opacity='.5'/></svg>"},widget:"image"},title:{label:"Title",defaultValue:"Aurora Desk Lamp",widget:"text"},description:{label:"Description",defaultValue:"Warm, dimmable light with a machined aluminum base.",widget:"rich_text"},price:{label:"Price",defaultValue:"89",widget:"text"},cta:{label:"Button",defaultValue:"Add to cart",widget:"text"},action:{label:"Link",defaultValue:{name:"web",values:{href:"https://example.com/lamp",target:"_blank"}},widget:"link"}}}},values:{},renderer:{exporters:{web:e=>`<div style="max-width:340px;margin:0 auto;font-family:'Segoe UI',system-ui,sans-serif;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 14px 34px rgba(17,24,39,.10);">
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
         </table>`}}},x=g(P),h=g(z),I={title:"Custom Tools/Registered Tools",parameters:{layout:"padded",docs:{description:{component:'\nCustom tools created with `registerElementsTool` — the same tool definition\nobject embedders write for the editor\'s `unlayer.registerTool` ([Custom Tools\ndocs](https://docs.unlayer.com/builder/tools/custom)). Elements uses the\n`renderer.exporters`/`renderer.head` half; the editor uses the Viewer and\nproperty panel half. `renderToJson` emits `{ type: "custom", slug, values }`,\nso these designs open in the Builder as the real tool.\n\n```tsx\nconst Countdown = registerElementsTool(countdownTool);\n\n<Email><Row><Column>\n  <Countdown headline="Offer ends in" days="02" accent="#e11d48" />\n</Column></Row></Email>\n```\n        '}}}},d={render:()=>o.jsx(f,{backgroundColor:"#f8fafc",contentWidth:"560px",children:o.jsx(u,{backgroundColor:"#ffffff",padding:"10px 0px",children:o.jsx(m,{children:o.jsx(x,{containerPadding:"30px 20px"})})})})},s={render:()=>o.jsx(f,{backgroundColor:"#0f172a",contentWidth:"560px",children:o.jsx(u,{padding:"10px 0px",children:o.jsx(m,{children:o.jsx(x,{headline:"Kickoff in",days:"00",hours:"04",minutes:"07",accent:"#f6d365",containerPadding:"34px 20px"})})})})},l={render:()=>o.jsx(f,{backgroundColor:"#f1f5f9",contentWidth:"560px",children:o.jsx(u,{padding:"14px 0px",children:o.jsx(m,{children:o.jsx(h,{containerPadding:"24px 20px"})})})})},c={render:()=>o.jsx(f,{backgroundColor:"#f8fafc",contentWidth:"560px",children:o.jsx(u,{backgroundColor:"#ffffff",padding:"8px 0px",children:o.jsxs(m,{children:[o.jsx(y,{textAlign:"center",fontSize:"24px",fontWeight:700,containerPadding:"30px 24px 4px",children:"Summer drop is live"}),o.jsx(C,{textAlign:"center",color:"#6b7280",containerPadding:"0px 32px 8px",children:"One design, two runtimes — this card and timer are custom tools."}),o.jsx(h,{price:"79",cta:"Get the launch price",containerPadding:"14px 20px"}),o.jsx(x,{headline:"Launch price ends in",containerPadding:"18px 20px 34px"})]})})})};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <Email backgroundColor="#f8fafc" contentWidth="560px">
      <Row backgroundColor="#ffffff" padding="10px 0px">
        <Column>
          <Countdown containerPadding="30px 20px" />
        </Column>
      </Row>
    </Email>
}`,...d.parameters?.docs?.source},description:{story:"The countdown tool with its option-widget defaults.",...d.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <Email backgroundColor="#0f172a" contentWidth="560px">
      <Row padding="10px 0px">
        <Column>
          <Countdown headline="Kickoff in" days="00" hours="04" minutes="07" accent="#f6d365" containerPadding="34px 20px" />
        </Column>
      </Row>
    </Email>
}`,...s.parameters?.docs?.source},description:{story:"Flat props override the tool's option defaults, like any component.",...s.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <Email backgroundColor="#f1f5f9" contentWidth="560px">
      <Row padding="14px 0px">
        <Column>
          <ProductCard containerPadding="24px 20px" />
        </Column>
      </Row>
    </Email>
}`,...l.parameters?.docs?.source},description:{story:"A product card tool with nested object values (image, link action).",...l.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source},description:{story:"Custom tools compose with built-ins inside a full design.",...c.parameters?.docs?.description}}};const U=["CountdownTool","CountdownCustomized","ProductCardTool","InsideAFullDesign"];export{s as CountdownCustomized,d as CountdownTool,c as InsideAFullDesign,l as ProductCardTool,U as __namedExportsOrder,I as default};
