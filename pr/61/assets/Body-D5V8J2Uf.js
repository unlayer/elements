import{j as h}from"./jsx-runtime-CC6rVHgd.js";import{R as c}from"./iframe-CZD6D2b4.js";import{D as T,b as P,m as _,l as R,o as B,p as x}from"./create-component-CqDgrZgD.js";import{B as E}from"./Column-mlAsMc3H.js";const C=E,u=150,w=[" ","‌","​","‍","‎","‏","\uFEFF"];function F(n){return n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function q(n){if(!n||n.trim().length===0)return"";const e=n.length>u?n.slice(0,u):n,o=Math.max(0,u-e.length);let i="";for(let r=0;r<o;r++)i+=w[r%w.length];return'<div data-skip-in-text="true" style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">'+F(e)+i+"</div>"}function U(n,e,o,i){let r=n;if(o==="email"&&i){const s=q(i);s&&(r=s+n)}const a=x[o]||x.web;return(o==="document"?a(r,e,{type:""}):o==="email"?a(r,e,{bodyValues:e}):a(r,e,e)).replace("min-height: 100vh; ","").replace("min-height: 100vh;","")}const b=n=>{const{children:e,mode:o,className:i,style:r,index:a=0,config:f,previewText:s,fonts:I,...v}=n,g={...T,...f},y=o??g.mode??"web",d={...g,mode:y};d.__ids={};const l=P(C,_(v,C,"Body")),S={...l,_meta:{htmlID:R(d,"u_body"),htmlClassNames:"u_body",...l._meta||{}}};let m=e;e&&(m=c.Children.map(e,t=>c.isValidElement(t)?c.cloneElement(t,{_config:d,bodyValues:l}):t));let p="";if(m)try{p=B.renderToString(m)}catch(t){console.error("Body: Failed to render children:",t),p=""}try{const t=U(p,S,y,s);return h.jsx("div",{dangerouslySetInnerHTML:{__html:t},className:i,style:r})}catch(t){return console.error("Body rendering failed:",t),h.jsx("div",{className:i,style:r,children:e})}};b.displayName="Body";b.__docgenInfo={description:`Body - Universal Server/Client Component

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
\`\`\``,methods:[],displayName:"Body",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},config:{required:!1,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:"Optional config (replaces context-based config for Server Component usage)"},previewText:{required:!1,tsType:{name:"string"},description:"Preview text shown in email client inboxes (email mode only)"},fonts:{required:!1,tsType:{name:"Array",elements:[{name:"signature",type:"object",raw:"{ url: string }",signature:{properties:[{key:"url",value:{name:"string",required:!0}}]}}],raw:"Array<{ url: string }>"},description:"Web font stylesheets the content uses (e.g. a Google Fonts CSS URL).\nrenderToHtml links them in the document head, with any `fonts` option."},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px") or a number (px).'},borderRadius:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Corner radius — a number (→ px) or CSS string ("8px").'}}};export{b as B};
