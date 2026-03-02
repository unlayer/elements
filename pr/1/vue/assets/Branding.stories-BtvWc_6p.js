import{d as B,c as S,a as t,F as v,b as l,n as b,e as x,o as i}from"./iframe-I69a5zrN.js";const C={key:0},k=B({__name:"Branding",props:{variant:{default:"default"},size:{default:"medium"},className:{default:""},style:{default:()=>({})}},setup(a){const n=a,s=S(()=>{const r="unlayer-branding",e={default:"unlayer-branding--default",minimal:"unlayer-branding--minimal",full:"unlayer-branding--full"},z={small:"unlayer-branding--small",medium:"unlayer-branding--medium",large:"unlayer-branding--large"};return[r,e[n.variant],z[n.size],n.className].filter(Boolean).join(" ")});return(r,e)=>(i(),t("div",{class:x(s.value),style:b(a.style)},[a.variant==="minimal"?(i(),t("span",C,"Made with Unlayer")):a.variant==="full"?(i(),t(v,{key:1},[e[0]||(e[0]=l("span",null,"Made with",-1)),e[1]||(e[1]=l("strong",null," Unlayer",-1))],64)):(i(),t(v,{key:2},[e[2]||(e[2]=l("span",null,"Made with ",-1)),e[3]||(e[3]=l("strong",null,"Unlayer",-1))],64))],6))}}),M=(a,n)=>{const s=a.__vccOpts||a;for(const[r,e]of n)s[r]=e;return s},y=M(k,[["__scopeId","data-v-17e870d4"]]),h={title:"Components/Branding",component:y,parameters:{layout:"centered",docs:{description:{component:'A branding component that displays "Made with Unlayer" in various styles and sizes.'}}},argTypes:{variant:{control:{type:"select"},options:["default","minimal","full"],description:"The visual variant of the branding"},size:{control:{type:"select"},options:["small","medium","large"],description:"The size of the branding component"},className:{control:{type:"text"},description:"Custom CSS class name"},style:{control:{type:"object"},description:"Custom CSS styles"}},tags:["autodocs"]},o={args:{}},d={args:{variant:"minimal"}},m={args:{variant:"full"}},c={args:{size:"small"}},u={args:{size:"large"}},p={args:{className:"custom-branding",style:{color:"#007bff",fontSize:"18px",fontWeight:"bold"}}},g={render:()=>({components:{Branding:y},template:`
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
        <Branding variant="default" />
        <Branding variant="minimal" />
        <Branding variant="full" />
      </div>
    `})},f={render:()=>({components:{Branding:y},template:`
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
        <Branding size="small" />
        <Branding size="medium" />
        <Branding size="large" />
      </div>
    `})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {}
}`,...o.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'minimal'
  }
}`,...d.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'full'
  }
}`,...m.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'small'
  }
}`,...c.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
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
  render: () => ({
    components: {
      Branding
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
        <Branding variant="default" />
        <Branding variant="minimal" />
        <Branding variant="full" />
      </div>
    \`
  })
}`,...g.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Branding
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
        <Branding size="small" />
        <Branding size="medium" />
        <Branding size="large" />
      </div>
    \`
  })
}`,...f.parameters?.docs?.source}}};const A=["Default","Minimal","Full","Small","Large","CustomStyling","AllVariants","AllSizes"];export{f as AllSizes,g as AllVariants,p as CustomStyling,o as Default,m as Full,u as Large,d as Minimal,c as Small,A as __namedExportsOrder,h as default};
