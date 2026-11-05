import{j as e}from"./jsx-runtime-THifDsy3.js";import{ad as b,ae as F,aw as a,aq as r,S as o,H as n,P as t,B as m,aS as A,C as f}from"./SideBySide-BdbHV3aE.js";import{F as h,I as p,W as y,B as S,M as w}from"./shared-DuwPCDP_.js";import"./iframe-D8KOAXBp.js";import"./preload-helper-PPVm8Dsz.js";const v={title:"Components/Page",args:F,argTypes:b,parameters:{docs:{description:{component:"A web page, a template's root: its own settings are its `width` and the props beside it, and its `style` has the window's background and the text everything inherits. \"Show code\" has each one's template."}}}},s=a("Page",e.jsx(r,{width:480,style:{color:p,fontFamily:h},children:e.jsxs(o,{style:{backgroundColor:y,padding:[32,24],gap:8},children:[e.jsx(n,{level:2,style:{fontSize:22},children:"At most 480px of content"}),e.jsx(t,{style:{fontSize:15},children:"The default is 1200px. The band behind this text runs the whole window."})]})})),i=a("Page",e.jsx(r,{width:640,style:{backgroundColor:"#0F172A",color:"#E2E8F0",fontFamily:"Georgia, serif",fontSize:18,lineHeight:1.7,textAlign:"center"},mobile:{fontSize:16},children:e.jsxs(o,{style:{padding:40,gap:12},children:[e.jsx(n,{level:1,style:{fontSize:34},children:"From the root's style"}),e.jsx(t,{children:"This text sets nothing of its own: its color, its font, its size and its alignment are all the Page's."})]})})),l=a("Page",e.jsxs(r,{width:560,style:{backgroundColor:y,color:p,fontFamily:h,gap:16,alignItems:"center",textAlign:"center"},children:[e.jsx(n,{level:2,style:{fontSize:22,padding:[24,0,0,0]},children:"16px between each"}),e.jsx(f,{style:{width:360,padding:20,backgroundColor:"#FFFFFF",borderRadius:8},children:e.jsx(t,{style:{fontSize:15},children:"A card."})}),e.jsx(m,{href:"https://example.com",style:{backgroundColor:S,borderRadius:6},children:"And a button"}),e.jsx(t,{style:{fontSize:12,color:w,padding:[0,0,24,0]},children:"The end of the page."})]})),d=a("Page",e.jsx(r,{width:560,title:"Acme, for teams",description:"Acme keeps your team's work in one place.",lang:"en",style:{color:p,fontFamily:h},children:e.jsxs(o,{style:{padding:24,gap:8},children:[e.jsx(n,{level:2,style:{fontSize:22},children:"Nothing here shows the settings"}),e.jsx(t,{style:{fontSize:15,color:w},children:"A browser's tab shows the title, and a search engine the description."})]})})),c=a("Page",e.jsx(r,{width:560,dir:"rtl",lang:"ar",style:{color:p,fontFamily:h},children:e.jsxs(o,{style:{backgroundColor:y,padding:32,gap:12,alignItems:"start"},children:[e.jsx(n,{level:1,style:{fontSize:28},children:"مرحبا بكم"}),e.jsx(t,{style:{fontSize:16},children:"شكرا لزيارتكم موقعنا."}),e.jsx(m,{href:"https://example.com",style:{backgroundColor:S,borderRadius:6},children:"ابدأ الآن"})]})})),P=[["Fast","Pages load before you've finished clicking."],["Safe","Backups every hour, kept for a year."],["Shared","Your whole team, in one place."]],g=a("Page",e.jsxs(r,{width:760,title:"Acme",style:{backgroundColor:"#0F172A",color:"#F8FAFC",fontFamily:h},children:[e.jsxs(o,{style:{padding:[56,24],gap:16,alignItems:"center",textAlign:"center"},children:[e.jsx(n,{level:1,style:{fontSize:44,lineHeight:1.1},children:"Your team's work, in one place"}),e.jsx(t,{style:{fontSize:17,color:"#94A3B8"},children:"Everything you make, findable by everyone who needs it."}),e.jsx(m,{href:"https://example.com/start",style:{backgroundColor:"#6366F1",padding:[14,28],borderRadius:8,fontSize:15},hover:{backgroundColor:"#4F46E5"},children:"Start free"})]}),e.jsx(o,{style:{padding:[0,24,56,24]},children:e.jsx(A,{columns:3,style:{gap:16},children:P.map(([u,x])=>e.jsxs(f,{style:{gap:8,padding:20,backgroundColor:"#1E293B",borderRadius:12},children:[e.jsx(n,{level:3,style:{fontSize:17},children:u}),e.jsx(t,{style:{fontSize:14,color:"#94A3B8"},children:x})]},u))})})]}));s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`showing("Page", <Page width={480} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: WASH,
    padding: [32, 24],
    gap: 8
  }}>
      <Heading level={2} style={{
      fontSize: 22
    }}>At most 480px of content</Heading>
      <Paragraph style={{
      fontSize: 15
    }}>The default is 1200px. The band behind this text runs the whole window.</Paragraph>
    </Section>
  </Page>)`,...s.parameters?.docs?.source},description:{story:"`width` is the widest the content gets; a `Section`'s background still reaches the window's edges.",...s.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`showing("Page", <Page width={640} style={{
  backgroundColor: "#0F172A",
  color: "#E2E8F0",
  fontFamily: "Georgia, serif",
  fontSize: 18,
  lineHeight: 1.7,
  textAlign: "center"
}} mobile={{
  fontSize: 16
}}>
    <Section style={{
    padding: 40,
    gap: 12
  }}>
      <Heading level={1} style={{
      fontSize: 34
    }}>From the root's style</Heading>
      <Paragraph>This text sets nothing of its own: its color, its font, its size and its alignment are all the Page's.</Paragraph>
    </Section>
  </Page>)`,...i.parameters?.docs?.source},description:{story:"Text styles on the root are inherited by everything in it, and `backgroundColor` is the window's.",...i.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`showing("Page", <Page width={560} style={{
  backgroundColor: WASH,
  color: INK,
  fontFamily: FONT,
  gap: 16,
  alignItems: "center",
  textAlign: "center"
}}>
    <Heading level={2} style={{
    fontSize: 22,
    padding: [24, 0, 0, 0]
  }}>16px between each</Heading>
    <Column style={{
    width: 360,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8
  }}>
      <Paragraph style={{
      fontSize: 15
    }}>A card.</Paragraph>
    </Column>
    <Button href="https://example.com" style={{
    backgroundColor: BRAND,
    borderRadius: 6
  }}>And a button</Button>
    <Paragraph style={{
    fontSize: 12,
    color: MUTED,
    padding: [0, 0, 24, 0]
  }}>The end of the page.</Paragraph>
  </Page>)`,...l.parameters?.docs?.source},description:{story:"`gap` is the space between the root's children, and `alignItems` where they sit, with `textAlign` for the text: here all in the middle.",...l.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`showing("Page", <Page width={560} title="Acme, for teams" description="Acme keeps your team's work in one place." lang="en" style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 8
  }}>
      <Heading level={2} style={{
      fontSize: 22
    }}>Nothing here shows the settings</Heading>
      <Paragraph style={{
      fontSize: 15,
      color: MUTED
    }}>A browser's tab shows the title, and a search engine the description.</Paragraph>
    </Section>
  </Page>)`,...d.parameters?.docs?.source},description:{story:"`title` is the browser tab's, `description` the page's meta description, and `lang` its language: none shows on the page.",...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`showing("Page", <Page width={560} dir="rtl" lang="ar" style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: WASH,
    padding: 32,
    gap: 12,
    alignItems: "start"
  }}>
      <Heading level={1} style={{
      fontSize: 28
    }}>مرحبا بكم</Heading>
      <Paragraph style={{
      fontSize: 16
    }}>شكرا لزيارتكم موقعنا.</Paragraph>
      <Button href="https://example.com" style={{
      backgroundColor: BRAND,
      borderRadius: 6
    }}>ابدأ الآن</Button>
    </Section>
  </Page>)`,...c.parameters?.docs?.source},description:{story:'`dir="rtl"` writes the whole page from the right, and `lang` says its language.',...c.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`showing("Page", <Page width={760} title="Acme" style={{
  backgroundColor: "#0F172A",
  color: "#F8FAFC",
  fontFamily: FONT
}}>
    <Section style={{
    padding: [56, 24],
    gap: 16,
    alignItems: "center",
    textAlign: "center"
  }}>
      <Heading level={1} style={{
      fontSize: 44,
      lineHeight: 1.1
    }}>Your team's work, in one place</Heading>
      <Paragraph style={{
      fontSize: 17,
      color: "#94A3B8"
    }}>Everything you make, findable by everyone who needs it.</Paragraph>
      <Button href="https://example.com/start" style={{
      backgroundColor: "#6366F1",
      padding: [14, 28],
      borderRadius: 8,
      fontSize: 15
    }} hover={{
      backgroundColor: "#4F46E5"
    }}>Start free</Button>
    </Section>
    <Section style={{
    padding: [0, 24, 56, 24]
  }}>
      <Grid columns={3} style={{
      gap: 16
    }}>
        {FEATURES.map(([name, line]) => <Column key={name} style={{
        gap: 8,
        padding: 20,
        backgroundColor: "#1E293B",
        borderRadius: 12
      }}>
            <Heading level={3} style={{
          fontSize: 17
        }}>{name}</Heading>
            <Paragraph style={{
          fontSize: 14,
          color: "#94A3B8"
        }}>{line}</Paragraph>
          </Column>)}
      </Grid>
    </Section>
  </Page>)`,...g.parameters?.docs?.source},description:{story:"A landing page in the dark: a hero, three features and a last word, all on the root's background.",...g.parameters?.docs?.description}}};const H=["Width","InheritedText","GapAndAlignment","TitleAndDescription","RightToLeft","Landing"];export{l as GapAndAlignment,i as InheritedText,g as Landing,c as RightToLeft,d as TitleAndDescription,s as Width,H as __namedExportsOrder,v as default};
