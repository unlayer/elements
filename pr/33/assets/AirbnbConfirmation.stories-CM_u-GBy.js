import{j as o}from"./jsx-runtime-C1DVBkX7.js";import{B as h}from"./Button-D6LyDqln.js";import{H as s}from"./Heading-BhGTZttH.js";import{I as g}from"./Image-B-0742R0.js";import{P as p}from"./Paragraph-CGD6uLIm.js";import{R as n,C as e}from"./Column-C8DVa5CK.js";import{E as C}from"./Email-wxF2iffl.js";import{C as t}from"./create-component-CyQuuYXd.js";import"./iframe-vuGBeOdo.js";import"./preload-helper-PPVm8Dsz.js";import"./Body-BH31p4Gf.js";const u="#FF385C",c="#222222",l="#717171",b="#EBEBEB",f={label:"Circular",value:"Circular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};function r(x,F,m=!1){const d={padding:"14px 0",borderBottomWidth:m?"0px":"1px",borderBottomStyle:"solid",borderBottomColor:b};return o.jsxs(n,{layout:t.TwoEqual,backgroundColor:"#FFFFFF",padding:"0 40px",children:[o.jsx(e,{...d,children:o.jsx(p,{html:x,fontSize:"14px",color:l,lineHeight:"140%"})}),o.jsx(e,{...d,children:o.jsx(p,{html:`<b>${F}</b>`,fontSize:"14px",color:c,textAlign:"right",lineHeight:"140%"})})]})}function i(){return o.jsxs(C,{backgroundColor:"#F7F7F7",contentWidth:"600px",fontFamily:f,children:[o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"28px 40px 12px 40px",children:o.jsx(e,{children:o.jsx(s,{headingType:"h2",fontSize:"22px",fontWeight:700,color:u,textAlign:"left",children:"airbnb"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"4px 40px 0 40px",children:o.jsx(e,{children:o.jsx(g,{src:"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",alt:"Oceanview Villa",width:"100%",textAlign:"center"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"28px 40px 4px 40px",children:o.jsxs(e,{children:[o.jsx(s,{headingType:"h1",fontSize:"26px",fontWeight:700,color:c,lineHeight:"130%",children:"You're confirmed, Maya 🎉"}),o.jsx(p,{html:"Your stay at <b>Oceanview Villa</b> in Malibu is booked. We can't wait to host you.",fontSize:"16px",color:l,lineHeight:"150%"})]})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"16px 40px 2px 40px",children:o.jsx(e,{children:o.jsx(s,{headingType:"h4",fontSize:"12px",fontWeight:700,color:l,letterSpacing:"0.06em",children:"RESERVATION"})})}),r("Property","Oceanview Villa · Malibu, CA"),r("Check-in","Fri, Jul 18 · 3:00 PM"),r("Check-out","Mon, Jul 21 · 11:00 AM"),r("Guests","2 adults"),r("Total","$1,248.00",!0),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"28px 40px 32px 40px",children:o.jsx(e,{children:o.jsx(h,{href:"https://airbnb.com/trips",backgroundColor:u,color:"#FFFFFF",fontSize:"16px",fontWeight:700,padding:"15px 28px",borderRadius:"10px",width:"100%",textAlign:"center",children:"View itinerary"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"8px 40px 40px 40px",children:o.jsx(e,{children:o.jsx(p,{html:"Questions about your trip? <a href='https://airbnb.com/help'>Visit the Help Center</a>.",fontSize:"13px",color:l,textAlign:"center",lineHeight:"150%"})})})]})}const T={title:"Agent Examples/Airbnb · Reservation Confirmation",component:i},a={};i.__docgenInfo={description:"",methods:[],displayName:"AirbnbConfirmation"};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`function AirbnbConfirmation() {
  return <Email backgroundColor="#F7F7F7" contentWidth="600px" fontFamily={sans}>
      {/* Brand */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 12px 40px">
        <Column>
          <Heading headingType="h2" fontSize="22px" fontWeight={700} color={RAUSCH} textAlign="left">
            airbnb
          </Heading>
        </Column>
      </Row>

      {/* Hero photo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="4px 40px 0 40px">
        <Column>
          <Image src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80" alt="Oceanview Villa" width="100%" textAlign="center" />
        </Column>
      </Row>

      {/* Headline */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 4px 40px">
        <Column>
          <Heading headingType="h1" fontSize="26px" fontWeight={700} color={INK} lineHeight="130%">
            You're confirmed, Maya 🎉
          </Heading>
          <Paragraph html="Your stay at <b>Oceanview Villa</b> in Malibu is booked. We can't wait to host you." fontSize="16px" color={MUTED} lineHeight="150%" />
        </Column>
      </Row>

      {/* Reservation summary — clean label/value, no spreadsheet borders */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="16px 40px 2px 40px">
        <Column>
          <Heading headingType="h4" fontSize="12px" fontWeight={700} color={MUTED} letterSpacing="0.06em">
            RESERVATION
          </Heading>
        </Column>
      </Row>
      {detailRow("Property", "Oceanview Villa · Malibu, CA")}
      {detailRow("Check-in", "Fri, Jul 18 · 3:00 PM")}
      {detailRow("Check-out", "Mon, Jul 21 · 11:00 AM")}
      {detailRow("Guests", "2 adults")}
      {detailRow("Total", "$1,248.00", true)}

      {/* CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="28px 40px 32px 40px">
        <Column>
          <Button href="https://airbnb.com/trips" backgroundColor={RAUSCH} color="#FFFFFF" fontSize="16px" fontWeight={700} padding="15px 28px" borderRadius="10px" width="100%" textAlign="center">
            View itinerary
          </Button>
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor="#FFFFFF" padding="8px 40px 40px 40px">
        <Column>
          <Paragraph html="Questions about your trip? <a href='https://airbnb.com/help'>Visit the Help Center</a>." fontSize="13px" color={MUTED} textAlign="center" lineHeight="150%" />
        </Column>
      </Row>
    </Email>;
}`,...i.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};const z=["AirbnbConfirmation","Default"];export{i as AirbnbConfirmation,a as Default,z as __namedExportsOrder,T as default};
