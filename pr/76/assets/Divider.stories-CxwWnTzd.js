import{j as e}from"./jsx-runtime-BFY4Ddos.js";import{ad as m,ae as g,ax as w,S as l,P as d,D as o}from"./SideBySide-BmvNzgB7.js";import{F as p,I as h,B as a,M as y}from"./shared-DuwPCDP_.js";import"./iframe-CAP2aJCy.js";import"./preload-helper-PPVm8Dsz.js";const A={title:"Components/Divider",args:g,argTypes:m,parameters:{docs:{description:{component:'A horizontal line: `borderTop` draws it, `width` is how long it is, `padding` the space around it. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.'}}}},c=w,s=c(t=>e.jsx(t,{width:560,style:{color:h,fontFamily:p},children:e.jsxs(l,{style:{padding:24,gap:16},children:[e.jsx(d,{style:{fontSize:15},children:"Above the line."}),e.jsx(o,{}),e.jsx(d,{style:{fontSize:15},children:"Below the line."})]})})),n=c(t=>e.jsx(t,{width:560,style:{color:h,fontFamily:p},children:e.jsxs(l,{style:{padding:24,gap:24},children:[e.jsx(o,{style:{borderTop:"1px solid #9AA5B1"}}),e.jsx(o,{style:{borderTop:"1px dashed #9AA5B1"}}),e.jsx(o,{style:{borderTop:"2px dotted #9AA5B1"}}),e.jsx(o,{style:{borderTop:{width:4,style:"solid",color:a}}})]})})),i=c(t=>e.jsx(t,{width:560,style:{color:h,fontFamily:p},children:e.jsxs(l,{style:{padding:24,gap:24},children:[e.jsx(o,{style:{borderTop:`2px solid ${a}`,width:"80%"}}),e.jsx(o,{style:{borderTop:`2px solid ${a}`,width:"50%"}}),e.jsx(o,{style:{borderTop:`2px solid ${a}`,width:80}})]})})),r=c(t=>e.jsx(t,{width:560,style:{color:h,fontFamily:p},children:e.jsxs(l,{style:{padding:24},children:[e.jsx(d,{style:{fontSize:15,color:y},children:"Space comes from the divider's own padding here."}),e.jsx(o,{style:{borderTop:"1px solid #9AA5B1",padding:[24,0]}}),e.jsx(d,{style:{fontSize:15,color:y},children:"On phones, the one below runs the whole width, with less space."}),e.jsx(o,{style:{borderTop:`2px solid ${a}`,width:"50%",padding:[32,0]},mobile:{width:"100%",padding:[16,0]}}),e.jsx(d,{style:{fontSize:15,color:y},children:"And the last line of text."})]})}));s.__docgenInfo={description:"With nothing set: a thin gray line, the whole width.",methods:[],displayName:"Default"};n.__docgenInfo={description:"`borderTop` is written as CSS writes it, or as `{ width, style, color }`: solid, dashed, dotted, heavy, in a color.",methods:[],displayName:"Lines"};i.__docgenInfo={description:"`width` makes it shorter than its place, in px or as a share.",methods:[],displayName:"Widths"};r.__docgenInfo={description:"`padding` is the space around the line, and `mobile` has its width and padding on phones.",methods:[],displayName:"Spacing"};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16
  }}>
      <Paragraph style={{
      fontSize: 15
    }}>Above the line.</Paragraph>
      <Divider />
      <Paragraph style={{
      fontSize: 15
    }}>Below the line.</Paragraph>
    </Section>
  </Root>)`,...s.parameters?.docs?.source},description:{story:"With nothing set: a thin gray line, the whole width.",...s.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 24
  }}>
      <Divider style={{
      borderTop: "1px solid #9AA5B1"
    }} />
      <Divider style={{
      borderTop: "1px dashed #9AA5B1"
    }} />
      <Divider style={{
      borderTop: "2px dotted #9AA5B1"
    }} />
      <Divider style={{
      borderTop: {
        width: 4,
        style: "solid",
        color: BRAND
      }
    }} />
    </Section>
  </Root>)`,...n.parameters?.docs?.source},description:{story:"`borderTop` is written as CSS writes it, or as `{ width, style, color }`: solid, dashed, dotted, heavy, in a color.",...n.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 24
  }}>
      <Divider style={{
      borderTop: \`2px solid \${BRAND}\`,
      width: "80%"
    }} />
      <Divider style={{
      borderTop: \`2px solid \${BRAND}\`,
      width: "50%"
    }} />
      <Divider style={{
      borderTop: \`2px solid \${BRAND}\`,
      width: 80
    }} />
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"`width` makes it shorter than its place, in px or as a share.",...i.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Paragraph style={{
      fontSize: 15,
      color: MUTED
    }}>Space comes from the divider's own padding here.</Paragraph>
      <Divider style={{
      borderTop: "1px solid #9AA5B1",
      padding: [24, 0]
    }} />
      <Paragraph style={{
      fontSize: 15,
      color: MUTED
    }}>On phones, the one below runs the whole width, with less space.</Paragraph>
      <Divider style={{
      borderTop: \`2px solid \${BRAND}\`,
      width: "50%",
      padding: [32, 0]
    }} mobile={{
      width: "100%",
      padding: [16, 0]
    }} />
      <Paragraph style={{
      fontSize: 15,
      color: MUTED
    }}>And the last line of text.</Paragraph>
    </Section>
  </Root>)`,...r.parameters?.docs?.source},description:{story:"`padding` is the space around the line, and `mobile` has its width and padding on phones.",...r.parameters?.docs?.description}}};const D=["Default","Lines","Widths","Spacing"];export{s as Default,n as Lines,r as Spacing,i as Widths,D as __namedExportsOrder,A as default};
