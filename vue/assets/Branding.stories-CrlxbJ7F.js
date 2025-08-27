import{d as B,c as S,a as t,o as l,F as v,b as i,n as b,e as x}from"./iframe-BW1sJNFS.js";const C={key:0},k=B({__name:"Branding",props:{variant:{default:"default"},size:{default:"medium"},className:{default:""},style:{default:()=>({})}},setup(s){const n=s,r=S(()=>{const a="unlayer-branding",e={default:"unlayer-branding--default",minimal:"unlayer-branding--minimal",full:"unlayer-branding--full"},z={small:"unlayer-branding--small",medium:"unlayer-branding--medium",large:"unlayer-branding--large"};return[a,e[n.variant],z[n.size],n.className].filter(Boolean).join(" ")});return(a,e)=>(l(),t("div",{class:x(r.value),style:b(a.style)},[a.variant==="minimal"?(l(),t("span",C,"Made with Unlayer")):a.variant==="full"?(l(),t(v,{key:1},[e[0]||(e[0]=i("span",null,"Made with",-1)),e[1]||(e[1]=i("strong",null," Unlayer",-1))],64)):(l(),t(v,{key:2},[e[2]||(e[2]=i("span",null,"Made with ",-1)),e[3]||(e[3]=i("strong",null,"Unlayer",-1))],64))],6))}}),M=(s,n)=>{const r=s.__vccOpts||s;for(const[a,e]of n)r[a]=e;return r},y=M(k,[["__scopeId","data-v-17e870d4"]]),h={title:"Components/Branding",component:y,parameters:{layout:"centered",docs:{description:{component:'A branding component that displays "Made with Unlayer" in various styles and sizes.'}}},argTypes:{variant:{control:{type:"select"},options:["default","minimal","full"],description:"The visual variant of the branding"},size:{control:{type:"select"},options:["small","medium","large"],description:"The size of the branding component"},className:{control:{type:"text"},description:"Custom CSS class name"},style:{control:{type:"object"},description:"Custom CSS styles"}},tags:["autodocs"]},o={args:{}},d={args:{variant:"minimal"}},m={args:{variant:"full"}},c={args:{size:"small"}},p={args:{size:"large"}},u={args:{className:"custom-branding",style:{color:"#007bff",fontSize:"18px",fontWeight:"bold"}}},g={render:()=>({components:{Branding:y},template:`
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
}`,...c.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'large'
  }
}`,...p.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    className: 'custom-branding',
    style: {
      color: '#007bff',
      fontSize: '18px',
      fontWeight: 'bold'
    }
  }
}`,...u.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...f.parameters?.docs?.source}}};const A=["Default","Minimal","Full","Small","Large","CustomStyling","AllVariants","AllSizes"];export{f as AllSizes,g as AllVariants,u as CustomStyling,o as Default,m as Full,p as Large,d as Minimal,c as Small,A as __namedExportsOrder,h as default};
