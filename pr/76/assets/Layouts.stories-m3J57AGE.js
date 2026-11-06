import{j as e}from"./jsx-runtime-BAA0J-eO.js";import{s as O,t as $,c as B,ak as H,f as k,a0 as L,j as g,G as F,k as n,B as v,a5 as N,I as S,a as j,T as I,H as R,L as P}from"./SideBySide-VIYK5UwL.js";import"./iframe-LCdfJrVN.js";import"./preload-helper-PPVm8Dsz.js";const V={title:"Layouts",args:$,argTypes:O,parameters:{docs:{description:{component:"Layouts the new engine writes for email and for the page in different markup (tables and inline-blocks, flexbox and CSS grid): each template rendered as a Page and as an Email, side by side. The pottery, Tarn, is fictional."}}}},f=t=>({...H({label:"Page",template:t(k)},{label:"Email",template:t(L)}),parameters:{docs:{source:{code:B(t(k)),language:"tsx"}}}}),p="#ECE7DF",d="#FFFDF9",y="#2A2522",x="#6E655D",z="#3E6B61",Q="#2F554D",m="Fraunces, Georgia, 'Times New Roman', serif",u="Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif",w=[{family:"Fraunces",src:"https://fonts.gstatic.com/s/fraunces/v38/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeP2Xz5c.woff2",format:"woff2",weight:"100 900"},{family:"Figtree",src:"https://fonts.gstatic.com/s/figtree/v9/_Xms-HUzqDCFdgfMm4S9DaRvzig.woff2",format:"woff2",weight:"300 900"}],A={fontSize:12,fontWeight:600,letterSpacing:1.4,textTransform:"uppercase"},b=(t,o,r)=>({src:`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${o}" viewBox="0 0 ${t} ${o}">${r}</svg>`)}`,width:t,height:o}),h='fill="#000" opacity=".16"',T={bowl:`<path d="M112 168 Q114 250 200 252 Q286 250 288 168 Z"/><ellipse cx="200" cy="168" rx="88" ry="13"/><ellipse cx="200" cy="169" rx="78" ry="9" ${h}/>`,vase:`<path d="M178 70 L222 70 L220 92 Q268 140 252 214 Q242 250 200 252 Q158 250 148 214 Q132 140 180 92 Z"/><ellipse cx="200" cy="70" rx="22" ry="5"/><ellipse cx="200" cy="70" rx="16" ry="3" ${h}/>`,jug:'<path d="M152 104 Q200 112 238 104 Q254 102 264 92 Q268 108 250 122 Q264 190 244 236 Q236 252 200 252 Q164 252 156 236 Q140 180 152 104 Z"/><path d="M151 128 Q110 134 114 174 Q118 206 152 208" fill="none" stroke-width="12" stroke="currentColor" stroke-linecap="round"/>',mug:`<path d="M146 122 L254 122 L250 236 Q248 252 200 252 Q152 252 150 236 Z"/><path d="M252 148 Q292 150 290 186 Q288 216 252 214" fill="none" stroke-width="13" stroke="currentColor"/><ellipse cx="200" cy="122" rx="54" ry="8"/><ellipse cx="200" cy="123" rx="47" ry="5.5" ${h}/>`,plate:`<ellipse cx="200" cy="214" rx="132" ry="38"/><ellipse cx="200" cy="210" rx="92" ry="23" ${h}/>`},c=(t,o,r)=>b(400,300,`<rect width="400" height="300" fill="${o}"/><ellipse cx="200" cy="256" rx="112" ry="10" fill="#000" opacity=".08"/><g fill="${r}" color="${r}">${T[t]}</g>`),W=[{name:"Tea bowl",glaze:"Celadon",price:"£32",picture:c("bowl","#E4E9E3","#9EBFAF")},{name:"Bud vase",glaze:"Ash white",price:"£38",picture:c("vase","#F1ECE3","#CFC4AF")},{name:"Pouring jug",glaze:"Tenmoku",price:"£46",picture:c("jug","#EAE1D6","#3B2A22")},{name:"Mug",glaze:"Oatmeal",price:"£26",picture:c("mug","#EFE8DC","#C9B79A")},{name:"Side plate",glaze:"Iron blue",price:"£22",picture:c("plate","#E5E8EA","#5C7083")}],a=f(t=>e.jsxs(t,{width:600,fonts:w,style:{backgroundColor:p,color:y,fontFamily:u},children:[e.jsxs(g,{style:{backgroundColor:d,padding:[36,24,8],gap:6},mobile:{padding:[28,16,4]},children:[e.jsx(I,{style:{...A,color:z},children:"From the winter firing"}),e.jsx(R,{level:2,style:{fontFamily:m,fontSize:30,fontWeight:400,letterSpacing:-.5},children:"New on the shelves"})]}),e.jsx(g,{style:{backgroundColor:d,padding:[20,24,36]},mobile:{padding:[16,16,28]},children:e.jsx(F,{columns:3,style:{gap:16,rowGap:28},children:W.map(o=>e.jsxs(j,{style:{gap:4},children:[e.jsx(S,{src:o.picture,alt:`${o.name} in a ${o.glaze.toLowerCase()} glaze`,style:{width:"100%"}}),e.jsx(n,{style:{fontFamily:m,fontSize:17,padding:[6,0,0]},children:o.name}),e.jsxs(n,{style:{fontSize:13,color:x},children:[o.glaze," · ",o.price]})]},o.name))})})]})),i=f(t=>e.jsx(t,{width:600,fonts:w,style:{backgroundColor:p,color:y,fontFamily:u},children:e.jsx(g,{style:{padding:[32,24]},mobile:{padding:[20,12]},children:e.jsxs(F,{columns:2,stackOnMobile:!1,style:{gap:24,alignItems:"center",padding:28,backgroundColor:d,borderRadius:4},mobile:{gap:16,padding:18},children:[e.jsx(n,{style:{fontFamily:m,fontSize:21,lineHeight:1.25},children:"Open studio on Saturdays, ten till four."}),e.jsx(n,{style:{fontSize:15,color:x},children:"Every piece is thrown here in Hebden Bridge, and fired twice in a gas kiln that takes a day to cool."}),e.jsx(n,{style:{fontSize:15,color:x},children:"Chipped something? We mend our own work for a year."}),e.jsx(v,{href:"https://tarn.example/visit",style:{backgroundColor:z,color:"#FFFFFF",fontSize:15,fontWeight:600,padding:[13,20],borderRadius:2},hover:{backgroundColor:Q},children:"Plan a visit"})]})})})),G=(t,o)=>b(t,o,`<g transform="scale(${t/1200} ${o/600})">
      <rect width="1200" height="600" fill="#3B4A46"/>
      <circle cx="830" cy="322" r="58" fill="#E2B474"/>
      <path d="M0 330 C200 300 380 320 560 300 C760 280 980 300 1200 270 V600 H0 Z" fill="#2F3D39"/>
      <path d="M0 400 C260 370 480 400 700 380 C900 362 1060 380 1200 360 V600 H0 Z" fill="#26322F"/>
      <rect x="780" y="372" width="120" height="62" fill="#1E2826"/>
      <polygon points="772,374 840,336 908,374" fill="#1E2826"/>
      <rect x="884" y="318" width="16" height="44" fill="#1E2826"/>
      <rect x="806" y="392" width="22" height="18" fill="#E2B474"/>
      <rect x="846" y="392" width="22" height="18" fill="#E2B474"/>
      <path d="M0 470 C300 440 600 476 860 452 C1020 438 1120 450 1200 440 V600 H0 Z" fill="#1C2523"/>
    </g>`),s=f(t=>e.jsx(t,{width:600,fonts:w,style:{backgroundColor:p,color:d,fontFamily:u},children:e.jsx(g,{children:e.jsxs(N,{style:{height:320,alignItems:"center"},children:[e.jsx(S,{src:G(1200,600),alt:"Dusk over the moor above Hebden Bridge, the studio's window lit",style:{width:"100%"}}),e.jsxs(j,{style:{padding:[0,40],gap:14},mobile:{padding:[0,20]},children:[e.jsx(I,{style:{...A,color:"#E2B474"},children:"The winter firing"}),e.jsxs(R,{level:1,style:{fontFamily:m,fontSize:36,fontWeight:400,lineHeight:1.1,letterSpacing:-.6},mobile:{fontSize:28},children:["Forty-two pieces,",e.jsx(P,{}),"out of the kiln."]}),e.jsx(n,{style:{fontSize:15,lineHeight:1.5,color:"#E4DED3",maxWidth:256},children:"Celadon and tenmoku, on the shelves from Saturday at ten."}),e.jsx(v,{href:"https://tarn.example/new",style:{backgroundColor:d,color:y,fontSize:14,fontWeight:600,padding:[12,20],borderRadius:2},hover:{backgroundColor:p},children:"See the new pieces"})]})]})})})),E=(t,o)=>`<rect x="0" y="${t}" width="1200" height="12" fill="#5A2410"/>${o.map(([r,D,C])=>`<g transform="translate(${D} ${t-252*C}) scale(${C})" fill="#6E2C12" color="#6E2C12">${T[r]}</g>`).join("")}`,_=(t,o)=>b(t,o,`<g transform="scale(${t/1200} ${o/400})">
      <rect width="1200" height="400" fill="#C9581F"/>
      <ellipse cx="600" cy="170" rx="560" ry="250" fill="#DE7A2E"/>
      <ellipse cx="600" cy="150" rx="340" ry="170" fill="#EE9D48"/>
      ${E(150,[["bowl",40,.5],["vase",250,.52],["mug",460,.5],["bowl",660,.5],["jug",880,.52]])}
      ${E(314,[["mug",130,.58],["jug",370,.6],["bowl",590,.58],["vase",820,.6]])}
    </g>`),l=f(t=>e.jsx(t,{width:600,fonts:w,style:{backgroundColor:p,fontFamily:u},children:e.jsx(g,{style:{padding:[24,24]},mobile:{padding:[16,12]},children:e.jsxs(N,{style:{height:184,alignItems:"end",borderRadius:6},children:[e.jsx(S,{src:_(1200,400),alt:"Rows of pots on the kiln's shelves, dark against an orange glow at 1,280°C",style:{width:"100%"}}),e.jsx(n,{style:{padding:[10,16],backgroundColor:y,color:d,fontSize:13,letterSpacing:.2},children:"The kiln at 1,280°C, two days into the winter firing"})]})})}));a.__docgenInfo={description:`New pieces from the kiln: three to a row, the last row's two keeping their width. An email's cells are whole px
