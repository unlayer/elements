import{j as e}from"./jsx-runtime-Cf-MKpCd.js";import{a as y,b as F,d as u}from"./SideBySide-C5zoQ7Ex.js";import{F as d,l as m,B as x,p}from"./shared-DuwPCDP_.js";import{S as c,aO as a,I as r,C as f,H as w,P as g,B as I,T as l}from"./render-k9Rgha0b.js";import"./iframe-qU7x7_dT.js";import"./preload-helper-PPVm8Dsz.js";const T={title:"Components/Layer",args:F,argTypes:y,parameters:{docs:{description:{component:'Its children over each other, in one box: an image with words on it. In an email, that\'s an `Image` with one child over it. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.'}}}},h=u,n=h(t=>e.jsx(t,{width:560,style:{color:"#FFFFFF",fontFamily:d},children:e.jsx(c,{children:e.jsxs(a,{style:{height:280,alignItems:"center"},children:[e.jsx(r,{src:m(1120,560),alt:"Hills under a sun",style:{width:"100%"}}),e.jsxs(f,{style:{padding:[0,32],gap:12,alignItems:"start"},children:[e.jsx(w,{level:1,style:{fontSize:32},children:"Into the hills"}),e.jsx(g,{style:{fontSize:15},children:"Trails for every weekend of the season."}),e.jsx(I,{href:"https://example.com/trails",style:{backgroundColor:"#FFFFFF",color:x,borderRadius:6},children:"Find a trail"})]})]})})})),s=h(t=>e.jsx(t,{width:560,style:{fontFamily:d},children:e.jsx(c,{style:{padding:24},children:e.jsxs(a,{style:{height:200,alignItems:"end",borderRadius:12},children:[e.jsx(r,{src:m(1024,400),alt:"Hills under a sun",style:{width:"100%"}}),e.jsx(g,{style:{padding:[10,16],backgroundColor:"#111827",color:"#F9FAFB",fontSize:14},children:"Photographed in the north, last spring"})]})})})),o=h(t=>e.jsx(t,{width:560,style:{color:"#FFFFFF",fontFamily:d},children:e.jsxs(c,{style:{padding:24,gap:16},children:[e.jsxs(a,{style:{height:120,alignItems:"start"},children:[e.jsx(r,{src:p("#334E68",1024,240),alt:"A flat blue",style:{width:"100%"}}),e.jsx(l,{style:{padding:12,fontSize:15,textAlign:"center"},children:"At the top"})]}),e.jsxs(a,{style:{height:120,alignItems:"center"},children:[e.jsx(r,{src:p("#486581",1024,240),alt:"A flat blue",style:{width:"100%"}}),e.jsx(l,{style:{padding:12,fontSize:15,textAlign:"center"},children:"In the middle"})]}),e.jsxs(a,{style:{height:120,alignItems:"end"},children:[e.jsx(r,{src:p("#627D98",1024,240),alt:"A flat blue",style:{width:"100%"}}),e.jsx(l,{style:{padding:12,fontSize:15,textAlign:"center"},children:"At the bottom"})]})]})})),i=h(t=>e.jsx(t,{width:560,style:{color:"#FFFFFF",fontFamily:d},children:e.jsx(c,{children:e.jsxs(a,{style:{height:240,alignItems:"center",fontSize:22},mobile:{fontSize:16,textAlign:"center"},children:[e.jsx(r,{src:m(1120,480),alt:"Hills under a sun",style:{width:"100%"}}),e.jsx(l,{style:{padding:[0,32],fontWeight:700},children:"Smaller on phones"})]})})}));n.__docgenInfo={description:"Words and a button over a picture: `height` is the box's, and the picture covers it.",methods:[],displayName:"WordsOverAPicture"};s.__docgenInfo={description:"A caption along the bottom, on a band of its own, with the Layer's corners rounded.",methods:[],displayName:"Caption"};o.__docgenInfo={description:"`alignItems` is where its children sit in its height: at the top, in the middle, at the bottom.",methods:[],displayName:"Alignment"};i.__docgenInfo={description:'`mobile` has the text\'s size and alignment on phones: choose "phone" under width to see it.',methods:[],displayName:"OnPhones"};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: "#FFFFFF",
  fontFamily: FONT
}}>
    <Section>
      <Layer style={{
      height: 280,
      alignItems: "center"
    }}>
        <Image src={landscape(1120, 560)} alt="Hills under a sun" style={{
        width: "100%"
      }} />
        <Column style={{
        padding: [0, 32],
        gap: 12,
        alignItems: "start"
      }}>
          <Heading level={1} style={{
          fontSize: 32
        }}>Into the hills</Heading>
          <Paragraph style={{
          fontSize: 15
        }}>Trails for every weekend of the season.</Paragraph>
          <Button href="https://example.com/trails" style={{
          backgroundColor: "#FFFFFF",
          color: BRAND,
          borderRadius: 6
        }}>Find a trail</Button>
        </Column>
      </Layer>
    </Section>
  </Root>)`,...n.parameters?.docs?.source},description:{story:"Words and a button over a picture: `height` is the box's, and the picture covers it.",...n.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Layer style={{
      height: 200,
      alignItems: "end",
      borderRadius: 12
    }}>
        <Image src={landscape(1024, 400)} alt="Hills under a sun" style={{
        width: "100%"
      }} />
        <Paragraph style={{
        padding: [10, 16],
        backgroundColor: "#111827",
        color: "#F9FAFB",
        fontSize: 14
      }}>Photographed in the north, last spring</Paragraph>
      </Layer>
    </Section>
  </Root>)`,...s.parameters?.docs?.source},description:{story:"A caption along the bottom, on a band of its own, with the Layer's corners rounded.",...s.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: "#FFFFFF",
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16
  }}>
      <Layer style={{
      height: 120,
      alignItems: "start"
    }}>
        <Image src={picture("#334E68", 1024, 240)} alt="A flat blue" style={{
        width: "100%"
      }} />
        <Text style={{
        padding: 12,
        fontSize: 15,
        textAlign: "center"
      }}>At the top</Text>
      </Layer>
      <Layer style={{
      height: 120,
      alignItems: "center"
    }}>
        <Image src={picture("#486581", 1024, 240)} alt="A flat blue" style={{
        width: "100%"
      }} />
        <Text style={{
        padding: 12,
        fontSize: 15,
        textAlign: "center"
      }}>In the middle</Text>
      </Layer>
      <Layer style={{
      height: 120,
      alignItems: "end"
    }}>
        <Image src={picture("#627D98", 1024, 240)} alt="A flat blue" style={{
        width: "100%"
      }} />
        <Text style={{
        padding: 12,
        fontSize: 15,
        textAlign: "center"
      }}>At the bottom</Text>
      </Layer>
    </Section>
  </Root>)`,...o.parameters?.docs?.source},description:{story:"`alignItems` is where its children sit in its height: at the top, in the middle, at the bottom.",...o.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: "#FFFFFF",
  fontFamily: FONT
}}>
    <Section>
      <Layer style={{
      height: 240,
      alignItems: "center",
      fontSize: 22
    }} mobile={{
      fontSize: 16,
      textAlign: "center"
    }}>
        <Image src={landscape(1120, 480)} alt="Hills under a sun" style={{
        width: "100%"
      }} />
        <Text style={{
        padding: [0, 32],
        fontWeight: 700
      }}>Smaller on phones</Text>
      </Layer>
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:'`mobile` has the text\'s size and alignment on phones: choose "phone" under width to see it.',...i.parameters?.docs?.description}}};const L=["WordsOverAPicture","Caption","Alignment","OnPhones"];export{o as Alignment,s as Caption,i as OnPhones,n as WordsOverAPicture,L as __namedExportsOrder,T as default};
