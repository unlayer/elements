import{j as g}from"./jsx-runtime-7XW1Bamv.js";import{R as c}from"./iframe-C9_knxBk.js";import{D as S,i as T,m as R,R as _,j as h}from"./create-component-BiMLqGDD.js";import{B}from"./Column-BA5dW-sz.js";const C=B,p=150,x=[" ","‌","​","‍","‎","‏","\uFEFF"];function E(r){if(!r||r.trim().length===0)return"";const e=r.length>p?r.slice(0,p):r,t=Math.max(0,p-e.length);let i="";for(let n=0;n<t;n++)i+=x[n%x.length];return'<div data-skip-in-text="true" style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">'+e+i+"</div>"}function F(r,e,t,i){let n=r;if(t==="email"&&i){const s=E(i);s&&(n=s+r)}const a=h[t]||h.web;return(t==="document"?a(n,e,{type:""}):t==="email"?a(n,e,{bodyValues:e}):a(n,e,e)).replace("min-height: 100vh; ","").replace("min-height: 100vh;","")}const w=r=>{const{children:e,mode:t,className:i,style:n,index:a=0,config:f,previewText:s,...v}=r,y={...S,...f},u=t??y.mode??"web",b={...y,mode:u},d=T(C,R(v,C,"Body")),P={...d,_meta:{htmlID:`u_body_${a+1}`,htmlClassNames:"u_body",...d._meta||{}}};let m=e;e&&(m=c.Children.map(e,o=>c.isValidElement(o)?c.cloneElement(o,{_config:b,bodyValues:d}):o));let l="";if(m)try{l=_.renderToString(m)}catch(o){console.error("Body: Failed to render children:",o),l=""}try{const o=F(l,P,u,s);return g.jsx("div",{dangerouslySetInnerHTML:{__html:o},className:i,style:n})}catch(o){return console.error("Body rendering failed:",o),g.jsx("div",{className:i,style:n,children:e})}};w.displayName="Body";w.__docgenInfo={description:`Body - Universal Server/Client Component

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
\`\`\``,methods:[],displayName:"Body",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},config:{required:!1,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:"Optional config (replaces context-based config for Server Component usage)"},previewText:{required:!1,tsType:{name:"string"},description:"Preview text shown in email client inboxes (email mode only)"},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px") or a number (px).'},containerPadding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:""}}};export{w as B};
