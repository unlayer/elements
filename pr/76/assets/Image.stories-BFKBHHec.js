import{j as e}from"./jsx-runtime-CCPVWFur.js";import{s as L,t as W,u as _,k as b,R as k,a as n,P as o,I as r,w as H,H as u}from"./SideBySide-UhjfkY-T.js";import{M as B,d as v,c as N}from"./kit-c-DcKTWhjI.js";import"./iframe-BzrPfnjl.js";import"./preload-helper-PPVm8Dsz.js";const ne={title:"Components/Image",args:W,argTypes:L,parameters:{docs:{description:{component:'An image: `src` has the file and its size, `alt` what it shows, `style` the size it\'s shown at and its shape. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.'}}}},S=_,M="#EDE6D8",O="#FAF7F0",U="#26231E",x="#6E675B",G="#D9D1C1",V="'Source Serif 4', Georgia, 'Times New Roman', serif",K="'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",P="https://greyfold.example",j={width:600,lang:"en-GB",fonts:[{family:"Source Serif 4",src:"https://fonts.gstatic.com/s/sourceserif4/v15/vEFI2_tTDB4M7-auWDN0ahZJW1gb8te1Xb7G.woff2",format:"woff2",weight:"200 900"},{family:"Instrument Sans",src:"https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2",format:"woff2",weight:"400 700"},B],style:{backgroundColor:M,color:U,fontFamily:K,fontSize:16,lineHeight:1.55}},D={fontSize:12,fontWeight:600,letterSpacing:1.4,textTransform:"uppercase",color:x},c={fontFamily:V,fontWeight:500,lineHeight:1.12,letterSpacing:-.3},h=N(x),Q=(t,s)=>{const i=s.map(([l,a,R])=>`<rect x="${l}" width="${a}" height="120" fill="${R}" opacity=".62"/>`).join(""),p=s.map(([l,a,R])=>`<rect y="${l}" width="120" height="${a}" fill="${R}" opacity=".62"/>`).join("");return`<pattern id="w" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="${t}"/>${i}${p}</pattern>`},Y=(t,s)=>{const i=Array.from({length:8},(l,a)=>`M0 ${a*8-32}L24 ${a*8-8}`).join(""),p=Array.from({length:8},(l,a)=>`M48 ${a*8-28}L24 ${a*8-4}`).join("");return`<pattern id="w" width="48" height="24" patternUnits="userSpaceOnUse"><rect width="48" height="24" fill="${t}"/><path d="${i}${p}" stroke="${s}" stroke-width="2.4" fill="none"/></pattern>`},Z=(t,s)=>`<pattern id="w" width="160" height="10" patternUnits="userSpaceOnUse"><rect width="160" height="10" fill="${t}"/>${s.map(([i,p,l])=>`<rect x="${i}" width="${p}" height="10" fill="${l}"/>`).join("")}</pattern>`,C=Q("#46533C",[[0,26,"#23291F"],[60,12,"#C2933B"],[90,8,"#D9CFBB"]]),A=Y("#55585A","#7F8381"),T=Z("#DCD2BE",[[0,44,"#3F4B57"],[62,5,"#9E3A2B"],[84,16,"#3F4B57"]]),d=(t,s,i)=>v(t,s,`<defs>${i}</defs><rect width="${t}" height="${s}" fill="url(#w)"/>`),z=t=>v(480,480,`<defs>${t}</defs><rect width="480" height="480" fill="#E0D7C6"/><rect x="78" y="64" width="324" height="336" fill="url(#w)"/><rect x="78" y="196" width="324" height="10" fill="#000" opacity=".22"/><path d="${Array.from({length:27},(s,i)=>`M${84+i*12} 400v20`).join("")}" stroke="#6E675B" stroke-width="3"/><rect x="300" y="300" width="74" height="30" fill="#9E3A2B"/><rect x="310" y="313" width="54" height="4" fill="#F3E9DC"/>`),F=v(240,240,'<rect width="240" height="240" fill="#46533C"/><g fill="#EFE8DA"><circle cx="84" cy="116" r="30"/><circle cx="118" cy="96" r="32"/><circle cx="152" cy="112" r="30"/><circle cx="104" cy="136" r="30"/><circle cx="140" cy="136" r="28"/></g><path d="M96 158v30M142 158v30" stroke="#23291F" stroke-width="9" stroke-linecap="round"/><ellipse cx="178" cy="108" rx="20" ry="25" fill="#23291F"/><path d="M164 92l-14-10M194 92l12-12" stroke="#23291F" stroke-width="8" stroke-linecap="round"/>'),g=S(t=>e.jsx(t,{...j,children:e.jsxs(b,{style:{padding:[36,24,44],gap:20},mobile:{padding:[24,20,32],gap:18},children:[e.jsxs(k,{stackOnMobile:!1,style:{alignItems:"end"},children:[e.jsx(n,{children:e.jsx(o,{style:{...c,fontSize:28,lineHeight:1},children:"Greyfold"})}),e.jsx(n,{children:e.jsx(o,{style:{...D,textAlign:"right"},children:"Autumn cloth"})})]}),e.jsxs(n,{style:{gap:8},children:[e.jsx(r,{src:d(552,288,C),alt:"The Cheviot check: moss green crossed with dark bands and a fine gold line"}),e.jsx(o,{style:h,children:"No width: its own 552px, never wider than its place"})]}),e.jsxs(k,{style:{gap:20},children:[e.jsxs(n,{style:{gap:8},children:[e.jsx(r,{src:d(266,180,A),alt:"The Herdwick herringbone, in charcoal and grey",style:{width:"100%",borderRadius:4}}),e.jsx(o,{style:h,children:'width: "100%", a share of the row'})]}),e.jsxs(n,{style:{gap:8},children:[e.jsx(H,{href:`${P}/cloth/solway`,children:e.jsx(r,{src:d(400,270,T),alt:"The Solway stripe, slate on oatmeal with a thread of madder red: see the cloth",style:{width:200}})}),e.jsx(o,{style:h,children:"width: 200, in a Link: the image is the link"})]})]})]})})),I=(t,s,i)=>e.jsxs(n,{style:{gap:12,alignItems:"center",textAlign:"center"},children:[t,e.jsxs(n,{style:{gap:2},children:[e.jsx(o,{style:{...c,fontSize:19},children:s}),e.jsx(o,{style:h,children:i})]})]}),m=S(t=>e.jsx(t,{...j,children:e.jsxs(b,{style:{padding:[44,24,48],gap:28},mobile:{padding:[32,28,36],gap:24},children:[e.jsx(u,{level:2,style:{...c,fontSize:32,textAlign:"center"},mobile:{fontSize:28},children:"One mill, three cuts"}),e.jsxs(k,{style:{gap:20},mobile:{gap:28},children:[I(e.jsx(r,{src:d(340,292,C),alt:"A square of the Cheviot check, with round corners",style:{width:"100%",borderRadius:12},mobile:{width:240}}),"The swatch","borderRadius: 12"),I(e.jsx(r,{src:F,alt:"Greyfold's mark, a white Cheviot ewe on moss green, in a circle",style:{width:140,borderRadius:70,border:`3px solid ${O}`}}),"The mark","borderRadius: 70"),I(e.jsx(r,{src:d(340,292,T),alt:"A tag of the Solway stripe, with only its top corners round and a thin outline",style:{width:"100%",borderRadius:[16,16,0,0],border:`1px solid ${x}`},mobile:{width:240}}),"The tag","[16, 16, 0, 0]")]})]})})),E=(t,s,i,p,l,a)=>e.jsxs(n,{style:{alignItems:t,gap:10,textAlign:s},children:[e.jsx(r,{src:d(240,96,i),alt:p}),e.jsxs(n,{style:{gap:2},children:[e.jsxs(o,{style:{...c,fontSize:21},children:[l,", ",a]}),e.jsxs(o,{style:h,children:['alignItems: "',t,'"']})]})]}),y=S(t=>e.jsx(t,{...j,children:e.jsxs(b,{style:{padding:[40,24,44],gap:24},mobile:{padding:[28,20,32],gap:20},children:[e.jsx(u,{level:2,style:{...c,fontSize:32},mobile:{fontSize:28},children:"Three weights, for three kinds of cold"}),E("start","left",T,"The Solway stripe, on the left","Solway","280 g, for a spare room"),E("center","center",C,"The Cheviot check, in the center","Cheviot","420 g, for most houses"),E("end","right",A,"The Herdwick herringbone, on the right","Herdwick","610 g, for a bothy")]})})),$={gap:14,padding:16,backgroundColor:O,border:`1px solid ${G}`,borderRadius:6},w=S(t=>e.jsx(t,{...j,children:e.jsx(b,{style:{padding:[36,24,44]},mobile:{padding:[20,20,28]},children:e.jsxs(k,{style:{gap:16},children:[e.jsxs(n,{style:$,children:[e.jsx(r,{src:z(C),alt:"The Cheviot blanket, folded once, moss green with gold lines and a red label",style:{width:"100%",borderRadius:3}}),e.jsxs(n,{style:{gap:4},children:[e.jsx(u,{level:3,style:{...c,fontSize:21},children:"The Cheviot blanket"}),e.jsx(o,{style:{fontSize:15,color:x},children:"Double, in 420 g lambswool, woven in the Borders. £148"})]})]}),e.jsxs(n,{style:$,children:[e.jsx(H,{href:`${P}/journal/fleece-to-fringe`,children:e.jsx(r,{src:z(A),alt:"The Herdwick blanket, folded once: read how it's made",style:{width:"100%",borderRadius:3}})}),e.jsxs(n,{style:{gap:4},children:[e.jsx(u,{level:3,style:{...c,fontSize:21},children:"From fleece to fringe"}),e.jsx(o,{style:{fontSize:15,color:x},children:"Eleven steps, and the picture is the link to them."})]})]})]})})})),f=S(t=>e.jsx(t,{...j,children:e.jsxs(b,{style:{padding:[36,24,44],gap:22},mobile:{padding:[24,20,32],gap:18},children:[e.jsxs(n,{style:{gap:6},children:[e.jsx(o,{style:D,children:"The Cheviot check"}),e.jsx(u,{level:2,style:{...c,fontSize:32},mobile:{fontSize:28},children:"The same cloth, on any window"})]}),e.jsxs(n,{style:{gap:8},children:[e.jsx(r,{src:d(552,230,C),alt:"The Cheviot check, 240px wide, the whole width on phones",style:{width:240},mobile:{width:"100%"}}),e.jsx(o,{style:h,children:"width: 240, the whole width on phones"})]}),e.jsxs(n,{style:{alignItems:"start",gap:8},children:[e.jsx(r,{src:F,alt:"Greyfold's mark, on the left, in the center on phones",style:{width:96,borderRadius:48},mobile:{alignSelf:"center"}}),e.jsx(o,{style:h,mobile:{textAlign:"center"},children:"On the left, in the center on phones"})]}),e.jsxs(n,{hidden:{mobile:!0},style:{gap:8},children:[e.jsx(r,{src:d(552,110,T),alt:"The Solway stripe, a wide strip for a wider window",style:{width:"100%"}}),e.jsx(o,{style:h,children:"Only on a wider window"})]})]})}));g.__docgenInfo={description:"`src` has the file's size; `style.width` sets the size shown. In a `Link`, the image is the link.",methods:[],displayName:"Sizes"};m.__docgenInfo={description:"`borderRadius` and `border` shape it: round corners, a circle for a face or a logo, an outline, the top corners only.",methods:[],displayName:"Shapes"};y.__docgenInfo={description:"The stack around an image says where it sits: `alignItems` on a `Column` puts it on the left, in the center or on the right.",methods:[],displayName:"Alignment"};w.__docgenInfo={description:'An image in a card, as for a product or an article: the `Column` has the box, and `width: "100%"` fills it.',methods:[],displayName:"InACard"};f.__docgenInfo={description:'`mobile` has its size and its place on phones: choose "phone" under width to see it.',methods:[],displayName:"OnPhones"};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`story(Root => <Root {...root}>
    <Section style={{
    padding: [36, 24, 44],
    gap: 20
  }} mobile={{
    padding: [24, 20, 32],
    gap: 18
  }}>
      <Row stackOnMobile={false} style={{
      alignItems: "end"
    }}>
        <Column>
          <Paragraph style={{
          ...title,
          fontSize: 28,
          lineHeight: 1
        }}>Greyfold</Paragraph>
        </Column>
        <Column>
          <Paragraph style={{
          ...label,
          textAlign: "right"
        }}>Autumn cloth</Paragraph>
        </Column>
      </Row>
      <Column style={{
      gap: 8
    }}>
        <Image src={cloth(552, 288, CHEVIOT)} alt="The Cheviot check: moss green crossed with dark bands and a fine gold line" />
        <Paragraph style={note}>No width: its own 552px, never wider than its place</Paragraph>
      </Column>
      <Row style={{
      gap: 20
    }}>
        <Column style={{
        gap: 8
      }}>
          <Image src={cloth(266, 180, HERDWICK)} alt="The Herdwick herringbone, in charcoal and grey" style={{
          width: "100%",
          borderRadius: 4
        }} />
          <Paragraph style={note}>width: "100%", a share of the row</Paragraph>
        </Column>
        <Column style={{
        gap: 8
      }}>
          <Link href={\`\${SITE}/cloth/solway\`}>
            <Image src={cloth(400, 270, SOLWAY)} alt="The Solway stripe, slate on oatmeal with a thread of madder red: see the cloth" style={{
            width: 200
          }} />
          </Link>
          <Paragraph style={note}>width: 200, in a Link: the image is the link</Paragraph>
        </Column>
      </Row>
    </Section>
  </Root>)`,...g.parameters?.docs?.source},description:{story:"`src` has the file's size; `style.width` sets the size shown. In a `Link`, the image is the link.",...g.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`story(Root => <Root {...root}>
    <Section style={{
    padding: [44, 24, 48],
    gap: 28
  }} mobile={{
    padding: [32, 28, 36],
    gap: 24
  }}>
      <Heading level={2} style={{
      ...title,
      fontSize: 32,
      textAlign: "center"
    }} mobile={{
      fontSize: 28
    }}>
        One mill, three cuts
      </Heading>
      <Row style={{
      gap: 20
    }} mobile={{
      gap: 28
    }}>
        {shaped(<Image src={cloth(340, 292, CHEVIOT)} alt="A square of the Cheviot check, with round corners" style={{
        width: "100%",
        borderRadius: 12
      }} mobile={{
        width: 240
      }} />, "The swatch", "borderRadius: 12")}
        {shaped(<Image src={EWE} alt="Greyfold's mark, a white Cheviot ewe on moss green, in a circle" style={{
        width: 140,
        borderRadius: 70,
        border: \`3px solid \${CARD}\`
      }} />, "The mark", "borderRadius: 70")}
        {shaped(<Image src={cloth(340, 292, SOLWAY)} alt="A tag of the Solway stripe, with only its top corners round and a thin outline" style={{
        width: "100%",
        borderRadius: [16, 16, 0, 0],
        border: \`1px solid \${QUIET}\`
      }} mobile={{
        width: 240
      }} />, "The tag", "[16, 16, 0, 0]")}
      </Row>
    </Section>
  </Root>)`,...m.parameters?.docs?.source},description:{story:"`borderRadius` and `border` shape it: round corners, a circle for a face or a logo, an outline, the top corners only.",...m.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`story(Root => <Root {...root}>
    <Section style={{
    padding: [40, 24, 44],
    gap: 24
  }} mobile={{
    padding: [28, 20, 32],
    gap: 20
  }}>
      <Heading level={2} style={{
      ...title,
      fontSize: 32
    }} mobile={{
      fontSize: 28
    }}>
        Three weights, for three kinds of cold
      </Heading>
      {bolt("start", "left", SOLWAY, "The Solway stripe, on the left", "Solway", "280 g, for a spare room")}
      {bolt("center", "center", CHEVIOT, "The Cheviot check, in the center", "Cheviot", "420 g, for most houses")}
      {bolt("end", "right", HERDWICK, "The Herdwick herringbone, on the right", "Herdwick", "610 g, for a bothy")}
    </Section>
  </Root>)`,...y.parameters?.docs?.source},description:{story:"The stack around an image says where it sits: `alignItems` on a `Column` puts it on the left, in the center or on the right.",...y.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`story(Root => <Root {...root}>
    <Section style={{
    padding: [36, 24, 44]
  }} mobile={{
    padding: [20, 20, 28]
  }}>
      <Row style={{
      gap: 16
    }}>
        <Column style={card}>
          <Image src={blanket(CHEVIOT)} alt="The Cheviot blanket, folded once, moss green with gold lines and a red label" style={{
          width: "100%",
          borderRadius: 3
        }} />
          <Column style={{
          gap: 4
        }}>
            <Heading level={3} style={{
            ...title,
            fontSize: 21
          }}>The Cheviot blanket</Heading>
            <Paragraph style={{
            fontSize: 15,
            color: QUIET
          }}>Double, in 420 g lambswool, woven in the Borders. £148</Paragraph>
          </Column>
        </Column>
        <Column style={card}>
          <Link href={\`\${SITE}/journal/fleece-to-fringe\`}>
            <Image src={blanket(HERDWICK)} alt="The Herdwick blanket, folded once: read how it's made" style={{
            width: "100%",
            borderRadius: 3
          }} />
          </Link>
          <Column style={{
          gap: 4
        }}>
            <Heading level={3} style={{
            ...title,
            fontSize: 21
          }}>From fleece to fringe</Heading>
            <Paragraph style={{
            fontSize: 15,
            color: QUIET
          }}>Eleven steps, and the picture is the link to them.</Paragraph>
          </Column>
        </Column>
      </Row>
    </Section>
  </Root>)`,...w.parameters?.docs?.source},description:{story:'An image in a card, as for a product or an article: the `Column` has the box, and `width: "100%"` fills it.',...w.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`story(Root => <Root {...root}>
    <Section style={{
    padding: [36, 24, 44],
    gap: 22
  }} mobile={{
    padding: [24, 20, 32],
    gap: 18
  }}>
      <Column style={{
      gap: 6
    }}>
        <Paragraph style={label}>The Cheviot check</Paragraph>
        <Heading level={2} style={{
        ...title,
        fontSize: 32
      }} mobile={{
        fontSize: 28
      }}>
          The same cloth, on any window
        </Heading>
      </Column>
      <Column style={{
      gap: 8
    }}>
        <Image src={cloth(552, 230, CHEVIOT)} alt="The Cheviot check, 240px wide, the whole width on phones" style={{
        width: 240
      }} mobile={{
        width: "100%"
      }} />
        <Paragraph style={note}>width: 240, the whole width on phones</Paragraph>
      </Column>
      <Column style={{
      alignItems: "start",
      gap: 8
    }}>
        <Image src={EWE} alt="Greyfold's mark, on the left, in the center on phones" style={{
        width: 96,
        borderRadius: 48
      }} mobile={{
        alignSelf: "center"
      }} />
        <Paragraph style={note} mobile={{
        textAlign: "center"
      }}>
          On the left, in the center on phones
        </Paragraph>
      </Column>
      <Column hidden={{
      mobile: true
    }} style={{
      gap: 8
    }}>
        <Image src={cloth(552, 110, SOLWAY)} alt="The Solway stripe, a wide strip for a wider window" style={{
        width: "100%"
      }} />
        <Paragraph style={note}>Only on a wider window</Paragraph>
      </Column>
    </Section>
  </Root>)`,...f.parameters?.docs?.source},description:{story:'`mobile` has its size and its place on phones: choose "phone" under width to see it.',...f.parameters?.docs?.description}}};const oe=["Sizes","Shapes","Alignment","InACard","OnPhones"];export{y as Alignment,w as InACard,f as OnPhones,m as Shapes,g as Sizes,oe as __namedExportsOrder,ne as default};
