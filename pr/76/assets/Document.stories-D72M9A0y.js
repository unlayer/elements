import{j as e}from"./jsx-runtime-CAEbENTf.js";import{r as p}from"./render-CdkSSt01.js";import{j as x,k as y,R as o,C as t,T as n,H as c,P as d,f as u,l as f,m as j,n as m}from"./components-DT8cqg9W.js";import"./iframe-BOulKYa9.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BL1rfIyn.js";import"./create-component-tFfyLCt7.js";import"./Column-DeOaAg8T.js";import"./normalize-D-3_b-_g.js";import"./Html-Cs8fwDgZ.js";const D={title:"Primitives/Document",parameters:{docs:{description:{component:"A `<Document>` rendered to print HTML: each page a box of the paper's size, its header and footer on each, numbered. Print it (or save it as PDF) from the frame; `@unlayer/elements-pdf` writes the same pages as a PDF without a browser."}}}},P=r=>({loaders:[async()=>({html:(await p(r)).html})],render:(s,{loaded:g})=>e.jsx("iframe",{title:"Print HTML",srcDoc:g.html,style:{width:"100%",height:1400,border:0},onLoad:h=>{const l=h.currentTarget;l.style.height=`${l.contentDocument?.documentElement.scrollHeight??1400}px`}})}),a=(r,s)=>e.jsxs(o,{style:{gap:24,padding:[8,0],border:{bottom:"1px solid #e5e7eb"}},children:[e.jsx(t,{children:e.jsx(n,{children:r})}),e.jsx(t,{style:{width:120},children:e.jsx(n,{style:{textAlign:"right"},children:s})})]},r),i=P(e.jsxs(x,{size:"Letter",margin:[56,64],title:"Invoice 2705",style:{fontFamily:"Arial, Helvetica, sans-serif",fontSize:12,lineHeight:1.45,color:"#111827"},children:[e.jsx(y,{style:{padding:[0,0,20,0]},children:e.jsxs(o,{style:{alignItems:"center"},children:[e.jsx(t,{children:e.jsx(n,{style:{fontWeight:700,fontSize:14},children:"Acme"})}),e.jsx(t,{children:e.jsx(n,{style:{textAlign:"right",color:"#6b7280",fontSize:10},children:"Invoice 2705 · July 1, 2026"})})]})}),e.jsx(c,{level:1,style:{fontSize:28},children:"Invoice"}),e.jsx(d,{style:{color:"#4b5563"},children:"Billed to Maya Chen, 100 Market St, San Francisco, CA."}),e.jsxs(u,{style:{padding:[16,0],gap:0},children:[a("Pro plan (monthly)","$25.00"),a("Additional seats × 3","$36.00"),a("Usage overage","$4.50"),e.jsxs(o,{style:{gap:24,padding:[12,0]},children:[e.jsx(t,{children:e.jsx(n,{style:{fontWeight:700},children:"Total"})}),e.jsx(t,{style:{width:120},children:e.jsx(n,{style:{textAlign:"right",fontWeight:700},children:"$65.50"})})]})]}),e.jsx(f,{}),e.jsx(c,{level:2,children:"Terms"}),e.jsx(d,{children:"Payment is due within 30 days. Late payments accrue interest at 1% a month."}),e.jsx(j,{children:e.jsxs(n,{style:{fontSize:10,color:"#6b7280",textAlign:"right"},children:["Page ",e.jsx(m,{})," of ",e.jsx(m,{total:!0})]})})]}));i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`printed(<Document size="Letter" margin={[56, 64]} title="Invoice 2705" style={{
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
  </Document>)`,...i.parameters?.docs?.source},description:{story:"An invoice and its terms: two Letter pages, a header and a numbered footer on each.",...i.parameters?.docs?.description}}};const F=["Invoice"];export{i as Invoice,F as __namedExportsOrder,D as default};
