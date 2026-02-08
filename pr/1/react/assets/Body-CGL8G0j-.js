import{j as c}from"./jsx-runtime-DpkTyRkt.js";import{r as C,R as l}from"./iframe-775iVVwO.js";import{D as m,m as b,R as T,x as f}from"./create-component-DVErpCgp.js";const w="__unlayerProviderActive";let d=null;function S(){return d||(d=C.createContext(m)),d}const v=({config:n,children:r})=>{const t=S(),o=C.useMemo(()=>({...m,...n,[w]:!0}),[n]);return c.jsx(t.Provider,{value:o,children:r})};v.displayName="UnlayerProvider";v.__docgenInfo={description:"",methods:[],displayName:"UnlayerProvider",props:{config:{required:!0,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:""},children:{required:!0,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""}}};const B={_meta:{},backgroundColor:"#F7F8F9",backgroundImage:{url:"",fullWidth:!0,repeat:"no-repeat",size:"custom",position:"center"},contentAlign:"center",contentWidth:"500px",fontFamily:{label:"Arial",value:"arial,helvetica,sans-serif"},linkStyle:{body:!0,linkColor:"#0000ee",linkHoverColor:"#0000ee",linkUnderline:!0,linkHoverUnderline:!0},textColor:"#000000"},g=n=>{const{children:r,mode:t,className:o,style:p,index:x=0,config:h,...P}=n,u={...m,...h},a=t??u.mode??"web",_={...u,mode:a},y=b(P,B,"Body"),R={...y,_meta:{htmlID:`u_body_${x+1}`,htmlClassNames:"u_body",...y._meta||{}}};let i=r;r&&(i=l.Children.map(r,e=>l.isValidElement(e)?l.cloneElement(e,{_config:_}):e));let s="";if(i)try{s=T.renderToString(i)}catch(e){console.error("Body: Failed to render children:",e),s=""}try{const U=(f[a]||f.web)(s,R,...a==="document"?[{type:""}]:[]);return c.jsx("div",{dangerouslySetInnerHTML:{__html:U},className:o,style:p})}catch(e){return console.error("Body rendering failed:",e),c.jsx("div",{className:o,style:p,children:r})}};g.displayName="Body";g.__docgenInfo={description:`Body - Universal Server/Client Component

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
\`\`\``,methods:[],displayName:"Body",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},values:{required:!1,tsType:{name:"T"},description:""},mode:{required:!1,tsType:{name:"union",raw:'"web" | "email" | "document"',elements:[{name:"literal",value:'"web"'},{name:"literal",value:'"email"'},{name:"literal",value:'"document"'}]},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},config:{required:!1,tsType:{name:"Partial",elements:[{name:"UnlayerConfig"}],raw:"Partial<UnlayerConfig>"},description:"Optional config (replaces context-based config for Server Component usage)"}}};export{g as B,v as U};
