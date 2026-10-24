import{j as o}from"./jsx-runtime-trJJtGmq.js";import{B as h}from"./Button-CPfMcqei.js";import{D as f}from"./Divider-CXKUzd_J.js";import{H as s}from"./Heading-CmyiSYeC.js";import{P as i}from"./Paragraph-J_dWj9Vg.js";import{R as e,C as n}from"./Column-BHe0Tk3q.js";import{E as y}from"./Email-BsCX6ZO0.js";import{C as t}from"./create-component-rDRSpsXs.js";import"./iframe-F3uSBm1o.js";import"./preload-helper-PPVm8Dsz.js";import"./markup-CfmypXVN.js";import"./Body-C2neC3ln.js";import"./Html-B5Xr68-G.js";import"./Image-F5X8lYlr.js";import"./Social-SCl36LpI.js";import"./Table-OoMFkR0g.js";const a="#0E0E10",x="#6B6B70",S="#5A4FCF",R="#1F9D55",m="#ECECEE",b="#FAFAFA",r="#FFFFFF",A={label:"Sans Serif",value:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};function p(u,g,C=!1){const c={padding:"14px 0",borderBottomWidth:C?"0px":"1px",borderBottomStyle:"solid",borderBottomColor:m};return o.jsxs(e,{layout:t.TwoEqual,backgroundColor:r,padding:"0 48px",children:[o.jsx(n,{...c,children:o.jsx(i,{html:u,fontSize:"14px",color:x,lineHeight:"140%"})}),o.jsx(n,{...c,children:o.jsx(i,{html:`<b>${g}</b>`,fontSize:"14px",color:a,textAlign:"right",lineHeight:"140%"})})]})}function l(){return o.jsxs(y,{backgroundColor:b,contentWidth:"560px",fontFamily:A,textColor:a,children:[o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"44px 48px 0 48px",children:o.jsx(n,{children:o.jsx(s,{headingType:"h4",fontSize:"17px",fontWeight:600,color:a,textAlign:"left",letterSpacing:"-0.01em",lineHeight:"100%",children:"Meridian"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"52px 48px 0 48px",children:o.jsx(n,{children:o.jsx(i,{html:"PAYMENT SENT",fontSize:"12px",fontWeight:700,color:R,textAlign:"left",letterSpacing:"0.06em",lineHeight:"100%"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"14px 48px 0 48px",children:o.jsx(n,{children:o.jsx(s,{headingType:"h1",fontSize:"48px",fontWeight:600,color:a,textAlign:"left",letterSpacing:"-0.02em",lineHeight:"110%",children:"$1,240.00"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"6px 48px 0 48px",children:o.jsx(n,{children:o.jsx(i,{html:"Your transfer to Olivia Hart is on its way.",fontSize:"16px",color:x,textAlign:"left",lineHeight:"150%"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"40px 48px 4px 48px",children:o.jsx(n,{children:o.jsx(i,{html:"DETAILS",fontSize:"12px",fontWeight:700,color:x,textAlign:"left",letterSpacing:"0.06em",lineHeight:"100%"})})}),p("To","Olivia Hart"),p("From","Acme Inc · ••4291"),p("Date","Jul 1, 2026"),p("Reference","INV-2705",!0),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"36px 48px 0 48px",children:o.jsx(n,{children:o.jsx(f,{borderTopWidth:"1px",borderTopColor:m,borderTopStyle:"solid"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"32px 48px 0 48px",children:o.jsx(n,{children:o.jsx(h,{href:"https://meridian.example.com/tx/INV-2705",backgroundColor:a,color:"#FFFFFF",fontSize:"15px",fontWeight:500,padding:"13px 24px",borderRadius:"8px",textAlign:"left",children:"View transaction"})})}),o.jsx(e,{layout:t.OneColumn,backgroundColor:r,padding:"48px 48px 56px 48px",children:o.jsx(n,{children:o.jsx(i,{html:`Meridian Financial · This receipt confirms a completed transfer. Need help? <a href="https://meridian.example.com/support" style="color:${S};text-decoration:none;">Contact support</a>.`,fontSize:"12px",color:x,textAlign:"left",lineHeight:"170%"})})})]})}const v={title:"Agent Examples/Mercury · Transaction Receipt",component:l},d={};l.__docgenInfo={description:"",methods:[],displayName:"MercuryReceipt"};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`function MercuryReceipt() {
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
}`,...l.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:"{}",...d.parameters?.docs?.source}}};const P=["MercuryReceipt","Default"];export{d as Default,l as MercuryReceipt,P as __namedExportsOrder,v as default};
