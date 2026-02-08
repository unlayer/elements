import{t as s,i as a,c as M,a as N,s as w,b as n}from"./iframe-Cl_RREe7.js";import"./preload-helper-PPVm8Dsz.js";var A=s("<span>Made with Unlayer"),D=s("<span>Made with"),U=s("<strong> Unlayer"),I=s("<span>Made with "),T=s("<strong>Unlayer"),j=s("<div>");const r=e=>{const f=()=>e.variant||"default",z=()=>e.size||"medium",S=()=>e.className||"",b=()=>e.style||{},x="unlayer-branding",h={default:"unlayer-branding--default",minimal:"unlayer-branding--minimal",full:"unlayer-branding--full"},C={small:"unlayer-branding--small",medium:"unlayer-branding--medium",large:"unlayer-branding--large"},$=()=>[x,h[f()],C[z()],S()].filter(Boolean).join(" "),_=()=>{switch(f()){case"minimal":return A();case"full":return[D(),U()];default:return[I(),T()]}};return(()=>{var l=j();return a(l,_),M(t=>{var y=$(),B=b();return y!==t.e&&N(l,t.e=y),t.t=w(l,B,t.t),t},{e:void 0,t:void 0}),l})()};var v=s("<div style=display:flex;flexDirection:column;gap:20px;alignItems:center>");const L={title:"Components/Branding",component:r,parameters:{layout:"centered",docs:{description:{component:'A branding component that displays "Made with Unlayer" in various styles and sizes.'}}},argTypes:{variant:{control:{type:"select"},options:["default","minimal","full"],description:"The visual variant of the branding"},size:{control:{type:"select"},options:["small","medium","large"],description:"The size of the branding component"},className:{control:{type:"text"},description:"Custom CSS class name"},style:{control:{type:"object"},description:"Custom CSS styles"}},tags:["autodocs"]},i={args:{}},o={args:{variant:"minimal"}},c={args:{variant:"full"}},m={args:{size:"small"}},d={args:{size:"large"}},u={args:{className:"custom-branding",style:{color:"#007bff",fontSize:"18px",fontWeight:"bold"}}},p={render:()=>(()=>{var e=v();return a(e,n(r,{variant:"default"}),null),a(e,n(r,{variant:"minimal"}),null),a(e,n(r,{variant:"full"}),null),e})()},g={render:()=>(()=>{var e=v();return a(e,n(r,{size:"small"}),null),a(e,n(r,{size:"medium"}),null),a(e,n(r,{size:"large"}),null),e})()};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...i.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'minimal'
  }
}`,...o.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'full'
  }
}`,...c.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'small'
  }
}`,...m.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'large'
  }
}`,...d.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    className: 'custom-branding',
    style: {
      color: '#007bff',
      fontSize: '18px',
      fontWeight: 'bold'
    }
  }
}`,...u.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
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
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}};const V=["Default","Minimal","Full","Small","Large","CustomStyling","AllVariants","AllSizes"];export{g as AllSizes,p as AllVariants,u as CustomStyling,i as Default,c as Full,d as Large,o as Minimal,m as Small,V as __namedExportsOrder,L as default};
