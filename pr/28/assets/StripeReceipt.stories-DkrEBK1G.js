import{j as o}from"./jsx-runtime-BTYzmbJG.js";import{B as c}from"./Button-CvmOE4Be.js";import{D as m}from"./Divider-CyqBXAb3.js";import{H as p}from"./Heading-DHRtVwCY.js";import{P as a}from"./Paragraph-DR98H8Sf.js";import{T as x}from"./Table-D1N00eux.js";import{R as n,C as e}from"./Column-Cve4JGCb.js";import{E as u}from"./Email-C7ZZiOtI.js";import{C as t}from"./create-component-BVsjaTpd.js";import"./iframe-DddmH49G.js";import"./preload-helper-PPVm8Dsz.js";import"./Body-Dp20ziZr.js";const d="#635BFF",i="#1A1F36",s="#697386",F="#E3E8EE",g={label:"Sans Serif",value:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};function r(){return o.jsxs(u,{backgroundColor:"#F6F9FC",contentWidth:"600px",fontFamily:g,children:[o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"36px 48px 4px 48px",children:o.jsx(e,{children:o.jsx(p,{headingType:"h3",fontSize:"20px",fontWeight:700,color:d,textAlign:"left",children:"Acme, Inc."})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"12px 48px 0 48px",children:o.jsxs(e,{children:[o.jsx(p,{headingType:"h1",fontSize:"28px",fontWeight:600,color:i,lineHeight:"130%",children:"Receipt from Acme"}),o.jsx(a,{html:"Receipt #2705-0042 · Paid July 1, 2026",fontSize:"14px",color:s})]})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"16px 48px 0 48px",children:o.jsx(e,{children:o.jsx(x,{headers:["Description","Amount"],data:[["Pro Plan (monthly)","$25.00"],["Additional seats × 3","$36.00"],["Usage overage","$4.50"]]})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"8px 48px 0 48px",children:o.jsx(e,{children:o.jsx(m,{borderTopWidth:"1px",borderTopColor:F,borderTopStyle:"solid"})})}),o.jsxs(n,{layout:t.TwoEqual,backgroundColor:"#FFFFFF",padding:"8px 48px 4px 48px",children:[o.jsx(e,{children:o.jsx(a,{html:"<b>Total paid</b>",fontSize:"16px",color:i,textAlign:"left"})}),o.jsx(e,{children:o.jsx(a,{html:"<b>$65.50</b>",fontSize:"16px",color:i,textAlign:"right"})})]}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"20px 48px 36px 48px",children:o.jsx(e,{children:o.jsx(c,{href:"https://acme.com/invoices/2705-0042.pdf",backgroundColor:d,color:"#FFFFFF",fontSize:"15px",fontWeight:500,padding:"12px 22px",borderRadius:"6px",textAlign:"left",children:"Download invoice"})})}),o.jsx(n,{layout:t.OneColumn,padding:"20px 48px 40px 48px",children:o.jsx(e,{children:o.jsx(a,{html:"Questions? Contact <a href='mailto:support@acme.com'>support@acme.com</a>.",fontSize:"12px",color:s,textAlign:"center",lineHeight:"150%"})})})]})}const E={title:"Agent Examples/Stripe · Payment Receipt",component:r},l={};r.__docgenInfo={description:"",methods:[],displayName:"StripeReceipt"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`function StripeReceipt() {
  return <Email backgroundColor="#F6F9FC" contentWidth="600px" fontFamily={sans}>
      {/* Brand wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="36px 48px 4px 48px">
        <Column>
          <Heading headingType="h3" fontSize="20px" fontWeight={700} color={INDIGO} textAlign="left">
            Acme, Inc.
          </Heading>
        </Column>
      </Row>

      {/* Heading */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="12px 48px 0 48px">
        <Column>
          <Heading headingType="h1" fontSize="28px" fontWeight={600} color={INK} lineHeight="130%">
            Receipt from Acme
          </Heading>
          <Paragraph html="Receipt #2705-0042 · Paid July 1, 2026" fontSize="14px" color={MUTED} />
        </Column>
      </Row>

      {/* Line items */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="16px 48px 0 48px">
        <Column>
          <Table headers={["Description", "Amount"]} data={[["Pro Plan (monthly)", "$25.00"], ["Additional seats × 3", "$36.00"], ["Usage overage", "$4.50"]]} />
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="8px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Total */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="8px 48px 4px 48px">
        <Column>
          <Paragraph html="<b>Total paid</b>" fontSize="16px" color={INK} textAlign="left" />
        </Column>
        <Column>
          <Paragraph html="<b>$65.50</b>" fontSize="16px" color={INK} textAlign="right" />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 48px 36px 48px">
        <Column>
          <Button href="https://acme.com/invoices/2705-0042.pdf" backgroundColor={INDIGO} color="#FFFFFF" fontSize="15px" fontWeight={500} padding="12px 22px" borderRadius="6px" textAlign="left">
            Download invoice
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} padding="20px 48px 40px 48px">
        <Column>
          <Paragraph html="Questions? Contact <a href='mailto:support@acme.com'>support@acme.com</a>." fontSize="12px" color={MUTED} textAlign="center" lineHeight="150%" />
        </Column>
      </Row>
    </Email>;
}`,...r.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:"{}",...l.parameters?.docs?.source}}};const I=["StripeReceipt","Default"];export{l as Default,r as StripeReceipt,I as __namedExportsOrder,E as default};
