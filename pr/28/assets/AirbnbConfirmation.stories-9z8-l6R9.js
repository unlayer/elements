import{j as o}from"./jsx-runtime-DOD8vpDv.js";import{B as u}from"./Button-o-Dz3MZR.js";import{D as d}from"./Divider-3iUD2SlJ.js";import{H as i}from"./Heading-Cf3qajk0.js";import{I as F}from"./Image-BXwRhcm6.js";import{P as l}from"./Paragraph-BS30U1QL.js";import{T as c}from"./Table-DBh6a1Ty.js";import{R as n,C as e}from"./Column-DvUiy8S1.js";import{E as x}from"./Email-gPStFuG3.js";import{C as t}from"./create-component-PAXKjTPB.js";import"./iframe-kDo7a6v8.js";import"./preload-helper-PPVm8Dsz.js";import"./Body-DLk5zidS.js";const p="#FF5A5F",m="#222222",s="#717171",h="#EBEBEB",C={label:"Circular",value:"Circular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};function r(){return o.jsxs(x,{backgroundColor:"#F7F7F7",contentWidth:"600px",fontFamily:C,children:[o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"28px 40px 8px 40px",children:o.jsx(e,{children:o.jsx(i,{headingType:"h2",fontSize:"22px",fontWeight:700,color:p,textAlign:"left",children:"airbnb"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"8px 40px 0 40px",children:o.jsx(e,{children:o.jsx(F,{src:"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",alt:"Oceanview Villa",width:"520px",textAlign:"center"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"28px 40px 4px 40px",children:o.jsxs(e,{children:[o.jsx(i,{headingType:"h1",fontSize:"28px",fontWeight:700,color:m,lineHeight:"130%",children:"You're confirmed, Maya 🎉"}),o.jsx(l,{html:"Your stay at <b>Oceanview Villa</b> in Malibu is booked. We can't wait to host you.",fontSize:"16px",color:s,lineHeight:"150%"})]})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"12px 40px 8px 40px",children:o.jsx(e,{children:o.jsx(c,{headers:["Reservation","Details"],data:[["Property","Oceanview Villa · Malibu, CA"],["Check-in","Fri, Jul 18 · 3:00 PM"],["Check-out","Mon, Jul 21 · 11:00 AM"],["Guests","2 adults"],["Total","$1,248.00"]]})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"20px 40px 32px 40px",children:o.jsx(e,{children:o.jsx(u,{href:"https://airbnb.com/trips",backgroundColor:p,color:"#FFFFFF",fontSize:"16px",fontWeight:700,padding:"14px 28px",borderRadius:"8px",width:"100%",textAlign:"center",children:"View itinerary"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"0 40px",children:o.jsx(e,{children:o.jsx(d,{borderTopWidth:"1px",borderTopColor:h,borderTopStyle:"solid"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"20px 40px 40px 40px",children:o.jsx(e,{children:o.jsx(l,{html:"Questions about your trip? <a href='https://airbnb.com/help'>Visit the Help Center</a>.",fontSize:"13px",color:s,textAlign:"center",lineHeight:"150%"})})})]})}const M={title:"Agent Examples/Airbnb · Reservation Confirmation",component:r},a={};r.__docgenInfo={description:"",methods:[],displayName:"AirbnbConfirmation"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`function AirbnbConfirmation() {
  return <Email backgroundColor="#F7F7F7" contentWidth="600px" fontFamily={sans}>
      {/* Brand */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 8px 40px">
        <Column>
          <Heading headingType="h2" fontSize="22px" fontWeight={700} color={RAUSCH} textAlign="left">
            airbnb
          </Heading>
        </Column>
      </Row>

      {/* Hero photo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="8px 40px 0 40px">
        <Column>
          <Image src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80" alt="Oceanview Villa" width="520px" textAlign="center" />
        </Column>
      </Row>

      {/* Headline */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 4px 40px">
        <Column>
          <Heading headingType="h1" fontSize="28px" fontWeight={700} color={INK} lineHeight="130%">
            You're confirmed, Maya 🎉
          </Heading>
          <Paragraph html="Your stay at <b>Oceanview Villa</b> in Malibu is booked. We can't wait to host you." fontSize="16px" color={MUTED} lineHeight="150%" />
        </Column>
      </Row>

      {/* Reservation summary */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="12px 40px 8px 40px">
        <Column>
          <Table headers={["Reservation", "Details"]} data={[["Property", "Oceanview Villa · Malibu, CA"], ["Check-in", "Fri, Jul 18 · 3:00 PM"], ["Check-out", "Mon, Jul 21 · 11:00 AM"], ["Guests", "2 adults"], ["Total", "$1,248.00"]]} />
        </Column>
      </Row>

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 40px 32px 40px">
        <Column>
          <Button href="https://airbnb.com/trips" backgroundColor={RAUSCH} color="#FFFFFF" fontSize="16px" fontWeight={700} padding="14px 28px" borderRadius="8px" width="100%" textAlign="center">
            View itinerary
          </Button>
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="0 40px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="20px 40px 40px 40px">
        <Column>
          <Paragraph html="Questions about your trip? <a href='https://airbnb.com/help'>Visit the Help Center</a>." fontSize="13px" color={MUTED} textAlign="center" lineHeight="150%" />
        </Column>
      </Row>
    </Email>;
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};const E=["AirbnbConfirmation","Default"];export{r as AirbnbConfirmation,a as Default,E as __namedExportsOrder,M as default};
