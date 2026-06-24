import{j as n}from"./jsx-runtime-BTYzmbJG.js";import{B as F}from"./Button-CvmOE4Be.js";import{D as s}from"./Divider-CyqBXAb3.js";import{H as l}from"./Heading-DHRtVwCY.js";import{P as p}from"./Paragraph-DR98H8Sf.js";import{T as x}from"./Table-D1N00eux.js";import{R as o,C as e}from"./Column-Cve4JGCb.js";import{E as c}from"./Email-C7ZZiOtI.js";import{C as t}from"./create-component-BVsjaTpd.js";import"./iframe-DddmH49G.js";import"./preload-helper-PPVm8Dsz.js";import"./Body-Dp20ziZr.js";const i="#1A1A2E",d="#6B7280",m="#5C6AC4",u="#ECECF1",g={label:"Sans Serif",value:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};function r(){return n.jsxs(c,{backgroundColor:"#FFFFFF",contentWidth:"560px",fontFamily:g,textColor:i,children:[n.jsx(o,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"48px 48px 0 48px",children:n.jsx(e,{children:n.jsx(l,{headingType:"h4",fontSize:"15px",fontWeight:600,color:i,textAlign:"left",lineHeight:"100%",children:"◆ Meridian"})})}),n.jsx(o,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"56px 48px 0 48px",children:n.jsxs(e,{children:[n.jsx(l,{headingType:"h1",fontSize:"52px",fontWeight:600,color:i,textAlign:"left",lineHeight:"110%",children:"$1,240.00"}),n.jsx(p,{html:"Payment sent",fontSize:"17px",color:d,textAlign:"left",lineHeight:"150%"})]})}),n.jsx(o,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"40px 48px 0 48px",children:n.jsx(e,{children:n.jsx(x,{enableHeader:!1,data:[["To","Olivia Hart"],["From","Operating · USD ••4582"],["Date","June 24, 2026"],["Reference","TXN-9F3K-22B0"]]})})}),n.jsx(o,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"32px 48px 0 48px",children:n.jsx(e,{children:n.jsx(s,{borderTopWidth:"1px",borderTopColor:u,borderTopStyle:"solid"})})}),n.jsx(o,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"32px 48px 0 48px",children:n.jsx(e,{children:n.jsx(F,{href:"https://meridian.example.com/tx/9F3K22B0",backgroundColor:m,color:"#FFFFFF",fontSize:"15px",fontWeight:500,padding:"13px 24px",borderRadius:"8px",textAlign:"left",children:"View transaction"})})}),n.jsx(o,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"48px 48px 56px 48px",children:n.jsx(e,{children:n.jsx(p,{html:"Meridian Financial · This receipt confirms a completed transfer.",fontSize:"12px",color:d,textAlign:"left",lineHeight:"160%"})})})]})}const E={title:"Agent Examples/Mercury · Transaction Receipt",component:r},a={};r.__docgenInfo={description:"",methods:[],displayName:"MercuryReceipt"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`function MercuryReceipt() {
  return <Email backgroundColor="#FFFFFF" contentWidth="560px" fontFamily={sans} textColor={INK}>
      {/* Wordmark */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="48px 48px 0 48px">
        <Column>
          <Heading headingType="h4" fontSize="15px" fontWeight={600} color={INK} textAlign="left" lineHeight="100%">
            ◆ Meridian
          </Heading>
        </Column>
      </Row>

      {/* Big amount */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="56px 48px 0 48px">
        <Column>
          <Heading headingType="h1" fontSize="52px" fontWeight={600} color={INK} textAlign="left" lineHeight="110%">
            $1,240.00
          </Heading>
          <Paragraph html="Payment sent" fontSize="17px" color={MUTED} textAlign="left" lineHeight="150%" />
        </Column>
      </Row>

      {/* Spacer + details table */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="40px 48px 0 48px">
        <Column>
          <Table enableHeader={false} data={[["To", "Olivia Hart"], ["From", "Operating · USD ••4582"], ["Date", "June 24, 2026"], ["Reference", "TXN-9F3K-22B0"]]} />
        </Column>
      </Row>

      {/* Divider */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="32px 48px 0 48px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="32px 48px 0 48px">
        <Column>
          <Button href="https://meridian.example.com/tx/9F3K22B0" backgroundColor={ACCENT} color="#FFFFFF" fontSize="15px" fontWeight={500} padding="13px 24px" borderRadius="8px" textAlign="left">
            View transaction
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="48px 48px 56px 48px">
        <Column>
          <Paragraph html="Meridian Financial · This receipt confirms a completed transfer." fontSize="12px" color={MUTED} textAlign="left" lineHeight="160%" />
        </Column>
      </Row>
    </Email>;
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};const O=["MercuryReceipt","Default"];export{a as Default,r as MercuryReceipt,O as __namedExportsOrder,E as default};
