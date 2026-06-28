import{j as o}from"./jsx-runtime-BGQ56ehA.js";import{B as h}from"./Button-BR-ciyoG.js";import{D as f}from"./Divider-uJ5Y_0M5.js";import{H as p}from"./Heading-CI3LZr-n.js";import{I as d}from"./Image-DNcKhrc_.js";import{P as s}from"./Paragraph-D5hRCWEA.js";import{R as n,C as i}from"./Column-BJXJZ83Z.js";import{E as y}from"./Email-keNadpFz.js";import{C as t}from"./create-component-CtZsFBQG.js";import"./iframe-Uf6U1a0S.js";import"./preload-helper-PPVm8Dsz.js";import"./Body-BnbR8nOp.js";const m="#1ED760",e="#121212",x="#FFFFFF",u="#B3B3B3",C="#2A2A2A",b={label:"Circular",value:"Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"};function l(c,g){return o.jsxs(i,{children:[o.jsx(p,{headingType:"h3",fontSize:"17px",fontWeight:700,color:x,lineHeight:"130%",children:`✓  ${c}`}),o.jsx(s,{html:g,fontSize:"14px",color:u,lineHeight:"155%"})]})}function r(){return o.jsxs(y,{backgroundColor:e,contentWidth:"600px",fontFamily:b,children:[o.jsx(n,{layout:t.OneColumn,backgroundColor:e,padding:"32px 40px 18px 40px",children:o.jsx(i,{children:o.jsx(d,{src:"https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png",alt:"Spotify",width:"120px",textAlign:"left"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:e,padding:"0px 0px 0px 0px",children:o.jsx(i,{children:o.jsx(d,{src:"https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80",alt:"Live music",width:"100%",textAlign:"center"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:e,padding:"36px 40px 4px 40px",children:o.jsxs(i,{children:[o.jsx(p,{headingType:"h4",fontSize:"12px",fontWeight:700,color:m,letterSpacing:"0.14em",children:"SPOTIFY PREMIUM"}),o.jsx(p,{headingType:"h1",fontSize:"42px",fontWeight:800,color:x,lineHeight:"106%",children:"Premium is yours. Welcome."}),o.jsx(s,{html:"No ads. No limits. Just the music you love — now in lossless quality, online or off.",fontSize:"17px",color:u,lineHeight:"155%"})]})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:e,padding:"22px 40px 36px 40px",children:o.jsx(i,{children:o.jsx(h,{href:"https://open.spotify.com",backgroundColor:m,color:"#000000",fontSize:"16px",fontWeight:700,borderRadius:"500px",padding:"16px 40px",textAlign:"left",children:"Start listening"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:e,padding:"0px 40px",children:o.jsx(i,{children:o.jsx(f,{borderTopWidth:"1px",borderTopColor:C,borderTopStyle:"solid"})})}),o.jsx(n,{layout:t.OneColumn,backgroundColor:e,padding:"32px 40px 6px 40px",children:o.jsx(i,{children:o.jsx(p,{headingType:"h4",fontSize:"12px",fontWeight:700,color:u,letterSpacing:"0.12em",children:"WHAT'S INCLUDED"})})}),o.jsxs(n,{layout:t.TwoEqual,backgroundColor:e,padding:"14px 40px 10px 40px",children:[l("Ad-free music","Uninterrupted listening — no ad breaks, ever."),l("Lossless audio","Hear every detail in up to 24-bit quality.")]}),o.jsxs(n,{layout:t.TwoEqual,backgroundColor:e,padding:"10px 40px 36px 40px",children:[l("Offline listening","Download your favorites and play anywhere."),l("Full control","Pick any track, skip freely, repeat at will.")]}),o.jsx(n,{layout:t.OneColumn,backgroundColor:e,padding:"8px 40px 40px 40px",children:o.jsx(i,{children:o.jsx(s,{html:"You're receiving this because you subscribed to Spotify Premium.",fontSize:"12px",color:"#7A7A7A",textAlign:"center",lineHeight:"150%"})})})]})}const P={title:"Examples/Spotify Premium Welcome",component:r},a={};r.__docgenInfo={description:"",methods:[],displayName:"SpotifyPremiumWelcome"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`function SpotifyPremiumWelcome() {
  return <Email backgroundColor={BG} contentWidth="600px" fontFamily={sans}>
      {/* Logo */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="32px 40px 18px 40px">
        <Column>
          <Image src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" width="120px" textAlign="left" />
        </Column>
      </Row>

      {/* Hero image */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="0px 0px 0px 0px">
        <Column>
          <Image src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80" alt="Live music" width="100%" textAlign="center" />
        </Column>
      </Row>

      {/* Eyebrow + headline + subhead */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="36px 40px 4px 40px">
        <Column>
          <Heading headingType="h4" fontSize="12px" fontWeight={700} color={GREEN} letterSpacing="0.14em">
            SPOTIFY PREMIUM
          </Heading>
          <Heading headingType="h1" fontSize="42px" fontWeight={800} color={WHITE} lineHeight="106%">
            Premium is yours. Welcome.
          </Heading>
          <Paragraph html="No ads. No limits. Just the music you love — now in lossless quality, online or off." fontSize="17px" color={MUTED} lineHeight="155%" />
        </Column>
      </Row>

      {/* Primary CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="22px 40px 36px 40px">
        <Column>
          <Button href="https://open.spotify.com" backgroundColor={GREEN} color="#000000" fontSize="16px" fontWeight={700} borderRadius="500px" padding="16px 40px" textAlign="left">
            Start listening
          </Button>
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="0px 40px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor={LINE} borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Benefits */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="32px 40px 6px 40px">
        <Column>
          <Heading headingType="h4" fontSize="12px" fontWeight={700} color={MUTED} letterSpacing="0.12em">
            WHAT'S INCLUDED
          </Heading>
        </Column>
      </Row>
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={BG} padding="14px 40px 10px 40px">
        {benefit("Ad-free music", "Uninterrupted listening — no ad breaks, ever.")}
        {benefit("Lossless audio", "Hear every detail in up to 24-bit quality.")}
      </Row>
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={BG} padding="10px 40px 36px 40px">
        {benefit("Offline listening", "Download your favorites and play anywhere.")}
        {benefit("Full control", "Pick any track, skip freely, repeat at will.")}
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BG} padding="8px 40px 40px 40px">
        <Column>
          <Paragraph html="You're receiving this because you subscribed to Spotify Premium." fontSize="12px" color="#7A7A7A" textAlign="center" lineHeight="150%" />
        </Column>
      </Row>
    </Email>;
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};const O=["SpotifyPremiumWelcome","Default"];export{a as Default,r as SpotifyPremiumWelcome,O as __namedExportsOrder,P as default};
