import{j as e}from"./jsx-runtime-DbXT79Kj.js";import{ad as f,ae as F,aw as s,E as l,C as g,H as d,P as t,S as p,L as w,B as y}from"./SideBySide-CXr_9Qxy.js";import{F as c,I as h,W as m,B as u,M as x}from"./shared-DuwPCDP_.js";import"./iframe-BRFaxXMR.js";import"./preload-helper-PPVm8Dsz.js";const z={title:"Components/Email",args:F,argTypes:f,parameters:{docs:{description:{component:"An email, a template's root: its own settings are its `width` and the props beside it, and its `style` has the window's background and the text everything inherits. \"Show code\" has each one's template."}}}},n=s("Email",e.jsx(l,{width:420,style:{backgroundColor:m,color:h,fontFamily:c},children:e.jsxs(g,{style:{padding:24,gap:8,backgroundColor:"#FFFFFF"},children:[e.jsx(d,{level:2,style:{fontSize:20},children:"420px wide"}),e.jsx(t,{style:{fontSize:15},children:"The default is 600px. The window around it is the Email's own background."})]})})),i=s("Email",e.jsx(l,{width:560,style:{backgroundColor:"#FFFBEB",color:"#78350F",fontFamily:"Georgia, serif",fontSize:17,lineHeight:1.7,textAlign:"center"},mobile:{fontSize:15},children:e.jsxs(p,{style:{padding:32,gap:12},children:[e.jsx(d,{level:1,style:{fontSize:30},children:"From the root's style"}),e.jsx(t,{children:"This text sets nothing of its own: its color, its font, its size and its alignment are all the Email's."}),e.jsxs(t,{children:["A ",e.jsx(w,{href:"https://example.com",style:{color:"#B45309"},children:"link"})," sets only its color."]})]})})),o=s("Email",e.jsxs(l,{width:560,style:{backgroundColor:m,color:h,fontFamily:c,gap:16,alignItems:"center",textAlign:"center"},children:[e.jsx(d,{level:2,style:{fontSize:20,padding:[24,0,0,0]},children:"16px between each"}),e.jsx(g,{style:{width:360,padding:20,backgroundColor:"#FFFFFF",borderRadius:8},children:e.jsx(t,{style:{fontSize:15},children:"A card."})}),e.jsx(g,{style:{width:360,padding:20,backgroundColor:"#FFFFFF",borderRadius:8},children:e.jsx(t,{style:{fontSize:15},children:"Another card."})}),e.jsx(y,{href:"https://example.com",style:{backgroundColor:u,borderRadius:6},children:"And a button"}),e.jsx(t,{style:{fontSize:12,color:x,padding:[0,0,24,0]},children:"Sent by Acme."})]})),r=s("Email",e.jsx(l,{width:560,previewText:"Your receipt is inside, and a note about shipping",title:"Your receipt",lang:"en",style:{color:h,fontFamily:c},children:e.jsxs(p,{style:{padding:24,gap:8},children:[e.jsx(d,{level:2,style:{fontSize:20},children:"Nothing here shows the settings"}),e.jsx(t,{style:{fontSize:15,color:x},children:"An inbox shows the preview text after the subject; the email itself doesn't."})]})})),a=s("Email",e.jsx(l,{width:560,dir:"rtl",lang:"ar",style:{backgroundColor:m,color:h,fontFamily:c},children:e.jsxs(p,{style:{padding:32,gap:12,alignItems:"start"},children:[e.jsx(d,{level:1,style:{fontSize:28},children:"مرحبا بكم"}),e.jsx(t,{style:{fontSize:16},children:"شكرا لاشتراككم في نشرتنا."}),e.jsx(y,{href:"https://example.com",style:{backgroundColor:u,borderRadius:6},children:"ابدأ الآن"})]})}));n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`showing("Email", <Email width={420} style={{
  backgroundColor: WASH,
  color: INK,
  fontFamily: FONT
}}>
    <Column style={{
    padding: 24,
    gap: 8,
    backgroundColor: "#FFFFFF"
  }}>
      <Heading level={2} style={{
      fontSize: 20
    }}>420px wide</Heading>
      <Paragraph style={{
      fontSize: 15
    }}>The default is 600px. The window around it is the Email's own background.</Paragraph>
    </Column>
  </Email>)`,...n.parameters?.docs?.source},description:{story:"`width` is the content's: the window around it takes the root's background.",...n.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`showing("Email", <Email width={560} style={{
  backgroundColor: "#FFFBEB",
  color: "#78350F",
  fontFamily: "Georgia, serif",
  fontSize: 17,
  lineHeight: 1.7,
  textAlign: "center"
}} mobile={{
  fontSize: 15
}}>
    <Section style={{
    padding: 32,
    gap: 12
  }}>
      <Heading level={1} style={{
      fontSize: 30
    }}>From the root's style</Heading>
      <Paragraph>This text sets nothing of its own: its color, its font, its size and its alignment are all the Email's.</Paragraph>
      <Paragraph>
        A <Link href="https://example.com" style={{
        color: "#B45309"
      }}>link</Link> sets only its color.
      </Paragraph>
    </Section>
  </Email>)`,...i.parameters?.docs?.source},description:{story:"Text styles on the root are inherited by everything in it: its color, font, size, line height and alignment.",...i.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`showing("Email", <Email width={560} style={{
  backgroundColor: WASH,
  color: INK,
  fontFamily: FONT,
  gap: 16,
  alignItems: "center",
  textAlign: "center"
}}>
    <Heading level={2} style={{
    fontSize: 20,
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
    <Column style={{
    width: 360,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8
  }}>
      <Paragraph style={{
      fontSize: 15
    }}>Another card.</Paragraph>
    </Column>
    <Button href="https://example.com" style={{
    backgroundColor: BRAND,
    borderRadius: 6
  }}>And a button</Button>
    <Paragraph style={{
    fontSize: 12,
    color: MUTED,
    padding: [0, 0, 24, 0]
  }}>Sent by Acme.</Paragraph>
  </Email>)`,...o.parameters?.docs?.source},description:{story:"`gap` is the space between the root's children, and `alignItems` where they sit, with `textAlign` for the text: here all in the middle.",...o.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`showing("Email", <Email width={560} previewText="Your receipt is inside, and a note about shipping" title="Your receipt" lang="en" style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 8
  }}>
      <Heading level={2} style={{
      fontSize: 20
    }}>Nothing here shows the settings</Heading>
      <Paragraph style={{
      fontSize: 15,
      color: MUTED
    }}>An inbox shows the preview text after the subject; the email itself doesn't.</Paragraph>
    </Section>
  </Email>)`,...r.parameters?.docs?.source},description:{story:"`previewText` shows after the subject in an inbox, and `title` and `lang` describe the document: none shows in the email.",...r.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`showing("Email", <Email width={560} dir="rtl" lang="ar" style={{
  backgroundColor: WASH,
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 32,
    gap: 12,
    alignItems: "start"
  }}>
      <Heading level={1} style={{
      fontSize: 28
    }}>مرحبا بكم</Heading>
      <Paragraph style={{
      fontSize: 16
    }}>شكرا لاشتراككم في نشرتنا.</Paragraph>
      <Button href="https://example.com" style={{
      backgroundColor: BRAND,
      borderRadius: 6
    }}>ابدأ الآن</Button>
    </Section>
  </Email>)`,...a.parameters?.docs?.source},description:{story:'`dir="rtl"` writes the whole email from the right, and `lang` says its language.',...a.parameters?.docs?.description}}};const k=["Width","InheritedText","GapAndAlignment","PreviewTextAndTitle","RightToLeft"];export{o as GapAndAlignment,i as InheritedText,r as PreviewTextAndTitle,a as RightToLeft,n as Width,k as __namedExportsOrder,z as default};
