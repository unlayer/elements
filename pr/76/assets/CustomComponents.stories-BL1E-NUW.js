import{j as e}from"./jsx-runtime-BRn4Y0sw.js";import{X as b,Y as _,Z as K,_ as U,$ as G,a0 as V,a1 as Q,a2 as J,a3 as X,a4 as Z,a5 as ee,a6 as te,a7 as oe,a8 as ne,a9 as re,aa as ae,ab as le,b as ie,e as se,N as ce,x as w,R as E,j as i,m as x,T as s,y,ac as de,U as pe,O as he}from"./SideBySide-BvGu3HbT.js";import"./iframe-DIHAMFCx.js";import"./preload-helper-PPVm8Dsz.js";function h(t){return o=>b(t(),o)}const r={text:h(()=>le()),color:h(()=>ae()),image:h(()=>re()),link:h(()=>ne()),boolean:h(()=>oe()),fontFamily:h(()=>te()),fontWeight:h(()=>ee()),number:t=>{const{min:o,max:n,integer:a,...l}=t;return b(G({min:o,max:n,integer:a}),l)},length:t=>{const{units:o,min:n,...a}=t;return b(U(o,{min:n}),a)},choice:(t,o)=>b(K(t),o)};function k(t){const o=_({type:t.type,label:t.label,description:t.description,props:t.props,placement:t.placement,expand(a,l){const{nodes:d,components:p,diagnostics:P}=J(t.render(a));for(const Y of p)l.register(Y);if(P.length)throw new Error(X(P));return d.length===1?d[0]:d}}),n=a=>{const l=Z();if(!l)throw new Error(`[Elements] <${t.type}> is part of a template: render the template with render(), not this component on its own`);return V(l,o),Q(l,t.type,a)};return n.displayName=t.type,Object.assign(n,{definition:o})}const me="#F7F3EA",H="#FFFDF8",S="#1E1C19",C="#6C665B",W="#A9A293",q="#E2DBCC",A="#2E5041",O="#9A4A2A",ge="#B0872E",ue="'Cormorant Garamond', Georgia, 'Times New Roman', serif",fe="'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",M="'DM Mono', SFMono-Regular, Menlo, Consolas, monospace",I="https://long-shelf.example",j={fonts:[{family:"Cormorant Garamond",src:"https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2",format:"woff2",weight:"300 700"},{family:"Cormorant Garamond",src:"https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2",format:"woff2",weight:"300 700",style:"italic"},{family:"Instrument Sans",src:"https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2",format:"woff2",weight:"400 700"},{family:"DM Mono",src:"https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2",format:"woff2",weight:400}],style:{backgroundColor:me,color:S,fontFamily:fe,fontSize:16,lineHeight:1.5}},v={fontFamily:M,fontSize:12,lineHeight:1.5,letterSpacing:1,textTransform:"uppercase",color:C},$={fontFamily:M,fontSize:12,lineHeight:1.5,color:C},c=t=>({fontFamily:ue,fontWeight:500,fontSize:t,lineHeight:1.08,letterSpacing:-.3}),B=t=>e.jsxs(E,{stackOnMobile:!1,style:{alignItems:"end",padding:[0,0,10],border:{bottom:`1px solid ${S}`}},children:[e.jsx(i,{style:{width:140},children:e.jsx(s,{style:{...c(26),fontStyle:"italic",lineHeight:"28px"},children:"Long Shelf"})}),e.jsx(i,{children:e.jsx(s,{style:{...v,textAlign:"right"},children:t})})]}),Ce={title:"Components/Custom components",args:se,argTypes:ie,parameters:{docs:{description:{component:"`component()` names a block made of other components, with typed props: `prop.text`, `prop.color`, `prop.image`, `prop.link`, `prop.number`, `prop.choice`, `prop.boolean`. It's kept as one node in the document, and drawn from its `render` as an Email and as a Page. \"Show code\" has its definition and how it's used."}}}},T=(t,o)=>({...ce(o),parameters:{docs:{source:{code:t,language:"tsx"}}}}),F=k({type:"longshelf.Countdown",label:"Countdown",props:{headline:r.text({label:"Headline",default:"The winter sale ends in"}),days:r.text({label:"Days",default:"02"}),hours:r.text({label:"Hours",default:"11"}),minutes:r.text({label:"Minutes",default:"45"}),accent:r.color({label:"Accent",default:A})},render:({headline:t,days:o,hours:n,minutes:a,accent:l})=>e.jsxs(i,{style:{gap:14,alignItems:"center"},children:[e.jsx(x,{level:2,style:{...c(30),textAlign:"center",color:l},children:t}),e.jsx(E,{stackOnMobile:!1,style:{gap:8,justifyContent:"center"},children:[[o,"Days"],[n,"Hours"],[a,"Mins"]].map(([d,p])=>e.jsxs(i,{style:{width:92,padding:[8,0,12],gap:2,backgroundColor:S,color:H,borderRadius:2,textAlign:"center"},children:[e.jsx(s,{style:{...c(46),lineHeight:1.25},children:d}),e.jsx(s,{style:{...v,fontSize:11,color:W},children:p})]},p))})]})}),m=T(`import { Column, component, Email, Heading, prop, Row, Section, Text } from "@unlayer/react-elements";

const Countdown = component({
  type: "longshelf.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "The winter sale ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 14, alignItems: "center" }}>
      <Heading level={2} style={{ textAlign: "center", color: accent }}>{headline}</Heading>
      <Row stackOnMobile={false} style={{ gap: 8, justifyContent: "center" }}>
        {/* A Column for each of days, hours and minutes */}
      </Row>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Countdown />
      <Countdown headline="Doors open for Ines Varga in" days="00" hours="03" minutes="20" accent="#9A4A2A" />
    </Section>
  </Email>
);`,t=>e.jsx(t,{width:560,...j,children:e.jsxs(w,{style:{padding:[28,32,44],gap:32},mobile:{padding:[20,20,32],gap:28},children:[B("This week"),e.jsx(F,{}),e.jsx(de,{style:{borderTop:`1px solid ${q}`}}),e.jsx(F,{headline:"Doors open for Ines Varga in",days:"00",hours:"03",minutes:"20",accent:O})]})})),N=(t,o,n,a,l)=>({src:`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="${t}"/><rect x="202" y="32" width="208" height="344" fill="#000" opacity=".12"/><rect x="196" y="24" width="208" height="344" fill="${o}"/>${l}<text x="300" y="332" fill="${n}" font-family="Georgia, serif" font-size="23" text-anchor="middle">${a}</text></svg>`)}`,width:600,height:400}),we=N("#E7DFCF","#254653","#F3E9D2","Low Water",'<circle cx="300" cy="124" r="52" fill="#E2B04A"/><path d="M196 196q26-20 52 0t52 0 52 0 52 0v172H196Z" fill="#17323D"/><path d="M196 234q26-20 52 0t52 0 52 0 52 0" fill="none" stroke="#F3E9D2" stroke-width="2"/>'),be=N("#E4E2D2","#E9DFC6","#2E3B24","The Orchard Year",'<circle cx="300" cy="136" r="78" fill="#5C6B3C"/><rect x="294" y="196" width="12" height="84" fill="#3E2E20"/><circle cx="272" cy="118" r="10" fill="#B54A33"/><circle cx="322" cy="104" r="10" fill="#B54A33"/><circle cx="332" cy="154" r="10" fill="#B54A33"/><circle cx="284" cy="160" r="10" fill="#B54A33"/>'),L=k({type:"longshelf.BookCard",label:"Book card",props:{jacket:r.image({label:"Jacket",required:!0}),title:r.text({label:"Title",required:!0}),blurb:r.text({label:"Blurb",required:!0}),price:r.text({label:"Price",required:!0}),href:r.link({label:"Link",required:!0}),cta:r.text({label:"Button",default:"Add to basket"}),accent:r.color({label:"Accent",default:A})},render:({jacket:t,title:o,blurb:n,price:a,href:l,cta:d,accent:p})=>e.jsxs(i,{style:{gap:14,padding:[0,0,18],backgroundColor:H,borderRadius:3},children:[e.jsx(pe,{src:t,alt:`The jacket of ${o}.`,style:{width:"100%",borderRadius:[3,3,0,0]}}),e.jsxs(i,{style:{gap:8,padding:[0,16]},children:[e.jsx(x,{level:3,style:c(26),children:o}),e.jsx(y,{style:{fontSize:14,lineHeight:1.45,color:C},children:n}),e.jsx(y,{style:{...c(28),color:p},children:a}),e.jsx(he,{href:l,style:{width:"100%",backgroundColor:p,fontSize:14,fontWeight:600,padding:[12,0],borderRadius:2},children:d})]})]})}),g=T(`import { Button, Column, component, Email, Heading, Image, Paragraph, prop, Row, Section } from "@unlayer/react-elements";

