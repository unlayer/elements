import{j as o}from"./jsx-runtime-BF5DEDpw.js";import{B as C}from"./Button-rny-yN7k.js";import{D as f}from"./Divider-DnVQyUi5.js";import{H as s}from"./Heading-Ba1I90tK.js";import{P as i}from"./Paragraph-Bp5JwC3o.js";import{R as e,C as n}from"./Column-BRdT06Ei.js";import{E as y}from"./Email-JwHNThOs.js";import{e as t}from"./create-component-Df6eRtdD.js";const a="#0E0E10",c="#6B6B70",S="#5A4FCF",b="#1F9D55",u="#ECECEE",R="#FAFAFA",r="#FFFFFF",A={label:"Sans Serif",value:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};function d(m,g,h=!1){const x={padding:"14px 0",borderBottomWidth:h?"0px":"1px",borderBottomStyle:"solid",borderBottomColor:u};return o.jsxs(e,{layout:t.TwoEqual,backgroundColor:r,padding:"0 48px",children:[o.jsx(n,{...x,children:o.jsx(i,{html:m,fontSize:"14px",color:c,lineHeight:"140%"})}),o.jsx(n,{...x,children:o.jsx(i,{html:`<b>${g}</b>`,fontSize:"14px",color:a,textAlign:"right",lineHeight:"140%"})})]})}function l(){return o.jsxs(y,{backgroundColor:R,contentWidth:"560px",fontFamily:A,textColor:a,children:[o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"44px 48px 0 48px",children:o.jsx(n,{children:o.jsx(s,{headingType:"h4",fontSize:"17px",fontWeight:600,color:a,textAlign:"left",letterSpacing:"-0.01em",lineHeight:"100%",children:"Meridian"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"52px 48px 0 48px",children:o.jsx(n,{children:o.jsx(i,{html:"PAYMENT SENT",fontSize:"12px",fontWeight:700,color:b,textAlign:"left",letterSpacing:"0.06em",lineHeight:"100%"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"14px 48px 0 48px",children:o.jsx(n,{children:o.jsx(s,{headingType:"h1",fontSize:"48px",fontWeight:600,color:a,textAlign:"left",letterSpacing:"-0.02em",lineHeight:"110%",children:"$1,240.00"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"6px 48px 0 48px",children:o.jsx(n,{children:o.jsx(i,{html:"Your transfer to Olivia Hart is on its way.",fontSize:"16px",color:c,textAlign:"left",lineHeight:"150%"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"40px 48px 4px 48px",children:o.jsx(n,{children:o.jsx(i,{html:"DETAILS",fontSize:"12px",fontWeight:700,color:c,textAlign:"left",letterSpacing:"0.06em",lineHeight:"100%"})})}),d("To","Olivia Hart"),d("From","Acme Inc · ••4291"),d("Date","Jul 1, 2026"),d("Reference","INV-2705",!0),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"36px 48px 0 48px",children:o.jsx(n,{children:o.jsx(f,{borderTopWidth:"1px",borderTopColor:u,borderTopStyle:"solid"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"32px 48px 0 48px",children:o.jsx(n,{children:o.jsx(C,{href:"https://meridian.example.com/tx/INV-2705",backgroundColor:a,color:"#FFFFFF",fontSize:"15px",fontWeight:500,padding:"13px 24px",borderRadius:"8px",textAlign:"left",children:"View transaction"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"48px 48px 56px 48px",children:o.jsx(n,{children:o.jsx(i,{html:`Meridian Financial · This receipt confirms a completed transfer. Need help? <a href="https://meridian.example.com/support" style="color:${S};text-decoration:none;">Contact support</a>.`,fontSize:"12px",color:c,textAlign:"left",lineHeight:"170%"})})})]})}const j={title:"Agent Examples/Mercury · Transaction Receipt",component:l},p={};l.__docgenInfo={description:"",methods:[],displayName:"MercuryReceipt"};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`function MercuryReceipt() {
  return <Email backgroundColor={BG} contentWidth="560px" fontFamily={sans} textColor={INK}>
      {/* Wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="44px 48px 0 48px">
        <Column>
          <Heading headingType="h4" fontSize="17px" fontWeight={600} color={INK} textAlign="left" letterSpacing="-0.01em" lineHeight="100%">
            Meridian
          </Heading>
        </Column>
      </Row>

      {/* Status eyebrow */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="52px 48px 0 48px">
        <Column>
          <Paragraph html="PAYMENT SENT" fontSize="12px" fontWeight={700} color={SUCCESS} textAlign="left" letterSpacing="0.06em" lineHeight="100%" />
        </Column>
      </Row>

      {/* Big amount */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="14px 48px 0 48px">
        <Column>
          <Heading headingType="h1" fontSize="48px" fontWeight={600} color={INK} textAlign="left" letterSpacing="-0.02em" lineHeight="110%">
            $1,240.00
          </Heading>
        </Column>
      </Row>

      {/* Subhead */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="6px 48px 0 48px">
        <Column>
          <Paragraph html="Your transfer to Olivia Hart is on its way." fontSize="16px" color={MUTED} textAlign="left" lineHeight="150%" />
        </Column>
      </Row>

      {/* Section label */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="40px 48px 4px 48px">
        <Column>
          <Paragraph html="DETAILS" fontSize="12px" fontWeight={700} color={MUTED} textAlign="left" letterSpacing="0.06em" lineHeight="100%" />
        </Column>
      </Row>

      {/* Details — label/value rows with hairline dividers */}
      {detailRow("To", "Olivia Hart")}
      {detailRow("From", "Acme Inc · ••4291")}
      {detailRow("Date", "Jul 1, 2026")}
      {detailRow("Reference", "INV-2705", true)}

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="36px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="32px 48px 0 48px">
        <Column>
          <Button href="https://meridian.example.com/tx/INV-2705" backgroundColor={INK} color="#FFFFFF" fontSize="15px" fontWeight={500} padding="13px 24px" borderRadius="8px" textAlign="left">
            View transaction
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={CARD} padding="48px 48px 56px 48px">
        <Column>
          <Paragraph html={\`Meridian Financial · This receipt confirms a completed transfer. Need help? <a href="https://meridian.example.com/support" style="color:\${ACCENT};text-decoration:none;">Contact support</a>.\`} fontSize="12px" color={MUTED} textAlign="left" lineHeight="170%" />
        </Column>
      </Row>
    </Email>;
}`,...l.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:"{}",...p.parameters?.docs?.source}}};const F=["MercuryReceipt","Default"],M=Object.freeze(Object.defineProperty({__proto__:null,Default:p,MercuryReceipt:l,__namedExportsOrder:F,default:j},Symbol.toStringTag,{value:"Module"}));export{l as M,M as m};
