import{j as r}from"./jsx-runtime-BDQy9sJ1.js";import{R as C}from"./iframe-C74jFfCv.js";import{r as W}from"./register-tool-DbIvJNpN.js";import{m as R,a as v,b as _,U as G,D as N,s as K}from"./create-component-UlSCryGK.js";import{B as V,a as H,b as L,R as $,C as B}from"./Column-CqHPWsuJ.js";import{E as Q}from"./Email-D6g9utBr.js";import{B as X}from"./Body-Do6r5tBN.js";import{H as O}from"./Heading-B7flewb0.js";import"./preload-helper-PPVm8Dsz.js";function T(e){return r.jsx(X,{...e,mode:"web"})}T.displayName="Page";T.__docgenInfo={description:`Page - Renders with div/flexbox for responsive web display.

Thin wrapper around Body with mode locked to "web".

@example
\`\`\`tsx
<Page backgroundColor="#ffffff" contentWidth="960px">
  <Row><Column><Paragraph text="Hello" /></Column></Row>
</Page>
\`\`\``,methods:[],displayName:"Page"};function A(e,o,t=0){return{...e,_meta:{htmlID:`u_content_${o.toLowerCase()}_${t+1}`,htmlClassNames:`u_content_${o.toLowerCase()}`,...e._meta||{}}}}function z(e){const o=e.type;return o?.displayName||o?.name}function E(e){const o=[];return C.Children.forEach(e,t=>{C.isValidElement(t)&&o.push(t)}),o}function I(e,o=[]){const t=new Set(["children","mode","className","style","index","colIndex","cells","bodyValues","rowValues","_config","config","previewText","layout","collection",...o]),n={};for(const[i,a]of Object.entries(e))!t.has(i)&&a!==void 0&&(n[i]=a);return n}function D(e,o){return e[o]=(e[o]||0)+1,e[o]}function P(e,o,t,n,i,a,l,c){if(!e)return;const s=[o,t,{displayMode:n,isViewer:!1,variant:null,type:"rows",headConfig:i}],d=e.css?.(...s);d&&a.push(d);const p=e.js?.(...s);p&&l.push(p);const u=e.tags?.(...s);u&&c.push(...u)}function Z(e,o,t,n,i,a,l,c){const d=e.type[G];if(!d)return;const{name:p,defaultValues:u,propMapper:f}=d,{children:g,...m}=e.props,b=f({children:g,...m}),U=v(u,b),S=d.metaName??p.toLowerCase(),q=D(i,`u_content_${S}`),J=A(U,S,q-1),Y=d.head??_[p];P(Y,J,o,t,n,a,l,c)}function ee(e,o,t,n,i,a,l,c,s){const d=I(e.props),p=R(d,L,"Column"),u=D(a,"u_column"),f=A(v(L,p),"column",u-1),g=_.Column;P(g,f,o,n,i,l,c,s);const m=E(e.props.children);for(const b of m)Z(b,o,n,i,a,l,c,s)}function oe(e,o,t,n,i,a,l,c){const s=I(e.props,["layout"]),d=R(s,H,"Row"),p=D(i,"u_row"),u=A(v(H,d),"row",p-1),f=_.Row;P(f,u,o,t,n,a,l,c);const g=E(e.props.children);for(const m of g)z(m)==="Column"&&ee(m,o,u,t,n,i,a,l,c)}function te(e,o){const{displayMode:t}=o,n={hasFeature:o.headConfig?.hasFeature??(()=>!1),getInitialValues:o.headConfig?.getInitialValues??(()=>({}))},i=[],a=[],l=[],c={},s=I(e.props),d=R(s,V,"Body"),p=A(v(V,d),"body",0),u=_.Body;P(u,p,p,t,n,i,a,l);const f=E(e.props.children);for(const m of f)z(m)==="Row"&&oe(m,p,t,n,c,i,a,l);const g=[...new Set(l.filter(Boolean))];return{css:i.filter(Boolean).join(`
`),js:a.filter(Boolean).join(`
`),tags:g}}const ne={Email:"email",Page:"web",Document:"document"};function ae(e,o){const t=e.type?.displayName;return(t?ne[t]:void 0)??e.props.mode??o.mode??"web"}function re(e,o){const t={...N,...o};try{const n=C.cloneElement(e,{config:t});return K.renderToStaticMarkup(n)}catch(n){const i=n instanceof Error?n.message:String(n);throw new Error(`[Unlayer] renderToHtml failed: ${i}
Tip: Ensure your tree uses Body > Row > Column > Item structure.`)}}function ie(e,o){const t=re(e,o),n={...N,...o},i=ae(e,n),{css:a,js:l,tags:c}=te(e,{displayMode:i,headConfig:n.headConfig}),s=[];return a&&s.push(`<style>${a}</style>`),l&&s.push(`<script>${l}<\/script>`),c.length>0&&s.push(...c),{head:s.join(`
`),body:t}}const le={name:"accordion",options:{menu:{title:"Accordion Items",options:{accordionRow:{label:"Accordion Row",defaultValue:{items:[{title:"How long does shipping take?",description:"Orders ship within 24 hours and arrive in 3–5 business days. Express options are available at checkout."},{title:"What is the return policy?",description:"Everything can come back within 30 days, no questions asked. Returns are free in the continental US."},{title:"Do you offer support?",description:"Real humans answer within a few hours, seven days a week."}]},widget:"accordion_editor"}}},colors:{title:"Colors",options:{titleTextColor:{label:"Title Text Color",defaultValue:"#212121",widget:"color_picker"},descriptionTextColor:{label:"Description Text Color",defaultValue:"#212121",widget:"color_picker"},titleBackgroundColor:{label:"Title Background Color",defaultValue:"#FAFAFA",widget:"color_picker"},descriptionBackgroundColor:{label:"Description Background Color",defaultValue:"#ffffff",widget:"color_picker"},titleHoverBackground:{label:"Title Hover Background Color",defaultValue:"#ECEDEF",widget:"color_picker"}}},fontFamily:{title:"Fonts",options:{fontFamily:{label:"Title Font",defaultValue:{label:"Arial",value:"arial,helvetica,sans-serif"},widget:"font_family"}}}},values:{},renderer:{exporters:{web:e=>{const o=e.accordionRow?.items??[];if(o.length===0)return'<div style="padding:15px;border:2px dashed #ccc;background:#eee;color:#999;text-align:center;">Empty Accordion</div>';const t=o.map(n=>`
          <div>
            <div class="ua-acc-title" onclick="window.__uaAccordionToggle(this)">
              <span>${n.title}</span><span class="ua-acc-icon" style="font-size:20px;">+</span>
            </div>
            <div class="ua-acc-panel"><p style="margin:0;">${n.description}</p></div>
          </div>`).join("");return`<div id="${e._meta.htmlID}-root">${t}</div>`},email:e=>`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${(e.accordionRow?.items??[]).map(t=>`
            <tr><td style="background-color:${e.titleBackgroundColor};color:${e.titleTextColor};font-family:${e.fontFamily.value};font-weight:bold;padding:14px 20px;border-top:3px solid #ffffff;">${t.title}</td></tr>
            <tr><td style="background-color:${e.descriptionBackgroundColor};color:${e.descriptionTextColor};font-family:${e.fontFamily.value};padding:12px 20px;font-size:14px;line-height:1.5;">${t.description}</td></tr>`).join("")}</table>`},head:{css:e=>`
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
      };`}}},se={name:"tab_strip",options:{tabs:{title:"Tabs",options:{tabItem:{label:"Tabs",defaultValue:{items:[{title:"Overview",content:"A desk lamp with a machined aluminum base and warm, dimmable light — designed to disappear into your desk setup."},{title:"Specs",content:"2700–4000K adjustable temperature, 850 lumens, USB-C powered, 5-year warranty."},{title:"Reviews",content:"4.9/5 across 1,200 reviews. “The hinge alone is worth it.” — a very reasonable customer."}]},widget:"tab_editor"},titleTextColor:{label:"Tab Text",defaultValue:"#000000",widget:"color_picker"},contentTextColor:{label:"Content Text",defaultValue:"#000000",widget:"color_picker"},titleBackgroundColor:{label:"Tab Background",defaultValue:"#FDFDFD",widget:"color_picker"},contentBackgroundColor:{label:"Content Background",defaultValue:"#FDFDFD",widget:"color_picker"},activeTabColor:{label:"Active Tab",defaultValue:"#18B2B3",widget:"color_picker"},tabTitleFontFamily:{label:"Tab Font",defaultValue:{label:"Arial",value:"arial,helvetica,sans-serif"},widget:"font_family"}}}},values:{},renderer:{exporters:{web:e=>{const o=e.tabItem?.items??[],t=e._meta.htmlID;if(o.length===0)return'<div style="padding:15px;border:2px dashed #ccc;background:#eee;color:#999;text-align:center;">No Tabs</div>';const n=o.map((a,l)=>`<button class="ua-tablink${l===0?" active":""}" onclick="window.__uaOpenTab(this,'${t}-panel-${l}')">${a.title}</button>`).join(""),i=o.map((a,l)=>`<div id="${t}-panel-${l}" class="ua-tabcontent" style="display:${l===0?"block":"none"};"><p style="margin:0;">${a.content}</p></div>`).join("");return`<div id="${t}-root" class="ua-tabs"><div class="ua-tabbar">${n}</div>${i}</div>`},email:e=>`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${(e.tabItem?.items??[]).map(t=>`
            <tr><td style="font-family:${e.tabTitleFontFamily.value};color:${e.activeTabColor};font-weight:bold;font-size:15px;padding:16px 20px 6px;border-bottom:2px solid ${e.activeTabColor};">${t.title}</td></tr>
            <tr><td style="font-family:${e.tabTitleFontFamily.value};background-color:${e.contentBackgroundColor};color:${e.contentTextColor};padding:12px 20px 18px;font-size:14px;line-height:1.5;">${t.content}</td></tr>`).join("")}</table>`},head:{css:e=>`
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
      };`}}},k=W(le),M=W(se),F=({tree:e})=>{const{head:o,body:t}=C.useMemo(()=>ie(e),[e]),n=[...o.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(a=>a[1]).join(`
`),i=[...o.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(a=>a[1]).join(`
`);return C.useEffect(()=>{if(!i)return;const a=document.createElement("script");return a.textContent=i,document.body.appendChild(a),()=>a.remove()},[i]),r.jsxs(r.Fragment,{children:[r.jsx("style",{dangerouslySetInnerHTML:{__html:n}}),r.jsx("div",{dangerouslySetInnerHTML:{__html:t}})]})},he={title:"Custom Tools/Examples Gallery",tags:["autodocs"],parameters:{layout:"padded",docs:{description:{component:`
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
        `}}}},j=e=>({docs:{source:{language:"tsx",code:e}}}),x={parameters:j(`const accordionTool = {
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

<Page><Row><Column><Accordion /></Column></Row></Page>`),render:()=>r.jsx(F,{tree:r.jsx(T,{backgroundColor:"#f8fafc",contentWidth:"600px",children:r.jsx($,{backgroundColor:"#ffffff",padding:"10px 0px",children:r.jsxs(B,{children:[r.jsx(O,{fontSize:"20px",fontWeight:700,containerPadding:"24px 20px 6px",children:"Frequently asked questions"}),r.jsx(k,{containerPadding:"10px 20px 28px"})]})})})})},h={parameters:j(`const tabTool = {
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

<Page><Row><Column><Tabs /></Column></Row></Page>`),render:()=>r.jsx(F,{tree:r.jsx(T,{backgroundColor:"#f8fafc",contentWidth:"600px",children:r.jsx($,{backgroundColor:"#ffffff",padding:"10px 0px",children:r.jsx(B,{children:r.jsx(M,{containerPadding:"24px 20px 30px"})})})})})},w={parameters:j(`// Same tool, two instances, different values — the head css is scoped
// per instance (via values._meta.htmlID), so styles never bleed across.
<Page><Row><Column>
  <Accordion />
  <Accordion
    titleBackgroundColor="#111827"
    titleTextColor="#f9fafb"
    titleHoverBackground="#1f2937"
    descriptionBackgroundColor="#f9fafb"
  />
</Column></Row></Page>`),render:()=>r.jsx(F,{tree:r.jsx(T,{backgroundColor:"#f8fafc",contentWidth:"600px",children:r.jsx($,{backgroundColor:"#ffffff",padding:"10px 0px",children:r.jsxs(B,{children:[r.jsx(k,{containerPadding:"20px 20px 8px"}),r.jsx(k,{titleBackgroundColor:"#111827",titleTextColor:"#f9fafb",titleHoverBackground:"#1f2937",descriptionBackgroundColor:"#f9fafb",containerPadding:"8px 20px 28px"})]})})})})},y={parameters:j(`// Email clients strip JS, so the email exporters adapt the interaction
// away: accordion panels render expanded; tabs become stacked sections.
renderToHtml(
  <Email><Row><Column>
    <Accordion />
    <Tabs />
  </Column></Row></Email>
);`),render:()=>r.jsx(F,{tree:r.jsx(Q,{backgroundColor:"#f8fafc",contentWidth:"600px",children:r.jsx($,{backgroundColor:"#ffffff",padding:"10px 0px",children:r.jsxs(B,{children:[r.jsx(O,{fontSize:"18px",fontWeight:700,containerPadding:"24px 20px 4px",children:"As an email — no JS, everything visible"}),r.jsx(k,{containerPadding:"12px 20px"}),r.jsx(M,{containerPadding:"6px 20px 28px"})]})})})})};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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

const Accordion = registerElementsTool(accordionTool);

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
}`,...x.parameters?.docs?.source},description:{story:"Interactive accordion — click a title to toggle its panel.",...x.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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

const Tabs = registerElementsTool(tabTool);

<Page><Row><Column><Tabs /></Column></Row></Page>\`),
  render: () => <LiveParts tree={<Page backgroundColor="#f8fafc" contentWidth="600px">
          <Row backgroundColor="#ffffff" padding="10px 0px">
            <Column>
              <Tabs containerPadding="24px 20px 30px" />
            </Column>
          </Row>
        </Page>} />
}`,...h.parameters?.docs?.source},description:{story:"Interactive tabs — per-instance panel ids, container-scoped switching.",...h.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source},description:{story:"Two instances with different colors — per-instance scoping means no clashes.",...w.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source},description:{story:"The email renders: accordion panels expanded, tabs as stacked sections.",...y.parameters?.docs?.description}}};const we=["AccordionTool","TabsTool","TwoIndependentAccordions","EmailAdaptations"];export{x as AccordionTool,y as EmailAdaptations,h as TabsTool,w as TwoIndependentAccordions,we as __namedExportsOrder,he as default};
