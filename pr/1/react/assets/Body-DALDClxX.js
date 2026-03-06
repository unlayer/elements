import{j as m}from"./jsx-runtime-BmHDSO9P.js";import{R as t}from"./iframe-Bl8K1Mum.js";import{D as x,m as P,a as S,r as T}from"./index-BdhjsKVo.js";const b={_meta:{},backgroundColor:"#F7F8F9",backgroundImage:{url:"",fullWidth:!0,repeat:"no-repeat",size:"custom",position:"center"},contentAlign:"center",contentWidth:"500px",fontFamily:{label:"Arial",value:"arial,helvetica,sans-serif"},linkStyle:{body:!0,linkColor:"#0000ee",linkHoverColor:"#0000ee",linkUnderline:!0,linkHoverUnderline:!0},textColor:"#000000"},c=p=>{const{children:n,mode:y,className:i,style:a,index:u=0,config:f,previewText:C,...g}=p,s={...x,...f},l=y??s.mode??"web",v={...s,mode:l},d=P(g,b,"Body"),h={...d,_meta:{htmlID:`u_body_${u+1}`,htmlClassNames:"u_body",...d._meta||{}}};let o=n;n&&(o=t.Children.map(n,e=>t.isValidElement(e)?t.cloneElement(e,{_config:v}):e));let r="";if(o)try{r=S.renderToString(o)}catch(e){console.error("Body: Failed to render children:",e),r=""}try{const e=T({innerHTML:r,values:h,mode:l,previewText:C});return m.jsx("div",{dangerouslySetInnerHTML:{__html:e},className:i,style:a})}catch(e){return console.error("Body rendering failed:",e),m.jsx("div",{className:i,style:a,children:n})}};c.displayName="Body";c.__docgenInfo={description:`Body - Universal Server/Client Component

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
\`\`\``,methods:[],displayName:"Body",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},mode:{required:!1,tsType:{name:"DisplayMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},config:{required:!1,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:"Optional config (replaces context-based config for Server Component usage)"},previewText:{required:!1,tsType:{name:"string"},description:"Preview text shown in email client inboxes (email mode only)"}},composes:["SemanticProps"]};export{c as B};
