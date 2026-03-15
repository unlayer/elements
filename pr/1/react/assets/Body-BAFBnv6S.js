import{j as l}from"./jsx-runtime-QZhfyhdM.js";import{R as t}from"./iframe-BtvyOEmj.js";import{D as h,m as S,R as T,r as B}from"./create-component-Dy-zN2hY.js";import{B as P}from"./Column-DhQ2jODN.js";const R=P,c=p=>{const{children:n,mode:y,className:s,style:i,index:f=0,config:u,previewText:C,...g}=p,a={...h,...u},d=y??a.mode??"web",v={...a,mode:d},m=S(g,R,"Body"),x={...m,_meta:{htmlID:`u_body_${f+1}`,htmlClassNames:"u_body",...m._meta||{}}};let o=n;n&&(o=t.Children.map(n,e=>t.isValidElement(e)?t.cloneElement(e,{_config:v}):e));let r="";if(o)try{r=T.renderToString(o)}catch(e){console.error("Body: Failed to render children:",e),r=""}try{const e=B({innerHTML:r,values:x,mode:d,previewText:C});return l.jsx("div",{dangerouslySetInnerHTML:{__html:e},className:s,style:i})}catch(e){return console.error("Body rendering failed:",e),l.jsx("div",{className:s,style:i,children:n})}};c.displayName="Body";c.__docgenInfo={description:`Body - Universal Server/Client Component

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
\`\`\``,methods:[],displayName:"Body",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},config:{required:!1,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:"Optional config (replaces context-based config for Server Component usage)"},previewText:{required:!1,tsType:{name:"string"},description:"Preview text shown in email client inboxes (email mode only)"}},composes:["SemanticProps"]};export{c as B};
