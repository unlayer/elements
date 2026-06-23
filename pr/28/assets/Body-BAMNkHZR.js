import{j as g}from"./jsx-runtime-DOsOwh2B.js";import{R as c}from"./iframe-BxJB5v_i.js";import{D as R,i as _,m as B,R as T,j as u}from"./create-component-OmXHvtaT.js";import{B as b}from"./Column-VFd-Tmc7.js";const C=b,p=150,v=[" ","‌","​","‍","‎","‏","\uFEFF"];function E(o){if(!o||o.trim().length===0)return"";const e=o.length>p?o.slice(0,p):o,t=Math.max(0,p-e.length);let i="";for(let n=0;n<t;n++)i+=v[n%v.length];return'<div data-skip-in-text="true" style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">'+e+i+"</div>"}function F(o,e,t,i){let n=o;if(t==="email"&&i){const s=E(i);s&&(n=s+o)}const a=u[t]||u.web;return(t==="document"?a(n,e,{type:""}):t==="email"?a(n,e,{bodyValues:e}):a(n,e,e)).replace("min-height: 100vh; ","").replace("min-height: 100vh;","")}const x=o=>{const{children:e,mode:t,className:i,style:n,index:a=0,config:f,previewText:s,...w}=o,y={...R,...f},h=t??y.mode??"web",P={...y,mode:h},d=_(C,B(w,C,"Body")),S={...d,_meta:{htmlID:`u_body_${a+1}`,htmlClassNames:"u_body",...d._meta||{}}};let l=e;e&&(l=c.Children.map(e,r=>c.isValidElement(r)?c.cloneElement(r,{_config:P,bodyValues:d}):r));let m="";if(l)try{m=T.renderToString(l)}catch(r){console.error("Body: Failed to render children:",r),m=""}try{const r=F(m,S,h,s);return g.jsx("div",{dangerouslySetInnerHTML:{__html:r},className:i,style:n})}catch(r){return console.error("Body rendering failed:",r),g.jsx("div",{className:i,style:n,children:e})}};x.displayName="Body";x.__docgenInfo={description:`Body - Universal Server/Client Component

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
\`\`\``,methods:[],displayName:"Body",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},config:{required:!1,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:"Optional config (replaces context-based config for Server Component usage)"},previewText:{required:!1,tsType:{name:"string"},description:"Preview text shown in email client inboxes (email mode only)"}},composes:["SemanticProps"]};export{x as B};
