import{A as e,C as t,J as n,O as r,S as i,_t as a,a as o,at as s,ct as c,dt as l,ft as u,gt as d,ht as ee,i as te,it as ne,lt as re,mt as ie,ot as f,pt as p,q as m,r as ae,rt as h,st as g,tt as _,ut as v,vt as y,y as b,yt as x}from"./SideBySide-DKhc6apT.js";import{t as S}from"./jsx-runtime-lhLBEFCC.js";function C(e){return t=>y(e(),t)}var w={text:C(()=>x()),color:C(()=>re()),image:C(()=>g()),link:C(()=>d()),boolean:C(()=>c()),fontFamily:C(()=>u()),fontWeight:C(()=>p()),number:e=>{let{min:t,max:n,integer:r,...i}=e;return y(a({min:t,max:n,integer:r}),i)},length:e=>{let{units:t,min:n,...r}=e;return y(ee(t,{min:n}),r)},choice:(e,t)=>y(l(e),t)};function T(e){let t=v({type:e.type,label:e.label,description:e.description,props:e.props,placement:e.placement,expand(t,n){let{nodes:r,components:i,diagnostics:a}=h(e.render(t));for(let e of i)n.register(e);if(a.length)throw Error(ie(a));return r.length===1?r[0]:r}}),n=n=>{let r=ne();if(!r)throw Error(`[Elements] <${e.type}> is part of a template: render the template with render(), not this component on its own`);return f(r,t),s(r,e.type,n)};return n.displayName=e.type,Object.assign(n,{definition:t})}var E=S(),D=`#F7F3EA`,O=`#FFFDF8`,k=`#1E1C19`,A=`#6C665B`,j=`#A9A293`,M=`#E2DBCC`,N=`#2E5041`,P=`#9A4A2A`,oe=`#B0872E`,se=`'Cormorant Garamond', Georgia, 'Times New Roman', serif`,ce=`'Instrument Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`,F=`'DM Mono', SFMono-Regular, Menlo, Consolas, monospace`,I=`https://long-shelf.example`,L={fonts:[{family:`Cormorant Garamond`,src:`https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2`,format:`woff2`,weight:`300 700`},{family:`Cormorant Garamond`,src:`https://fonts.gstatic.com/s/cormorantgaramond/v21/co3ZmX5slCNuHLi8bLeY9MK7whWMhyjYrEtImSqn7B6D.woff2`,format:`woff2`,weight:`300 700`,style:`italic`},{family:`Instrument Sans`,src:`https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1ZuWi3g.woff2`,format:`woff2`,weight:`400 700`},{family:`DM Mono`,src:`https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2`,format:`woff2`,weight:400}],style:{backgroundColor:D,color:k,fontFamily:ce,fontSize:16,lineHeight:1.5}},R={fontFamily:F,fontSize:12,lineHeight:1.5,letterSpacing:1,textTransform:`uppercase`,color:A},z={fontFamily:F,fontSize:12,lineHeight:1.5,color:A},B=e=>({fontFamily:se,fontWeight:500,fontSize:e,lineHeight:1.08,letterSpacing:-.3}),V=e=>(0,E.jsxs)(m,{stackOnMobile:!1,style:{alignItems:`end`,padding:[0,0,10],border:{bottom:`1px solid ${k}`}},children:[(0,E.jsx)(i,{style:{width:140},children:(0,E.jsx)(_,{style:{...B(26),fontStyle:`italic`,lineHeight:`28px`},children:`Long Shelf`})}),(0,E.jsx)(i,{children:(0,E.jsx)(_,{style:{...R,textAlign:`right`},children:e})})]}),H={title:`Components/Custom components`,args:te,argTypes:ae,parameters:{docs:{description:{component:"`component()` names a block made of other components, with typed props: `prop.text`, `prop.color`, `prop.image`, `prop.link`, `prop.number`, `prop.choice`, `prop.boolean`. It's kept as one node in the document, and drawn from its `render` as an Email and as a Page. \"Show code\" has its definition and how it's used."}}}},U=(e,t)=>({...o(t),parameters:{docs:{source:{code:e,language:`tsx`}}}}),W=T({type:`longshelf.Countdown`,label:`Countdown`,props:{headline:w.text({label:`Headline`,default:`The winter sale ends in`}),days:w.text({label:`Days`,default:`02`}),hours:w.text({label:`Hours`,default:`11`}),minutes:w.text({label:`Minutes`,default:`45`}),accent:w.color({label:`Accent`,default:N})},render:({headline:e,days:t,hours:n,minutes:a,accent:o})=>(0,E.jsxs)(i,{style:{gap:14,alignItems:`center`},children:[(0,E.jsx)(r,{level:2,style:{...B(30),textAlign:`center`,color:o},children:e}),(0,E.jsx)(m,{stackOnMobile:!1,style:{gap:8,justifyContent:`center`},children:[[t,`Days`],[n,`Hours`],[a,`Mins`]].map(([e,t])=>(0,E.jsxs)(i,{style:{width:92,padding:[8,0,12],gap:2,backgroundColor:k,color:O,borderRadius:2,textAlign:`center`},children:[(0,E.jsx)(_,{style:{...B(46),lineHeight:1.25},children:e}),(0,E.jsx)(_,{style:{...R,fontSize:11,color:j},children:t})]},t))})]})}),G=U(`import { Column, component, Email, Heading, prop, Row, Section, Text } from "@unlayer/react-elements";

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
);`,e=>(0,E.jsx)(e,{width:560,...L,children:(0,E.jsxs)(n,{style:{padding:[28,32,44],gap:32},mobile:{padding:[20,20,32],gap:28},children:[V(`This week`),(0,E.jsx)(W,{}),(0,E.jsx)(t,{style:{borderTop:`1px solid ${M}`}}),(0,E.jsx)(W,{headline:`Doors open for Ines Varga in`,days:`00`,hours:`03`,minutes:`20`,accent:P})]})})),K=(e,t,n,r,i)=>({src:`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="${e}"/><rect x="202" y="32" width="208" height="344" fill="#000" opacity=".12"/><rect x="196" y="24" width="208" height="344" fill="${t}"/>${i}<text x="300" y="332" fill="${n}" font-family="Georgia, serif" font-size="23" text-anchor="middle">${r}</text></svg>`)}`,width:600,height:400}),le=K(`#E7DFCF`,`#254653`,`#F3E9D2`,`Low Water`,`<circle cx="300" cy="124" r="52" fill="#E2B04A"/><path d="M196 196q26-20 52 0t52 0 52 0 52 0v172H196Z" fill="#17323D"/><path d="M196 234q26-20 52 0t52 0 52 0 52 0" fill="none" stroke="#F3E9D2" stroke-width="2"/>`),ue=K(`#E4E2D2`,`#E9DFC6`,`#2E3B24`,`The Orchard Year`,`<circle cx="300" cy="136" r="78" fill="#5C6B3C"/><rect x="294" y="196" width="12" height="84" fill="#3E2E20"/><circle cx="272" cy="118" r="10" fill="#B54A33"/><circle cx="322" cy="104" r="10" fill="#B54A33"/><circle cx="332" cy="154" r="10" fill="#B54A33"/><circle cx="284" cy="160" r="10" fill="#B54A33"/>`),q=T({type:`longshelf.BookCard`,label:`Book card`,props:{jacket:w.image({label:`Jacket`,required:!0}),title:w.text({label:`Title`,required:!0}),blurb:w.text({label:`Blurb`,required:!0}),price:w.text({label:`Price`,required:!0}),href:w.link({label:`Link`,required:!0}),cta:w.text({label:`Button`,default:`Add to basket`}),accent:w.color({label:`Accent`,default:N})},render:({jacket:t,title:n,blurb:a,price:o,href:s,cta:c,accent:l})=>(0,E.jsxs)(i,{style:{gap:14,padding:[0,0,18],backgroundColor:O,borderRadius:3},children:[(0,E.jsx)(e,{src:t,alt:`The jacket of ${n}.`,style:{width:`100%`,borderRadius:[3,3,0,0]}}),(0,E.jsxs)(i,{style:{gap:8,padding:[0,16]},children:[(0,E.jsx)(r,{level:3,style:B(26),children:n}),(0,E.jsx)(_,{style:{fontSize:14,lineHeight:1.45,color:A},children:a}),(0,E.jsx)(_,{style:{...B(28),color:l},children:o}),(0,E.jsx)(b,{href:s,style:{width:`100%`,backgroundColor:l,fontSize:14,fontWeight:600,padding:[12,0],borderRadius:2},children:c})]})]})}),J=U(`import { Button, Column, component, Email, Heading, Image, Text, prop, Row, Section } from "@unlayer/react-elements";

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
      <Text>{blurb}</Text>
      <Text style={{ color: accent }}>{price}</Text>
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
);`,e=>(0,E.jsx)(e,{width:640,...L,children:(0,E.jsxs)(n,{style:{padding:[28,24,40],gap:20},mobile:{padding:[20,16,32]},children:[V(`New this week`),(0,E.jsxs)(m,{style:{gap:16},children:[(0,E.jsx)(q,{jacket:le,title:`Low Water`,blurb:`Six stories from the Severn, where the tide comes in faster than a man can run.`,price:`£14`,href:`${I}/low-water`}),(0,E.jsx)(q,{style:{flex:2},jacket:ue,title:`The Orchard Year`,blurb:`Twelve months with one Herefordshire orchard: its grafts, its frosts, its pickers, and the three old men who still argue over when to prune. Hardback, with colour plates.`,price:`£22`,href:`${I}/orchard-year`,cta:`Reserve a copy`,accent:P})]})]})})),Y=T({type:`longshelf.Rating`,label:`Rating`,props:{score:w.number({label:`Score`,min:0,max:5,integer:!0,required:!0}),size:w.choice([`small`,`large`],{label:`Size`,default:`small`}),showScore:w.boolean({label:`Show the score`,default:!1})},render:({score:e,size:t,showScore:n})=>(0,E.jsx)(_,{style:{fontSize:t===`large`?30:16,lineHeight:1.2,letterSpacing:t===`large`?3:1,color:oe},children:`★`.repeat(e)+`☆`.repeat(5-e)+(n?` ${e} of 5`:``)})}),X=(e,t,n)=>(0,E.jsxs)(i,{style:{gap:6,padding:[16,0],border:{top:`1px solid ${M}`}},children:[e,(0,E.jsx)(_,{style:{...B(21),fontWeight:400,lineHeight:1.25,letterSpacing:0},children:t}),(0,E.jsx)(_,{style:z,children:n})]}),Z=U(`import { component, Email, prop, Section, Text } from "@unlayer/react-elements";

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
);`,e=>(0,E.jsx)(e,{width:560,...L,children:(0,E.jsxs)(n,{style:{padding:[28,44,44],gap:24},mobile:{padding:[20,22,32]},children:[V(`What readers said`),(0,E.jsxs)(i,{style:{gap:8},children:[(0,E.jsx)(Y,{score:5,size:`large`}),(0,E.jsx)(r,{level:2,style:B(38),children:`Low Water`}),(0,E.jsx)(_,{style:{fontSize:15,color:A},children:`Ines Varga. Our book of the month, by a long way.`})]}),(0,E.jsxs)(i,{children:[X((0,E.jsx)(Y,{score:4,showScore:!0}),`I read it on a train, and missed my stop.`,`Priya, Gloucester`),X((0,E.jsx)(Y,{score:3}),`Beautiful, and too sad for January. I’ll try again in spring.`,`Tom, Stroud`)]})]})})),Q=T({type:`longshelf.Hero`,label:`Hero`,placement:`section`,props:{title:w.text({label:`Title`,required:!0}),kicker:w.text({label:`Kicker`,default:`Long Shelf`}),background:w.color({label:`Background`,default:k})},render:({title:e,kicker:t,background:i})=>(0,E.jsxs)(n,{style:{backgroundColor:i,color:O,padding:[52,24,56],gap:10,textAlign:`center`},mobile:{padding:[40,20,44]},children:[(0,E.jsx)(_,{style:{...R,color:j},children:t}),(0,E.jsx)(r,{level:1,style:{...B(60),fontStyle:`italic`},mobile:{fontSize:48},children:e})]})}),$=U(`import { component, Email, Heading, Text, prop, Section } from "@unlayer/react-elements";

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
      <Text>The rest of the email goes on under it.</Text>
    </Section>
    <Hero title="Last chance" kicker="The winter sale" background="#2E5041" />
  </Email>
);`,e=>(0,E.jsxs)(e,{width:560,...L,children:[(0,E.jsx)(Q,{title:`New arrivals`}),(0,E.jsxs)(n,{style:{padding:[36,44],gap:10},mobile:{padding:[28,22]},children:[(0,E.jsx)(_,{style:{...B(24),fontWeight:400,lineHeight:1.3,letterSpacing:0,textAlign:`center`},children:`Eleven books came in this week, three of them first novels, and one that Maud has already put aside for herself.`}),(0,E.jsx)(_,{style:{...z,textAlign:`center`},children:`The band above and the one below are each one Hero: it goes where a Section goes.`})]}),(0,E.jsx)(Q,{title:`Last chance`,kicker:`The winter sale`,background:N})]}));G.__docgenInfo={description:`A countdown from its props: with their defaults, and with its own.`,methods:[],displayName:`CountdownTimer`},J.__docgenInfo={description:"A book card: a required jacket and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`.",methods:[],displayName:`ProductCards`},Z.__docgenInfo={description:"A rating worked out from its props in `render`: a number, a choice of sizes, and a switch.",methods:[],displayName:`WorkedOutFromProps`},$.__docgenInfo={description:'`placement: "section"` makes a custom component a band of its own: it goes where a `Section` goes, and renders one.',methods:[],displayName:`AWholeSection`},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`story(\`import { Column, component, Email, Heading, prop, Row, Section, Text } from "@unlayer/react-elements";

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
    </Root>)`,...G.parameters?.docs?.source},description:{story:`A countdown from its props: with their defaults, and with its own.`,...G.parameters?.docs?.description}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`story(\`import { Button, Column, component, Email, Heading, Image, Text, prop, Row, Section } from "@unlayer/react-elements";

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
      <Text>{blurb}</Text>
      <Text style={{ color: accent }}>{price}</Text>
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
    </Root>)`,...J.parameters?.docs?.source},description:{story:"A book card: a required jacket and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`.",...J.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`story(\`import { component, Email, prop, Section, Text } from "@unlayer/react-elements";

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
    </Root>)`,...Z.parameters?.docs?.source},description:{story:"A rating worked out from its props in `render`: a number, a choice of sizes, and a switch.",...Z.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`story(\`import { component, Email, Heading, Text, prop, Section } from "@unlayer/react-elements";

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
      <Text>The rest of the email goes on under it.</Text>
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
        <Text style={{
      ...serif(24),
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: 0,
      textAlign: "center"
    }}>Eleven books came in this week, three of them first novels, and one that Maud has already put aside for herself.</Text>
        <Text style={{
      ...note,
      textAlign: "center"
    }}>The band above and the one below are each one Hero: it goes where a Section goes.</Text>
      </Section>
      <Hero title="Last chance" kicker="The winter sale" background={CLOTH} />
    </Root>)`,...$.parameters?.docs?.source},description:{story:'`placement: "section"` makes a custom component a band of its own: it goes where a `Section` goes, and renders one.',...$.parameters?.docs?.description}}};var de=[`CountdownTimer`,`ProductCards`,`WorkedOutFromProps`,`AWholeSection`];export{$ as AWholeSection,G as CountdownTimer,J as ProductCards,Z as WorkedOutFromProps,de as __namedExportsOrder,H as default};