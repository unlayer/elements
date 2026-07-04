import{j as h}from"./jsx-runtime-BDQy9sJ1.js";import{R as c}from"./iframe-C74jFfCv.js";import{D as P,a as R,m as T,q as _,R as B,r as x}from"./create-component-UlSCryGK.js";import{B as E}from"./Column-CqHPWsuJ.js";const C=E,f=150,w=[" ","‌","​","‍","‎","‏","\uFEFF"];function F(r){if(!r||r.trim().length===0)return"";const e=r.length>f?r.slice(0,f):r,t=Math.max(0,f-e.length);let i="";for(let n=0;n<t;n++)i+=w[n%w.length];return'<div data-skip-in-text="true" style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">'+e+i+"</div>"}function q(r,e,t,i){let n=r;if(t==="email"&&i){const s=F(i);s&&(n=s+r)}const a=x[t]||x.web;return(t==="document"?a(n,e,{type:""}):t==="email"?a(n,e,{bodyValues:e}):a(n,e,e)).replace("min-height: 100vh; ","").replace("min-height: 100vh;","")}const v=r=>{const{children:e,mode:t,className:i,style:n,index:a=0,config:u,previewText:s,...b}=r,y={...P,...u},g=t??y.mode??"web",d={...y,mode:g};d.__ids={};const m=R(C,T(b,C,"Body")),S={...m,_meta:{htmlID:_(d,"u_body"),htmlClassNames:"u_body",...m._meta||{}}};let l=e;e&&(l=c.Children.map(e,o=>c.isValidElement(o)?c.cloneElement(o,{_config:d,bodyValues:m}):o));let p="";if(l)try{p=B.renderToString(l)}catch(o){console.error("Body: Failed to render children:",o),p=""}try{const o=q(p,S,g,s);return h.jsx("div",{dangerouslySetInnerHTML:{__html:o},className:i,style:n})}catch(o){return console.error("Body rendering failed:",o),h.jsx("div",{className:i,style:n,children:e})}};v.displayName="Body";v.__docgenInfo={description:`Body - Universal Server/Client Component

Works in both Server Components and Client Components.
In Server Components, pass config as a prop.
In Client Components, config can come from UnlayerProvider context or props.

@example Server Component
\`\`\`tsx
<Body backgroundColor="#F7F8F9" contentWidth="600px" mode="web">
  <Row><Column><Paragraph values={{...}} mode="web" /></Column></Row>
</Body>
\`\`\`

@example Client Component with Provider
\`\`\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body>...</Body>
</UnlayerProvider>
\`\`\``,methods:[],displayName:"Body",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},config:{required:!1,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:"Optional config (replaces context-based config for Server Component usage)"},previewText:{required:!1,tsType:{name:"string"},description:"Preview text shown in email client inboxes (email mode only)"},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px") or a number (px).'},borderRadius:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Corner radius — a number (→ px) or CSS string ("8px").'}}};export{v as B};
