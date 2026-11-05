import{j as e}from"./jsx-runtime-Qf3qns3a.js";import{a as f,b as x,d as w}from"./SideBySide-CfkqG_yh.js";import{F as h,I as a,B as g,W as y,M as u,L as b}from"./shared-DuwPCDP_.js";import{S as n,H as m,P as o,B as S}from"./render-Bv3q7nXI.js";import"./iframe-CSaRab9Y.js";import"./preload-helper-PPVm8Dsz.js";const k={title:"Components/Section",args:x,argTypes:f,parameters:{docs:{description:{component:'A band across the whole window, directly in an Email or a Page: its background spans the window, and its children are stacked at the content width. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.'}}}},p=w,s=p(t=>e.jsxs(t,{width:400,style:{color:a,fontFamily:h},children:[e.jsx(n,{style:{backgroundColor:g,color:"#FFFFFF",padding:[20,24]},children:e.jsx(m,{level:2,style:{fontSize:20},children:"A band across the window"})}),e.jsx(n,{style:{padding:[20,24]},children:e.jsx(o,{style:{fontSize:15},children:"The text stays at the content width, 400px here."})}),e.jsx(n,{style:{backgroundColor:y,padding:[20,24]},children:e.jsx(o,{style:{fontSize:15,color:u},children:"Another band, in another color."})})]})),r=p(t=>e.jsxs(t,{width:560,style:{color:a,fontFamily:h},children:[e.jsxs(n,{style:{backgroundColor:y,padding:[40,24],gap:24},children:[e.jsx(m,{level:3,style:{fontSize:18},children:"More padding, a wider gap"}),e.jsx(o,{style:{fontSize:15},children:"24px under the heading."})]}),e.jsxs(n,{style:{padding:[8,24],gap:4},children:[e.jsx(m,{level:3,style:{fontSize:18},children:"Less padding, a smaller gap"}),e.jsx(o,{style:{fontSize:15},children:"4px under the heading."})]})]})),i=p(t=>e.jsxs(t,{width:560,style:{color:a,fontFamily:h},children:[e.jsx(n,{style:{padding:16,alignItems:"start"},children:e.jsx(S,{href:"https://example.com",style:{backgroundColor:g},children:"On the left"})}),e.jsx(n,{style:{padding:16,alignItems:"center",backgroundColor:y},children:e.jsx(S,{href:"https://example.com",style:{backgroundColor:g},children:"In the center"})}),e.jsx(n,{style:{padding:16,alignItems:"end"},children:e.jsx(S,{href:"https://example.com",style:{backgroundColor:g},children:"On the right"})})]})),d=p(t=>e.jsxs(t,{width:560,style:{color:a,fontFamily:h},children:[e.jsx(n,{style:{padding:24,border:{top:`4px solid ${g}`}},children:e.jsx(o,{style:{fontSize:15},children:"An accent along the top."})}),e.jsx(n,{style:{padding:24,border:{bottom:b}},children:e.jsx(o,{style:{fontSize:15},children:"A hairline along the bottom."})})]})),l=p(t=>e.jsx(t,{width:560,style:{color:a,fontFamily:h},children:e.jsxs(n,{style:{backgroundColor:a,color:"#FFFFFF",padding:[32,24],gap:8,textAlign:"center",fontFamily:"Georgia, serif"},children:[e.jsx(m,{level:2,style:{fontSize:26},children:"White, centered, in a serif"}),e.jsx(o,{style:{fontSize:15},children:"All of it from the Section's own style."})]})})),c=p(t=>e.jsx(t,{width:560,style:{color:a,fontFamily:h},children:e.jsxs(n,{style:{backgroundColor:y,padding:[48,40],gap:24,fontSize:18},mobile:{padding:[20,16],gap:8,fontSize:15,textAlign:"center"},children:[e.jsx(o,{children:"Roomy on desktop."}),e.jsx(o,{children:"Tighter and centered on phones."})]})}));s.__docgenInfo={description:"Each `Section`'s background reaches the window's edges, whatever the template's width.",methods:[],displayName:"Bands"};r.__docgenInfo={description:"`padding` is the space inside the band, and `gap` the space between what it holds.",methods:[],displayName:"Spacing"};i.__docgenInfo={description:"`alignItems` says where what it holds sits across the width.",methods:[],displayName:"Alignment"};d.__docgenInfo={description:"`border` draws a line on any side of the band: an accent on top, a hairline below.",methods:[],displayName:"Borders"};l.__docgenInfo={description:"A section's text styles are inherited by what it holds, so a dark band needs no color on each line.",methods:[],displayName:"InheritedText"};c.__docgenInfo={description:'`mobile` has its padding, gap and text on phones: choose "phone" under width to see it.',methods:[],displayName:"OnPhones"};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`story(Root => <Root width={400} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: BRAND,
    color: "#FFFFFF",
    padding: [20, 24]
  }}>
      <Heading level={2} style={{
      fontSize: 20
    }}>A band across the window</Heading>
    </Section>
    <Section style={{
    padding: [20, 24]
  }}>
      <Paragraph style={{
      fontSize: 15
    }}>The text stays at the content width, 400px here.</Paragraph>
    </Section>
    <Section style={{
    backgroundColor: WASH,
    padding: [20, 24]
  }}>
      <Paragraph style={{
      fontSize: 15,
      color: MUTED
    }}>Another band, in another color.</Paragraph>
    </Section>
  </Root>)`,...s.parameters?.docs?.source},description:{story:"Each `Section`'s background reaches the window's edges, whatever the template's width.",...s.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: WASH,
    padding: [40, 24],
    gap: 24
  }}>
      <Heading level={3} style={{
      fontSize: 18
    }}>More padding, a wider gap</Heading>
      <Paragraph style={{
      fontSize: 15
    }}>24px under the heading.</Paragraph>
    </Section>
    <Section style={{
    padding: [8, 24],
    gap: 4
  }}>
      <Heading level={3} style={{
      fontSize: 18
    }}>Less padding, a smaller gap</Heading>
      <Paragraph style={{
      fontSize: 15
    }}>4px under the heading.</Paragraph>
    </Section>
  </Root>)`,...r.parameters?.docs?.source},description:{story:"`padding` is the space inside the band, and `gap` the space between what it holds.",...r.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 16,
    alignItems: "start"
  }}>
      <Button href="https://example.com" style={{
      backgroundColor: BRAND
    }}>On the left</Button>
    </Section>
    <Section style={{
    padding: 16,
    alignItems: "center",
    backgroundColor: WASH
  }}>
      <Button href="https://example.com" style={{
      backgroundColor: BRAND
    }}>In the center</Button>
    </Section>
    <Section style={{
    padding: 16,
    alignItems: "end"
  }}>
      <Button href="https://example.com" style={{
      backgroundColor: BRAND
    }}>On the right</Button>
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"`alignItems` says where what it holds sits across the width.",...i.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    border: {
      top: \`4px solid \${BRAND}\`
    }
  }}>
      <Paragraph style={{
      fontSize: 15
    }}>An accent along the top.</Paragraph>
    </Section>
    <Section style={{
    padding: 24,
    border: {
      bottom: LINE
    }
  }}>
      <Paragraph style={{
      fontSize: 15
    }}>A hairline along the bottom.</Paragraph>
    </Section>
  </Root>)`,...d.parameters?.docs?.source},description:{story:"`border` draws a line on any side of the band: an accent on top, a hairline below.",...d.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: INK,
    color: "#FFFFFF",
    padding: [32, 24],
    gap: 8,
    textAlign: "center",
    fontFamily: "Georgia, serif"
  }}>
      <Heading level={2} style={{
      fontSize: 26
    }}>White, centered, in a serif</Heading>
      <Paragraph style={{
      fontSize: 15
    }}>All of it from the Section's own style.</Paragraph>
    </Section>
  </Root>)`,...l.parameters?.docs?.source},description:{story:"A section's text styles are inherited by what it holds, so a dark band needs no color on each line.",...l.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: WASH,
    padding: [48, 40],
    gap: 24,
    fontSize: 18
  }} mobile={{
    padding: [20, 16],
    gap: 8,
    fontSize: 15,
    textAlign: "center"
  }}>
      <Paragraph>Roomy on desktop.</Paragraph>
      <Paragraph>Tighter and centered on phones.</Paragraph>
    </Section>
  </Root>)`,...c.parameters?.docs?.source},description:{story:'`mobile` has its padding, gap and text on phones: choose "phone" under width to see it.',...c.parameters?.docs?.description}}};const z=["Bands","Spacing","Alignment","Borders","InheritedText","OnPhones"];export{i as Alignment,s as Bands,d as Borders,l as InheritedText,c as OnPhones,r as Spacing,z as __namedExportsOrder,k as default};
