import{j as o}from"./jsx-runtime-BMkwV71l.js";import{B as C}from"./Button-BakKUbSt.js";import{D as m}from"./Divider-DEItx034.js";import{H as a}from"./Heading-DTgt_zNQ.js";import{P as r}from"./Paragraph-Be0w9H3t.js";import{R as t,C as e}from"./Column-ClmK9czY.js";import{E as f}from"./Email-BnAwxn3E.js";import{C as n}from"./create-component-xGSb90rI.js";import"./iframe-DzZUZZU8.js";import"./preload-helper-PPVm8Dsz.js";import"./Body-B1659i05.js";const F="#635BFF",l="#1A1F36",d="#697386",c="#E3E8EE",y={label:"Sans Serif",value:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};function x(s,g,h=!1){const u={padding:"14px 0",borderBottomWidth:h?"0px":"1px",borderBottomStyle:"solid",borderBottomColor:c};return o.jsxs(t,{layout:n.TwoEqual,backgroundColor:"#FFFFFF",padding:"0 48px",children:[o.jsx(e,{...u,children:o.jsx(r,{html:s,fontSize:"14px",color:d,lineHeight:"140%"})}),o.jsx(e,{...u,children:o.jsx(r,{html:`<b>${g}</b>`,fontSize:"14px",color:l,textAlign:"right",lineHeight:"140%"})})]})}function i(){return o.jsxs(f,{backgroundColor:"#F6F9FC",contentWidth:"600px",fontFamily:y,textColor:l,previewText:"Your receipt from Acme — Receipt #2705, paid Jul 1, 2026.",children:[o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"44px 48px 0 48px",children:o.jsx(e,{children:o.jsx(a,{headingType:"h4",fontSize:"20px",fontWeight:700,color:F,textAlign:"left",lineHeight:"100%",letterSpacing:"-0.01em",children:"Acme"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"40px 48px 0 48px",children:o.jsx(e,{children:o.jsx(r,{html:"RECEIPT",fontSize:"12px",fontWeight:700,color:d,textAlign:"left",letterSpacing:"0.06em",lineHeight:"100%"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"12px 48px 0 48px",children:o.jsx(e,{children:o.jsx(a,{headingType:"h1",fontSize:"28px",fontWeight:600,color:l,textAlign:"left",lineHeight:"125%",letterSpacing:"-0.02em",children:"Receipt from Acme"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"6px 48px 0 48px",children:o.jsx(e,{children:o.jsx(r,{html:"Receipt #2705 · Paid Jul 1, 2026",fontSize:"14px",color:d,textAlign:"left",lineHeight:"150%"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"32px 48px 4px 48px",children:o.jsx(e,{children:o.jsx(m,{borderTopWidth:"1px",borderTopColor:c,borderTopStyle:"solid"})})}),x("Pro Plan (monthly)","$25.00"),x("Additional seats × 3","$36.00"),x("Usage overage","$4.50",!0),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"8px 48px 0 48px",children:o.jsx(e,{children:o.jsx(m,{borderTopWidth:"1px",borderTopColor:c,borderTopStyle:"solid"})})}),o.jsxs(t,{layout:n.TwoEqual,backgroundColor:"#FFFFFF",padding:"20px 48px 0 48px",children:[o.jsx(e,{children:o.jsx(a,{headingType:"h3",fontSize:"18px",fontWeight:600,color:l,textAlign:"left",lineHeight:"120%",children:"Total"})}),o.jsx(e,{children:o.jsx(a,{headingType:"h3",fontSize:"22px",fontWeight:700,color:l,textAlign:"right",lineHeight:"120%",letterSpacing:"-0.01em",children:"$65.50"})})]}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"36px 48px 0 48px",children:o.jsx(e,{children:o.jsx(C,{href:"https://acme.com/invoices/2705.pdf",backgroundColor:F,color:"#FFFFFF",fontSize:"15px",fontWeight:600,padding:"13px 24px",borderRadius:"8px",textAlign:"left",children:"Download invoice"})})}),o.jsx(t,{layout:n.OneColumn,backgroundColor:"#FFFFFF",padding:"44px 48px 48px 48px",children:o.jsx(e,{children:o.jsx(r,{html:"Questions about this receipt? Contact <a href='mailto:support@acme.com'>support@acme.com</a>.",fontSize:"12px",color:d,textAlign:"left",lineHeight:"160%"})})})]})}const W={title:"Agent Examples/Stripe · Payment Receipt",component:i},p={};i.__docgenInfo={description:"",methods:[],displayName:"StripeReceipt"};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`function StripeReceipt() {
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
}`,...i.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:"{}",...p.parameters?.docs?.source}}};const z=["StripeReceipt","Default"];export{p as Default,i as StripeReceipt,z as __namedExportsOrder,W as default};
