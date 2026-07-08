import{j as n}from"./jsx-runtime-BeM-6lTP.js";import{R as g}from"./iframe-M4Vf4_JS.js";import{r as R}from"./register-tool-CLG-kbV4.js";import{m as z,a as B,b as F,U as oe,D as ne,s as re}from"./create-component-C_i99gso.js";import{B as O,a as U,b as Q,R as b,C as w}from"./Column-Bcibkpme.js";import{E as M}from"./Email-NRC0rKW1.js";import{B as ae}from"./Body-CApRaWj0.js";import{H as S}from"./Heading-Kvn98aRL.js";import"./preload-helper-PPVm8Dsz.js";function T(e){return n.jsx(ae,{...e,mode:"web"})}T.displayName="Page";T.__docgenInfo={description:`Page - Renders with div/flexbox for responsive web display.

Thin wrapper around Body with mode locked to "web".

@example
\`\`\`tsx
<Page backgroundColor="#ffffff" contentWidth="960px">
  <Row><Column><Paragraph text="Hello" /></Column></Row>
</Page>
\`\`\``,methods:[],displayName:"Page"};function E(e,t,o=0){return{...e,_meta:{htmlID:`u_content_${t.toLowerCase()}_${o+1}`,htmlClassNames:`u_content_${t.toLowerCase()}`,...e._meta||{}}}}function G(e){const t=e.type;return t?.displayName||t?.name}function I(e){const t=[];return g.Children.forEach(e,o=>{if(g.isValidElement(o)){if(o.type===g.Fragment){t.push(...I(o.props.children));return}t.push(o)}}),t}function H(e,t=[]){const o=new Set(["children","mode","className","style","index","colIndex","cells","bodyValues","rowValues","_config","config","previewText","layout","collection",...t]),r={};for(const[i,a]of Object.entries(e))!o.has(i)&&a!==void 0&&(r[i]=a);return r}function W(e,t){return e[t]=(e[t]||0)+1,e[t]}function q(e,t,o,r,i,a,l,p){if(!e)return;const c=[t,o,{displayMode:r,isViewer:!1,variant:null,type:"rows",headConfig:i}],s=e.css?.(...c);s&&a.push(s);const d=e.js?.(...c);d&&l.push(d);const u=e.tags?.(...c);u&&p.push(...u)}function ie(e,t,o,r,i,a,l,p){const s=e.type[oe];if(!s)return;const{name:d,defaultValues:u,propMapper:f}=s,{children:x,...m}=e.props,h=f({children:x,...m}),L=B(u,h),N=s.metaName??d.toLowerCase(),X=W(i,`u_content_${N}`),ee=E(L,N,X-1),te=s.head??F[d];q(te,ee,t,o,r,a,l,p)}function le(e,t,o,r,i,a,l,p,c){const s=H(e.props),d=z(s,Q,"Column"),u=W(a,"u_column"),f=E(B(Q,d),"column",u-1),x=F.Column;q(x,f,t,r,i,l,p,c);const m=I(e.props.children);for(const h of m)ie(h,t,r,i,a,l,p,c)}function de(e,t,o,r,i,a,l,p){const c=H(e.props,["layout"]),s=z(c,U,"Row"),d=W(i,"u_row"),u=E(B(U,s),"row",d-1),f=F.Row;q(f,u,t,o,r,a,l,p);const x=I(e.props.children);for(const m of x)G(m)==="Column"&&le(m,t,u,o,r,i,a,l,p)}function se(e,t){const{displayMode:o}=t,r={hasFeature:t.headConfig?.hasFeature??(()=>!1),getInitialValues:t.headConfig?.getInitialValues??(()=>({}))},i=[],a=[],l=[],p={},c=H(e.props),s=z(c,O,"Body"),d=E(B(O,s),"body",0),u=F.Body;q(u,d,d,o,r,i,a,l);const f=I(e.props.children);for(const m of f)G(m)==="Row"&&de(m,d,o,r,p,i,a,l);const x=[...new Set(l.filter(Boolean))];return{css:i.filter(Boolean).join(`
`),js:a.filter(Boolean).join(`
`),tags:x}}const Y={Email:"email",Page:"web",Document:"document"};function D(e){return e.type?.displayName}function ce(e){const t=D(e);return t==="Body"||(t?t in Y:!1)}function pe(e){let t=e,o;for(;D(t)==="UnlayerProvider";){const r=t.props,i=g.Children.toArray(r.children).filter(g.isValidElement);if(i.length!==1)break;o={...o,...r.config},t=i[0]}return{element:t,providerConfig:o}}function ue(e,t){const o=D(e),r=o?Y[o]:void 0,i=e.props;return r??i.mode??i.config?.mode??t.mode??"web"}function Z(e,t){if(D(e)==="UnlayerProvider"){const o=g.Children.toArray(e.props.children),r=o.filter(g.isValidElement);return o.length===1&&r.length===1?g.cloneElement(e,void 0,Z(r[0],t)):e}if(ce(e)){const o=e.props.config;return g.cloneElement(e,{config:{...o,...t}})}return e}function me(e,t){try{const o=Z(e,t??{});return re.renderToStaticMarkup(o)}catch(o){const r=o instanceof Error?o.message:String(o);throw new Error(`[Unlayer] renderToHtml failed: ${r}
Tip: Ensure your tree uses Body > Row > Column > Item structure.`)}}function ge(e,t){const o=me(e,{onError:"throw",...t}),{element:r,providerConfig:i}=pe(e),a={...ne,...i,...t},l=ue(r,a),{css:p,js:c,tags:s}=se(r,{displayMode:l,headConfig:a.headConfig}),d=[];return p&&d.push(`<style>${p}</style>`),c&&d.push(`<script>${c}<\/script>`),s.length>0&&d.push(...s),{head:d.join(`
`),body:o,css:p,js:c,tags:s}}const fe={name:"accordion",options:{menu:{title:"Accordion Items",options:{accordionRow:{label:"Accordion Row",defaultValue:{items:[{title:"How long does shipping take?",description:"Orders ship within 24 hours and arrive in 3–5 business days. Express options are available at checkout."},{title:"What is the return policy?",description:"Everything can come back within 30 days, no questions asked. Returns are free in the continental US."},{title:"Do you offer support?",description:"Real humans answer within a few hours, seven days a week."}]},widget:"accordion_editor"}}},colors:{title:"Colors",options:{titleTextColor:{label:"Title Text Color",defaultValue:"#212121",widget:"color_picker"},descriptionTextColor:{label:"Description Text Color",defaultValue:"#212121",widget:"color_picker"},titleBackgroundColor:{label:"Title Background Color",defaultValue:"#FAFAFA",widget:"color_picker"},descriptionBackgroundColor:{label:"Description Background Color",defaultValue:"#ffffff",widget:"color_picker"},titleHoverBackground:{label:"Title Hover Background Color",defaultValue:"#ECEDEF",widget:"color_picker"}}},fontFamily:{title:"Fonts",options:{fontFamily:{label:"Title Font",defaultValue:{label:"Arial",value:"arial,helvetica,sans-serif"},widget:"font_family"}}}},values:{},renderer:{exporters:{web:e=>{const t=e.accordionRow?.items??[];if(t.length===0)return'<div style="padding:15px;border:2px dashed #ccc;background:#eee;color:#999;text-align:center;">Empty Accordion</div>';const o=t.map(r=>`
          <div>
            <div class="ua-acc-title" onclick="window.__uaAccordionToggle(this)">
              <span>${r.title}</span><span class="ua-acc-icon" style="font-size:20px;">+</span>
            </div>
            <div class="ua-acc-panel"><p style="margin:0;">${r.description}</p></div>
          </div>`).join("");return`<div id="${e._meta.htmlID}-root">${o}</div>`},email:e=>`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${(e.accordionRow?.items??[]).map(o=>`
            <tr><td style="background-color:${e.titleBackgroundColor};color:${e.titleTextColor};font-family:${e.fontFamily.value};font-weight:bold;padding:14px 20px;border-top:3px solid #ffffff;">${o.title}</td></tr>
            <tr><td style="background-color:${e.descriptionBackgroundColor};color:${e.descriptionTextColor};font-family:${e.fontFamily.value};padding:12px 20px;font-size:14px;line-height:1.5;">${o.description}</td></tr>`).join("")}</table>`},head:{css:e=>`
        #${e._meta.htmlID}-root .ua-acc-title {
          display: flex; justify-content: space-between; align-items: center;
          background-color: ${e.titleBackgroundColor};
          color: ${e.titleTextColor};
          font-family: ${e.fontFamily.value};
          cursor: pointer; padding: 15px 20px; margin-top: 3px;
          font-size: 15px; transition: 0.3s;
        }
        #${e._meta.htmlID}-root .ua-acc-title:hover { background-color: ${e.titleHoverBackground}; }
        #${e._meta.htmlID}-root .ua-acc-panel {
          display: none; padding: 12px 20px;
          background-color: ${e.descriptionBackgroundColor};
          color: ${e.descriptionTextColor};
          font-family: ${e.fontFamily.value};
          border-top: 1px solid #f2f2f2; font-size: 14px; line-height: 1.5;
        }`,js:()=>`window.__uaAccordionToggle = window.__uaAccordionToggle || function (el) {
        var panel = el.nextElementSibling;
        var open = panel.style.display === "block";
        panel.style.display = open ? "none" : "block";
        el.querySelector(".ua-acc-icon").textContent = open ? "+" : "\\u2212";
      };`}}},xe={name:"tab_strip",options:{tabs:{title:"Tabs",options:{tabItem:{label:"Tabs",defaultValue:{items:[{title:"Overview",content:"A desk lamp with a machined aluminum base and warm, dimmable light — designed to disappear into your desk setup."},{title:"Specs",content:"2700–4000K adjustable temperature, 850 lumens, USB-C powered, 5-year warranty."},{title:"Reviews",content:"4.9/5 across 1,200 reviews. “The hinge alone is worth it.” — a very reasonable customer."}]},widget:"tab_editor"},titleTextColor:{label:"Tab Text",defaultValue:"#000000",widget:"color_picker"},contentTextColor:{label:"Content Text",defaultValue:"#000000",widget:"color_picker"},titleBackgroundColor:{label:"Tab Background",defaultValue:"#FDFDFD",widget:"color_picker"},contentBackgroundColor:{label:"Content Background",defaultValue:"#FDFDFD",widget:"color_picker"},activeTabColor:{label:"Active Tab",defaultValue:"#18B2B3",widget:"color_picker"},tabTitleFontFamily:{label:"Tab Font",defaultValue:{label:"Arial",value:"arial,helvetica,sans-serif"},widget:"font_family"}}}},values:{},renderer:{exporters:{web:e=>{const t=e.tabItem?.items??[],o=e._meta.htmlID;if(t.length===0)return'<div style="padding:15px;border:2px dashed #ccc;background:#eee;color:#999;text-align:center;">No Tabs</div>';const r=t.map((a,l)=>`<button class="ua-tablink${l===0?" active":""}" onclick="window.__uaOpenTab(this,'${o}-panel-${l}')">${a.title}</button>`).join(""),i=t.map((a,l)=>`<div id="${o}-panel-${l}" class="ua-tabcontent" style="display:${l===0?"block":"none"};"><p style="margin:0;">${a.content}</p></div>`).join("");return`<div id="${o}-root" class="ua-tabs"><div class="ua-tabbar">${r}</div>${i}</div>`},email:e=>`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${(e.tabItem?.items??[]).map(o=>`
            <tr><td style="font-family:${e.tabTitleFontFamily.value};color:${e.activeTabColor};font-weight:bold;font-size:15px;padding:16px 20px 6px;border-bottom:2px solid ${e.activeTabColor};">${o.title}</td></tr>
            <tr><td style="font-family:${e.tabTitleFontFamily.value};background-color:${e.contentBackgroundColor};color:${e.contentTextColor};padding:12px 20px 18px;font-size:14px;line-height:1.5;">${o.content}</td></tr>`).join("")}</table>`},head:{css:e=>`
        #${e._meta.htmlID}-root .ua-tabbar { display: flex; overflow: hidden; background-color: ${e.titleBackgroundColor}; }
        #${e._meta.htmlID}-root .ua-tablink {
          flex: 1; background-color: inherit; border: none; outline: none; cursor: pointer;
          padding: 14px 16px; transition: 0.3s; font-size: 15px;
          color: ${e.titleTextColor}; border-bottom: 2px solid #e3e3e3;
          font-family: ${e.tabTitleFontFamily.value};
        }
        #${e._meta.htmlID}-root .ua-tablink:hover { background-color: #eeeeee; }
        #${e._meta.htmlID}-root .ua-tablink.active { border-bottom: 2px solid ${e.activeTabColor}; color: ${e.activeTabColor}; }
        #${e._meta.htmlID}-root .ua-tabcontent {
          padding: 15px 20px; color: ${e.contentTextColor};
          background-color: ${e.contentBackgroundColor};
          font-family: ${e.tabTitleFontFamily.value}; font-size: 14px; line-height: 1.5;
        }`,js:()=>`window.__uaOpenTab = window.__uaOpenTab || function (btn, panelId) {
        var root = btn.closest(".ua-tabs");
        root.querySelectorAll(".ua-tabcontent").forEach(function (p) { p.style.display = "none"; });
        root.querySelectorAll(".ua-tablink").forEach(function (b) { b.classList.remove("active"); });
        document.getElementById(panelId).style.display = "block";
        btn.classList.add("active");
      };`}}},he={name:"product_library",options:{productContent:{title:"Product Content",options:{productImage:{label:"Product Image",defaultValue:{url:"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='340'><defs><linearGradient id='p' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%230ea5e9'/><stop offset='1' stop-color='%236366f1'/></linearGradient></defs><rect width='600' height='340' fill='url(%23p)'/><rect x='210' y='90' width='180' height='160' rx='14' fill='white' opacity='.92'/><rect x='240' y='120' width='120' height='14' rx='7' fill='%236366f1' opacity='.7'/><rect x='240' y='150' width='90' height='10' rx='5' fill='%2394a3b8'/><rect x='240' y='170' width='104' height='10' rx='5' fill='%2394a3b8'/><rect x='240' y='200' width='70' height='22' rx='11' fill='%230ea5e9'/></svg>"},widget:"image"},productTitle:{label:"Product Title",defaultValue:"Studio Headphones X2",widget:"text"},productTitleColor:{label:"Product Title Color",defaultValue:"#111827",widget:"color_picker"},productDescription:{label:"Product Description",defaultValue:"Closed-back studio headphones with a detachable cable, memory-foam pads, and a case that survives checked luggage.",widget:"rich_text"},productPrice:{label:"Product Price",defaultValue:"149.00",widget:"text"},productPriceColor:{label:"Price Color",defaultValue:"#111827",widget:"color_picker"},productPriceBackgroundColor:{label:"Price Background",defaultValue:"#f8fafc",widget:"color_picker"},productCTA:{label:"Button Name",defaultValue:"Buy Now",widget:"text"},productCTAColor:{label:"Button Color",defaultValue:"#0ea5e9",widget:"color_picker"},productCTATextColor:{label:"Button Text Color",defaultValue:"#ffffff",widget:"color_picker"},productCTAAction:{label:"Action Type",defaultValue:{name:"web",values:{href:"https://example.com/headphones",target:"_blank"}},widget:"link"}}}},values:{},renderer:{exporters:{web:e=>`<div style="position:relative;display:table;min-width:0;word-wrap:break-word;background-color:#fff;background-clip:border-box;border:1px solid rgba(0,0,0,.125);border-radius:6px;margin:auto;text-align:center;max-width:360px;overflow:hidden;">
          <img src="${e.productImage.url}" alt="${e.productTitle}" style="width:100%;object-fit:contain;display:block;"/>
          <div style="padding:0 16px 16px;text-align:left;">
            <h3 style="margin:12px 0;color:${e.productTitleColor};">${e.productTitle}</h3>
            <div style="color:#6b7280;font-size:14px;line-height:1.5;">${e.productDescription}</div>
          </div>
          <div style="display:flex;border-top:1px solid rgba(0,0,0,.125);align-items:center;font-weight:bold;background-color:${e.productPriceBackgroundColor};">
            <div style="width:50%;padding:12px;font-size:16px;line-height:1.5;color:${e.productPriceColor};">$${e.productPrice}</div>
            <a href="${e.productCTAAction.url}" target="${e.productCTAAction.target}" style="width:50%;text-decoration:none;background-color:${e.productCTAColor};color:${e.productCTATextColor};display:inline-block;font-weight:400;text-align:center;vertical-align:middle;padding:12px;font-size:16px;line-height:1.5;cursor:pointer;">${e.productCTA}</a>
          </div>
        </div>`,email:e=>`<table cellspacing="0" cellpadding="0" role="presentation" style="min-width:0;word-wrap:break-word;background-color:#fff;border:1px solid rgba(0,0,0,.125);border-radius:6px;margin:auto;text-align:center;max-width:360px;">
          <tbody>
            <tr><td width="100%"><img src="${e.productImage.url}" alt="${e.productTitle}" style="width:100%;object-fit:contain;border-top-left-radius:6px;border-top-right-radius:6px;"/></td></tr>
            <tr><td width="100%"><h3 style="text-align:left;margin:8px 0 12px 0;padding:0 16px;color:${e.productTitleColor};">${e.productTitle}</h3></td></tr>
            <tr><td width="100%"><div style="text-align:left;padding:0 16px;margin:0 0 12px 0;color:#6b7280;font-size:14px;line-height:1.5;">${e.productDescription}</div></td></tr>
            <tr><td width="100%">
              <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="border-top:1px solid rgba(0,0,0,.125);font-weight:bold;background-color:${e.productPriceBackgroundColor};">
                <tbody><tr>
                  <td width="50%" style="text-align:center;padding:12px;font-size:16px;line-height:1.5;"><div style="color:${e.productPriceColor};">$${e.productPrice}</div></td>
                  <td width="50%" style="background-color:${e.productCTAColor};text-align:center;vertical-align:middle;padding:12px 0;font-size:16px;line-height:1.5;"><a href="${e.productCTAAction.url}" target="${e.productCTAAction.target}" style="width:100%;color:${e.productCTATextColor};text-decoration:none;">${e.productCTA}</a></td>
                </tr></tbody>
              </table>
            </td></tr>
          </tbody>
        </table>`}}},be={name:"qr_tool",options:{qr:{title:"QR Content",options:{qr:{label:"QR URL",defaultValue:{srcUrl:"https://unlayer.com",qrCode:"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Funlayer.com"},widget:"qr_generator"},width:{label:"Width",defaultValue:"50",widget:"counter"},alignment:{label:"Alignment",defaultValue:"center",widget:"alignment"}}}},values:{},renderer:{exporters:{web:e=>`<div class="qr-tool" style="margin:auto;text-align:${e.alignment};">${e.qr?.qrCode?`<img src="${e.qr.qrCode}" alt="QR code for ${e.qr.srcUrl}" style="width:${e.width}%;"/>`:"<h3>Enter url and QR Code will be generated here</h3>"}</div>`,email:e=>`<div style="margin:auto;text-align:${e.alignment};">${e.qr?.qrCode?`<img src="${e.qr.qrCode}" alt="QR code for ${e.qr.srcUrl}" width="${Math.round(3*Number(e.width))}" style="width:${e.width}%;"/>`:""}</div>`}}},we={name:"map_tool",options:{location:{title:"Location",options:{latitude:{label:"Latitude",widget:"text",defaultValue:"37.785343"},longitude:{label:"Longitude",widget:"text",defaultValue:"-122.3978088"},caption:{label:"Caption",widget:"text",defaultValue:"Mission St, San Francisco"}}},zoom:{title:"Zoom level",options:{zoom:{label:"Zoom Level",widget:"counter",defaultValue:"15"}}}},values:{},renderer:{exporters:{web:e=>J(e,!0),email:e=>J(e,!1)}}};function J(e,t){const o=parseFloat(e.latitude),r=parseFloat(e.longitude),i=parseInt(e.zoom,10),a=2**i,l=(r+180)/360*a,p=o*Math.PI/180,c=(1-Math.log(Math.tan(p)+1/Math.cos(p))/Math.PI)/2*a,s=Math.floor(l)-1,d=Math.floor(c)-(c%1<.5?1:0),u=[0,1].map(h=>`<tr>${[0,1,2].map(L=>`<td style="padding:0;line-height:0;"><img src="https://tile.openstreetmap.org/${i}/${s+L}/${d+h}.png" width="200" height="200" alt="" style="display:block;width:100%;"/></td>`).join("")}</tr>`).join(""),f=((l-s)/3*100).toFixed(2),x=((c-d)/2*100).toFixed(2),m=t?`<div style="position:absolute;left:${f}%;top:${x}%;transform:translate(-50%,-100%);font-size:30px;line-height:1;">&#128205;</div>`:"";return`<div style="max-width:600px;margin:auto;${t?"position:relative;":""}border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${u}</table>${m}
  </div>
  <div style="text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#6b7280;padding-top:8px;">${e.caption} &middot; &copy; OpenStreetMap contributors</div>`}const Ce=R(he),ye=R(be),Te=R(we),j=R(fe),K=R(xe),C=({tree:e})=>{const{head:t,body:o}=g.useMemo(()=>ge(e),[e]),r=[...t.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(a=>a[1]).join(`
`),i=[...t.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(a=>a[1]).join(`
`);return g.useEffect(()=>{if(!i)return;const a=document.createElement("script");return a.textContent=i,document.body.appendChild(a),()=>a.remove()},[i]),n.jsxs(n.Fragment,{children:[n.jsx("style",{dangerouslySetInnerHTML:{__html:r}}),n.jsx("div",{dangerouslySetInnerHTML:{__html:o}})]})},Be={title:"Custom Tools/Examples Gallery",tags:["autodocs"],parameters:{layout:"padded",docs:{description:{component:`
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
        `}}}},y=e=>({docs:{source:{language:"tsx",code:e}}}),k={parameters:y(`const accordionTool = {
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

<Page><Row><Column><Accordion /></Column></Row></Page>`),render:()=>n.jsx(C,{tree:n.jsx(T,{backgroundColor:"#f8fafc",contentWidth:"600px",children:n.jsx(b,{backgroundColor:"#ffffff",padding:"10px 0px",children:n.jsxs(w,{children:[n.jsx(S,{fontSize:"20px",fontWeight:700,containerPadding:"24px 20px 6px",children:"Frequently asked questions"}),n.jsx(j,{containerPadding:"10px 20px 28px"})]})})})})},v={parameters:y(`const tabTool = {
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

<Page><Row><Column><Tabs /></Column></Row></Page>`),render:()=>n.jsx(C,{tree:n.jsx(T,{backgroundColor:"#f8fafc",contentWidth:"600px",children:n.jsx(b,{backgroundColor:"#ffffff",padding:"10px 0px",children:n.jsx(w,{children:n.jsx(K,{containerPadding:"24px 20px 30px"})})})})})},_={parameters:y(`// Same tool, two instances, different values — the head css is scoped
// per instance (via values._meta.htmlID), so styles never bleed across.
<Page><Row><Column>
  <Accordion />
  <Accordion
    titleBackgroundColor="#111827"
    titleTextColor="#f9fafb"
    titleHoverBackground="#1f2937"
    descriptionBackgroundColor="#f9fafb"
  />
</Column></Row></Page>`),render:()=>n.jsx(C,{tree:n.jsx(T,{backgroundColor:"#f8fafc",contentWidth:"600px",children:n.jsx(b,{backgroundColor:"#ffffff",padding:"10px 0px",children:n.jsxs(w,{children:[n.jsx(j,{containerPadding:"20px 20px 8px"}),n.jsx(j,{titleBackgroundColor:"#111827",titleTextColor:"#f9fafb",titleHoverBackground:"#1f2937",descriptionBackgroundColor:"#f9fafb",containerPadding:"8px 20px 28px"})]})})})})},P={parameters:y(`// Email clients strip JS, so the email exporters adapt the interaction
// away: accordion panels render expanded; tabs become stacked sections.
renderToHtml(
  <Email><Row><Column>
    <Accordion />
    <Tabs />
  </Column></Row></Email>
);`),render:()=>n.jsx(C,{tree:n.jsx(M,{backgroundColor:"#f8fafc",contentWidth:"600px",children:n.jsx(b,{backgroundColor:"#ffffff",padding:"10px 0px",children:n.jsxs(w,{children:[n.jsx(S,{fontSize:"18px",fontWeight:700,containerPadding:"24px 20px 4px",children:"As an email — no JS, everything visible"}),n.jsx(j,{containerPadding:"12px 20px"}),n.jsx(K,{containerPadding:"6px 20px 28px"})]})})})})},$={parameters:y(`const productLibraryTool = {
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
</Column></Row></Email>`),render:()=>n.jsx(C,{tree:n.jsx(M,{backgroundColor:"#f1f5f9",contentWidth:"600px",children:n.jsx(b,{padding:"14px 0px",children:n.jsx(w,{children:n.jsx(Ce,{containerPadding:"24px 20px"})})})})})},A={parameters:y(`const qrTool = {
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

<Email><Row><Column><QrCode width="35" /></Column></Row></Email>`),render:()=>n.jsx(C,{tree:n.jsx(M,{backgroundColor:"#ffffff",contentWidth:"600px",children:n.jsx(b,{children:n.jsxs(w,{children:[n.jsx(S,{fontSize:"18px",fontWeight:700,textAlign:"center",containerPadding:"26px 20px 2px",children:"Scan for your ticket"}),n.jsx(ye,{width:"35",containerPadding:"8px 20px 30px"})]})})})})},V={parameters:y(`// The gallery original builds a Google Static Maps URL (needs an API
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

<Page><Row><Column><OsmMap zoom="15" /></Column></Row></Page>`),render:()=>n.jsx(C,{tree:n.jsx(T,{backgroundColor:"#f8fafc",contentWidth:"640px",children:n.jsx(b,{backgroundColor:"#ffffff",padding:"10px 0px",children:n.jsxs(w,{children:[n.jsx(S,{fontSize:"20px",fontWeight:700,containerPadding:"24px 20px 4px",children:"Find us here"}),n.jsx(Te,{containerPadding:"12px 20px 28px"})]})})})})};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  parameters: sourceFor(\`const accordionTool = {
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
      css: (v) => \\\\\\\`#\\\\\\\${v._meta.htmlID}-root .ua-acc-title { background: \\\\\\\${v.titleBackgroundColor}; … }\\\\\\\`,
      js:  () => \\\\\\\`window.__uaAccordionToggle = window.__uaAccordionToggle || function (el) { … }\\\\\\\`,
    },
  },
};

const Accordion = registerTool(accordionTool);

<Page><Row><Column><Accordion /></Column></Row></Page>\`),
  render: () => <LiveParts tree={<Page backgroundColor="#f8fafc" contentWidth="600px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Heading fontSize="20px" fontWeight={700} containerPadding="24px 20px 6px">
                Frequently asked questions
              </Heading>
              <Accordion containerPadding="10px 20px 28px" />
            </Column>
          </Row>
        </Page>} />
}`,...k.parameters?.docs?.source},description:{story:"Interactive accordion — click a title to toggle its panel.",...k.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  parameters: sourceFor(\`const tabTool = {
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
      web:   (v) => /* tab bar + panels with per-instance ids (\\\\\\\${v._meta.htmlID}-panel-N) */,
      email: (v) => /* stacked titled sections */,
    },
    head: {
      css: (v) => /* scoped: #\\\\\\\${v._meta.htmlID}-root .ua-tablink.active { color: \\\\\\\${v.activeTabColor}; } */,
      js:  () => /* window.__uaOpenTab — switches panels within the tool's own container */,
    },
  },
};

const Tabs = registerTool(tabTool);

<Page><Row><Column><Tabs /></Column></Row></Page>\`),
  render: () => <LiveParts tree={<Page backgroundColor="#f8fafc" contentWidth="600px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Tabs containerPadding="24px 20px 30px" />
            </Column>
          </Row>
        </Page>} />
}`,...v.parameters?.docs?.source},description:{story:"Interactive tabs — per-instance panel ids, container-scoped switching.",...v.parameters?.docs?.description}}};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  parameters: sourceFor(\`// Same tool, two instances, different values — the head css is scoped
// per instance (via values._meta.htmlID), so styles never bleed across.
<Page><Row><Column>
  <Accordion />
  <Accordion
    titleBackgroundColor="#111827"
    titleTextColor="#f9fafb"
    titleHoverBackground="#1f2937"
    descriptionBackgroundColor="#f9fafb"
  />
</Column></Row></Page>\`),
  render: () => <LiveParts tree={<Page backgroundColor="#f8fafc" contentWidth="600px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Accordion containerPadding="20px 20px 8px" />
              <Accordion titleBackgroundColor="#111827" titleTextColor="#f9fafb" titleHoverBackground="#1f2937" descriptionBackgroundColor="#f9fafb" containerPadding="8px 20px 28px" />
            </Column>
          </Row>
        </Page>} />
}`,..._.parameters?.docs?.source},description:{story:"Two instances with different colors — per-instance scoping means no clashes.",..._.parameters?.docs?.description}}};P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  parameters: sourceFor(\`// Email clients strip JS, so the email exporters adapt the interaction
// away: accordion panels render expanded; tabs become stacked sections.
renderToHtml(
  <Email><Row><Column>
    <Accordion />
    <Tabs />
  </Column></Row></Email>
);\`),
  render: () => <LiveParts tree={<Email backgroundColor="#f8fafc" contentWidth="600px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Heading fontSize="18px" fontWeight={700} containerPadding="24px 20px 4px">
                As an email — no JS, everything visible
              </Heading>
              <Accordion containerPadding="12px 20px" />
              <Tabs containerPadding="6px 20px 28px" />
            </Column>
          </Row>
        </Email>} />
}`,...P.parameters?.docs?.source},description:{story:"The email renders: accordion panels expanded, tabs as stacked sections.",...P.parameters?.docs?.description}}};$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  parameters: sourceFor(\`const productLibraryTool = {
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
</Column></Row></Email>\`),
  render: () => <LiveParts tree={<Email backgroundColor="#f1f5f9" contentWidth="600px">
          <Row padding="14px 0px">
            <Column>
              <ProductLibrary containerPadding="24px 20px" />
            </Column>
          </Row>
        </Email>} />
}`,...$.parameters?.docs?.source},description:{story:"The gallery's product card: image, rich description, price/CTA footer.",...$.parameters?.docs?.description}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  parameters: sourceFor(\`const qrTool = {
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

<Email><Row><Column><QrCode width="35" /></Column></Row></Email>\`),
  render: () => <LiveParts tree={<Email backgroundColor="#ffffff" contentWidth="600px">
          <Row>
            <Column>
              <Heading fontSize="18px" fontWeight={700} textAlign="center" containerPadding="26px 20px 2px">
                Scan for your ticket
              </Heading>
              <QrCode width="35" containerPadding="8px 20px 30px" />
            </Column>
          </Row>
        </Email>} />
}`,...A.parameters?.docs?.source},description:{story:"QR code — the Builder generates the code via a property-editor widget.",...A.parameters?.docs?.description}}};V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  parameters: sourceFor(\`// The gallery original builds a Google Static Maps URL (needs an API
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

<Page><Row><Column><OsmMap zoom="15" /></Column></Row></Page>\`),
  render: () => <LiveParts tree={<Page backgroundColor="#f8fafc" contentWidth="640px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Heading fontSize="20px" fontWeight={700} containerPadding="24px 20px 4px">
                Find us here
              </Heading>
              <OsmMap containerPadding="12px 20px 28px" />
            </Column>
          </Row>
        </Page>} />
}`,...V.parameters?.docs?.source},description:{story:"Map — keyless OpenStreetMap tiles computed from lat/lon/zoom in the exporter.",...V.parameters?.docs?.description}}};const Fe=["AccordionTool","TabsTool","TwoIndependentAccordions","EmailAdaptations","ProductLibraryTool","QrCodeTool","MapTool"];export{k as AccordionTool,P as EmailAdaptations,V as MapTool,$ as ProductLibraryTool,A as QrCodeTool,v as TabsTool,_ as TwoIndependentAccordions,Fe as __namedExportsOrder,Be as default};
