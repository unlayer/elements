import{j as e}from"./jsx-runtime-DIqnCnE3.js";import{ad as L,ae as u,ax as I,S as c,az as s,aA as t,D as g,a as x,L as f,ay as j}from"./SideBySide-CTZXQXkZ.js";import{F as m,I as l,L as h,B as y,M as w,W as S}from"./shared-DuwPCDP_.js";import"./iframe-PnVPNnO0.js";import"./preload-helper-PPVm8Dsz.js";const T={title:"Components/List",args:u,argTypes:L,parameters:{docs:{description:{component:'A bulleted or numbered `List` of `ListItem`s, whose text holds what any text holds. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.'}}}},p=I,i=p(n=>e.jsx(n,{width:560,style:{color:l,fontFamily:m},children:e.jsxs(c,{style:{padding:24,gap:16},children:[e.jsxs(s,{children:[e.jsx(t,{children:"Three projects"}),e.jsx(t,{children:"Unlimited viewers"})]}),e.jsx(g,{style:{borderTop:h}}),e.jsxs(s,{type:"number",children:[e.jsx(t,{children:"Choose a template"}),e.jsxs(t,{children:["Add your content",e.jsx(s,{children:e.jsx(t,{children:"Text and images"})})]}),e.jsx(t,{children:"Send it"})]})]})})),o=p(n=>e.jsx(n,{width:560,style:{color:l,fontFamily:m},children:e.jsxs(c,{style:{padding:24,gap:16},children:[e.jsxs(s,{type:"number",children:[e.jsx(t,{children:"Create your account"}),e.jsx(t,{children:"Invite your team"})]}),e.jsxs(s,{type:"number",start:3,children:[e.jsx(t,{children:"Picks up at three"}),e.jsx(t,{children:"Then four"})]})]})})),r=p(n=>e.jsx(n,{width:560,style:{color:l,fontFamily:m},children:e.jsx(c,{style:{padding:24},children:e.jsxs(s,{style:{fontSize:15,gap:6},children:[e.jsxs(t,{children:["Fruit",e.jsxs(s,{style:{gap:6},children:[e.jsx(t,{children:"Apples"}),e.jsxs(t,{children:["Citrus",e.jsxs(s,{style:{gap:6},children:[e.jsx(t,{children:"Lemons"}),e.jsx(t,{children:"Oranges"})]})]})]})]}),e.jsx(t,{children:"Vegetables"})]})})})),a=p(n=>e.jsx(n,{width:560,style:{color:l,fontFamily:m},children:e.jsxs(c,{style:{padding:24,gap:16},children:[e.jsxs(s,{style:{gap:12,indent:40,fontSize:15,color:y},children:[e.jsx(t,{children:"More space between items"}),e.jsx(t,{children:"A wider column for the markers"})]}),e.jsxs(s,{type:"number",style:{padding:16,backgroundColor:S,border:h,fontSize:14,color:w},children:[e.jsx(t,{children:"In a box of its own"}),e.jsx(t,{style:{fontWeight:700,color:l},children:"One item styled its own way"}),e.jsx(t,{style:{textDecoration:"line-through"},children:"One item struck through"})]})]})})),d=p(n=>e.jsx(n,{width:560,style:{color:l,fontFamily:m},children:e.jsx(c,{style:{padding:24},children:e.jsxs(s,{style:{gap:8,fontSize:15},mobile:{fontSize:14,gap:4},children:[e.jsxs(t,{children:[e.jsx(x,{style:{fontWeight:700},children:"Free shipping"})," on your first order"]}),e.jsxs(t,{children:["Read ",e.jsx(f,{href:"https://example.com/returns",style:{color:y},children:"how returns work"})]}),e.jsxs(t,{children:["Your code is ",e.jsx(j,{name:"discount_code"})]})]})})}));i.__docgenInfo={description:"A `Divider` is a line, `List` bullets or numbers, and an item can hold a list of its own.",methods:[],displayName:"ListsAndDividers"};o.__docgenInfo={description:'`type="number"` counts from 1, and `start` from another number.',methods:[],displayName:"Numbers"};r.__docgenInfo={description:"An item holds a `List` of its own, down as many levels as it needs.",methods:[],displayName:"Nested"};a.__docgenInfo={description:"`gap` is the space between items, `indent` the markers' column, and a list has a box of its own.",methods:[],displayName:"Styles"};d.__docgenInfo={description:"An item's text holds what any text holds: a `Span`, a `Link`, a `MergeTag`.",methods:[],displayName:"RunsInItems"};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16
  }}>
      <List>
        <ListItem>Three projects</ListItem>
        <ListItem>Unlimited viewers</ListItem>
      </List>
      <Divider style={{
      borderTop: LINE
    }} />
      <List type="number">
        <ListItem>Choose a template</ListItem>
        <ListItem>Add your content<List><ListItem>Text and images</ListItem></List></ListItem>
        <ListItem>Send it</ListItem>
      </List>
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"A `Divider` is a line, `List` bullets or numbers, and an item can hold a list of its own.",...i.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16
  }}>
      <List type="number">
        <ListItem>Create your account</ListItem>
        <ListItem>Invite your team</ListItem>
      </List>
      <List type="number" start={3}>
        <ListItem>Picks up at three</ListItem>
        <ListItem>Then four</ListItem>
      </List>
    </Section>
  </Root>)`,...o.parameters?.docs?.source},description:{story:'`type="number"` counts from 1, and `start` from another number.',...o.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <List style={{
      fontSize: 15,
      gap: 6
    }}>
        <ListItem>
          Fruit
          <List style={{
          gap: 6
        }}>
            <ListItem>Apples</ListItem>
            <ListItem>
              Citrus
              <List style={{
              gap: 6
            }}>
                <ListItem>Lemons</ListItem>
                <ListItem>Oranges</ListItem>
              </List>
            </ListItem>
          </List>
        </ListItem>
        <ListItem>Vegetables</ListItem>
      </List>
    </Section>
  </Root>)`,...r.parameters?.docs?.source},description:{story:"An item holds a `List` of its own, down as many levels as it needs.",...r.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16
  }}>
      <List style={{
      gap: 12,
      indent: 40,
      fontSize: 15,
      color: BRAND
    }}>
        <ListItem>More space between items</ListItem>
        <ListItem>A wider column for the markers</ListItem>
      </List>
      <List type="number" style={{
      padding: 16,
      backgroundColor: WASH,
      border: LINE,
      fontSize: 14,
      color: MUTED
    }}>
        <ListItem>In a box of its own</ListItem>
        <ListItem style={{
        fontWeight: 700,
        color: INK
      }}>One item styled its own way</ListItem>
        <ListItem style={{
        textDecoration: "line-through"
      }}>One item struck through</ListItem>
      </List>
    </Section>
  </Root>)`,...a.parameters?.docs?.source},description:{story:"`gap` is the space between items, `indent` the markers' column, and a list has a box of its own.",...a.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <List style={{
      gap: 8,
      fontSize: 15
    }} mobile={{
      fontSize: 14,
      gap: 4
    }}>
        <ListItem><Span style={{
          fontWeight: 700
        }}>Free shipping</Span> on your first order</ListItem>
        <ListItem>Read <Link href="https://example.com/returns" style={{
          color: BRAND
        }}>how returns work</Link></ListItem>
        <ListItem>Your code is <MergeTag name="discount_code" /></ListItem>
      </List>
    </Section>
  </Root>)`,...d.parameters?.docs?.source},description:{story:"An item's text holds what any text holds: a `Span`, a `Link`, a `MergeTag`.",...d.parameters?.docs?.description}}};const k=["ListsAndDividers","Numbers","Nested","Styles","RunsInItems"];export{i as ListsAndDividers,r as Nested,o as Numbers,d as RunsInItems,a as Styles,k as __namedExportsOrder,T as default};
