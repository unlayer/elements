import{j as e}from"./jsx-runtime-Cf-MKpCd.js";import{a as S,b as C,d as b}from"./SideBySide-C5zoQ7Ex.js";import{F as h,I as g,W as s,L as x,M as j}from"./shared-DuwPCDP_.js";import{S as m,aM as o,P as a,C as w,H as F,T as G}from"./render-k9Rgha0b.js";import"./iframe-qU7x7_dT.js";import"./preload-helper-PPVm8Dsz.js";const O={title:"Components/Grid",args:C,argTypes:S,parameters:{docs:{description:{component:'Its children in columns of equal width, row after row, and on phones one under another. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.'}}}},y=b,A=(n,r="#D9E2EC")=>e.jsx(w,{style:{padding:16,backgroundColor:r},children:e.jsx(G,{style:{fontSize:14,textAlign:"center"},children:n})},n),t=(n,r)=>Array.from({length:n},(u,f)=>A(f+1,r)),i=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsxs(m,{style:{padding:24,gap:24},children:[e.jsx(o,{columns:2,style:{gap:12},children:t(4)}),e.jsx(o,{columns:3,style:{gap:12},children:t(5,"#BCCCDC")}),e.jsx(o,{columns:4,style:{gap:12},children:t(8,"#9FB3C8")})]})})),d=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsxs(m,{style:{padding:24,gap:24},children:[e.jsx(o,{columns:3,style:{gap:4},children:t(6)}),e.jsx(o,{columns:3,style:{gap:24},children:t(6,"#BCCCDC")}),e.jsx(o,{columns:3,style:{gap:8,rowGap:32},mobile:{gap:4},children:t(6,"#9FB3C8")})]})})),l=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsxs(m,{style:{padding:24,gap:24},children:[e.jsxs(o,{columns:2,style:{gap:12,alignItems:"start"},children:[e.jsx(a,{style:{padding:12,backgroundColor:s,fontSize:14},children:"A cell with a good deal more text in it than the one beside it, at the top of the row."}),e.jsx(a,{style:{padding:12,backgroundColor:s,fontSize:14},children:"At the top."})]}),e.jsxs(o,{columns:2,style:{gap:12,alignItems:"center"},children:[e.jsx(a,{style:{padding:12,backgroundColor:s,fontSize:14},children:"A cell with a good deal more text in it than the one beside it, in the middle of the row."}),e.jsx(a,{style:{padding:12,backgroundColor:s,fontSize:14},children:"In the middle."})]}),e.jsxs(o,{columns:2,style:{gap:12,alignItems:"end"},children:[e.jsx(a,{style:{padding:12,backgroundColor:s,fontSize:14},children:"A cell with a good deal more text in it than the one beside it, at the bottom of the row."}),e.jsx(a,{style:{padding:12,backgroundColor:s,fontSize:14},children:"At the bottom."})]})]})})),c=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsxs(m,{style:{padding:24,gap:24},children:[e.jsx(o,{columns:3,style:{gap:12},children:t(3)}),e.jsx(o,{columns:3,stackOnMobile:!1,style:{gap:12},children:t(3,"#9FB3C8")})]})})),k=[["Design","Templates and layouts, made to fit your brand."],["Delivery","Sent on time, to every inbox you care about."],["Reporting","What was opened and clicked, every morning."],["Support","A person who answers, the same day."]],p=y(n=>e.jsx(n,{width:560,style:{color:g,fontFamily:h},children:e.jsx(m,{style:{padding:24},children:e.jsx(o,{columns:2,style:{gap:12,padding:16,backgroundColor:s,borderRadius:12,border:x},children:k.map(([r,u])=>e.jsxs(w,{style:{gap:4,padding:16,backgroundColor:"#FFFFFF",borderRadius:8},children:[e.jsx(F,{level:3,style:{fontSize:16},children:r}),e.jsx(a,{style:{fontSize:13,color:j},children:u})]},r))})})}));i.__docgenInfo={description:"`columns` is how many children to a row; a last row that's short keeps their width.",methods:[],displayName:"Columns"};d.__docgenInfo={description:"`gap` is the space across and down, unless `rowGap` sets the space between rows; `mobile` has others on phones.",methods:[],displayName:"Gaps"};l.__docgenInfo={description:"`alignItems` is where each child sits in its row's height.",methods:[],displayName:"Alignment"};c.__docgenInfo={description:'A grid goes one under another on phones unless `stackOnMobile={false}` keeps its columns: choose "phone" under width to see it.',methods:[],displayName:"KeptOnPhones"};p.__docgenInfo={description:"A grid has a box of its own: here services in a tinted panel, two to a row.",methods:[],displayName:"Services"};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 24
  }}>
      <Grid columns={2} style={{
      gap: 12
    }}>{tiles(4)}</Grid>
      <Grid columns={3} style={{
      gap: 12
    }}>{tiles(5, "#BCCCDC")}</Grid>
      <Grid columns={4} style={{
      gap: 12
    }}>{tiles(8, "#9FB3C8")}</Grid>
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"`columns` is how many children to a row; a last row that's short keeps their width.",...i.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 24
  }}>
      <Grid columns={3} style={{
      gap: 4
    }}>{tiles(6)}</Grid>
      <Grid columns={3} style={{
      gap: 24
    }}>{tiles(6, "#BCCCDC")}</Grid>
      <Grid columns={3} style={{
      gap: 8,
      rowGap: 32
    }} mobile={{
      gap: 4
    }}>{tiles(6, "#9FB3C8")}</Grid>
    </Section>
  </Root>)`,...d.parameters?.docs?.source},description:{story:"`gap` is the space across and down, unless `rowGap` sets the space between rows; `mobile` has others on phones.",...d.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 24
  }}>
      <Grid columns={2} style={{
      gap: 12,
      alignItems: "start"
    }}>
        <Paragraph style={{
        padding: 12,
        backgroundColor: WASH,
        fontSize: 14
      }}>A cell with a good deal more text in it than the one beside it, at the top of the row.</Paragraph>
        <Paragraph style={{
        padding: 12,
        backgroundColor: WASH,
        fontSize: 14
      }}>At the top.</Paragraph>
      </Grid>
      <Grid columns={2} style={{
      gap: 12,
      alignItems: "center"
    }}>
        <Paragraph style={{
        padding: 12,
        backgroundColor: WASH,
        fontSize: 14
      }}>A cell with a good deal more text in it than the one beside it, in the middle of the row.</Paragraph>
        <Paragraph style={{
        padding: 12,
        backgroundColor: WASH,
        fontSize: 14
      }}>In the middle.</Paragraph>
      </Grid>
      <Grid columns={2} style={{
      gap: 12,
      alignItems: "end"
    }}>
        <Paragraph style={{
        padding: 12,
        backgroundColor: WASH,
        fontSize: 14
      }}>A cell with a good deal more text in it than the one beside it, at the bottom of the row.</Paragraph>
        <Paragraph style={{
        padding: 12,
        backgroundColor: WASH,
        fontSize: 14
      }}>At the bottom.</Paragraph>
      </Grid>
    </Section>
  </Root>)`,...l.parameters?.docs?.source},description:{story:"`alignItems` is where each child sits in its row's height.",...l.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 24
  }}>
      <Grid columns={3} style={{
      gap: 12
    }}>{tiles(3)}</Grid>
      <Grid columns={3} stackOnMobile={false} style={{
      gap: 12
    }}>{tiles(3, "#9FB3C8")}</Grid>
    </Section>
  </Root>)`,...c.parameters?.docs?.source},description:{story:'A grid goes one under another on phones unless `stackOnMobile={false}` keeps its columns: choose "phone" under width to see it.',...c.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Grid columns={2} style={{
      gap: 12,
      padding: 16,
      backgroundColor: WASH,
      borderRadius: 12,
      border: LINE
    }}>
        {SERVICES.map(([name, line]) => <Column key={name} style={{
        gap: 4,
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 8
      }}>
            <Heading level={3} style={{
          fontSize: 16
        }}>{name}</Heading>
            <Paragraph style={{
          fontSize: 13,
          color: MUTED
        }}>{line}</Paragraph>
          </Column>)}
      </Grid>
    </Section>
  </Root>)`,...p.parameters?.docs?.source},description:{story:"A grid has a box of its own: here services in a tinted panel, two to a row.",...p.parameters?.docs?.description}}};const _=["Columns","Gaps","Alignment","KeptOnPhones","Services"];export{l as Alignment,i as Columns,d as Gaps,c as KeptOnPhones,p as Services,_ as __namedExportsOrder,O as default};
