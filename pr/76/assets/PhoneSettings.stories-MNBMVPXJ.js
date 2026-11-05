import{j as e}from"./jsx-runtime-Cf-MKpCd.js";import{a as x,d as S}from"./SideBySide-C5zoQ7Ex.js";import{F as l,I as r,M as u,l as g,W as w,B as R}from"./shared-DuwPCDP_.js";import{S as m,H as b,P as d,C as o,I as y,B as p,R as f,T as c}from"./render-k9Rgha0b.js";import"./iframe-qU7x7_dT.js";import"./preload-helper-PPVm8Dsz.js";const T={title:"Components/Phone settings",args:{width:"phone"},argTypes:x,parameters:{docs:{description:{component:'What changes on phones: `mobile={{ }}` has a box\'s or text\'s styles there, `hidden={{ }}` leaves it out on one or the other, and a `Row` stacks. These stories open in a phone\'s window; choose "desktop" under width for the same template on a wider one. Each is drawn as an Email and as a Page, from one template; "Show code" has it.'}}}},h=S,t=h(n=>e.jsx(n,{width:560,style:{color:r,fontFamily:l},children:e.jsxs(m,{style:{padding:24,gap:12},children:[e.jsx(b,{level:1,style:{fontSize:34},mobile:{fontSize:24,textAlign:"center"},children:"Smaller and centered on phones"}),e.jsx(d,{hidden:{mobile:!0},style:{color:u},children:"Only on a wider window."}),e.jsx(d,{hidden:{desktop:!0},style:{color:u},children:"Only on a phone."})]})})),s=h(n=>e.jsx(n,{width:600,style:{backgroundColor:"#F3F5F1",fontFamily:l},children:e.jsxs(o,{style:{backgroundColor:"#FFFFFF",padding:[36,40]},mobile:{padding:[24,20]},children:[e.jsx(d,{style:{color:"#355B48",fontSize:12,letterSpacing:2},children:"DESIGN PREVIEW"}),e.jsx(b,{level:1,style:{padding:[16,0],fontSize:38,fontWeight:400,lineHeight:1.15,color:"#20372A"},mobile:{fontSize:30,textAlign:"center"},children:"Room to read. On every screen."}),e.jsx(o,{style:{padding:[8,0,20,0],alignItems:"center"},mobile:{padding:[4,0,16,0]},children:e.jsx(y,{src:g(),alt:"Green hills under a warm sun",style:{width:"75%"},mobile:{width:"100%"}})}),e.jsx(d,{style:{padding:[0,0,24,0],color:"#526358",fontSize:16,lineHeight:1.6},mobile:{fontSize:15,lineHeight:1.55},children:"The same design keeps its layout on a wider window, and adapts its padding, its type and its picture's width for a phone."}),e.jsx(o,{style:{alignItems:"center"},children:e.jsx(p,{href:"https://example.com",style:{backgroundColor:"#355B48",borderRadius:6,padding:[14,24]},children:"Read more"})}),e.jsx(d,{hidden:{mobile:!0},style:{padding:[24,0,0,0],fontSize:12,color:"#6D7C71"},children:"A wider window's detail: this line is left out on a phone."}),e.jsx(d,{hidden:{desktop:!0},style:{padding:[20,0,0,0],fontSize:12,color:"#6D7C71",textAlign:"center"},children:"A phone's detail: this line is only on a phone."})]})})),i=h(n=>e.jsx(n,{width:560,style:{color:r,fontFamily:l},children:e.jsxs(m,{style:{padding:24,gap:16},children:[e.jsxs(f,{style:{gap:12},mobile:{gap:4},children:[e.jsx(o,{style:{padding:16,backgroundColor:w},mobile:{padding:8},children:e.jsx(c,{style:{fontSize:14},children:"These two stack, closer together."})}),e.jsx(o,{style:{padding:16,backgroundColor:w},mobile:{padding:8},children:e.jsx(c,{style:{fontSize:14},children:"With less padding too."})})]}),e.jsxs(f,{stackOnMobile:!1,style:{gap:12,alignItems:"center"},children:[e.jsx(o,{style:{width:64},children:e.jsx(y,{src:g(64,64),alt:"Hills under a sun",style:{borderRadius:32}})}),e.jsx(o,{children:e.jsx(c,{style:{fontSize:14},children:"A picture and its words stay side by side."})})]})]})})),a=h(n=>e.jsx(n,{width:560,style:{color:r,fontFamily:l},children:e.jsxs(m,{style:{padding:24,gap:16,alignItems:"start"},children:[e.jsx(y,{src:g(480,200),alt:"Hills under a sun",style:{width:240},mobile:{width:"100%"}}),e.jsx(p,{href:"https://example.com",style:{width:240,backgroundColor:R,borderRadius:6},mobile:{width:"100%",fontSize:16,padding:[14,20]},children:"The whole width, and larger"}),e.jsx(p,{href:"https://example.com",style:{backgroundColor:r,borderRadius:6},mobile:{alignSelf:"center"},children:"On the left, in the center on phones"})]})}));t.__docgenInfo={description:"`mobile` has a box's or text's styles on phones, and `hidden` leaves it out on one or the other.",methods:[],displayName:"TextAndHidden"};s.__docgenInfo={description:"One design that keeps its layout on a wider window, and changes its padding, its type and its picture's width for a phone.",methods:[],displayName:"WholeDesign"};i.__docgenInfo={description:"A `Row` stacks on phones, unless `stackOnMobile={false}` keeps it; each child's `mobile` has its own width and box.",methods:[],displayName:"RowsOnPhones"};a.__docgenInfo={description:"A button and a picture take the whole width on phones, and `alignSelf` moves one to another place there.",methods:[],displayName:"ButtonsAndImages"};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 12
  }}>
      <Heading level={1} style={{
      fontSize: 34
    }} mobile={{
      fontSize: 24,
      textAlign: "center"
    }}>Smaller and centered on phones</Heading>
      <Paragraph hidden={{
      mobile: true
    }} style={{
      color: MUTED
    }}>Only on a wider window.</Paragraph>
      <Paragraph hidden={{
      desktop: true
    }} style={{
      color: MUTED
    }}>Only on a phone.</Paragraph>
    </Section>
  </Root>)`,...t.parameters?.docs?.source},description:{story:"`mobile` has a box's or text's styles on phones, and `hidden` leaves it out on one or the other.",...t.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`story(Root => <Root width={600} style={{
  backgroundColor: "#F3F5F1",
  fontFamily: FONT
}}>
    <Column style={{
    backgroundColor: "#FFFFFF",
    padding: [36, 40]
  }} mobile={{
    padding: [24, 20]
  }}>
      <Paragraph style={{
      color: "#355B48",
      fontSize: 12,
      letterSpacing: 2
    }}>DESIGN PREVIEW</Paragraph>
      <Heading level={1} style={{
      padding: [16, 0],
      fontSize: 38,
      fontWeight: 400,
      lineHeight: 1.15,
      color: "#20372A"
    }} mobile={{
      fontSize: 30,
      textAlign: "center"
    }}>
        Room to read. On every screen.
      </Heading>
      <Column style={{
      padding: [8, 0, 20, 0],
      alignItems: "center"
    }} mobile={{
      padding: [4, 0, 16, 0]
    }}>
        <Image src={landscape()} alt="Green hills under a warm sun" style={{
        width: "75%"
      }} mobile={{
        width: "100%"
      }} />
      </Column>
      <Paragraph style={{
      padding: [0, 0, 24, 0],
      color: "#526358",
      fontSize: 16,
      lineHeight: 1.6
    }} mobile={{
      fontSize: 15,
      lineHeight: 1.55
    }}>
        The same design keeps its layout on a wider window, and adapts its padding, its type and its picture's width for a phone.
      </Paragraph>
      <Column style={{
      alignItems: "center"
    }}>
        <Button href="https://example.com" style={{
        backgroundColor: "#355B48",
        borderRadius: 6,
        padding: [14, 24]
      }}>Read more</Button>
      </Column>
      <Paragraph hidden={{
      mobile: true
    }} style={{
      padding: [24, 0, 0, 0],
      fontSize: 12,
      color: "#6D7C71"
    }}>A wider window's detail: this line is left out on a phone.</Paragraph>
      <Paragraph hidden={{
      desktop: true
    }} style={{
      padding: [20, 0, 0, 0],
      fontSize: 12,
      color: "#6D7C71",
      textAlign: "center"
    }}>A phone's detail: this line is only on a phone.</Paragraph>
    </Column>
  </Root>)`,...s.parameters?.docs?.source},description:{story:"One design that keeps its layout on a wider window, and changes its padding, its type and its picture's width for a phone.",...s.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16
  }}>
      <Row style={{
      gap: 12
    }} mobile={{
      gap: 4
    }}>
        <Column style={{
        padding: 16,
        backgroundColor: WASH
      }} mobile={{
        padding: 8
      }}><Text style={{
          fontSize: 14
        }}>These two stack, closer together.</Text></Column>
        <Column style={{
        padding: 16,
        backgroundColor: WASH
      }} mobile={{
        padding: 8
      }}><Text style={{
          fontSize: 14
        }}>With less padding too.</Text></Column>
      </Row>
      <Row stackOnMobile={false} style={{
      gap: 12,
      alignItems: "center"
    }}>
        <Column style={{
        width: 64
      }}><Image src={landscape(64, 64)} alt="Hills under a sun" style={{
          borderRadius: 32
        }} /></Column>
        <Column><Text style={{
          fontSize: 14
        }}>A picture and its words stay side by side.</Text></Column>
      </Row>
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"A `Row` stacks on phones, unless `stackOnMobile={false}` keeps it; each child's `mobile` has its own width and box.",...i.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16,
    alignItems: "start"
  }}>
      <Image src={landscape(480, 200)} alt="Hills under a sun" style={{
      width: 240
    }} mobile={{
      width: "100%"
    }} />
      <Button href="https://example.com" style={{
      width: 240,
      backgroundColor: BRAND,
      borderRadius: 6
    }} mobile={{
      width: "100%",
      fontSize: 16,
      padding: [14, 20]
    }}>The whole width, and larger</Button>
      <Button href="https://example.com" style={{
      backgroundColor: INK,
      borderRadius: 6
    }} mobile={{
      alignSelf: "center"
    }}>On the left, in the center on phones</Button>
    </Section>
  </Root>)`,...a.parameters?.docs?.source},description:{story:"A button and a picture take the whole width on phones, and `alignSelf` moves one to another place there.",...a.parameters?.docs?.description}}};const z=["TextAndHidden","WholeDesign","RowsOnPhones","ButtonsAndImages"];export{a as ButtonsAndImages,i as RowsOnPhones,t as TextAndHidden,s as WholeDesign,z as __namedExportsOrder,T as default};
