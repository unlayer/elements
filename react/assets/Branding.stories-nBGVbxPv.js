import{j as e}from"./jsx-runtime-D_zvdyIk.js";const a=({variant:c="default",size:d="medium",className:u="",style:p={}})=>{const g="unlayer-branding",f={default:"unlayer-branding--default",minimal:"unlayer-branding--minimal",full:"unlayer-branding--full"},y={small:"unlayer-branding--small",medium:"unlayer-branding--medium",large:"unlayer-branding--large"},x=[g,f[c],y[d],u].filter(Boolean).join(" "),v=()=>{switch(c){case"minimal":return e.jsx("span",{children:"Made with Unlayer"});case"full":return e.jsxs(e.Fragment,{children:[e.jsx("span",{children:"Made with"}),e.jsx("strong",{children:" Unlayer"})]});default:return e.jsxs(e.Fragment,{children:[e.jsx("span",{children:"Made with "}),e.jsx("strong",{children:"Unlayer"})]})}};return e.jsx("div",{className:x,style:p,children:v()})};a.__docgenInfo={description:"",methods:[],displayName:"Branding",props:{variant:{required:!1,tsType:{name:"union",raw:"'default' | 'minimal' | 'full'",elements:[{name:"literal",value:"'default'"},{name:"literal",value:"'minimal'"},{name:"literal",value:"'full'"}]},description:"Variant of the branding display",defaultValue:{value:"'default'",computed:!1}},size:{required:!1,tsType:{name:"union",raw:"'small' | 'medium' | 'large'",elements:[{name:"literal",value:"'small'"},{name:"literal",value:"'medium'"},{name:"literal",value:"'large'"}]},description:"Size of the branding",defaultValue:{value:"'medium'",computed:!1}},className:{required:!1,tsType:{name:"string"},description:"Custom CSS class name",defaultValue:{value:"''",computed:!1}},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:"Custom CSS styles",defaultValue:{value:"{}",computed:!1}}}};const h={title:"Components/Branding",component:a,parameters:{layout:"centered",docs:{description:{component:'A branding component that displays "Made with Unlayer" in various styles and sizes.'}}},argTypes:{variant:{control:{type:"select"},options:["default","minimal","full"],description:"The visual variant of the branding"},size:{control:{type:"select"},options:["small","medium","large"],description:"The size of the branding component"},className:{control:{type:"text"},description:"Custom CSS class name"},style:{control:{type:"object"},description:"Custom CSS styles"}},tags:["autodocs"]},s={args:{}},r={args:{variant:"minimal"}},n={args:{variant:"full"}},l={args:{size:"small"}},t={args:{size:"large"}},i={args:{className:"custom-branding",style:{color:"#007bff",fontSize:"18px",fontWeight:"bold"}}},o={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px",alignItems:"center"},children:[e.jsx(a,{variant:"default"}),e.jsx(a,{variant:"minimal"}),e.jsx(a,{variant:"full"})]})},m={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px",alignItems:"center"},children:[e.jsx(a,{size:"small"}),e.jsx(a,{size:"medium"}),e.jsx(a,{size:"large"})]})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'minimal'
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'full'
  }
}`,...n.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'small'
  }
}`,...l.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'large'
  }
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    className: 'custom-branding',
    style: {
      color: '#007bff',
      fontSize: '18px',
      fontWeight: 'bold'
    }
  }
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center'
  }}>
      <Branding variant="default" />
      <Branding variant="minimal" />
      <Branding variant="full" />
    </div>
}`,...o.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center'
  }}>
      <Branding size="small" />
      <Branding size="medium" />
      <Branding size="large" />
    </div>
}`,...m.parameters?.docs?.source}}};const b=["Default","Minimal","Full","Small","Large","CustomStyling","AllVariants","AllSizes"];export{m as AllSizes,o as AllVariants,i as CustomStyling,s as Default,n as Full,t as Large,r as Minimal,l as Small,b as __namedExportsOrder,h as default};
