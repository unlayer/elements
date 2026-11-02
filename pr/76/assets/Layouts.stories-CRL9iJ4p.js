import{j as e}from"./jsx-runtime-CTczVuoy.js";import{a as u,b as w,o as d}from"./story-P5utGeLe.js";import{j as l,G as h,k as n,B as p,w as g,I as c,d as m,H as y}from"./render-B540ryJT.js";import"./iframe-DsK8fnhh.js";import"./preload-helper-PPVm8Dsz.js";import"./render-to-html-DVm97wbE.js";import"./create-component-B6Q-FRDR.js";import"./Column-DTQ5PoDD.js";import"./normalize-DIojY5wj.js";import"./Html-DGSLSiOq.js";const z={title:"Primitives/Email and page",args:w,argTypes:u,parameters:{docs:{description:{component:"Layouts the new engine writes for email and for the page in different markup (tables and inline-blocks, flexbox and CSS grid): each template rendered as a Page and as an Email, side by side. The comparison gate checks the two draw the same, at desktop and phone widths."}}}},F="#1F2933",x="#616E7C",b=t=>({src:`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${t}"/></svg>`)}`,width:400,height:300}),v=[{name:"Linen shirt",price:"$68",color:"#D9C5A0"},{name:"Canvas tote",price:"$34",color:"#A3B18A"},{name:"Wool beanie",price:"$28",color:"#B5838D"},{name:"Leather belt",price:"$52",color:"#6D4C41"},{name:"Cotton socks",price:"$14",color:"#90A4AE"}],r=d(t=>e.jsxs(t,{width:600,style:{backgroundColor:"#F5F7FA",color:F,fontFamily:"Arial, Helvetica, sans-serif"},children:[e.jsx(l,{style:{backgroundColor:"#FFFFFF",padding:[32,24]},children:e.jsx(y,{level:2,style:{fontSize:22,textAlign:"center"},children:"New arrivals"})}),e.jsx(l,{style:{backgroundColor:"#FFFFFF",padding:[0,24,32,24]},children:e.jsx(h,{columns:3,style:{gap:16,rowGap:24},children:v.map(o=>e.jsxs(m,{style:{gap:8},children:[e.jsx(c,{src:b(o.color),alt:o.name,style:{width:"100%"}}),e.jsx(n,{style:{fontSize:15,fontWeight:700},children:o.name}),e.jsx(n,{style:{fontSize:14,color:x},children:o.price})]},o.name))})})]}),{y:2}),s=d(t=>e.jsx(t,{width:600,style:{color:F,fontFamily:"Arial, Helvetica, sans-serif"},children:e.jsx(l,{style:{padding:[32,24]},children:e.jsxs(h,{columns:2,stackOnMobile:!1,style:{gap:24,alignItems:"center",padding:16,backgroundColor:"#EEF2FF",borderRadius:8},children:[e.jsx(n,{style:{fontSize:15},children:"Write anything: docs, notes and wikis that feel effortless."}),e.jsx(n,{style:{fontSize:15},children:"Plan together."}),e.jsx(n,{style:{fontSize:15},children:"Find it fast, across everything you've written."}),e.jsx(p,{href:"https://example.com/start",style:{backgroundColor:"#4F46E5",color:"#FFFFFF",padding:[10,18],borderRadius:6},children:"Get started"})]})})})),f=(t,o)=>({src:`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${o}" viewBox="0 0 1200 600" preserveAspectRatio="none"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#1E3A8A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><rect width="1200" height="600" fill="url(#g)"/><circle cx="900" cy="380" r="120" fill="#FDE68A"/></svg>`)}`,width:t,height:o}),a=d(t=>e.jsx(t,{width:600,style:{color:"#FFFFFF",fontFamily:"Arial, Helvetica, sans-serif"},children:e.jsx(l,{children:e.jsxs(g,{style:{height:300,alignItems:"center"},children:[e.jsx(c,{src:f(1200,600),alt:"A sunset over the sea",style:{width:"100%"}}),e.jsxs(m,{style:{padding:[0,40],gap:16},children:[e.jsx(y,{level:1,style:{fontSize:34,lineHeight:1.2},children:"Summer sale"}),e.jsx(n,{style:{fontSize:16},children:"Up to 40% off everything for the season, this week only."}),e.jsx(p,{href:"https://example.com/sale",style:{backgroundColor:"#FFFFFF",color:"#1E3A8A",padding:[12,22],borderRadius:6},children:"Shop the sale"})]})]})})})),i=d(t=>e.jsx(t,{width:600,style:{fontFamily:"Arial, Helvetica, sans-serif"},children:e.jsx(l,{style:{padding:[24,24]},children:e.jsxs(g,{style:{height:184,alignItems:"end",borderRadius:8},children:[e.jsx(c,{src:f(1200,400),alt:"The coast at dusk",style:{width:"100%"}}),e.jsx(n,{style:{padding:[10,16],backgroundColor:"#111827",color:"#F9FAFB",fontSize:14},children:"Photographed on the north coast, May 2026"})]})})}));r.__docgenInfo={description:`A shop's new arrivals: three to a row, the last row's two keeping their width. An email's cells are whole px (174,
173, 173: Outlook's widths), a page's flexbox shares (173.33 each), so the photos' heights differ by up to a pixel
and the second row may sit two lower.`,methods:[],displayName:"ProductGrid"};s.__docgenInfo={description:"Features two to a row, of different heights, each in the middle of its row; kept two to a row on phones.",methods:[],displayName:"FeatureGrid"};a.__docgenInfo={description:"A hero: words and a button over a picture, in the middle of the Layer's height, the picture covering it.",methods:[],displayName:"HeroOverImage"};i.__docgenInfo={description:"A banner, its caption along the bottom on a band of its own, its corners rounded.",methods:[],displayName:"BannerCaption"};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`outputs(Root => <Root width={600} style={{
  backgroundColor: "#F5F7FA",
  color: INK,
  fontFamily: "Arial, Helvetica, sans-serif"
}}>
    <Section style={{
    backgroundColor: "#FFFFFF",
    padding: [32, 24]
  }}>
      <Heading level={2} style={{
      fontSize: 22,
      textAlign: "center"
    }}>New arrivals</Heading>
    </Section>
    <Section style={{
    backgroundColor: "#FFFFFF",
    padding: [0, 24, 32, 24]
  }}>
      <Grid columns={3} style={{
      gap: 16,
      rowGap: 24
    }}>
        {products.map(product => <Column key={product.name} style={{
        gap: 8
      }}>
            <Image src={photo(product.color)} alt={product.name} style={{
          width: "100%"
        }} />
            <Paragraph style={{
          fontSize: 15,
          fontWeight: 700
        }}>{product.name}</Paragraph>
            <Paragraph style={{
          fontSize: 14,
          color: MUTED
        }}>{product.price}</Paragraph>
          </Column>)}
      </Grid>
    </Section>
  </Root>, {
  y: 2
})`,...r.parameters?.docs?.source},description:{story:`A shop's new arrivals: three to a row, the last row's two keeping their width. An email's cells are whole px (174,
173, 173: Outlook's widths), a page's flexbox shares (173.33 each), so the photos' heights differ by up to a pixel
and the second row may sit two lower.`,...r.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`outputs(Root => <Root width={600} style={{
  color: INK,
  fontFamily: "Arial, Helvetica, sans-serif"
}}>
    <Section style={{
    padding: [32, 24]
  }}>
      <Grid columns={2} stackOnMobile={false} style={{
      gap: 24,
      alignItems: "center",
      padding: 16,
      backgroundColor: "#EEF2FF",
      borderRadius: 8
    }}>
        <Paragraph style={{
        fontSize: 15
      }}>Write anything: docs, notes and wikis that feel effortless.</Paragraph>
        <Paragraph style={{
        fontSize: 15
      }}>Plan together.</Paragraph>
        <Paragraph style={{
        fontSize: 15
      }}>Find it fast, across everything you've written.</Paragraph>
        <Button href="https://example.com/start" style={{
        backgroundColor: "#4F46E5",
        color: "#FFFFFF",
        padding: [10, 18],
        borderRadius: 6
      }}>Get started</Button>
      </Grid>
    </Section>
  </Root>)`,...s.parameters?.docs?.source},description:{story:"Features two to a row, of different heights, each in the middle of its row; kept two to a row on phones.",...s.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`outputs(Root => <Root width={600} style={{
  color: "#FFFFFF",
  fontFamily: "Arial, Helvetica, sans-serif"
}}>
    <Section>
      <Layer style={{
      height: 300,
      alignItems: "center"
    }}>
        <Image src={scene(1200, 600)} alt="A sunset over the sea" style={{
        width: "100%"
      }} />
        <Column style={{
        padding: [0, 40],
        gap: 16
      }}>
          <Heading level={1} style={{
          fontSize: 34,
          lineHeight: 1.2
        }}>Summer sale</Heading>
          <Paragraph style={{
          fontSize: 16
        }}>Up to 40% off everything for the season, this week only.</Paragraph>
          <Button href="https://example.com/sale" style={{
          backgroundColor: "#FFFFFF",
          color: "#1E3A8A",
          padding: [12, 22],
          borderRadius: 6
        }}>Shop the sale</Button>
        </Column>
      </Layer>
    </Section>
  </Root>)`,...a.parameters?.docs?.source},description:{story:"A hero: words and a button over a picture, in the middle of the Layer's height, the picture covering it.",...a.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`outputs(Root => <Root width={600} style={{
  fontFamily: "Arial, Helvetica, sans-serif"
}}>
    <Section style={{
    padding: [24, 24]
  }}>
      <Layer style={{
      height: 184,
      alignItems: "end",
      borderRadius: 8
    }}>
        <Image src={scene(1200, 400)} alt="The coast at dusk" style={{
        width: "100%"
      }} />
        <Paragraph style={{
        padding: [10, 16],
        backgroundColor: "#111827",
        color: "#F9FAFB",
        fontSize: 14
      }}>Photographed on the north coast, May 2026</Paragraph>
      </Layer>
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"A banner, its caption along the bottom on a band of its own, its corners rounded.",...i.parameters?.docs?.description}}};const G=["ProductGrid","FeatureGrid","HeroOverImage","BannerCaption"];export{i as BannerCaption,s as FeatureGrid,a as HeroOverImage,r as ProductGrid,G as __namedExportsOrder,z as default};
