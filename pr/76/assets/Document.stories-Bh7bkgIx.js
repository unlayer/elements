import{j as e}from"./jsx-runtime-THifDsy3.js";import{ag as T,ah as v,c as s,H as r,P as t,T as n,ar as P,R as y,C as o,S as w,as as f,at as j,au as a}from"./SideBySide-BdbHV3aE.js";import"./iframe-D8KOAXBp.js";import"./preload-helper-PPVm8Dsz.js";const F={title:"Document",parameters:{docs:{description:{component:"A `<Document>` rendered to print HTML: each page a box of the paper's size, its header and footer on each, numbered. Print it (or save it as PDF) from the frame; `@unlayer/elements-pdf` writes the same pages as a PDF without a browser."}}}},i=l=>({parameters:{docs:{source:{code:v(l),language:"tsx"}}},loaders:[async()=>({html:(await T(l)).html})],render:(b,{loaded:A})=>e.jsx("iframe",{title:"Print HTML",srcDoc:A.html,style:{width:"100%",height:1400,border:0},onLoad:z=>{const S=z.currentTarget;S.style.height=`${S.contentDocument?.documentElement.scrollHeight??1400}px`}})}),x=(l,b)=>e.jsxs(y,{style:{gap:24,padding:[8,0],border:{bottom:"1px solid #e5e7eb"}},children:[e.jsx(o,{children:e.jsx(n,{children:l})}),e.jsx(o,{style:{width:120},children:e.jsx(n,{style:{textAlign:"right"},children:b})})]},l),c=i(e.jsxs(s,{size:"Letter",margin:[56,64],title:"Invoice 2705",style:{backgroundColor:"#ffffff",fontFamily:"Arial, Helvetica, sans-serif",fontSize:12,lineHeight:1.45,color:"#111827"},children:[e.jsx(P,{style:{padding:[0,0,20,0]},children:e.jsxs(y,{style:{alignItems:"center"},children:[e.jsx(o,{children:e.jsx(n,{style:{fontWeight:700,fontSize:14},children:"Acme"})}),e.jsx(o,{children:e.jsx(n,{style:{textAlign:"right",color:"#6b7280",fontSize:10},children:"Invoice 2705 · July 1, 2026"})})]})}),e.jsx(r,{level:1,style:{fontSize:28},children:"Invoice"}),e.jsx(t,{style:{color:"#4b5563"},children:"Billed to Maya Chen, 100 Market St, San Francisco, CA."}),e.jsxs(w,{style:{padding:[16,0],gap:0},children:[x("Pro plan (monthly)","$25.00"),x("Additional seats × 3","$36.00"),x("Usage overage","$4.50"),e.jsxs(y,{style:{gap:24,padding:[12,0]},children:[e.jsx(o,{children:e.jsx(n,{style:{fontWeight:700},children:"Total"})}),e.jsx(o,{style:{width:120},children:e.jsx(n,{style:{textAlign:"right",fontWeight:700},children:"$65.50"})})]})]}),e.jsx(f,{}),e.jsx(r,{level:2,children:"Terms"}),e.jsx(t,{children:"Payment is due within 30 days. Late payments accrue interest at 1% a month."}),e.jsx(j,{children:e.jsxs(n,{style:{fontSize:10,color:"#6b7280",textAlign:"right"},children:["Page ",e.jsx(a,{})," of ",e.jsx(a,{total:!0})]})})]})),u={backgroundColor:"#ffffff",fontFamily:"Arial, Helvetica, sans-serif",fontSize:13,lineHeight:1.5,color:"#111827",gap:8},d=i(e.jsxs(s,{size:"A5",margin:40,title:"A short guide",style:u,children:[e.jsx(r,{level:1,style:{fontSize:22},children:"Part one"}),e.jsx(t,{children:"This part ends at the PageBreak under this line, however much room is left on its page."}),e.jsx(f,{}),e.jsx(r,{level:1,style:{fontSize:22},children:"Part two"}),e.jsx(t,{children:"This part starts on a page of its own."}),e.jsx(f,{}),e.jsx(r,{level:1,style:{fontSize:22},children:"Part three"}),e.jsx(t,{children:"And so does this one."})]})),g=i(e.jsxs(s,{size:"A5",margin:32,title:"Quarterly report",style:u,children:[e.jsx(P,{style:{padding:[0,0,8,0],border:{bottom:"2px solid #0f766e"}},children:e.jsx(n,{style:{fontWeight:700,color:"#0f766e"},children:"Quarterly report"})}),e.jsx(r,{level:1,style:{fontSize:22},children:"Summary"}),e.jsx(t,{children:"Orders grew in every region this quarter, and returns held steady."}),e.jsx(f,{}),e.jsx(r,{level:1,style:{fontSize:22},children:"Next quarter"}),e.jsx(t,{children:"The header and the footer come back on this page by themselves."}),e.jsx(j,{style:{padding:[8,12],backgroundColor:"#f5f7fa"},children:e.jsx(n,{style:{fontSize:10,color:"#616e7c",textAlign:"center"},children:"Acme Inc., 1 Market St, San Francisco"})})]})),h=i(e.jsxs(s,{size:"A5",margin:32,title:"Page numbers",style:u,children:[e.jsx(P,{children:e.jsxs(n,{style:{fontSize:10,color:"#616e7c",textAlign:"right"},children:[e.jsx(a,{})," / ",e.jsx(a,{total:!0})]})}),e.jsxs(t,{children:["This document has ",e.jsx(a,{total:!0})," pages, and this is page ",e.jsx(a,{}),"."]}),e.jsx(f,{}),e.jsxs(t,{children:["This is page ",e.jsx(a,{}),", its last."]}),e.jsx(j,{children:e.jsxs(n,{style:{fontSize:10,color:"#616e7c",textAlign:"center"},children:["Page ",e.jsx(a,{})," of ",e.jsx(a,{total:!0})]})})]})),p=i(e.jsxs(s,{size:"A5",margin:40,title:"A cover and a page",style:u,children:[e.jsxs(s.Page,{style:{backgroundColor:"#0f172a",color:"#ffffff",gap:12},children:[e.jsx(r,{level:1,style:{fontSize:34},children:"The cover"}),e.jsx(t,{style:{color:"#cbd5e1"},children:"A page with a background out to its edges."})]}),e.jsxs(s.Page,{style:{gap:24},children:[e.jsx(r,{level:2,style:{fontSize:20},children:"The first page"}),e.jsx(t,{children:"A page of its own, with more space between what it holds."})]})]})),m=i(e.jsxs(s,{size:"A5",orientation:"landscape",margin:48,title:"Certificate",style:{...u,backgroundColor:"#fffbeb",textAlign:"center",gap:12},children:[e.jsx(n,{style:{fontSize:12,letterSpacing:3,textTransform:"uppercase",color:"#92400e"},children:"Certificate of completion"}),e.jsx(r,{level:1,style:{fontSize:34,fontFamily:"Georgia, serif"},children:"Your name here"}),e.jsx(t,{children:"finished all twelve lessons of the course."})]}));c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`printed(<Document size="Letter" margin={[56, 64]} title="Invoice 2705" style={{
  backgroundColor: "#ffffff",
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
  </Document>)`,...c.parameters?.docs?.source},description:{story:"An invoice and its terms: two Letter pages, a header and a numbered footer on each.",...c.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`printed(<Document size="A5" margin={40} title="A short guide" style={TYPE}>
    <Heading level={1} style={{
    fontSize: 22
  }}>
      Part one
    </Heading>
    <Paragraph>This part ends at the PageBreak under this line, however much room is left on its page.</Paragraph>
    <PageBreak />
    <Heading level={1} style={{
    fontSize: 22
  }}>
      Part two
    </Heading>
    <Paragraph>This part starts on a page of its own.</Paragraph>
    <PageBreak />
    <Heading level={1} style={{
    fontSize: 22
  }}>
      Part three
    </Heading>
    <Paragraph>And so does this one.</Paragraph>
  </Document>)`,...d.parameters?.docs?.source},description:{story:"`PageBreak` ends a page where you say: what follows starts the next one.",...d.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`printed(<Document size="A5" margin={32} title="Quarterly report" style={TYPE}>
    <PageHeader style={{
    padding: [0, 0, 8, 0],
    border: {
      bottom: "2px solid #0f766e"
    }
  }}>
      <Text style={{
      fontWeight: 700,
      color: "#0f766e"
    }}>Quarterly report</Text>
    </PageHeader>
    <Heading level={1} style={{
    fontSize: 22
  }}>
      Summary
    </Heading>
    <Paragraph>Orders grew in every region this quarter, and returns held steady.</Paragraph>
    <PageBreak />
    <Heading level={1} style={{
    fontSize: 22
  }}>
      Next quarter
    </Heading>
    <Paragraph>The header and the footer come back on this page by themselves.</Paragraph>
    <PageFooter style={{
    padding: [8, 12],
    backgroundColor: "#f5f7fa"
  }}>
      <Text style={{
      fontSize: 10,
      color: "#616e7c",
      textAlign: "center"
    }}>Acme Inc., 1 Market St, San Francisco</Text>
    </PageFooter>
  </Document>)`,...g.parameters?.docs?.source},description:{story:"A `PageHeader` and a `PageFooter` are drawn on every page, inside its margins, each with a box of its own.",...g.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`printed(<Document size="A5" margin={32} title="Page numbers" style={TYPE}>
    <PageHeader>
      <Text style={{
      fontSize: 10,
      color: "#616e7c",
      textAlign: "right"
    }}>
        <PageNumber /> / <PageNumber total />
      </Text>
    </PageHeader>
    <Paragraph>
      This document has <PageNumber total /> pages, and this is page <PageNumber />.
    </Paragraph>
    <PageBreak />
    <Paragraph>
      This is page <PageNumber />, its last.
    </Paragraph>
    <PageFooter>
      <Text style={{
      fontSize: 10,
      color: "#616e7c",
      textAlign: "center"
    }}>
        Page <PageNumber /> of <PageNumber total />
      </Text>
    </PageFooter>
  </Document>)`,...h.parameters?.docs?.source},description:{story:"`PageNumber` is the number of the page it's on, and with `total` how many there are: in a header, a footer, or any text.",...h.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`printed(<Document size="A5" margin={40} title="A cover and a page" style={TYPE}>
    <Document.Page style={{
    backgroundColor: "#0f172a",
    color: "#ffffff",
    gap: 12
  }}>
      <Heading level={1} style={{
      fontSize: 34
    }}>
        The cover
      </Heading>
      <Paragraph style={{
      color: "#cbd5e1"
    }}>A page with a background out to its edges.</Paragraph>
    </Document.Page>
    <Document.Page style={{
    gap: 24
  }}>
      <Heading level={2} style={{
      fontSize: 20
    }}>
        The first page
      </Heading>
      <Paragraph>A page of its own, with more space between what it holds.</Paragraph>
    </Document.Page>
  </Document>)`,...p.parameters?.docs?.source},description:{story:"`Document.Page` writes each page by itself, with its own background and spacing.",...p.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`printed(<Document size="A5" orientation="landscape" margin={48} title="Certificate" style={{
  ...TYPE,
  backgroundColor: "#fffbeb",
  textAlign: "center",
  gap: 12
}}>
    <Text style={{
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#92400e"
  }}>Certificate of completion</Text>
    <Heading level={1} style={{
    fontSize: 34,
    fontFamily: "Georgia, serif"
  }}>
      Your name here
    </Heading>
    <Paragraph>finished all twelve lessons of the course.</Paragraph>
  </Document>)`,...m.parameters?.docs?.source},description:{story:"`size` and `orientation` are the paper's: A5 turned on its side, for a certificate.",...m.parameters?.docs?.description}}};const B=["Invoice","PageBreaks","HeadersAndFooters","PageNumbers","PagesOneByOne","SizeAndOrientation"];export{g as HeadersAndFooters,c as Invoice,d as PageBreaks,h as PageNumbers,p as PagesOneByOne,m as SizeAndOrientation,B as __namedExportsOrder,F as default};
