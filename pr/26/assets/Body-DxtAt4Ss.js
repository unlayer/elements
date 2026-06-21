import{j as g}from"./jsx-runtime-CG3iJa7w.js";import{R as c}from"./iframe-BDBWa6zR.js";import{D as S,m as R,R as _,j as u}from"./create-component-BATyVUxj.js";import{B}from"./Column-2nF3R12S.js";const T=B,p=150,C=[" ","‌","​","‍","‎","‏","\uFEFF"];function b(n){if(!n||n.trim().length===0)return"";const e=n.length>p?n.slice(0,p):n,i=Math.max(0,p-e.length);let t="";for(let o=0;o<i;o++)t+=C[o%C.length];return'<div data-skip-in-text="true" style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">'+e+t+"</div>"}function E(n,e,i,t){let o=n;if(i==="email"&&t){const s=b(t);s&&(o=s+n)}const a=u[i]||u.web;return(i==="document"?a(o,e,{type:""}):a(o,e,e)).replace("min-height: 100vh; ","").replace("min-height: 100vh;","")}const v=n=>{const{children:e,mode:i,className:t,style:o,index:a=0,config:f,previewText:s,...x}=n,y={...S,...f},h=i??y.mode??"web",w={...y,mode:h},d=R(x,T,"Body"),P={...d,_meta:{htmlID:`u_body_${a+1}`,htmlClassNames:"u_body",...d._meta||{}}};let l=e;e&&(l=c.Children.map(e,r=>c.isValidElement(r)?c.cloneElement(r,{_config:w,bodyValues:d}):r));let m="";if(l)try{m=_.renderToString(l)}catch(r){console.error("Body: Failed to render children:",r),m=""}try{const r=E(m,P,h,s);return g.jsx("div",{dangerouslySetInnerHTML:{__html:r},className:t,style:o})}catch(r){return console.error("Body rendering failed:",r),g.jsx("div",{className:t,style:o,children:e})}};v.displayName="Body";v.__docgenInfo={description:`Body - Universal Server/Client Component

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
\`\`\``,methods:[],displayName:"Body",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},config:{required:!1,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:"Optional config (replaces context-based config for Server Component usage)"},previewText:{required:!1,tsType:{name:"string"},description:"Preview text shown in email client inboxes (email mode only)"}},composes:["SemanticProps"]};export{v as B};
