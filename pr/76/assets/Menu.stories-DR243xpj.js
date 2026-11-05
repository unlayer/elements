import{j as e}from"./jsx-runtime-DIqnCnE3.js";import{ad as u,ae as x,ax as S,S as s,av as n,b as j,P as f}from"./SideBySide-CTZXQXkZ.js";import{F as m,I as r,B as g,M as y,W as F}from"./shared-DuwPCDP_.js";import"./iframe-PnVPNnO0.js";import"./preload-helper-PPVm8Dsz.js";const k={title:"Components/Menu",args:x,argTypes:u,parameters:{docs:{description:{component:'A line of links, or links down a column: `items` has each link\'s `text` and `href`, `style` their look. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.'}}}},h=S,o=[{text:"Home",href:"https://example.com"},{text:"About",href:"https://example.com/about"},{text:"Services",href:"https://example.com/services"},{text:"Contact",href:"https://example.com/contact"}],a=h(t=>e.jsx(t,{width:560,style:{color:r,fontFamily:m},children:e.jsxs(s,{style:{padding:24,gap:20,alignItems:"center"},children:[e.jsx(n,{items:[{text:"Pricing",href:"https://example.com/pricing"},{text:"Docs",href:"https://example.com/docs"},{text:"Blog",href:"https://example.com/blog"}],separator:"·",style:{fontSize:14,color:g,padding:[4,8]}}),e.jsx(j,{icons:[{name:"x",href:"https://x.com/acme"},{name:"instagram",href:"https://instagram.com/acme"},{name:"youtube",href:"https://youtube.com/acme"}],iconType:"circle",size:32,style:{gap:12}})]})})),i=h(t=>e.jsx(t,{width:560,style:{color:r,fontFamily:m},children:e.jsxs(s,{style:{padding:24,gap:20},children:[e.jsx(n,{items:o}),e.jsx(n,{items:o,separator:"|"}),e.jsx(n,{items:o,separator:"/",style:{color:g,separatorColor:"#9AA5B1"}})]})})),c=h(t=>e.jsx(t,{width:560,style:{color:r,fontFamily:m},children:e.jsx(s,{style:{padding:24},children:e.jsx(n,{items:o,layout:"vertical",style:{fontSize:15,color:g,padding:[6,0],justifyContent:"start"}})})})),l=h(t=>e.jsx(t,{width:560,style:{color:r,fontFamily:m},children:e.jsxs(s,{style:{padding:24,gap:16},children:[e.jsx(n,{items:o,style:{justifyContent:"start",padding:[4,16,4,0]}}),e.jsx(n,{items:o,style:{justifyContent:"center"}}),e.jsx(n,{items:o,style:{justifyContent:"end",padding:[4,0,4,16]}})]})})),p=h(t=>e.jsxs(t,{width:560,style:{color:r,fontFamily:m},children:[e.jsx(s,{style:{backgroundColor:r,padding:[8,16]},children:e.jsx(n,{items:o,style:{color:"#FFFFFF",fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:[12,16]}})}),e.jsx(s,{style:{padding:24},children:e.jsx(f,{style:{fontSize:15,color:y},children:"The page starts here."})})]})),d=h(t=>e.jsx(t,{width:560,style:{color:r,fontFamily:m},children:e.jsxs(s,{style:{backgroundColor:F,padding:24,gap:12},children:[e.jsx(n,{items:[{text:"Unsubscribe",href:"https://example.com/unsubscribe"},{text:"Preferences",href:"https://example.com/preferences"},{text:"Privacy",href:"https://example.com/privacy"}],separator:"|",style:{fontSize:12,color:y,separatorColor:"#CBD2D9",padding:[2,10]}}),e.jsx(f,{style:{fontSize:12,color:y,textAlign:"center"},children:"Acme Inc., 1 Market St, San Francisco"})]})}));a.__docgenInfo={description:"`Menu` for a line of links, `Social` for profiles' icons.",methods:[],displayName:"WithSocialIcons"};i.__docgenInfo={description:"With nothing set, and with a `separator` between the links, in a color of its own (phones show none).",methods:[],displayName:"Separators"};c.__docgenInfo={description:'`layout="vertical"` puts the links down a column.',methods:[],displayName:"Vertical"};l.__docgenInfo={description:"`justifyContent` puts the links on the left, in the center or on the right.",methods:[],displayName:"Alignment"};p.__docgenInfo={description:"A site's navigation: light, bold capitals on a dark band.",methods:[],displayName:"NavigationBar"};d.__docgenInfo={description:"An email's footer: small links, a quiet separator, the address under them.",methods:[],displayName:"FooterLinks"};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 20,
    alignItems: "center"
  }}>
      <Menu items={[{
      text: "Pricing",
      href: "https://example.com/pricing"
    }, {
      text: "Docs",
      href: "https://example.com/docs"
    }, {
      text: "Blog",
      href: "https://example.com/blog"
    }]} separator="·" style={{
      fontSize: 14,
      color: BRAND,
      padding: [4, 8]
    }} />
      <Social icons={[{
      name: "x",
      href: "https://x.com/acme"
    }, {
      name: "instagram",
      href: "https://instagram.com/acme"
    }, {
      name: "youtube",
      href: "https://youtube.com/acme"
    }]} iconType="circle" size={32} style={{
      gap: 12
    }} />
    </Section>
  </Root>)`,...a.parameters?.docs?.source},description:{story:"`Menu` for a line of links, `Social` for profiles' icons.",...a.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 20
  }}>
      <Menu items={ITEMS} />
      <Menu items={ITEMS} separator="|" />
      <Menu items={ITEMS} separator="/" style={{
      color: BRAND,
      separatorColor: "#9AA5B1"
    }} />
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"With nothing set, and with a `separator` between the links, in a color of its own (phones show none).",...i.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Menu items={ITEMS} layout="vertical" style={{
      fontSize: 15,
      color: BRAND,
      padding: [6, 0],
      justifyContent: "start"
    }} />
    </Section>
  </Root>)`,...c.parameters?.docs?.source},description:{story:'`layout="vertical"` puts the links down a column.',...c.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16
  }}>
      <Menu items={ITEMS} style={{
      justifyContent: "start",
      padding: [4, 16, 4, 0]
    }} />
      <Menu items={ITEMS} style={{
      justifyContent: "center"
    }} />
      <Menu items={ITEMS} style={{
      justifyContent: "end",
      padding: [4, 0, 4, 16]
    }} />
    </Section>
  </Root>)`,...l.parameters?.docs?.source},description:{story:"`justifyContent` puts the links on the left, in the center or on the right.",...l.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: INK,
    padding: [8, 16]
  }}>
      <Menu items={ITEMS} style={{
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "uppercase",
      padding: [12, 16]
    }} />
    </Section>
    <Section style={{
    padding: 24
  }}>
      <Paragraph style={{
      fontSize: 15,
      color: MUTED
    }}>The page starts here.</Paragraph>
    </Section>
  </Root>)`,...p.parameters?.docs?.source},description:{story:"A site's navigation: light, bold capitals on a dark band.",...p.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: WASH,
    padding: 24,
    gap: 12
  }}>
      <Menu items={[{
      text: "Unsubscribe",
      href: "https://example.com/unsubscribe"
    }, {
      text: "Preferences",
      href: "https://example.com/preferences"
    }, {
      text: "Privacy",
      href: "https://example.com/privacy"
    }]} separator="|" style={{
      fontSize: 12,
      color: MUTED,
      separatorColor: "#CBD2D9",
      padding: [2, 10]
    }} />
      <Paragraph style={{
      fontSize: 12,
      color: MUTED,
      textAlign: "center"
    }}>Acme Inc., 1 Market St, San Francisco</Paragraph>
    </Section>
  </Root>)`,...d.parameters?.docs?.source},description:{story:"An email's footer: small links, a quiet separator, the address under them.",...d.parameters?.docs?.description}}};const w=["WithSocialIcons","Separators","Vertical","Alignment","NavigationBar","FooterLinks"];export{l as Alignment,d as FooterLinks,p as NavigationBar,i as Separators,c as Vertical,a as WithSocialIcons,w as __namedExportsOrder,k as default};
