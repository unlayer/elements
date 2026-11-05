import{j as e}from"./jsx-runtime-Qf3qns3a.js";import{a as R,b as F,d as j}from"./SideBySide-CfkqG_yh.js";import{F as h,I as g,B as C,M as w,W as m,l as A}from"./shared-DuwPCDP_.js";import{S as a,H as S,R as t,C as s,P as x,T as u,I as k,B as T}from"./render-Bv3q7nXI.js";import"./iframe-CSaRab9Y.js";import"./preload-helper-PPVm8Dsz.js";const O={title:"Components/Row",args:F,argTypes:R,parameters:{docs:{description:{component:`Lays its children out side by side, and stacks them on phones. A child takes its width, or a share of what's left. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.`}}}},y=j,o=(n,f="#D9E2EC",b)=>e.jsx(s,{style:{padding:b?[0,12]:12,backgroundColor:f,height:b},children:e.jsx(u,{style:{fontSize:14,textAlign:"center"},children:n})},n),r=y(n=>e.jsxs(n,{width:560,style:{backgroundColor:"#F5F7FA",color:g,fontFamily:h},children:[e.jsx(a,{style:{backgroundColor:C,color:"#FFFFFF",padding:[20,24]},children:e.jsx(S,{level:2,style:{fontSize:20},children:"A band across the window"})}),e.jsx(a,{style:{backgroundColor:"#FFFFFF",padding:24},children:e.jsxs(t,{style:{gap:16},children:[e.jsxs(s,{style:{width:180,gap:8},children:[e.jsx(x,{style:{fontWeight:700},children:"180px"}),e.jsx(x,{style:{color:w,fontSize:14},children:"A set width."})]}),e.jsxs(s,{style:{gap:8,padding:12,backgroundColor:"#F5F7FA",borderRadius:6},children:[e.jsx(x,{style:{fontWeight:700},children:"The rest"}),e.jsx(x,{style:{color:w,fontSize:14},children:"What's left of the row, with a box of its own."})]})]})})]})),i=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsxs(a,{style:{padding:24,gap:12},children:[e.jsx(t,{style:{gap:12},children:[o("1"),o("1 ")]}),e.jsx(t,{style:{gap:12},children:[o("1"),o("1 "),o("1  ")]}),e.jsx(t,{style:{gap:12},children:[o("1"),o("1 "),o("1  "),o("1   ")]}),e.jsxs(t,{style:{gap:12},children:[e.jsx(s,{style:{flex:1,padding:12,backgroundColor:"#D9E2EC"},children:e.jsx(u,{style:{fontSize:14,textAlign:"center"},children:"flex: 1"})}),e.jsx(s,{style:{flex:2,padding:12,backgroundColor:"#9FB3C8"},children:e.jsx(u,{style:{fontSize:14,textAlign:"center"},children:"flex: 2"})})]})]})})),l=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsxs(a,{style:{padding:24,gap:12},children:[e.jsx(t,{style:{gap:12,alignItems:"start",backgroundColor:m},children:[o("Tall","#D9E2EC",80),o("At the top")]}),e.jsx(t,{style:{gap:12,alignItems:"center",backgroundColor:m},children:[o("Tall","#D9E2EC",80),o("In the middle")]}),e.jsx(t,{style:{gap:12,alignItems:"end",backgroundColor:m},children:[o("Tall","#D9E2EC",80),o("At the bottom")]}),e.jsx(t,{style:{gap:12,justifyContent:"end",backgroundColor:m},children:e.jsx(s,{style:{width:120,padding:12,backgroundColor:"#D9E2EC"},children:e.jsx(u,{style:{fontSize:14,textAlign:"center"},children:"At the end"})})})]})})),d=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsxs(a,{style:{padding:24,gap:12},children:[e.jsx(t,{style:{gap:12},children:[o("Stacks"),o("on phones")]}),e.jsx(t,{stackOnMobile:!1,style:{gap:12},children:[o("Stays","#9FB3C8"),o("side by side","#9FB3C8")]})]})})),E=["Design","Email","Layout","Typography","Accessibility","Components","Templates","Phones"],c=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsx(a,{style:{padding:24},children:e.jsx(t,{stackOnMobile:!1,style:{gap:8,flexWrap:"wrap"},children:E.map(f=>e.jsx(u,{style:{flex:"none",padding:[4,12],fontSize:13,backgroundColor:m,borderRadius:12},children:f},f))})})})),p=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsx(a,{style:{padding:24},children:e.jsxs(t,{style:{gap:24,alignItems:"center"},children:[e.jsx(s,{children:e.jsx(k,{src:A(480,320),alt:"Hills under a sun",style:{width:"100%",borderRadius:8}})}),e.jsxs(s,{style:{gap:12,alignItems:"start"},children:[e.jsx(S,{level:3,style:{fontSize:20},children:"See it all from above"}),e.jsx(x,{style:{fontSize:14,lineHeight:1.6,color:w},children:"One view of every project, updated as your team works."}),e.jsx(T,{href:"https://example.com/features",style:{backgroundColor:C,borderRadius:6},children:"See how"})]})]})})}));r.__docgenInfo={description:"A `Section` is a band across the window. A `Row` puts its `Column`s side by side, and stacks them on phones. Space is `gap` and `padding`, never margins.",methods:[],displayName:"SetWidthAndTheRest"};i.__docgenInfo={description:"Children share the width equally; `flex` gives one more of it.",methods:[],displayName:"Shares"};l.__docgenInfo={description:"`alignItems` says where children of different heights sit, and `justifyContent` where they sit along the row.",methods:[],displayName:"Alignment"};d.__docgenInfo={description:'A `Row` stacks on phones unless `stackOnMobile={false}` keeps it side by side: choose "phone" under width to see it.',methods:[],displayName:"KeptOnPhones"};c.__docgenInfo={description:'`flexWrap: "wrap"` moves what doesn\'t fit to another line, in a row kept side by side on phones.',methods:[],displayName:"Wrapping"};p.__docgenInfo={description:"A picture beside its words, the words in the middle of the row's height, as for a product's feature.",methods:[],displayName:"PictureAndWords"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  backgroundColor: "#F5F7FA",
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
    backgroundColor: "#FFFFFF",
    padding: 24
  }}>
      <Row style={{
      gap: 16
    }}>
        <Column style={{
        width: 180,
        gap: 8
      }}>
          <Paragraph style={{
          fontWeight: 700
        }}>180px</Paragraph>
          <Paragraph style={{
          color: MUTED,
          fontSize: 14
        }}>A set width.</Paragraph>
        </Column>
        <Column style={{
        gap: 8,
        padding: 12,
        backgroundColor: "#F5F7FA",
        borderRadius: 6
      }}>
          <Paragraph style={{
          fontWeight: 700
        }}>The rest</Paragraph>
          <Paragraph style={{
          color: MUTED,
          fontSize: 14
        }}>What's left of the row, with a box of its own.</Paragraph>
        </Column>
      </Row>
    </Section>
  </Root>)`,...r.parameters?.docs?.source},description:{story:"A `Section` is a band across the window. A `Row` puts its `Column`s side by side, and stacks them on phones. Space is `gap` and `padding`, never margins.",...r.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 12
  }}>
      <Row style={{
      gap: 12
    }}>{[box("1"), box("1 ")]}</Row>
      <Row style={{
      gap: 12
    }}>{[box("1"), box("1 "), box("1  ")]}</Row>
      <Row style={{
      gap: 12
    }}>{[box("1"), box("1 "), box("1  "), box("1   ")]}</Row>
      <Row style={{
      gap: 12
    }}>
        <Column style={{
        flex: 1,
        padding: 12,
        backgroundColor: "#D9E2EC"
      }}><Text style={{
          fontSize: 14,
          textAlign: "center"
        }}>flex: 1</Text></Column>
        <Column style={{
        flex: 2,
        padding: 12,
        backgroundColor: "#9FB3C8"
      }}><Text style={{
          fontSize: 14,
          textAlign: "center"
        }}>flex: 2</Text></Column>
      </Row>
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"Children share the width equally; `flex` gives one more of it.",...i.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 12
  }}>
      <Row style={{
      gap: 12,
      alignItems: "start",
      backgroundColor: WASH
    }}>{[box("Tall", "#D9E2EC", 80), box("At the top")]}</Row>
      <Row style={{
      gap: 12,
      alignItems: "center",
      backgroundColor: WASH
    }}>{[box("Tall", "#D9E2EC", 80), box("In the middle")]}</Row>
      <Row style={{
      gap: 12,
      alignItems: "end",
      backgroundColor: WASH
    }}>{[box("Tall", "#D9E2EC", 80), box("At the bottom")]}</Row>
      <Row style={{
      gap: 12,
      justifyContent: "end",
      backgroundColor: WASH
    }}>
        <Column style={{
        width: 120,
        padding: 12,
        backgroundColor: "#D9E2EC"
      }}><Text style={{
          fontSize: 14,
          textAlign: "center"
        }}>At the end</Text></Column>
      </Row>
    </Section>
  </Root>)`,...l.parameters?.docs?.source},description:{story:"`alignItems` says where children of different heights sit, and `justifyContent` where they sit along the row.",...l.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 12
  }}>
      <Row style={{
      gap: 12
    }}>{[box("Stacks"), box("on phones")]}</Row>
      <Row stackOnMobile={false} style={{
      gap: 12
    }}>{[box("Stays", "#9FB3C8"), box("side by side", "#9FB3C8")]}</Row>
    </Section>
  </Root>)`,...d.parameters?.docs?.source},description:{story:'A `Row` stacks on phones unless `stackOnMobile={false}` keeps it side by side: choose "phone" under width to see it.',...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Row stackOnMobile={false} style={{
      gap: 8,
      flexWrap: "wrap"
    }}>
        {TAGS.map(tag => <Text key={tag} style={{
        flex: "none",
        padding: [4, 12],
        fontSize: 13,
        backgroundColor: WASH,
        borderRadius: 12
      }}>{tag}</Text>)}
      </Row>
    </Section>
  </Root>)`,...c.parameters?.docs?.source},description:{story:'`flexWrap: "wrap"` moves what doesn\'t fit to another line, in a row kept side by side on phones.',...c.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Row style={{
      gap: 24,
      alignItems: "center"
    }}>
        <Column>
          <Image src={landscape(480, 320)} alt="Hills under a sun" style={{
          width: "100%",
          borderRadius: 8
        }} />
        </Column>
        <Column style={{
        gap: 12,
        alignItems: "start"
      }}>
          <Heading level={3} style={{
          fontSize: 20
        }}>See it all from above</Heading>
          <Paragraph style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: MUTED
        }}>One view of every project, updated as your team works.</Paragraph>
          <Button href="https://example.com/features" style={{
          backgroundColor: BRAND,
          borderRadius: 6
        }}>See how</Button>
        </Column>
      </Row>
    </Section>
  </Root>)`,...p.parameters?.docs?.source},description:{story:"A picture beside its words, the words in the middle of the row's height, as for a product's feature.",...p.parameters?.docs?.description}}};const v=["SetWidthAndTheRest","Shares","Alignment","KeptOnPhones","Wrapping","PictureAndWords"];export{l as Alignment,d as KeptOnPhones,p as PictureAndWords,r as SetWidthAndTheRest,i as Shares,c as Wrapping,v as __namedExportsOrder,O as default};
