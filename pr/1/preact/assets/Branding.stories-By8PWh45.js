import{u as e}from"./jsxRuntime.module-BsseSJ0u.js";import{k as m}from"./iframe-D-BLp2VD.js";import"./preload-helper-PPVm8Dsz.js";const a=({variant:d="default",size:u="medium",className:p="",style:g={}})=>{const f="unlayer-branding",y={default:"unlayer-branding--default",minimal:"unlayer-branding--minimal",full:"unlayer-branding--full"},h={small:"unlayer-branding--small",medium:"unlayer-branding--medium",large:"unlayer-branding--large"},v=[f,y[d],h[u],p].filter(Boolean).join(" ");return e("div",{className:v,style:g,children:(()=>{switch(d){case"minimal":return e("span",{children:"Made with Unlayer"});case"full":return e(m,{children:[e("span",{children:"Made with"}),e("strong",{children:" Unlayer"})]});default:return e(m,{children:[e("span",{children:"Made with "}),e("strong",{children:"Unlayer"})]})}})()})},C={title:"Components/Branding",component:a,parameters:{layout:"centered",docs:{description:{component:'A branding component that displays "Made with Unlayer" in various styles and sizes.'}}},argTypes:{variant:{control:{type:"select"},options:["default","minimal","full"],description:"The visual variant of the branding"},size:{control:{type:"select"},options:["small","medium","large"],description:"The size of the branding component"},className:{control:{type:"text"},description:"Custom CSS class name"},style:{control:{type:"object"},description:"Custom CSS styles"}},tags:["autodocs"]},r={args:{}},n={args:{variant:"minimal"}},s={args:{variant:"full"}},t={args:{size:"small"}},i={args:{size:"large"}},l={args:{className:"custom-branding",style:{color:"#007bff",fontSize:"18px",fontWeight:"bold"}}},o={render:()=>e("div",{style:{display:"flex",flexDirection:"column",gap:"20px",alignItems:"center"},children:[e(a,{variant:"default"}),e(a,{variant:"minimal"}),e(a,{variant:"full"})]})},c={render:()=>e("div",{style:{display:"flex",flexDirection:"column",gap:"20px",alignItems:"center"},children:[e(a,{size:"small"}),e(a,{size:"medium"}),e(a,{size:"large"})]})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'minimal'
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'full'
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'small'
  }
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'large'
  }
}`,...i.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    className: 'custom-branding',
    style: {
      color: '#007bff',
      fontSize: '18px',
      fontWeight: 'bold'
    }
  }
}`,...l.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...o.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source}}};const B=["Default","Minimal","Full","Small","Large","CustomStyling","AllVariants","AllSizes"];export{c as AllSizes,o as AllVariants,l as CustomStyling,r as Default,s as Full,i as Large,n as Minimal,t as Small,B as __namedExportsOrder,C as default};
