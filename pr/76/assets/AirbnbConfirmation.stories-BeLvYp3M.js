import{j as o}from"./jsx-runtime-BF5DEDpw.js";import{B as h}from"./Button-rny-yN7k.js";import{H as s}from"./Heading-Ba1I90tK.js";import{I as g}from"./Image-DsXy0uuq.js";import{P as p}from"./Paragraph-Bp5JwC3o.js";import{R as n,C as e}from"./Column-BRdT06Ei.js";import{E as C}from"./Email-JwHNThOs.js";import{e as t}from"./create-component-Df6eRtdD.js";const d="#FF385C",c="#222222",l="#717171",b="#EBEBEB",f={label:"Circular",value:"Circular, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};function r(x,F,m=!1){const u={padding:"14px 0",borderBottomWidth:m?"0px":"1px",borderBottomStyle:"solid",borderBottomColor:b};return o.jsxs(n,{layout:t.TwoEqual,backgroundColor:"#FFFFFF",padding:"0 40px",children:[o.jsx(e,{...u,children:o.jsx(p,{html:x,fontSize:"14px",color:l,lineHeight:"140%"})}),o.jsx(e,{...u,children:o.jsx(p,{html:`<b>${F}</b>`,fontSize:"14px",color:c,textAlign:"right",lineHeight:"140%"})})]})}function i(){return o.jsxs(C,{backgroundColor:"#F7F7F7",contentWidth:"600px",fontFamily:f,children:[o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"28px 40px 12px 40px",children:o.jsx(e,{children:o.jsx(s,{headingType:"h2",fontSize:"22px",fontWeight:700,color:d,textAlign:"left",children:"airbnb"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"4px 40px 0 40px",children:o.jsx(e,{children:o.jsx(g,{src:"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",alt:"Oceanview Villa",width:"100%",textAlign:"center"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"28px 40px 4px 40px",children:o.jsxs(e,{children:[o.jsx(s,{headingType:"h1",fontSize:"26px",fontWeight:700,color:c,lineHeight:"130%",children:"You're confirmed, Maya 🎉"}),o.jsx(p,{html:"Your stay at <b>Oceanview Villa</b> in Malibu is booked. We can't wait to host you.",fontSize:"16px",color:l,lineHeight:"150%"})]})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"16px 40px 2px 40px",children:o.jsx(e,{children:o.jsx(s,{headingType:"h4",fontSize:"12px",fontWeight:700,color:l,letterSpacing:"0.06em",children:"RESERVATION"})})}),r("Property","Oceanview Villa · Malibu, CA"),r("Check-in","Fri, Jul 18 · 3:00 PM"),r("Check-out","Mon, Jul 21 · 11:00 AM"),r("Guests","2 adults"),r("Total","$1,248.00",!0),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"28px 40px 32px 40px",children:o.jsx(e,{children:o.jsx(h,{href:"https://airbnb.com/trips",backgroundColor:d,color:"#FFFFFF",fontSize:"16px",fontWeight:700,padding:"15px 28px",borderRadius:"10px",width:"100%",textAlign:"center",children:"View itinerary"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:"#FFFFFF",padding:"8px 40px 40px 40px",children:o.jsx(e,{children:o.jsx(p,{html:"Questions about your trip? <a href='https://airbnb.com/help'>Visit the Help Center</a>.",fontSize:"13px",color:l,textAlign:"center",lineHeight:"150%"})})})]})}const y={title:"Agent Examples/Airbnb · Reservation Confirmation",component:i},a={};i.__docgenInfo={description:"",methods:[],displayName:"AirbnbConfirmation"};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`function AirbnbConfirmation() {
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
}`,...i.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};const w=["AirbnbConfirmation","Default"],M=Object.freeze(Object.defineProperty({__proto__:null,AirbnbConfirmation:i,Default:a,__namedExportsOrder:w,default:y},Symbol.toStringTag,{value:"Module"}));export{i as A,M as a};
