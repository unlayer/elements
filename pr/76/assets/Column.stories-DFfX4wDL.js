import{j as e}from"./jsx-runtime-DIqnCnE3.js";import{ad as T,ae as I,ax as N,aw as H,S as p,C as t,H as u,P as a,R as f,B as C,T as S,L as w,az as P,aA as W,aq as B}from"./SideBySide-CTZXQXkZ.js";import{W as s,F as g,I as o,M as j,L as A,B as r}from"./shared-DuwPCDP_.js";import"./iframe-PnVPNnO0.js";import"./preload-helper-PPVm8Dsz.js";const _={title:"Components/Column",args:I,argTypes:T,parameters:{docs:{description:{component:"Stacks its children, with its own spacing and box. In a `Row` it's one of the children side by side; with a background it's a card. Each story is drawn as an Email and as a Page, from one template; \"Show code\" has it."}}}},x=N,i=x(n=>e.jsx(n,{width:560,style:{color:o,fontFamily:g,backgroundColor:s},children:e.jsxs(p,{style:{padding:24,gap:16},children:[e.jsxs(t,{style:{gap:8,padding:24,backgroundColor:"#FFFFFF",borderRadius:8},mobile:{padding:12},children:[e.jsx(u,{level:3,style:{fontSize:18},children:"A plain card"}),e.jsx(a,{style:{fontSize:14,color:j},children:"A background, round corners, and less padding on phones."})]}),e.jsxs(t,{style:{gap:8,padding:24,backgroundColor:"#FFFFFF",border:A},children:[e.jsx(u,{level:3,style:{fontSize:18},children:"With an outline"}),e.jsx(a,{style:{fontSize:14,color:j},children:"A hairline all around."})]}),e.jsxs(t,{style:{gap:8,padding:24,backgroundColor:"#FFFFFF",border:{left:`4px solid ${r}`}},children:[e.jsx(u,{level:3,style:{fontSize:18},children:"With an accent"}),e.jsx(a,{style:{fontSize:14,color:j},children:"A line on one side only."})]})]})})),l=x(n=>e.jsx(n,{width:560,style:{color:o,fontFamily:g},children:e.jsx(p,{style:{padding:24},children:e.jsxs(f,{style:{gap:12},children:[e.jsx(t,{style:{padding:12,backgroundColor:s,alignItems:"start"},children:e.jsx(C,{href:"https://example.com",style:{backgroundColor:r},children:"Left"})}),e.jsx(t,{style:{padding:12,backgroundColor:s,alignItems:"center"},children:e.jsx(C,{href:"https://example.com",style:{backgroundColor:r},children:"Center"})}),e.jsx(t,{style:{padding:12,backgroundColor:s,alignItems:"end"},children:e.jsx(C,{href:"https://example.com",style:{backgroundColor:r},children:"Right"})})]})})})),y=H("Page",e.jsx(B,{width:560,style:{color:o,fontFamily:g},children:e.jsx(p,{style:{padding:24},children:e.jsxs(f,{style:{gap:12},children:[e.jsx(t,{style:{height:160,padding:12,backgroundColor:s,justifyContent:"start"},children:e.jsx(S,{style:{fontSize:14},children:"At the top"})}),e.jsx(t,{style:{height:160,padding:12,backgroundColor:s,justifyContent:"center"},children:e.jsx(S,{style:{fontSize:14},children:"In the middle"})}),e.jsx(t,{style:{height:160,padding:12,backgroundColor:s,justifyContent:"end"},children:e.jsx(S,{style:{fontSize:14},children:"At the bottom"})})]})})})),k=(n,F,z,m=!1)=>e.jsxs(t,{style:{gap:12,padding:20,borderRadius:12,alignItems:"stretch",backgroundColor:m?o:"#FFFFFF",color:m?"#FFFFFF":o,border:m?void 0:A},children:[e.jsx(u,{level:3,style:{fontSize:16},children:n}),e.jsx(a,{style:{fontSize:30,fontWeight:700},children:F}),e.jsx(P,{style:{gap:4,fontSize:13,indent:16},children:z.map(R=>e.jsx(W,{children:R},R))}),e.jsx(C,{href:"https://example.com/plans",style:{width:"100%",backgroundColor:m?"#FFFFFF":r,color:m?o:"#FFFFFF",borderRadius:6},children:"Choose"})]},n),d=x(n=>e.jsx(n,{width:640,style:{color:o,fontFamily:g,backgroundColor:s},children:e.jsx(p,{style:{padding:24},children:e.jsx(f,{style:{gap:12},children:[k("Starter","$0",["One project","Email support"]),k("Team","$29",["Ten projects","Priority support","Shared library"],!0),k("Business","$99",["Every project","Phone support"])]})})})),b=(n,F)=>e.jsxs(t,{style:{gap:4,textAlign:"center"},children:[e.jsx(a,{style:{fontSize:28,fontWeight:700},children:n}),e.jsx(a,{style:{fontSize:12,color:"#CBD2D9"},children:F})]},F),c=x(n=>e.jsx(n,{width:640,style:{color:o,fontFamily:g},children:e.jsx(p,{style:{backgroundColor:o,color:"#FFFFFF",padding:[32,24]},children:e.jsx(f,{stackOnMobile:!1,style:{gap:16},children:[b("99.9%","Uptime"),b("12k","Teams"),b("48","Countries"),b("4.9","Rating")]})})})),h=x(n=>e.jsx(n,{width:640,style:{color:o,fontFamily:g},children:e.jsx(p,{style:{padding:24},children:e.jsxs(f,{style:{gap:24},children:[e.jsxs(t,{style:{width:160,gap:8,padding:16,backgroundColor:s,borderRadius:8},children:[e.jsx(S,{style:{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:j},children:"In this issue"}),e.jsx(w,{href:"https://example.com/start",style:{fontSize:14,color:r},children:"Getting started"}),e.jsx(w,{href:"https://example.com/layouts",style:{fontSize:14,color:r},children:"Layouts"}),e.jsx(w,{href:"https://example.com/more",style:{fontSize:14,color:r},children:"What's next"})]}),e.jsxs(t,{style:{gap:12},children:[e.jsx(u,{level:2,style:{fontSize:24},children:"Getting started"}),e.jsx(a,{style:{fontSize:15,lineHeight:1.7},children:"A longer article runs beside the sidebar on a wider window. On a phone, the sidebar comes first and the article goes under it."})]})]})})}));i.__docgenInfo={description:"A `Column` with a box is a card: its background, border, corners and padding, and another padding on phones.",methods:[],displayName:"Cards"};l.__docgenInfo={description:"`alignItems` says where its children sit across it: on the left, in the center, on the right.",methods:[],displayName:"Alignment"};d.__docgenInfo={description:"Three plans, the middle one featured: a `Column` is a card, and a `Row` puts them side by side.",methods:[],displayName:"PricingCards"};c.__docgenInfo={description:"Figures along a dark band: a column's `textAlign` is inherited by what it holds.",methods:[],displayName:"Stats"};h.__docgenInfo={description:"An article beside a tinted sidebar: the sidebar has a set `width`, and the article takes what's left.",methods:[],displayName:"Sidebar"};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT,
  backgroundColor: WASH
}}>
    <Section style={{
    padding: 24,
    gap: 16
  }}>
      <Column style={{
      gap: 8,
      padding: 24,
      backgroundColor: "#FFFFFF",
      borderRadius: 8
    }} mobile={{
      padding: 12
    }}>
        <Heading level={3} style={{
        fontSize: 18
      }}>A plain card</Heading>
        <Paragraph style={{
        fontSize: 14,
        color: MUTED
      }}>A background, round corners, and less padding on phones.</Paragraph>
      </Column>
      <Column style={{
      gap: 8,
      padding: 24,
      backgroundColor: "#FFFFFF",
      border: LINE
    }}>
        <Heading level={3} style={{
        fontSize: 18
      }}>With an outline</Heading>
        <Paragraph style={{
        fontSize: 14,
        color: MUTED
      }}>A hairline all around.</Paragraph>
      </Column>
      <Column style={{
      gap: 8,
      padding: 24,
      backgroundColor: "#FFFFFF",
      border: {
        left: \`4px solid \${BRAND}\`
      }
    }}>
        <Heading level={3} style={{
        fontSize: 18
      }}>With an accent</Heading>
        <Paragraph style={{
        fontSize: 14,
        color: MUTED
      }}>A line on one side only.</Paragraph>
      </Column>
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"A `Column` with a box is a card: its background, border, corners and padding, and another padding on phones.",...i.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Row style={{
      gap: 12
    }}>
        <Column style={{
        padding: 12,
        backgroundColor: WASH,
        alignItems: "start"
      }}><Button href="https://example.com" style={{
          backgroundColor: BRAND
        }}>Left</Button></Column>
        <Column style={{
        padding: 12,
        backgroundColor: WASH,
        alignItems: "center"
      }}><Button href="https://example.com" style={{
          backgroundColor: BRAND
        }}>Center</Button></Column>
        <Column style={{
        padding: 12,
        backgroundColor: WASH,
        alignItems: "end"
      }}><Button href="https://example.com" style={{
          backgroundColor: BRAND
        }}>Right</Button></Column>
      </Row>
    </Section>
  </Root>)`,...l.parameters?.docs?.source},description:{story:"`alignItems` says where its children sit across it: on the left, in the center, on the right.",...l.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`showing("Page", <Page width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Row style={{
      gap: 12
    }}>
        <Column style={{
        height: 160,
        padding: 12,
        backgroundColor: WASH,
        justifyContent: "start"
      }}><Text style={{
          fontSize: 14
        }}>At the top</Text></Column>
        <Column style={{
        height: 160,
        padding: 12,
        backgroundColor: WASH,
        justifyContent: "center"
      }}><Text style={{
          fontSize: 14
        }}>In the middle</Text></Column>
        <Column style={{
        height: 160,
        padding: 12,
        backgroundColor: WASH,
        justifyContent: "end"
      }}><Text style={{
          fontSize: 14
        }}>At the bottom</Text></Column>
      </Row>
    </Section>
  </Page>)`,...y.parameters?.docs?.source},description:{story:"On a page, `justifyContent` says where its children sit in a set `height` (an email starts them at the top).",...y.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`story(Root => <Root width={640} style={{
  color: INK,
  fontFamily: FONT,
  backgroundColor: WASH
}}>
    <Section style={{
    padding: 24
  }}>
      <Row style={{
      gap: 12
    }}>
        {[plan("Starter", "$0", ["One project", "Email support"]), plan("Team", "$29", ["Ten projects", "Priority support", "Shared library"], true), plan("Business", "$99", ["Every project", "Phone support"])]}
      </Row>
    </Section>
  </Root>)`,...d.parameters?.docs?.source},description:{story:"Three plans, the middle one featured: a `Column` is a card, and a `Row` puts them side by side.",...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`story(Root => <Root width={640} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    backgroundColor: INK,
    color: "#FFFFFF",
    padding: [32, 24]
  }}>
      <Row stackOnMobile={false} style={{
      gap: 16
    }}>{[stat("99.9%", "Uptime"), stat("12k", "Teams"), stat("48", "Countries"), stat("4.9", "Rating")]}</Row>
    </Section>
  </Root>)`,...c.parameters?.docs?.source},description:{story:"Figures along a dark band: a column's `textAlign` is inherited by what it holds.",...c.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`story(Root => <Root width={640} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Row style={{
      gap: 24
    }}>
        <Column style={{
        width: 160,
        gap: 8,
        padding: 16,
        backgroundColor: WASH,
        borderRadius: 8
      }}>
          <Text style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: MUTED
        }}>In this issue</Text>
          <Link href="https://example.com/start" style={{
          fontSize: 14,
          color: BRAND
        }}>Getting started</Link>
          <Link href="https://example.com/layouts" style={{
          fontSize: 14,
          color: BRAND
        }}>Layouts</Link>
          <Link href="https://example.com/more" style={{
          fontSize: 14,
          color: BRAND
        }}>What's next</Link>
        </Column>
        <Column style={{
        gap: 12
      }}>
          <Heading level={2} style={{
          fontSize: 24
        }}>Getting started</Heading>
          <Paragraph style={{
          fontSize: 15,
          lineHeight: 1.7
        }}>A longer article runs beside the sidebar on a wider window. On a phone, the sidebar comes first and the article goes under it.</Paragraph>
        </Column>
      </Row>
    </Section>
  </Root>)`,...h.parameters?.docs?.source},description:{story:"An article beside a tinted sidebar: the sidebar has a set `width`, and the article takes what's left.",...h.parameters?.docs?.description}}};const K=["Cards","Alignment","HeightAndJustify","PricingCards","Stats","Sidebar"];export{l as Alignment,i as Cards,y as HeightAndJustify,d as PricingCards,h as Sidebar,c as Stats,K as __namedExportsOrder,_ as default};