(174, 173, 173: Outlook's widths), a page's flexbox shares (173.33 each).`,methods:[],displayName:"ProductGrid"};i.__docgenInfo={description:"What the studio offers, two to a row, cells of different heights each in the middle of its row; kept two to a row on phones.",methods:[],displayName:"FeatureGrid"};s.__docgenInfo={description:"A hero: words and a button over a picture, in the middle of the Layer's height, the picture covering it.",methods:[],displayName:"HeroOverImage"};l.__docgenInfo={description:"A banner, its caption along the bottom on a band of its own, its corners rounded.",methods:[],displayName:"BannerCaption"};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`outputs(Root => <Root width={600} fonts={FONTS} style={{
  backgroundColor: STONE,
  color: INK,
  fontFamily: SANS
}}>
    <Section style={{
    backgroundColor: CARD,
    padding: [36, 24, 8],
    gap: 6
  }} mobile={{
    padding: [28, 16, 4]
  }}>
      <Text style={{
      ...kicker,
      color: CELADON
    }}>From the winter firing</Text>
      <Heading level={2} style={{
      fontFamily: SERIF,
      fontSize: 30,
      fontWeight: 400,
      letterSpacing: -0.5
    }}>
        New on the shelves
      </Heading>
    </Section>
    <Section style={{
    backgroundColor: CARD,
    padding: [20, 24, 36]
  }} mobile={{
    padding: [16, 16, 28]
  }}>
      <Grid columns={3} style={{
      gap: 16,
      rowGap: 28
    }}>
        {pieces.map(piece => <Column key={piece.name} style={{
        gap: 4
      }}>
            <Image src={piece.picture} alt={\`\${piece.name} in a \${piece.glaze.toLowerCase()} glaze\`} style={{
          width: "100%"
        }} />
            <Paragraph style={{
          fontFamily: SERIF,
          fontSize: 17,
          padding: [6, 0, 0]
        }}>{piece.name}</Paragraph>
            <Paragraph style={{
          fontSize: 13,
          color: QUIET
        }}>
              {piece.glaze} · {piece.price}
            </Paragraph>
          </Column>)}
      </Grid>
    </Section>
  </Root>)`,...a.parameters?.docs?.source},description:{story:`New pieces from the kiln: three to a row, the last row's two keeping their width. An email's cells are whole px
(174, 173, 173: Outlook's widths), a page's flexbox shares (173.33 each).`,...a.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`outputs(Root => <Root width={600} fonts={FONTS} style={{
  backgroundColor: STONE,
  color: INK,
  fontFamily: SANS
}}>
    <Section style={{
    padding: [32, 24]
  }} mobile={{
    padding: [20, 12]
  }}>
      <Grid columns={2} stackOnMobile={false} style={{
      gap: 24,
      alignItems: "center",
      padding: 28,
      backgroundColor: CARD,
      borderRadius: 4
    }} mobile={{
      gap: 16,
      padding: 18
    }}>
        <Paragraph style={{
        fontFamily: SERIF,
        fontSize: 21,
        lineHeight: 1.25
      }}>Open studio on Saturdays, ten till four.</Paragraph>
        <Paragraph style={{
        fontSize: 15,
        color: QUIET
      }}>Every piece is thrown here in Hebden Bridge, and fired twice in a gas kiln that takes a day to cool.</Paragraph>
        <Paragraph style={{
        fontSize: 15,
        color: QUIET
      }}>Chipped something? We mend our own work for a year.</Paragraph>
        <Button href="https://tarn.example/visit" style={{
        backgroundColor: CELADON,
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: 600,
        padding: [13, 20],
        borderRadius: 2
      }} hover={{
        backgroundColor: CELADON_DOWN
      }}>
          Plan a visit
        </Button>
      </Grid>
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"What the studio offers, two to a row, cells of different heights each in the middle of its row; kept two to a row on phones.",...i.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`outputs(Root => <Root width={600} fonts={FONTS} style={{
  backgroundColor: STONE,
  color: CARD,
  fontFamily: SANS
}}>
    <Section>
      <Layer style={{
      height: 320,
      alignItems: "center"
    }}>
        <Image src={dusk(1200, 600)} alt="Dusk over the moor above Hebden Bridge, the studio's window lit" style={{
        width: "100%"
      }} />
        <Column style={{
        padding: [0, 40],
        gap: 14
      }} mobile={{
        padding: [0, 20]
      }}>
          <Text style={{
          ...kicker,
          color: "#E2B474"
        }}>The winter firing</Text>
          <Heading level={1} style={{
          fontFamily: SERIF,
          fontSize: 36,
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: -0.6
        }} mobile={{
          fontSize: 28
        }}>
            Forty-two pieces,
            <LineBreak />
            out of the kiln.
          </Heading>
          <Paragraph style={{
          fontSize: 15,
          lineHeight: 1.5,
          color: "#E4DED3",
          maxWidth: 256
        }}>Celadon and tenmoku, on the shelves from Saturday at ten.</Paragraph>
          <Button href="https://tarn.example/new" style={{
          backgroundColor: CARD,
          color: INK,
          fontSize: 14,
          fontWeight: 600,
          padding: [12, 20],
          borderRadius: 2
        }} hover={{
          backgroundColor: STONE
        }}>
            See the new pieces
          </Button>
        </Column>
      </Layer>
    </Section>
  </Root>)`,...s.parameters?.docs?.source},description:{story:"A hero: words and a button over a picture, in the middle of the Layer's height, the picture covering it.",...s.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`outputs(Root => <Root width={600} fonts={FONTS} style={{
  backgroundColor: STONE,
  fontFamily: SANS
}}>
    <Section style={{
    padding: [24, 24]
  }} mobile={{
    padding: [16, 12]
  }}>
      <Layer style={{
      height: 184,
      alignItems: "end",
      borderRadius: 6
    }}>
        <Image src={kiln(1200, 400)} alt="Rows of pots on the kiln's shelves, dark against an orange glow at 1,280°C" style={{
        width: "100%"
      }} />
        <Paragraph style={{
        padding: [10, 16],
        backgroundColor: INK,
        color: CARD,
        fontSize: 13,
        letterSpacing: 0.2
      }}>
          The kiln at 1,280°C, two days into the winter firing
        </Paragraph>
      </Layer>
    </Section>
  </Root>)`,...l.parameters?.docs?.source},description:{story:"A banner, its caption along the bottom on a band of its own, its corners rounded.",...l.parameters?.docs?.description}}};const q=["ProductGrid","FeatureGrid","HeroOverImage","BannerCaption"];export{l as BannerCaption,i as FeatureGrid,s as HeroOverImage,a as ProductGrid,q as __namedExportsOrder,V as default};
