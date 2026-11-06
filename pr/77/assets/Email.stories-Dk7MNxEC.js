import{j as e}from"./jsx-runtime-BUhFnUpm.js";import{q as P,s as L,u as f,$ as y,j as g,I as k,a as t,T as n,H as u,v as $,B as D,R as S}from"./SideBySide-CPlxLXKP.js";import"./iframe-DJdl-cPt.js";import"./preload-helper-PPVm8Dsz.js";const G="#F5EEE2",w="#FFFCF7",b="#2C211B",T="#75675B",F="#E5DBCB",A="#A12B2F",N="#86211F",H="Newsreader, Georgia, 'Times New Roman', serif",Y="'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",I="'DM Mono', SFMono-Regular, Menlo, Consolas, monospace",E="'Noto Naskh Arabic', 'Geeza Pro', 'Traditional Arabic', serif",z="https://dar-rumman.example",x=[{family:"Newsreader",src:"https://fonts.gstatic.com/s/newsreader/v26/cY9AfjOCX1hbuyalUrK4397yjIJFJpc.woff2",format:"woff2",weight:"200 800"},{family:"Newsreader",src:"https://fonts.gstatic.com/s/newsreader/v26/cY9CfjOCX1hbuyalUrK439vCjohCBJWxZA.woff2",format:"woff2",weight:"200 800",style:"italic"},{family:"Instrument Sans",src:"https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2",format:"woff2",weight:"400 700"},{family:"DM Mono",src:"https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2",format:"woff2",weight:400}],j={backgroundColor:G,color:b,fontFamily:Y,fontSize:16,lineHeight:1.55},B=(()=>{const o=(i,O,W)=>`<path d="M${i-6} 180 V96 A44 44 0 1 1 ${i+78} 96 V180 Z" fill="${O}"/><path d="M${i} 180 V96 A38 38 0 1 1 ${i+72} 96 V180 Z" fill="${W}"/>`,M=`<svg xmlns="http://www.w3.org/2000/svg" width="840" height="300" viewBox="0 0 560 200"><rect width="560" height="200" fill="#E6D9C4"/><g transform="translate(0 16)">${[40,142,244,346,448].map(i=>i===244?o(i,"#F2E9DA",A):o(i,"#F2E9DA","#C6B59B")).join("")}</g><rect y="196" width="560" height="4" fill="${b}"/></svg>`;return{src:`data:image/svg+xml,${encodeURIComponent(M)}`,width:840,height:300}})(),v={fontFamily:I,fontSize:12,lineHeight:1.5,letterSpacing:1,textTransform:"uppercase",color:T},r={fontFamily:I,fontSize:12,lineHeight:1.5,color:T},p=o=>({fontFamily:H,fontWeight:400,fontSize:o,lineHeight:1.12,letterSpacing:-.4}),s=(o,a)=>e.jsxs(S,{stackOnMobile:!1,style:{padding:[10,0],border:{top:`1px solid ${F}`}},children:[e.jsx(t,{style:{width:110},children:e.jsx(n,{style:{fontSize:14,color:T},children:o})}),e.jsx(t,{children:e.jsx(n,{style:{fontSize:15},children:a})})]}),X={title:"Components/Email",args:L,argTypes:P,parameters:{docs:{description:{component:"An email, a template's root: its own settings are its `width` and the props beside it, and its `style` has the window's background and the text everything inherits. \"Show code\" has each one's template."}}}},l=f("Email",e.jsxs(y,{width:420,fonts:x,style:j,children:[e.jsxs(g,{style:{padding:[40,0,16],gap:0},mobile:{padding:[20,16,12]},children:[e.jsx(k,{src:B,alt:"Five horseshoe arches along a courtyard wall, the middle one in pomegranate red.",style:{width:"100%"}}),e.jsxs(t,{style:{padding:[28,32,32],gap:16,backgroundColor:w},mobile:{padding:[24,20,24]},children:[e.jsxs(t,{style:{gap:8},children:[e.jsx(n,{style:v,children:"Friday 11 December"}),e.jsx(u,{level:1,style:p(34),children:"We’ve kept the room over the courtyard."})]}),e.jsxs(t,{children:[s("Arriving","After 3 pm, any time"),s("Leaving","Monday 14 December"),s("Room","The Pomegranate Room")]})]})]}),e.jsx(g,{style:{padding:[0,0,40]},mobile:{padding:[0,16,24]},children:e.jsx(n,{style:{...r,textAlign:"center"},children:"width: 420. The default is 600, and the window around it is the Email’s own background."})})]})),d=f("Email",e.jsx(y,{width:520,fonts:x,style:{backgroundColor:w,color:b,fontFamily:H,fontSize:20,lineHeight:1.6,textAlign:"center"},mobile:{fontSize:18},children:e.jsxs(g,{style:{padding:[64,32],gap:18},mobile:{padding:[44,24],gap:16},children:[e.jsx(u,{level:1,style:{fontSize:44,fontWeight:400,fontStyle:"italic",lineHeight:1.1},children:"Dear Ada,"}),e.jsx(n,{children:"The orange trees in the courtyard have just come into blossom, so you’ll smell the house before you see it."}),e.jsxs(n,{children:["If your train is late, ",e.jsx($,{href:"mailto:layla@dar-rumman.example",style:{color:A},children:"send me a word"})," and I’ll keep the tagine warm."]}),e.jsx(n,{children:"Layla"}),e.jsx(n,{style:{...r,padding:[20,0,0]},children:"Nothing above sets a color, a font or an alignment: they’re all the Email’s. The link sets only its color."})]})})),C=(o,a)=>e.jsxs(t,{style:{width:400,padding:[22,24],gap:6,backgroundColor:w,borderRadius:4},mobile:{width:327},children:[e.jsx(n,{style:v,children:o}),e.jsx(n,{style:{...p(21),lineHeight:1.3,letterSpacing:0},children:a})]}),c=f("Email",e.jsxs(y,{width:560,fonts:x,style:{...j,gap:16,alignItems:"center",textAlign:"center"},children:[e.jsx(u,{level:2,style:{...p(36),padding:[44,24,8]},mobile:{fontSize:26,padding:[32,24,4]},children:"Two things, before you come"}),C("From the station","Hassan will meet you at the Bab Boujloud gate, with a cart for your bags."),C("At eight","Dinner is on the roof. Tell us what you don’t eat, and we’ll cook around it."),e.jsx(D,{href:`${z}/arrival`,style:{backgroundColor:A,fontSize:15,fontWeight:600,padding:[15,30],borderRadius:3},hover:{backgroundColor:N},children:"Tell us when you’ll arrive"}),e.jsx(n,{style:{...r,padding:[8,24,44]},mobile:{padding:[8,24,32]},children:'gap: 16 between each; alignItems: "center" and textAlign: "center" on the Email'})]})),h=f("Email",e.jsx(y,{width:560,previewText:"Your room is held for 11 December, and a note about the train",title:"Your Dar Rumman deposit",lang:"en",fonts:x,style:j,children:e.jsxs(g,{style:{padding:[40,40,44],gap:24},mobile:{padding:[28,24,32],gap:20},children:[e.jsxs(S,{stackOnMobile:!1,style:{alignItems:"end",padding:[0,0,12],border:{bottom:`1px solid ${b}`}},children:[e.jsx(t,{style:{width:180},children:e.jsx(n,{style:{...p(25),fontStyle:"italic",lineHeight:"28px"},children:"Dar Rumman"})}),e.jsx(t,{children:e.jsx(n,{style:{...v,textAlign:"right"},children:"Receipt 0417"})})]}),e.jsx(u,{level:1,style:p(38),mobile:{fontSize:32},children:"Your deposit is paid, and your room is yours."}),e.jsxs(t,{children:[s("Deposit","€120, on 6 November"),s("Left to pay","€240, when you leave"),s("Room","The Pomegranate Room")]}),e.jsxs(t,{style:{gap:6,padding:[14,16],backgroundColor:w},children:[e.jsx(n,{style:r,children:"previewText: “Your room is held for 11 December, and a note about the train”"}),e.jsx(n,{style:r,children:"title and lang describe the document. None of the three shows in the email."})]})]})})),R=(o,a)=>e.jsxs(S,{stackOnMobile:!1,style:{padding:[10,0],border:{top:`1px solid ${F}`}},children:[e.jsx(t,{style:{width:96},children:e.jsx(n,{style:{fontSize:16,color:T},children:o})}),e.jsx(t,{children:e.jsx(n,{style:{fontSize:18},children:a})})]}),m=f("Email",e.jsx(y,{width:560,dir:"rtl",lang:"ar",fonts:[...x,{family:"Noto Naskh Arabic",src:"https://fonts.gstatic.com/s/notonaskharabic/v44/RrQKbpV-9Dd1b1OAGA6M9PkyDuVBeN2DHV2mLXgzTrc.woff2",format:"woff2",weight:"400 700"}],style:{...j,fontFamily:E,fontSize:19,lineHeight:1.8},children:e.jsxs(g,{style:{padding:[36,40,44],gap:20,alignItems:"start"},mobile:{padding:[24,24,32]},children:[e.jsx(k,{src:B,alt:"خمسة أقواس على جدار الفناء، أوسطها بلون الرمّان.",style:{width:"100%"}}),e.jsx(u,{level:1,style:{fontSize:36,fontWeight:500,lineHeight:1.35},mobile:{fontSize:30},children:"أهلاً بكم في دار الرمّان"}),e.jsx(n,{children:"غرفتكم جاهزة، والشاي بالنعناع ينتظركم على السطح."}),e.jsxs(t,{children:[R("الوصول","الجمعة ١١ ديسمبر"),R("المغادرة","الاثنين ١٤ ديسمبر")]}),e.jsx(D,{href:`${z}/ar/dinner`,style:{backgroundColor:A,fontFamily:E,fontSize:18,fontWeight:600,padding:[12,30],borderRadius:3},hover:{backgroundColor:N},children:"احجزوا عشاءكم"}),e.jsx(n,{dir:"ltr",style:{...r,textAlign:"right"},children:'dir="rtl" lang="ar"'})]})}));l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`showing("Email", <Email width={420} fonts={fonts} style={text}>
    <Section style={{
    padding: [40, 0, 16],
    gap: 0
  }} mobile={{
    padding: [20, 16, 12]
  }}>
      <Image src={ARCADE} alt="Five horseshoe arches along a courtyard wall, the middle one in pomegranate red." style={{
      width: "100%"
    }} />
      <Column style={{
      padding: [28, 32, 32],
      gap: 16,
      backgroundColor: CARD
    }} mobile={{
      padding: [24, 20, 24]
    }}>
        <Column style={{
        gap: 8
      }}>
          <Text style={label}>Friday 11 December</Text>
          <Heading level={1} style={serif(34)}>
            We’ve kept the room over the courtyard.
          </Heading>
        </Column>
        <Column>
          {fact("Arriving", "After 3 pm, any time")}
          {fact("Leaving", "Monday 14 December")}
          {fact("Room", "The Pomegranate Room")}
        </Column>
      </Column>
    </Section>
    <Section style={{
    padding: [0, 0, 40]
  }} mobile={{
    padding: [0, 16, 24]
  }}>
      <Text style={{
      ...note,
      textAlign: "center"
    }}>width: 420. The default is 600, and the window around it is the Email’s own background.</Text>
    </Section>
  </Email>)`,...l.parameters?.docs?.source},description:{story:"`width` is the content's: the window around it takes the root's background.",...l.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`showing("Email", <Email width={520} fonts={fonts} style={{
  backgroundColor: CARD,
  color: WALNUT,
  fontFamily: SERIF,
  fontSize: 20,
  lineHeight: 1.6,
  textAlign: "center"
}} mobile={{
  fontSize: 18
}}>
    <Section style={{
    padding: [64, 32],
    gap: 18
  }} mobile={{
    padding: [44, 24],
    gap: 16
  }}>
      <Heading level={1} style={{
      fontSize: 44,
      fontWeight: 400,
      fontStyle: "italic",
      lineHeight: 1.1
    }}>
        Dear Ada,
      </Heading>
      <Text>The orange trees in the courtyard have just come into blossom, so you’ll smell the house before you see it.</Text>
      <Text>
        If your train is late, <Link href="mailto:layla@dar-rumman.example" style={{
        color: POMEGRANATE
      }}>send me a word</Link> and I’ll keep the tagine warm.
      </Text>
      <Text>Layla</Text>
      <Text style={{
      ...note,
      padding: [20, 0, 0]
    }}>Nothing above sets a color, a font or an alignment: they’re all the Email’s. The link sets only its color.</Text>
    </Section>
  </Email>)`,...d.parameters?.docs?.source},description:{story:"Text styles on the root are inherited by everything in it: its color, font, size, line height and alignment.",...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`showing("Email", <Email width={560} fonts={fonts} style={{
  ...text,
  gap: 16,
  alignItems: "center",
  textAlign: "center"
}}>
    <Heading level={2} style={{
    ...serif(36),
    padding: [44, 24, 8]
  }} mobile={{
    fontSize: 26,
    padding: [32, 24, 4]
  }}>
      Two things, before you come
    </Heading>
    {before("From the station", "Hassan will meet you at the Bab Boujloud gate, with a cart for your bags.")}
    {before("At eight", "Dinner is on the roof. Tell us what you don’t eat, and we’ll cook around it.")}
    <Button href={\`\${SITE}/arrival\`} style={{
    backgroundColor: POMEGRANATE,
    fontSize: 15,
    fontWeight: 600,
    padding: [15, 30],
    borderRadius: 3
  }} hover={{
    backgroundColor: POMEGRANATE_DOWN
  }}>
      Tell us when you’ll arrive
    </Button>
    <Text style={{
    ...note,
    padding: [8, 24, 44]
  }} mobile={{
    padding: [8, 24, 32]
  }}>
      gap: 16 between each; alignItems: "center" and textAlign: "center" on the Email
    </Text>
  </Email>)`,...c.parameters?.docs?.source},description:{story:"`gap` is the space between the root's children, and `alignItems` where they sit, with `textAlign` for the text: here all in the middle.",...c.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`showing("Email", <Email width={560} previewText="Your room is held for 11 December, and a note about the train" title="Your Dar Rumman deposit" lang="en" fonts={fonts} style={text}>
    <Section style={{
    padding: [40, 40, 44],
    gap: 24
  }} mobile={{
    padding: [28, 24, 32],
    gap: 20
  }}>
      <Row stackOnMobile={false} style={{
      alignItems: "end",
      padding: [0, 0, 12],
      border: {
        bottom: \`1px solid \${WALNUT}\`
      }
    }}>
        <Column style={{
        width: 180
      }}>
          <Text style={{
          ...serif(25),
          fontStyle: "italic",
          lineHeight: "28px"
        }}>Dar Rumman</Text>
        </Column>
        <Column>
          <Text style={{
          ...label,
          textAlign: "right"
        }}>Receipt 0417</Text>
        </Column>
      </Row>
      <Heading level={1} style={serif(38)} mobile={{
      fontSize: 32
    }}>
        Your deposit is paid, and your room is yours.
      </Heading>
      <Column>
        {fact("Deposit", "€120, on 6 November")}
        {fact("Left to pay", "€240, when you leave")}
        {fact("Room", "The Pomegranate Room")}
      </Column>
      <Column style={{
      gap: 6,
      padding: [14, 16],
      backgroundColor: CARD
    }}>
        <Text style={note}>previewText: “Your room is held for 11 December, and a note about the train”</Text>
        <Text style={note}>title and lang describe the document. None of the three shows in the email.</Text>
      </Column>
    </Section>
  </Email>)`,...h.parameters?.docs?.source},description:{story:"`previewText` shows after the subject in an inbox, and `title` and `lang` describe the document: none shows in the email.",...h.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`showing("Email", <Email width={560} dir="rtl" lang="ar" fonts={[...fonts, {
  family: "Noto Naskh Arabic",
  src: "https://fonts.gstatic.com/s/notonaskharabic/v44/RrQKbpV-9Dd1b1OAGA6M9PkyDuVBeN2DHV2mLXgzTrc.woff2",
  format: "woff2",
  weight: "400 700"
}]} style={{
  ...text,
  fontFamily: ARABIC,
  fontSize: 19,
  lineHeight: 1.8
}}>
    <Section style={{
    padding: [36, 40, 44],
    gap: 20,
    alignItems: "start"
  }} mobile={{
    padding: [24, 24, 32]
  }}>
      <Image src={ARCADE} alt="خمسة أقواس على جدار الفناء، أوسطها بلون الرمّان." style={{
      width: "100%"
    }} />
      <Heading level={1} style={{
      fontSize: 36,
      fontWeight: 500,
      lineHeight: 1.35
    }} mobile={{
      fontSize: 30
    }}>
        أهلاً بكم في دار الرمّان
      </Heading>
      <Text>غرفتكم جاهزة، والشاي بالنعناع ينتظركم على السطح.</Text>
      <Column>
        {arabicFact("الوصول", "الجمعة ١١ ديسمبر")}
        {arabicFact("المغادرة", "الاثنين ١٤ ديسمبر")}
      </Column>
      <Button href={\`\${SITE}/ar/dinner\`} style={{
      backgroundColor: POMEGRANATE,
      fontFamily: ARABIC,
      fontSize: 18,
      fontWeight: 600,
      padding: [12, 30],
      borderRadius: 3
    }} hover={{
      backgroundColor: POMEGRANATE_DOWN
    }}>
        احجزوا عشاءكم
      </Button>
      <Text dir="ltr" style={{
      ...note,
      textAlign: "right"
    }}>
        dir="rtl" lang="ar"
      </Text>
    </Section>
  </Email>)`,...m.parameters?.docs?.source},description:{story:'`dir="rtl"` writes the whole email from the right, and `lang` says its language.',...m.parameters?.docs?.description}}};const Z=["Width","InheritedText","GapAndAlignment","PreviewTextAndTitle","RightToLeft"];export{c as GapAndAlignment,d as InheritedText,h as PreviewTextAndTitle,m as RightToLeft,l as Width,Z as __namedExportsOrder,X as default};