const BookCard = component({
  type: "longshelf.BookCard",
  label: "Book card",
  props: {
    jacket: prop.image({ label: "Jacket", required: true }),
    title: prop.text({ label: "Title", required: true }),
    blurb: prop.text({ label: "Blurb", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to basket" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ jacket, title, blurb, price, href, cta, accent }) => (
    <Column style={{ gap: 14 }}>
      <Image src={jacket} alt={\`The jacket of \${title}.\`} style={{ width: "100%" }} />
      <Heading level={3}>{title}</Heading>
      <Paragraph>{blurb}</Paragraph>
      <Paragraph style={{ color: accent }}>{price}</Paragraph>
      <Button href={href} style={{ backgroundColor: accent }}>{cta}</Button>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Row style={{ gap: 16 }}>
        <BookCard jacket={{ src: "https://long-shelf.example/low-water.png", width: 600, height: 400 }} title="Low Water" blurb="Six stories from the Severn." price="£14" href="https://long-shelf.example/low-water" />
        <BookCard style={{ flex: 2 }} jacket={{ src: "https://long-shelf.example/orchard-year.png", width: 600, height: 400 }} title="The Orchard Year" blurb="Twelve months with one Herefordshire orchard." price="£22" href="https://long-shelf.example/orchard-year" cta="Reserve a copy" accent="#9A4A2A" />
      </Row>
    </Section>
  </Email>
);`,t=>e.jsx(t,{width:640,...j,children:e.jsxs(w,{style:{padding:[28,24,40],gap:20},mobile:{padding:[20,16,32]},children:[B("New this week"),e.jsxs(E,{style:{gap:16},children:[e.jsx(L,{jacket:we,title:"Low Water",blurb:"Six stories from the Severn, where the tide comes in faster than a man can run.",price:"£14",href:`${I}/low-water`}),e.jsx(L,{style:{flex:2},jacket:be,title:"The Orchard Year",blurb:"Twelve months with one Herefordshire orchard: its grafts, its frosts, its pickers, and the three old men who still argue over when to prune. Hardback, with colour plates.",price:"£22",href:`${I}/orchard-year`,cta:"Reserve a copy",accent:O})]})]})})),R=k({type:"longshelf.Rating",label:"Rating",props:{score:r.number({label:"Score",min:0,max:5,integer:!0,required:!0}),size:r.choice(["small","large"],{label:"Size",default:"small"}),showScore:r.boolean({label:"Show the score",default:!1})},render:({score:t,size:o,showScore:n})=>e.jsx(s,{style:{fontSize:o==="large"?30:16,lineHeight:1.2,letterSpacing:o==="large"?3:1,color:ge},children:"★".repeat(t)+"☆".repeat(5-t)+(n?` ${t} of 5`:"")})}),z=(t,o,n)=>e.jsxs(i,{style:{gap:6,padding:[16,0],border:{top:`1px solid ${q}`}},children:[t,e.jsx(y,{style:{...c(21),fontWeight:400,lineHeight:1.25,letterSpacing:0},children:o}),e.jsx(s,{style:$,children:n})]}),u=T(`import { component, Email, prop, Section, Text } from "@unlayer/react-elements";

const Rating = component({
  type: "longshelf.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 30 : 16, color: "#B0872E" }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? \` \${score} of 5\` : "")}
    </Text>
  ),
});

const template = (
  <Email>
    <Section>
      <Rating score={5} size="large" />
      <Rating score={4} showScore />
      <Rating score={3} />
    </Section>
  </Email>
);`,t=>e.jsx(t,{width:560,...j,children:e.jsxs(w,{style:{padding:[28,44,44],gap:24},mobile:{padding:[20,22,32]},children:[B("What readers said"),e.jsxs(i,{style:{gap:8},children:[e.jsx(R,{score:5,size:"large"}),e.jsx(x,{level:2,style:c(38),children:"Low Water"}),e.jsx(s,{style:{fontSize:15,color:C},children:"Ines Varga. Our book of the month, by a long way."})]}),e.jsxs(i,{children:[z(e.jsx(R,{score:4,showScore:!0}),"I read it on a train, and missed my stop.","Priya, Gloucester"),z(e.jsx(R,{score:3}),"Beautiful, and too sad for January. I’ll try again in spring.","Tom, Stroud")]})]})})),D=k({type:"longshelf.Hero",label:"Hero",placement:"section",props:{title:r.text({label:"Title",required:!0}),kicker:r.text({label:"Kicker",default:"Long Shelf"}),background:r.color({label:"Background",default:S})},render:({title:t,kicker:o,background:n})=>e.jsxs(w,{style:{backgroundColor:n,color:H,padding:[52,24,56],gap:10,textAlign:"center"},mobile:{padding:[40,20,44]},children:[e.jsx(s,{style:{...v,color:W},children:o}),e.jsx(x,{level:1,style:{...c(60),fontStyle:"italic"},mobile:{fontSize:48},children:t})]})}),f=T(`import { component, Email, Heading, Paragraph, prop, Section, Text } from "@unlayer/react-elements";

const Hero = component({
  type: "longshelf.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    kicker: prop.text({ label: "Kicker", default: "Long Shelf" }),
    background: prop.color({ label: "Background", default: "#1E1C19" }),
  },
  render: ({ title, kicker, background }) => (
    <Section style={{ backgroundColor: background, color: "#FFFDF8", padding: [52, 24, 56], textAlign: "center" }}>
      <Text>{kicker}</Text>
      <Heading level={1} style={{ fontSize: 60, fontStyle: "italic" }}>{title}</Heading>
    </Section>
  ),
});

const template = (
  <Email>
    <Hero title="New arrivals" />
    <Section>
      <Paragraph>The rest of the email goes on under it.</Paragraph>
    </Section>
    <Hero title="Last chance" kicker="The winter sale" background="#2E5041" />
  </Email>
);`,t=>e.jsxs(t,{width:560,...j,children:[e.jsx(D,{title:"New arrivals"}),e.jsxs(w,{style:{padding:[36,44],gap:10},mobile:{padding:[28,22]},children:[e.jsx(y,{style:{...c(24),fontWeight:400,lineHeight:1.3,letterSpacing:0,textAlign:"center"},children:"Eleven books came in this week, three of them first novels, and one that Maud has already put aside for herself."}),e.jsx(s,{style:{...$,textAlign:"center"},children:"The band above and the one below are each one Hero: it goes where a Section goes."})]}),e.jsx(D,{title:"Last chance",kicker:"The winter sale",background:A})]}));m.__docgenInfo={description:"A countdown from its props: with their defaults, and with its own.",methods:[],displayName:"CountdownTimer"};g.__docgenInfo={description:"A book card: a required jacket and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`.",methods:[],displayName:"ProductCards"};u.__docgenInfo={description:"A rating worked out from its props in `render`: a number, a choice of sizes, and a switch.",methods:[],displayName:"WorkedOutFromProps"};f.__docgenInfo={description:'`placement: "section"` makes a custom component a band of its own: it goes where a `Section` goes, and renders one.',methods:[],displayName:"AWholeSection"};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`story(\`import { Column, component, Email, Heading, prop, Row, Section, Text } from "@unlayer/react-elements";

const Countdown = component({
  type: "longshelf.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "The winter sale ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 14, alignItems: "center" }}>
      <Heading level={2} style={{ textAlign: "center", color: accent }}>{headline}</Heading>
      <Row stackOnMobile={false} style={{ gap: 8, justifyContent: "center" }}>
        {/* A Column for each of days, hours and minutes */}
      </Row>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Countdown />
      <Countdown headline="Doors open for Ines Varga in" days="00" hours="03" minutes="20" accent="#9A4A2A" />
    </Section>
  </Email>
);\`, Root => <Root width={560} {...root}>
      <Section style={{
    padding: [28, 32, 44],
    gap: 32
  }} mobile={{
    padding: [20, 20, 32],
    gap: 28
  }}>
        {masthead("This week")}
        <Countdown />
        <Divider style={{
      borderTop: \`1px solid \${RULE}\`
    }} />
        <Countdown headline="Doors open for Ines Varga in" days="00" hours="03" minutes="20" accent={CLAY} />
      </Section>
    </Root>)`,...m.parameters?.docs?.source},description:{story:"A countdown from its props: with their defaults, and with its own.",...m.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`story(\`import { Button, Column, component, Email, Heading, Image, Paragraph, prop, Row, Section } from "@unlayer/react-elements";

const BookCard = component({
  type: "longshelf.BookCard",
  label: "Book card",
  props: {
    jacket: prop.image({ label: "Jacket", required: true }),
    title: prop.text({ label: "Title", required: true }),
    blurb: prop.text({ label: "Blurb", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to basket" }),
    accent: prop.color({ label: "Accent", default: "#2E5041" }),
  },
  render: ({ jacket, title, blurb, price, href, cta, accent }) => (
    <Column style={{ gap: 14 }}>
      <Image src={jacket} alt={\\\`The jacket of \\\${title}.\\\`} style={{ width: "100%" }} />
      <Heading level={3}>{title}</Heading>
      <Paragraph>{blurb}</Paragraph>
      <Paragraph style={{ color: accent }}>{price}</Paragraph>
      <Button href={href} style={{ backgroundColor: accent }}>{cta}</Button>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Row style={{ gap: 16 }}>
        <BookCard jacket={{ src: "https://long-shelf.example/low-water.png", width: 600, height: 400 }} title="Low Water" blurb="Six stories from the Severn." price="£14" href="https://long-shelf.example/low-water" />
        <BookCard style={{ flex: 2 }} jacket={{ src: "https://long-shelf.example/orchard-year.png", width: 600, height: 400 }} title="The Orchard Year" blurb="Twelve months with one Herefordshire orchard." price="£22" href="https://long-shelf.example/orchard-year" cta="Reserve a copy" accent="#9A4A2A" />
      </Row>
    </Section>
  </Email>
);\`, Root => <Root width={640} {...root}>
      <Section style={{
    padding: [28, 24, 40],
    gap: 20
  }} mobile={{
    padding: [20, 16, 32]
  }}>
        {masthead("New this week")}
        <Row style={{
      gap: 16
    }}>
          <BookCard jacket={LOW_WATER} title="Low Water" blurb="Six stories from the Severn, where the tide comes in faster than a man can run." price="£14" href={\`\${SITE}/low-water\`} />
          <BookCard style={{
        flex: 2
      }} jacket={ORCHARD_YEAR} title="The Orchard Year" blurb="Twelve months with one Herefordshire orchard: its grafts, its frosts, its pickers, and the three old men who still argue over when to prune. Hardback, with colour plates." price="£22" href={\`\${SITE}/orchard-year\`} cta="Reserve a copy" accent={CLAY} />
        </Row>
      </Section>
    </Root>)`,...g.parameters?.docs?.source},description:{story:"A book card: a required jacket and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`.",...g.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`story(\`import { component, Email, prop, Section, Text } from "@unlayer/react-elements";

const Rating = component({
  type: "longshelf.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 30 : 16, color: "#B0872E" }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? \\\` \\\${score} of 5\\\` : "")}
    </Text>
  ),
});

const template = (
  <Email>
    <Section>
      <Rating score={5} size="large" />
      <Rating score={4} showScore />
      <Rating score={3} />
    </Section>
  </Email>
);\`, Root => <Root width={560} {...root}>
      <Section style={{
    padding: [28, 44, 44],
    gap: 24
  }} mobile={{
    padding: [20, 22, 32]
  }}>
        {masthead("What readers said")}
        <Column style={{
      gap: 8
    }}>
          <Rating score={5} size="large" />
          <Heading level={2} style={serif(38)}>
            Low Water
          </Heading>
          <Text style={{
        fontSize: 15,
        color: QUIET
      }}>Ines Varga. Our book of the month, by a long way.</Text>
        </Column>
        <Column>
          {review(<Rating score={4} showScore />, "I read it on a train, and missed my stop.", "Priya, Gloucester")}
          {review(<Rating score={3} />, "Beautiful, and too sad for January. I’ll try again in spring.", "Tom, Stroud")}
        </Column>
      </Section>
    </Root>)`,...u.parameters?.docs?.source},description:{story:"A rating worked out from its props in `render`: a number, a choice of sizes, and a switch.",...u.parameters?.docs?.description}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`story(\`import { component, Email, Heading, Paragraph, prop, Section, Text } from "@unlayer/react-elements";

const Hero = component({
  type: "longshelf.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    kicker: prop.text({ label: "Kicker", default: "Long Shelf" }),
    background: prop.color({ label: "Background", default: "#1E1C19" }),
  },
  render: ({ title, kicker, background }) => (
    <Section style={{ backgroundColor: background, color: "#FFFDF8", padding: [52, 24, 56], textAlign: "center" }}>
      <Text>{kicker}</Text>
      <Heading level={1} style={{ fontSize: 60, fontStyle: "italic" }}>{title}</Heading>
    </Section>
  ),
});

const template = (
  <Email>
    <Hero title="New arrivals" />
    <Section>
      <Paragraph>The rest of the email goes on under it.</Paragraph>
    </Section>
    <Hero title="Last chance" kicker="The winter sale" background="#2E5041" />
  </Email>
);\`, Root => <Root width={560} {...root}>
      <Hero title="New arrivals" />
      <Section style={{
    padding: [36, 44],
    gap: 10
  }} mobile={{
    padding: [28, 22]
  }}>
        <Paragraph style={{
      ...serif(24),
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: 0,
      textAlign: "center"
    }}>Eleven books came in this week, three of them first novels, and one that Maud has already put aside for herself.</Paragraph>
        <Text style={{
      ...note,
      textAlign: "center"
    }}>The band above and the one below are each one Hero: it goes where a Section goes.</Text>
      </Section>
      <Hero title="Last chance" kicker="The winter sale" background={CLOTH} />
    </Root>)`,...f.parameters?.docs?.source},description:{story:'`placement: "section"` makes a custom component a band of its own: it goes where a `Section` goes, and renders one.',...f.parameters?.docs?.description}}};const je=["CountdownTimer","ProductCards","WorkedOutFromProps","AWholeSection"];export{f as AWholeSection,m as CountdownTimer,g as ProductCards,u as WorkedOutFromProps,je as __namedExportsOrder,Ce as default};
