import{j as e}from"./jsx-runtime-L18gkHLN.js";import{b as p,D as x,q as y,R as s,d as t,T as n,H as c,k as d,j as u,s as f,t as j,u as g}from"./render-BiR0cNJI.js";import"./iframe-CUJXEzm2.js";import"./preload-helper-PPVm8Dsz.js";import"./create-component-ogGxHlnO.js";import"./Column-ROL-MH33.js";import"./normalize-8womD6Vs.js";import"./Html-KcbNJWYe.js";const C={title:"Primitives/Document",parameters:{docs:{description:{component:"A `<Document>` rendered to print HTML: each page a box of the paper's size, its header and footer on each, numbered. Print it (or save it as PDF) from the frame; `@unlayer/elements-pdf` writes the same pages as a PDF without a browser."}}}},P=a=>({loaders:[async()=>({html:(await p(a)).html})],render:(o,{loaded:h})=>e.jsx("iframe",{title:"Print HTML",srcDoc:h.html,style:{width:"100%",height:1400,border:0},onLoad:m=>{const l=m.currentTarget;l.style.height=`${l.contentDocument?.documentElement.scrollHeight??1400}px`}})}),r=(a,o)=>e.jsxs(s,{style:{gap:24,padding:[8,0],border:{bottom:"1px solid #e5e7eb"}},children:[e.jsx(t,{children:e.jsx(n,{children:a})}),e.jsx(t,{style:{width:120},children:e.jsx(n,{style:{textAlign:"right"},children:o})})]},a),i=P(e.jsxs(x,{size:"Letter",margin:[56,64],title:"Invoice 2705",style:{fontFamily:"Arial, Helvetica, sans-serif",fontSize:12,lineHeight:1.45,color:"#111827"},children:[e.jsx(y,{style:{padding:[0,0,20,0]},children:e.jsxs(s,{style:{alignItems:"center"},children:[e.jsx(t,{children:e.jsx(n,{style:{fontWeight:700,fontSize:14},children:"Acme"})}),e.jsx(t,{children:e.jsx(n,{style:{textAlign:"right",color:"#6b7280",fontSize:10},children:"Invoice 2705 · July 1, 2026"})})]})}),e.jsx(c,{level:1,style:{fontSize:28},children:"Invoice"}),e.jsx(d,{style:{color:"#4b5563"},children:"Billed to Maya Chen, 100 Market St, San Francisco, CA."}),e.jsxs(u,{style:{padding:[16,0],gap:0},children:[r("Pro plan (monthly)","$25.00"),r("Additional seats × 3","$36.00"),r("Usage overage","$4.50"),e.jsxs(s,{style:{gap:24,padding:[12,0]},children:[e.jsx(t,{children:e.jsx(n,{style:{fontWeight:700},children:"Total"})}),e.jsx(t,{style:{width:120},children:e.jsx(n,{style:{textAlign:"right",fontWeight:700},children:"$65.50"})})]})]}),e.jsx(f,{}),e.jsx(c,{level:2,children:"Terms"}),e.jsx(d,{children:"Payment is due within 30 days. Late payments accrue interest at 1% a month."}),e.jsx(j,{children:e.jsxs(n,{style:{fontSize:10,color:"#6b7280",textAlign:"right"},children:["Page ",e.jsx(g,{})," of ",e.jsx(g,{total:!0})]})})]}));i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`printed(<Document size="Letter" margin={[56, 64]} title="Invoice 2705" style={{
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: 12,
  lineHeight: 1.45,
  color: "#111827"
}}>
    <PageHeader style={{
    padding: [0, 0, 20, 0]
  }}>
      <Row style={{
      alignItems: "center"
    }}>
        <Column>
          <Text style={{
          fontWeight: 700,
          fontSize: 14
        }}>Acme</Text>
        </Column>
        <Column>
          <Text style={{
          textAlign: "right",
          color: "#6b7280",
          fontSize: 10
        }}>Invoice 2705 · July 1, 2026</Text>
        </Column>
      </Row>
    </PageHeader>
    <Heading level={1} style={{
    fontSize: 28
  }}>
      Invoice
    </Heading>
    <Paragraph style={{
    color: "#4b5563"
  }}>Billed to Maya Chen, 100 Market St, San Francisco, CA.</Paragraph>
    <Section style={{
    padding: [16, 0],
    gap: 0
  }}>
      {line("Pro plan (monthly)", "$25.00")}
      {line("Additional seats × 3", "$36.00")}
      {line("Usage overage", "$4.50")}
      <Row style={{
      gap: 24,
      padding: [12, 0]
    }}>
        <Column>
          <Text style={{
          fontWeight: 700
        }}>Total</Text>
        </Column>
        <Column style={{
        width: 120
      }}>
          <Text style={{
          textAlign: "right",
          fontWeight: 700
        }}>$65.50</Text>
        </Column>
      </Row>
    </Section>
    <PageBreak />
    <Heading level={2}>Terms</Heading>
    <Paragraph>Payment is due within 30 days. Late payments accrue interest at 1% a month.</Paragraph>
    <PageFooter>
      <Text style={{
      fontSize: 10,
      color: "#6b7280",
      textAlign: "right"
    }}>
        Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  </Document>)`,...i.parameters?.docs?.source},description:{story:"An invoice and its terms: two Letter pages, a header and a numbered footer on each.",...i.parameters?.docs?.description}}};const D=["Invoice"];export{i as Invoice,D as __namedExportsOrder,C as default};
