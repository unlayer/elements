import{j as e}from"./jsx-runtime-BF5DEDpw.js";import{r as c,g as d,C as f,H as h,T as s,R as m,h as i,i as y,j as g,k as n}from"./render-BMR9R1_0.js";import"./iframe-wNWmkGO9.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CE3QPv2v.js";import"./create-component-Df6eRtdD.js";import"./Column-BRdT06Ei.js";import"./normalize-D75PgBe4.js";import"./Html-Bq6Jeojj.js";const L={title:"Primitives/Canvas",parameters:{docs:{description:{component:"A `<Canvas>` rendered to HTML, to look at: a box of its size, its content laid out in it. `@unlayer/elements-image` writes the same as a PNG or SVG without a browser (its test compares the two pixel by pixel)."}}}},p=(a,l,r)=>({loaders:[async()=>({html:(await c(a)).html})],render:(x,{loaded:o})=>e.jsx("iframe",{title:"Canvas",srcDoc:o.html,style:{width:l,height:r,border:0}})}),t=p(e.jsxs(d,{width:600,height:315,style:{backgroundColor:"#0f172a",padding:40,gap:16,color:"#ffffff",justifyContent:"space-between"},children:[e.jsxs(f,{style:{gap:12},children:[e.jsx(h,{level:1,style:{fontSize:40,lineHeight:1.1},children:"Launch week"}),e.jsx(s,{style:{fontSize:18,color:"#cbd5e1"},children:"Five days of new things, one a day."})]}),e.jsxs(m,{style:{alignItems:"center",gap:12},children:[e.jsxs(i,{width:40,height:40,title:"Acme",children:[e.jsx(y,{width:40,height:40,rx:10,style:{fill:"#6366f1"}}),e.jsx(g,{d:"M12 28 L20 12 L28 28 Z",style:{fill:"#ffffff"}})]}),e.jsx(s,{style:{fontSize:16,fontWeight:700},children:"acme.dev"}),e.jsxs(i,{width:120,height:24,children:[e.jsx(n,{cx:12,cy:12,r:6,style:{fill:"#22c55e"}}),e.jsx(n,{cx:36,cy:12,r:6,style:{fill:"#eab308"}}),e.jsx(n,{cx:60,cy:12,r:6,style:{fill:"#ef4444"}})]})]})]}),600,315);t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`drawn(<Canvas width={600} height={315} style={{
  backgroundColor: "#0f172a",
  padding: 40,
  gap: 16,
  color: "#ffffff",
  justifyContent: "space-between"
}}>
    <Column style={{
    gap: 12
  }}>
      <Heading level={1} style={{
      fontSize: 40,
      lineHeight: 1.1
    }}>
        Launch week
      </Heading>
      <Text style={{
      fontSize: 18,
      color: "#cbd5e1"
    }}>Five days of new things, one a day.</Text>
    </Column>
    <Row style={{
    alignItems: "center",
    gap: 12
  }}>
      <Svg width={40} height={40} title="Acme">
        <Rect width={40} height={40} rx={10} style={{
        fill: "#6366f1"
      }} />
        <Path d="M12 28 L20 12 L28 28 Z" style={{
        fill: "#ffffff"
      }} />
      </Svg>
      <Text style={{
      fontSize: 16,
      fontWeight: 700
    }}>acme.dev</Text>
      <Svg width={120} height={24}>
        <Circle cx={12} cy={12} r={6} style={{
        fill: "#22c55e"
      }} />
        <Circle cx={36} cy={12} r={6} style={{
        fill: "#eab308"
      }} />
        <Circle cx={60} cy={12} r={6} style={{
        fill: "#ef4444"
      }} />
      </Svg>
    </Row>
  </Canvas>, 600, 315)`,...t.parameters?.docs?.source},description:{story:"A social card (1200 × 630, drawn at half size): a title, a line under it, and a drawn logo.",...t.parameters?.docs?.description}}};const R=["SocialCard"];export{t as SocialCard,R as __namedExportsOrder,L as default};
