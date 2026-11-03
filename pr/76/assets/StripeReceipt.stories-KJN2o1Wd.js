import{j as o}from"./jsx-runtime-DhNWAmKT.js";import{B as C}from"./Button-mEOb8EHm.js";import{D as s}from"./Divider-BvsoeFa5.js";import{H as p}from"./Heading-xUjnqJzx.js";import{P as a}from"./Paragraph-DZMDPKd1.js";import{R as t,C as e}from"./Column-CU-e8eIN.js";import{E as f}from"./Email-FU7HVbZH.js";import{C as n}from"./create-component-BGcOpEsR.js";const F="#635BFF",l="#1A1F36",d="#697386",x="#E3E8EE",b={label:"Sans Serif",value:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};function c(m,g,h=!1){const u={padding:"14px 0",borderBottomWidth:h?"0px":"1px",borderBottomStyle:"solid",borderBottomColor:x};return o.jsxs(t,{layout:n.TwoEqual,backgroundColor:"#FFFFFF",padding:"0 48px",children:[o.jsx(e,{...u,children:o.jsx(a,{html:m,fontSize:"14px",color:d,lineHeight:"140%"})}),o.jsx(e,{...u,children:o.jsx(a,{html:`<b>${g}</b>`,fontSize:"14px",color:l,textAlign:"right",lineHeight:"140%"})})]})}function i(){return o.jsxs(f,{backgroundColor:"#F6F9FC",contentWidth:"600px",fontFamily:b,textColor:l,previewText:"Your receipt from Acme — Receipt #2705, paid Jul 1, 2026.",children:[o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"44px 48px 0 48px",children:o.jsx(e,{children:o.jsx(p,{headingType:"h4",fontSize:"20px",fontWeight:700,color:F,textAlign:"left",lineHeight:"100%",letterSpacing:"-0.01em",children:"Acme"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"40px 48px 0 48px",children:o.jsx(e,{children:o.jsx(a,{html:"RECEIPT",fontSize:"12px",fontWeight:700,color:d,textAlign:"left",letterSpacing:"0.06em",lineHeight:"100%"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"12px 48px 0 48px",children:o.jsx(e,{children:o.jsx(p,{headingType:"h1",fontSize:"28px",fontWeight:600,color:l,textAlign:"left",lineHeight:"125%",letterSpacing:"-0.02em",children:"Receipt from Acme"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"6px 48px 0 48px",children:o.jsx(e,{children:o.jsx(a,{html:"Receipt #2705 · Paid Jul 1, 2026",fontSize:"14px",color:d,textAlign:"left",lineHeight:"150%"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"32px 48px 4px 48px",children:o.jsx(e,{children:o.jsx(s,{borderTopWidth:"1px",borderTopColor:x,borderTopStyle:"solid"})})}),c("Pro Plan (monthly)","$25.00"),c("Additional seats × 3","$36.00"),c("Usage overage","$4.50",!0),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"8px 48px 0 48px",children:o.jsx(e,{children:o.jsx(s,{borderTopWidth:"1px",borderTopColor:x,borderTopStyle:"solid"})})}),o.jsxs(t,{layout:n.TwoEqual,backgroundColor:"#FFFFFF",padding:"20px 48px 0 48px",children:[o.jsx(e,{children:o.jsx(p,{headingType:"h3",fontSize:"18px",fontWeight:600,color:l,textAlign:"left",lineHeight:"120%",children:"Total"})}),o.jsx(e,{children:o.jsx(p,{headingType:"h3",fontSize:"22px",fontWeight:700,color:l,textAlign:"right",lineHeight:"120%",letterSpacing:"-0.01em",children:"$65.50"})})]}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"36px 48px 0 48px",children:o.jsx(e,{children:o.jsx(C,{href:"https://acme.com/invoices/2705.pdf",backgroundColor:F,color:"#FFFFFF",fontSize:"15px",fontWeight:600,padding:"13px 24px",borderRadius:"8px",textAlign:"left",children:"Download invoice"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"44px 48px 48px 48px",children:o.jsx(e,{children:o.jsx(a,{html:"Questions about this receipt? Contact <a href='mailto:support@acme.com'>support@acme.com</a>.",fontSize:"12px",color:d,textAlign:"left",lineHeight:"160%"})})})]})}const y={title:"Agent Examples/Stripe · Payment Receipt",component:i},r={};i.__docgenInfo={description:"",methods:[],displayName:"StripeReceipt"};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`function StripeReceipt() {
  return <Email backgroundColor="#F6F9FC" contentWidth="600px" fontFamily={sans} textColor={INK} previewText="Your receipt from Acme — Receipt #2705, paid Jul 1, 2026.">
      {/* Wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="44px 48px 0 48px">
        <Column>
          <Heading headingType="h4" fontSize="20px" fontWeight={700} color={INDIGO} textAlign="left" lineHeight="100%" letterSpacing="-0.01em">
            Acme
          </Heading>
        </Column>
      </Row>

      {/* Eyebrow + heading + meta */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="40px 48px 0 48px">
        <Column>
          <Paragraph html="RECEIPT" fontSize="12px" fontWeight={700} color={MUTED} textAlign="left" letterSpacing="0.06em" lineHeight="100%" />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="12px 48px 0 48px">
        <Column>
          <Heading headingType="h1" fontSize="28px" fontWeight={600} color={INK} textAlign="left" lineHeight="125%" letterSpacing="-0.02em">
            Receipt from Acme
          </Heading>
        </Column>
      </Row>
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="6px 48px 0 48px">
        <Column>
          <Paragraph html="Receipt #2705 · Paid Jul 1, 2026" fontSize="14px" color={MUTED} textAlign="left" lineHeight="150%" />
        </Column>
      </Row>

      {/* Section divider before line items */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="32px 48px 4px 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Line items — Row + Column with hairline dividers (never <Table>) */}
      {lineRow("Pro Plan (monthly)", "$25.00")}
      {lineRow("Additional seats × 3", "$36.00")}
      {lineRow("Usage overage", "$4.50", true)}

      {/* Section divider before total */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="8px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Total — emphasized, no divider */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor="#FFFFFF" padding="20px 48px 0 48px">
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={600} color={INK} textAlign="left" lineHeight="120%">
            Total
          </Heading>
        </Column>
        <Column>
          <Heading headingType="h3" fontSize="22px" fontWeight={700} color={INK} textAlign="right" lineHeight="120%" letterSpacing="-0.01em">
            $65.50
          </Heading>
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="36px 48px 0 48px">
        <Column>
          <Button href="https://acme.com/invoices/2705.pdf" backgroundColor={INDIGO} color="#FFFFFF" fontSize="15px" fontWeight={600} padding="13px 24px" borderRadius="8px" textAlign="left">
            Download invoice
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="44px 48px 48px 48px">
        <Column>
          <Paragraph html="Questions about this receipt? Contact <a href='mailto:support@acme.com'>support@acme.com</a>." fontSize="12px" color={MUTED} textAlign="left" lineHeight="160%" />
        </Column>
      </Row>
    </Email>;
}`,...i.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};const S=["StripeReceipt","Default"],O=Object.freeze(Object.defineProperty({__proto__:null,Default:r,StripeReceipt:i,__namedExportsOrder:S,default:y},Symbol.toStringTag,{value:"Module"}));export{i as S,O as s};
