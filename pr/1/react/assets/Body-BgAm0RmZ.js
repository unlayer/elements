import{j as c}from"./jsx-runtime-CMO6xtnS.js";import{r as v,R as s}from"./iframe-C1UADmNS.js";import{D as m,m as U,R as w,b as C}from"./create-component-BRRZvuvv.js";const T="__unlayerProviderActive";let d=null;function S(){return d||(d=v.createContext(m)),d}const g=({config:r,children:n})=>{const a=S(),o=v.useMemo(()=>({...m,...r,[T]:!0}),[r]);return c.jsx(a.Provider,{value:o,children:n})};g.displayName="UnlayerProvider";g.__docgenInfo={description:"",methods:[],displayName:"UnlayerProvider",props:{config:{required:!0,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};const B={_meta:{},backgroundColor:"#F7F8F9",backgroundImage:{url:"",fullWidth:!0,repeat:"no-repeat",size:"custom",position:"center"},contentAlign:"center",contentWidth:"500px",fontFamily:{label:"Arial",value:"arial,helvetica,sans-serif"},linkStyle:{body:!0,linkColor:"#0000ee",linkHoverColor:"#0000ee",linkUnderline:!0,linkHoverUnderline:!0},textColor:"#000000"},h=r=>{const{children:n,mode:a,className:o,style:p,index:x=0,config:P,..._}=r,u={...m,...P},i=a??u.mode??"web",b={...u,mode:i},y=U(_,B,"Body"),f={...y,_meta:{htmlID:`u_body_${x+1}`,htmlClassNames:"u_body",...y._meta||{}}};let l=n;n&&(l=s.Children.map(n,e=>s.isValidElement(e)?s.cloneElement(e,{_config:b}):e));let t="";if(l)try{t=w.renderToString(l)}catch(e){console.error("Body: Failed to render children:",e),t=""}try{const e=C[i]||C.web,R=(i==="document"?e(t,f,{type:""}):e(t,f)).replace("min-height: 100vh; ","").replace("min-height: 100vh;","");return c.jsx("div",{dangerouslySetInnerHTML:{__html:R},className:o,style:p})}catch(e){return console.error("Body rendering failed:",e),c.jsx("div",{className:o,style:p,children:n})}};h.displayName="Body";h.__docgenInfo={description:`Body - Universal Server/Client Component

Works in both Server Components and Client Components.
In Server Components, pass config as a prop.
In Client Components, config can come from UnlayerProvider context or props.

@example Server Component
\`\`\`tsx
<Body backgroundColor="#F7F8F9" contentWidth="600px" mode="web">
  <Row><Column><Text values={{...}} mode="web" /></Column></Row>
</Body>
\`\`\`

@example Client Component with Provider
\`\`\`tsx
<UnlayerProvider config={{ mode: "email" }}>
  <Body>...</Body>
</UnlayerProvider>
\`\`\``,methods:[],displayName:"Body",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},values:{required:!1,tsType:{name:"T"},description:""},mode:{required:!1,tsType:{name:"union",raw:'"web" | "email" | "document"',elements:[{name:"literal",value:'"web"'},{name:"literal",value:'"email"'},{name:"literal",value:'"document"'}]},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},config:{required:!1,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:"Optional config (replaces context-based config for Server Component usage)"}}};export{h as B,g as U};
