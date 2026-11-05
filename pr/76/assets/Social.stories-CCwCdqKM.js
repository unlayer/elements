import{j as e}from"./jsx-runtime-Qf3qns3a.js";import{a as h,b as y,d as g}from"./SideBySide-CfkqG_yh.js";import{F as m,I as c,M as f}from"./shared-DuwPCDP_.js";import{S as l,b as n,P as p}from"./render-Bv3q7nXI.js";import"./iframe-CSaRab9Y.js";import"./preload-helper-PPVm8Dsz.js";const C={title:"Components/Social",args:y,argTypes:h,parameters:{docs:{description:{component:"Links to social profiles: `icons` has each network's `name` and the `href` of its profile, and each icon is the network's own, by that name. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it. The icons are files on Unlayer's CDN, so they need the network to show."}}}},d=g,o=[{name:"Facebook",href:"https://facebook.com/acme"},{name:"X",href:"https://x.com/acme"},{name:"Instagram",href:"https://instagram.com/acme"},{name:"LinkedIn",href:"https://linkedin.com/company/acme"},{name:"YouTube",href:"https://youtube.com/acme"}],s=d(t=>e.jsx(t,{width:560,style:{color:c,fontFamily:m},children:e.jsxs(l,{style:{padding:24,gap:20},children:[e.jsx(n,{icons:o}),e.jsx(n,{icons:o,iconType:"rounded"}),e.jsx(n,{icons:o,iconType:"squared"})]})})),a=d(t=>e.jsx(t,{width:560,style:{color:c,fontFamily:m},children:e.jsxs(l,{style:{padding:24,gap:20},children:[e.jsx(n,{icons:o,size:24,style:{gap:6}}),e.jsx(n,{icons:o,size:32,style:{gap:12}}),e.jsx(n,{icons:o,size:48,style:{gap:20},mobile:{gap:8}})]})})),i=d(t=>e.jsx(t,{width:560,style:{color:c,fontFamily:m},children:e.jsxs(l,{style:{padding:24,gap:20},children:[e.jsx(n,{icons:o.slice(0,3),style:{justifyContent:"start"}}),e.jsx(n,{icons:o.slice(0,3),style:{justifyContent:"center"}}),e.jsx(n,{icons:o.slice(0,3),style:{justifyContent:"end"}})]})})),r=d(t=>e.jsxs(t,{width:560,style:{color:c,fontFamily:m},children:[e.jsxs(l,{style:{backgroundColor:c,padding:24,gap:12},children:[e.jsx(n,{icons:[{name:"Facebook",href:"https://facebook.com/acme"},{name:"X",href:"https://x.com/acme"},{name:"Instagram",href:"https://instagram.com/acme"},{name:"Email",href:"mailto:hello@example.com"}],size:28,style:{gap:8}}),e.jsx(p,{style:{fontSize:12,color:"#CBD2D9",textAlign:"center"},children:"Follow along, or write to us."})]}),e.jsx(l,{style:{padding:16},children:e.jsx(p,{style:{fontSize:12,color:f,textAlign:"center"},children:"Acme Inc., 1 Market St, San Francisco"})})]}));s.__docgenInfo={description:"`iconType` is their shape: circles by default, rounded or squared.",methods:[],displayName:"IconTypes"};a.__docgenInfo={description:"`size` is each icon's width and height, and `gap` the space between them; `mobile` has another gap on phones.",methods:[],displayName:"Sizes"};i.__docgenInfo={description:"`justifyContent` puts them on the left, in the center or on the right.",methods:[],displayName:"Alignment"};r.__docgenInfo={description:"An email's footer: small icons, a mail link among them, on a dark band.",methods:[],displayName:"Footer"};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 20
  }}>
      <Social icons={ICONS} />
      <Social icons={ICONS} iconType="rounded" />
      <Social icons={ICONS} iconType="squared" />
    </Section>
  </Root>)`,...s.parameters?.docs?.source},description:{story:"`iconType` is their shape: circles by default, rounded or squared.",...s.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 20
  }}>
      <Social icons={ICONS} size={24} style={{
      gap: 6
    }} />
      <Social icons={ICONS} size={32} style={{
      gap: 12
    }} />
      <Social icons={ICONS} size={48} style={{
      gap: 20
    }} mobile={{
      gap: 8
    }} />
    </Section>
  </Root>)`,...a.parameters?.docs?.source},description:{story:"`size` is each icon's width and height, and `gap` the space between them; `mobile` has another gap on phones.",...a.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 20
  }}>
      <Social icons={ICONS.slice(0, 3)} style={{
      justifyContent: "start"
    }} />
      <Social icons={ICONS.slice(0, 3)} style={{
      justifyContent: "center"
    }} />
      <Social icons={ICONS.slice(0, 3)} style={{
      justifyContent: "end"
    }} />
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"`justifyContent` puts them on the left, in the center or on the right.",...i.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: INK,
    padding: 24,
    gap: 12
  }}>
      <Social icons={[{
      name: "Facebook",
      href: "https://facebook.com/acme"
    }, {
      name: "X",
      href: "https://x.com/acme"
    }, {
      name: "Instagram",
      href: "https://instagram.com/acme"
    }, {
      name: "Email",
      href: "mailto:hello@example.com"
    }]} size={28} style={{
      gap: 8
    }} />
      <Paragraph style={{
      fontSize: 12,
      color: "#CBD2D9",
      textAlign: "center"
    }}>Follow along, or write to us.</Paragraph>
    </Section>
    <Section style={{
    padding: 16
  }}>
      <Paragraph style={{
      fontSize: 12,
      color: MUTED,
      textAlign: "center"
    }}>Acme Inc., 1 Market St, San Francisco</Paragraph>
    </Section>
  </Root>)`,...r.parameters?.docs?.source},description:{story:"An email's footer: small icons, a mail link among them, on a dark band.",...r.parameters?.docs?.description}}};const F=["IconTypes","Sizes","Alignment","Footer"];export{i as Alignment,r as Footer,s as IconTypes,a as Sizes,F as __namedExportsOrder,C as default};
