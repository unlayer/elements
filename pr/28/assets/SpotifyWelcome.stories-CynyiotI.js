import{j as o}from"./jsx-runtime-DOD8vpDv.js";import{B as u}from"./Button-o-Dz3MZR.js";import{D as x}from"./Divider-3iUD2SlJ.js";import{H as a}from"./Heading-Cf3qajk0.js";import{I as m}from"./Image-BXwRhcm6.js";import{P as r}from"./Paragraph-BS30U1QL.js";import{R as i,C as e}from"./Column-DvUiy8S1.js";import{E as c}from"./Email-gPStFuG3.js";import{C as t}from"./create-component-PAXKjTPB.js";import"./iframe-kDo7a6v8.js";import"./preload-helper-PPVm8Dsz.js";import"./Body-DLk5zidS.js";const g="#1DB954",n="#191414",p="#FFFFFF",s="#B3B3B3",h={label:"Circular",value:"Circular, 'Helvetica Neue', Helvetica, Arial, sans-serif"};function l(){return o.jsxs(c,{backgroundColor:n,contentWidth:"600px",fontFamily:h,children:[o.jsx(i,{layout:t.OneColumn,backgroundColor:n,padding:"32px 40px 16px 40px",children:o.jsx(e,{children:o.jsx(m,{src:"https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png",alt:"Spotify",width:"132px",textAlign:"left"})})}),o.jsx(i,{layout:t.OneColumn,backgroundColor:n,padding:"24px 40px 8px 40px",children:o.jsxs(e,{children:[o.jsx(a,{headingType:"h1",fontSize:"40px",fontWeight:700,color:p,lineHeight:"115%",children:"Premium is yours. Welcome."}),o.jsx(r,{html:"No ads. No limits. Just the music you love — now in lossless quality, online or off.",fontSize:"17px",color:s,lineHeight:"150%"})]})}),o.jsx(i,{layout:t.OneColumn,backgroundColor:n,padding:"16px 40px 32px 40px",children:o.jsx(e,{children:o.jsx(u,{href:"https://open.spotify.com",backgroundColor:g,color:n,fontSize:"16px",fontWeight:700,borderRadius:"500px",padding:"16px 36px",textAlign:"left",children:"Start listening"})})}),o.jsx(i,{layout:t.OneColumn,backgroundColor:n,padding:"0px 40px",children:o.jsx(e,{children:o.jsx(x,{borderTopWidth:"1px",borderTopColor:"#2A2A2A",borderTopStyle:"solid"})})}),o.jsxs(i,{layout:t.TwoEqual,backgroundColor:n,padding:"28px 40px 8px 40px",children:[o.jsxs(e,{children:[o.jsx(a,{headingType:"h3",fontSize:"18px",fontWeight:700,color:p,children:"Ad-free music"}),o.jsx(r,{html:"Uninterrupted listening — no ad breaks, ever.",fontSize:"14px",color:s,lineHeight:"150%"})]}),o.jsxs(e,{children:[o.jsx(a,{headingType:"h3",fontSize:"18px",fontWeight:700,color:p,children:"Lossless audio"}),o.jsx(r,{html:"Hear every detail in up to 24-bit quality.",fontSize:"14px",color:s,lineHeight:"150%"})]})]}),o.jsxs(i,{layout:t.TwoEqual,backgroundColor:n,padding:"8px 40px 32px 40px",children:[o.jsxs(e,{children:[o.jsx(a,{headingType:"h3",fontSize:"18px",fontWeight:700,color:p,children:"Offline listening"}),o.jsx(r,{html:"Download your favorites and play anywhere.",fontSize:"14px",color:s,lineHeight:"150%"})]}),o.jsxs(e,{children:[o.jsx(a,{headingType:"h3",fontSize:"18px",fontWeight:700,color:p,children:"Full control"}),o.jsx(r,{html:"Pick any track, skip freely, repeat at will.",fontSize:"14px",color:s,lineHeight:"150%"})]})]}),o.jsx(i,{layout:t.OneColumn,backgroundColor:n,padding:"24px 40px 40px 40px",children:o.jsx(e,{children:o.jsx(r,{html:"You're receiving this because you subscribed to Spotify Premium.",fontSize:"12px",color:"#7A7A7A",textAlign:"center"})})})]})}const k={title:"Examples/Spotify Premium Welcome",component:l},d={};l.__docgenInfo={description:"",methods:[],displayName:"SpotifyPremiumWelcome"};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`function SpotifyPremiumWelcome() {
  return <Email backgroundColor={BLACK} contentWidth="600px" fontFamily={sans}>
      {/* Logo header */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="32px 40px 16px 40px">
        <Column>
          <Image src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" width="132px" textAlign="left" />
        </Column>
      </Row>

      {/* Hero */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="24px 40px 8px 40px">
        <Column>
          <Heading headingType="h1" fontSize="40px" fontWeight={700} color={WHITE} lineHeight="115%">
            Premium is yours. Welcome.
          </Heading>
          <Paragraph html="No ads. No limits. Just the music you love — now in lossless quality, online or off." fontSize="17px" color={MUTED} lineHeight="150%" />
        </Column>
      </Row>

      {/* Primary CTA */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="16px 40px 32px 40px">
        <Column>
          <Button href="https://open.spotify.com" backgroundColor={GREEN} color={BLACK} fontSize="16px" fontWeight={700} borderRadius="500px" padding="16px 36px" textAlign="left">
            Start listening
          </Button>
        </Column>
      </Row>

      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="0px 40px">
        <Column>
          <Divider borderTopWidth="1px" borderTopColor="#2A2A2A" borderTopStyle="solid" />
        </Column>
      </Row>

      {/* Benefits grid 2x2 */}
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={BLACK} padding="28px 40px 8px 40px">
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={WHITE}>Ad-free music</Heading>
          <Paragraph html="Uninterrupted listening — no ad breaks, ever." fontSize="14px" color={MUTED} lineHeight="150%" />
        </Column>
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={WHITE}>Lossless audio</Heading>
          <Paragraph html="Hear every detail in up to 24-bit quality." fontSize="14px" color={MUTED} lineHeight="150%" />
        </Column>
      </Row>
      <Row layout={ColumnLayouts.TwoEqual} backgroundColor={BLACK} padding="8px 40px 32px 40px">
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={WHITE}>Offline listening</Heading>
          <Paragraph html="Download your favorites and play anywhere." fontSize="14px" color={MUTED} lineHeight="150%" />
        </Column>
        <Column>
          <Heading headingType="h3" fontSize="18px" fontWeight={700} color={WHITE}>Full control</Heading>
          <Paragraph html="Pick any track, skip freely, repeat at will." fontSize="14px" color={MUTED} lineHeight="150%" />
        </Column>
      </Row>

      {/* Footer */}
      <Row layout={ColumnLayouts.OneColumn} backgroundColor={BLACK} padding="24px 40px 40px 40px">
        <Column>
          <Paragraph html="You're receiving this because you subscribed to Spotify Premium." fontSize="12px" color="#7A7A7A" textAlign="center" />
        </Column>
      </Row>
    </Email>;
}`,...l.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:"{}",...d.parameters?.docs?.source}}};const z=["SpotifyPremiumWelcome","Default"];export{d as Default,l as SpotifyPremiumWelcome,z as __namedExportsOrder,k as default};
