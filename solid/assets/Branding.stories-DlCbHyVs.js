import{t as n,i as r,c as M,a as N,s as w,b as a,d as t}from"./iframe-BJtteAov.js";import"./preload-helper-D9Z9MdNV.js";var A=n("<span>Made with Unlayer"),I=n("<span>Made with"),U=n("<strong> Unlayer"),T=n("<span>Made with "),j=n("<strong>Unlayer"),E=n("<div>");const s=e=>{const y=()=>e.variant||"default",z=()=>e.size||"medium",b=()=>e.className||"",x=()=>e.style||{},h="unlayer-branding",C={default:"unlayer-branding--default",minimal:"unlayer-branding--minimal",full:"unlayer-branding--full"},$={small:"unlayer-branding--small",medium:"unlayer-branding--medium",large:"unlayer-branding--large"},_=()=>[h,C[y()],$[z()],b()].filter(Boolean).join(" "),B=()=>{switch(y()){case"minimal":return A();case"full":return[I(),U()];default:return[T(),j()]}};return(()=>{var i=E();return r(i,B),M(l=>{var v=_(),D=x();return v!==l.e&&N(i,l.e=v),l.t=w(i,D,l.t),l},{e:void 0,t:void 0}),i})()};var S=n("<div>");const V={title:"Components/Branding",component:s,parameters:{layout:"centered",docs:{description:{component:'A branding component that displays "Made with Unlayer" in various styles and sizes.'}}},argTypes:{variant:{control:{type:"select"},options:["default","minimal","full"],description:"The visual variant of the branding"},size:{control:{type:"select"},options:["small","medium","large"],description:"The size of the branding component"},className:{control:{type:"text"},description:"Custom CSS class name"},style:{control:{type:"object"},description:"Custom CSS styles"}},tags:["autodocs"]},o={args:{}},c={args:{variant:"minimal"}},m={args:{variant:"full"}},d={args:{size:"small"}},u={args:{size:"large"}},p={args:{className:"custom-branding",style:{color:"#007bff",fontSize:"18px",fontWeight:"bold"}}},g={render:()=>(()=>{var e=S();return a(e,"display","flex"),a(e,"flexDirection","column"),a(e,"gap","20px"),a(e,"alignItems","center"),r(e,t(s,{variant:"default"}),null),r(e,t(s,{variant:"minimal"}),null),r(e,t(s,{variant:"full"}),null),e})()},f={render:()=>(()=>{var e=S();return a(e,"display","flex"),a(e,"flexDirection","column"),a(e,"gap","20px"),a(e,"alignItems","center"),r(e,t(s,{size:"small"}),null),r(e,t(s,{size:"medium"}),null),r(e,t(s,{size:"large"}),null),e})()};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...o.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'minimal'
  }
}`,...c.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'full'
  }
}`,...m.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'small'
  }
}`,...d.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'large'
  }
}`,...u.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    className: 'custom-branding',
    style: {
      color: '#007bff',
      fontSize: '18px',
      fontWeight: 'bold'
    }
  }
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
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
}`,...f.parameters?.docs?.source}}};const W=["Default","Minimal","Full","Small","Large","CustomStyling","AllVariants","AllSizes"];export{f as AllSizes,g as AllVariants,p as CustomStyling,o as Default,m as Full,u as Large,c as Minimal,d as Small,W as __namedExportsOrder,V as default};
