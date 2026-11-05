import{j as t}from"./jsx-runtime-BQty9Dse.js";import{ad as p,ae as w,ax as y,S as s,aZ as r,H as g,P as m,C as b,B as f,E as F}from"./SideBySide-Fi37olCW.js";import{F as l,I as d,p as x,W as S,M as j,B as v}from"./shared-DuwPCDP_.js";import"./iframe-CeBDI6vD.js";import"./preload-helper-PPVm8Dsz.js";const T={title:"Components/Video",args:w,argTypes:p,parameters:{docs:{description:{component:`A YouTube or Vimeo video: its player on a page, and in an email (which can't play one) its thumbnail, linked to it. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.`}}}},h=y,c=(e,u)=>e===F?x(u,512,288):void 0,o=h(e=>t.jsx(e,{width:560,style:{color:d,fontFamily:l},children:t.jsx(s,{style:{padding:24},children:t.jsx(r,{src:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",thumbnail:c(e,"#334E68"),title:"Product tour"})})})),n=h(e=>t.jsx(e,{width:560,style:{color:d,fontFamily:l},children:t.jsx(s,{style:{padding:24},children:t.jsx(r,{src:"https://vimeo.com/76979871",thumbnail:c(e,"#486581"),title:"A short film"})})})),i=h(e=>t.jsx(e,{width:560,style:{color:d,fontFamily:l},children:t.jsxs(s,{style:{padding:24,gap:16,alignItems:"center"},children:[t.jsx(r,{src:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",thumbnail:c(e,"#334E68"),title:"320px wide, the whole width on phones",style:{width:320},mobile:{width:"100%"}}),t.jsx(r,{src:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",thumbnail:c(e,"#627D98"),title:"Half the space",style:{width:"50%"}})]})})),a=h(e=>t.jsxs(e,{width:560,style:{color:d,fontFamily:l,backgroundColor:S},children:[t.jsxs(s,{style:{backgroundColor:d,color:"#FFFFFF",padding:[40,32]},children:[t.jsx(g,{level:1,style:{fontSize:32,textAlign:"center"},children:"Introducing Acme 2.0"}),t.jsx(m,{style:{fontSize:16,textAlign:"center",color:"#CBD2D9"},children:"The fastest way to build, ship and measure."})]}),t.jsxs(s,{style:{backgroundColor:"#FFFFFF",padding:32,gap:16},children:[t.jsx(r,{src:"https://www.youtube.com/watch?v=dQw4w9WgXcQ",thumbnail:c(e,"#334E68"),title:"See it in 90 seconds"}),t.jsx(m,{style:{fontSize:15,lineHeight:1.6,color:j},children:"Ninety seconds on what changed, and what it means for your team."}),t.jsx(b,{style:{alignItems:"center"},children:t.jsx(f,{href:"https://example.com/try",style:{backgroundColor:v,padding:[12,24],borderRadius:6},children:"Try it free"})})]})]}));o.__docgenInfo={description:"A `Video` is its player on a page and its thumbnail, linked to it, in an email.",methods:[],displayName:"YouTube"};n.__docgenInfo={description:"A Vimeo video's thumbnail can't be found without the network, so an email needs `thumbnail`.",methods:[],displayName:"Vimeo"};i.__docgenInfo={description:"`width` and `maxWidth` set its size, and `mobile` another on phones; the stack around it says where it sits.",methods:[],displayName:"Widths"};a.__docgenInfo={description:"A video in the middle of a product launch: a band for the title, the video, and a button to try it.",methods:[],displayName:"ProductLaunch"};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={thumbnail(Root, "#334E68")} title="Product tour" />
    </Section>
  </Root>)`,...o.parameters?.docs?.source},description:{story:"A `Video` is its player on a page and its thumbnail, linked to it, in an email.",...o.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Video src="https://vimeo.com/76979871" thumbnail={thumbnail(Root, "#486581")} title="A short film" />
    </Section>
  </Root>)`,...n.parameters?.docs?.source},description:{story:"A Vimeo video's thumbnail can't be found without the network, so an email needs `thumbnail`.",...n.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16,
    alignItems: "center"
  }}>
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={thumbnail(Root, "#334E68")} title="320px wide, the whole width on phones" style={{
      width: 320
    }} mobile={{
      width: "100%"
    }} />
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={thumbnail(Root, "#627D98")} title="Half the space" style={{
      width: "50%"
    }} />
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"`width` and `maxWidth` set its size, and `mobile` another on phones; the stack around it says where it sits.",...i.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT,
  backgroundColor: WASH
}}>
    <Section style={{
    backgroundColor: INK,
    color: "#FFFFFF",
    padding: [40, 32]
  }}>
      <Heading level={1} style={{
      fontSize: 32,
      textAlign: "center"
    }}>Introducing Acme 2.0</Heading>
      <Paragraph style={{
      fontSize: 16,
      textAlign: "center",
      color: "#CBD2D9"
    }}>The fastest way to build, ship and measure.</Paragraph>
    </Section>
    <Section style={{
    backgroundColor: "#FFFFFF",
    padding: 32,
    gap: 16
  }}>
      <Video src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" thumbnail={thumbnail(Root, "#334E68")} title="See it in 90 seconds" />
      <Paragraph style={{
      fontSize: 15,
      lineHeight: 1.6,
      color: MUTED
    }}>Ninety seconds on what changed, and what it means for your team.</Paragraph>
      <Column style={{
      alignItems: "center"
    }}>
        <Button href="https://example.com/try" style={{
        backgroundColor: BRAND,
        padding: [12, 24],
        borderRadius: 6
      }}>Try it free</Button>
      </Column>
    </Section>
  </Root>)`,...a.parameters?.docs?.source},description:{story:"A video in the middle of a product launch: a band for the title, the video, and a button to try it.",...a.parameters?.docs?.description}}};const W=["YouTube","Vimeo","Widths","ProductLaunch"];export{a as ProductLaunch,n as Vimeo,i as Widths,o as YouTube,W as __namedExportsOrder,T as default};
