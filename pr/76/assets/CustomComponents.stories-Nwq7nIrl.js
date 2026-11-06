import{j as t}from"./jsx-runtime-CsWrgwe2.js";import{X as g,Y as N,Z as q,_ as D,$ as B,a0 as I,a1 as O,a2 as W,a3 as v,a4 as $,a5 as _,a6 as M,a7 as L,a8 as K,a9 as U,aa as X,ab as Y,k as Z,m as G,O as J,S as h,R as j,P as f,C as y,T as F,I as Q,H as A,B as V}from"./SideBySide-Dn3jGyDx.js";import{W as ee,F as b,I as w,p as P,M as T,L as te}from"./shared-DuwPCDP_.js";import"./iframe-B-JyjJ4b.js";import"./preload-helper-PPVm8Dsz.js";function c(e){return o=>g(e(),o)}const n={text:c(()=>Y()),color:c(()=>X()),image:c(()=>U()),link:c(()=>K()),boolean:c(()=>L()),fontFamily:c(()=>M()),fontWeight:c(()=>_()),number:e=>{const{min:o,max:r,integer:a,...s}=e;return g(B({min:o,max:r,integer:a}),s)},length:e=>{const{units:o,min:r,...a}=e;return g(D(o,{min:r}),a)},choice:(e,o)=>g(q(e),o)};function x(e){const o=N({type:e.type,label:e.label,description:e.description,props:e.props,placement:e.placement,expand(a,s){const{nodes:l,components:i,diagnostics:k}=W(e.render(a));for(const z of i)s.register(z);if(k.length)throw new Error(v(k));return l.length===1?l[0]:l}}),r=a=>{const s=$();if(!s)throw new Error(`[Elements] <${e.type}> is part of a template: render the template with render(), not this component on its own`);return I(s,o),O(s,e.type,a)};return r.displayName=e.type,Object.assign(r,{definition:o})}const le={title:"Components/Custom components",args:G,argTypes:Z,parameters:{docs:{description:{component:"`component()` names a block made of other components, with typed props: `prop.text`, `prop.color`, `prop.image`, `prop.link`, `prop.number`, `prop.choice`, `prop.boolean`. It's kept as one node in the document, and drawn from its `render` as an Email and as a Page. \"Show code\" has its definition and how it's used."}}}},S=(e,o)=>({...J(o),parameters:{docs:{source:{code:e,language:"tsx"}}}}),E=x({type:"acme.Countdown",label:"Countdown",props:{headline:n.text({label:"Headline",default:"Offer ends in"}),days:n.text({label:"Days",default:"02"}),hours:n.text({label:"Hours",default:"11"}),minutes:n.text({label:"Minutes",default:"45"}),accent:n.color({label:"Accent",default:"#E11D48"})},render:({headline:e,days:o,hours:r,minutes:a,accent:s})=>t.jsxs(y,{style:{gap:12,alignItems:"center"},children:[t.jsx(f,{style:{fontSize:13,fontWeight:700,letterSpacing:3,textTransform:"uppercase",textAlign:"center",color:s},children:e}),t.jsx(j,{stackOnMobile:!1,style:{gap:8,justifyContent:"center"},children:[[o,"Days"],[r,"Hours"],[a,"Mins"]].map(([l,i])=>t.jsxs(y,{style:{width:76,padding:[12,0],gap:2,backgroundColor:"#111827",color:"#FFFFFF",borderRadius:10,textAlign:"center"},children:[t.jsx(F,{style:{fontSize:28,fontWeight:700},children:l}),t.jsx(F,{style:{fontSize:11,letterSpacing:2,textTransform:"uppercase",color:"#9CA3AF"},children:i})]},i))})]})}),p=S(`import { Column, component, Email, Paragraph, prop, Row, Section, Text } from "@unlayer/react-elements";

const Countdown = component({
  type: "acme.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "Offer ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: "#E11D48" }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 12, alignItems: "center" }}>
      <Paragraph style={{ textAlign: "center", color: accent }}>{headline}</Paragraph>
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
      <Countdown headline="Doors open in" days="00" hours="03" minutes="20" accent="#0F766E" />
    </Section>
  </Email>
);`,e=>t.jsx(e,{width:560,style:{color:w,fontFamily:b},children:t.jsxs(h,{style:{padding:24,gap:24},children:[t.jsx(E,{}),t.jsx(E,{headline:"Doors open in",days:"00",hours:"03",minutes:"20",accent:"#0F766E"})]})})),R=x({type:"acme.ProductCard",label:"Product card",props:{photo:n.image({label:"Photo",required:!0}),name:n.text({label:"Name",required:!0}),description:n.text({label:"Description",required:!0}),price:n.text({label:"Price",required:!0}),href:n.link({label:"Link",required:!0}),cta:n.text({label:"Button",default:"Add to cart"}),accent:n.color({label:"Accent",default:"#6366F1"})},render:({photo:e,name:o,description:r,price:a,href:s,cta:l,accent:i})=>t.jsxs(y,{style:{gap:12,padding:[0,0,16,0],backgroundColor:"#FFFFFF",border:te,borderRadius:12},children:[t.jsx(Q,{src:e,alt:o,style:{width:"100%",borderRadius:[12,12,0,0]}}),t.jsxs(y,{style:{gap:8,padding:[0,16]},children:[t.jsx(A,{level:3,style:{fontSize:17},children:o}),t.jsx(f,{style:{fontSize:13,lineHeight:1.5,color:T},children:r}),t.jsx(f,{style:{fontSize:17,fontWeight:700,color:i},children:a}),t.jsx(V,{href:s,style:{width:"100%",backgroundColor:i,borderRadius:8},children:l})]})]})}),d=S(`import { Button, Column, component, Email, Heading, Image, Paragraph, prop, Row, Section } from "@unlayer/react-elements";

const ProductCard = component({
  type: "acme.ProductCard",
  label: "Product card",
  props: {
    photo: prop.image({ label: "Photo", required: true }),
    name: prop.text({ label: "Name", required: true }),
    description: prop.text({ label: "Description", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to cart" }),
    accent: prop.color({ label: "Accent", default: "#6366F1" }),
  },
  render: ({ photo, name, description, price, href, cta, accent }) => (
    <Column style={{ gap: 12 }}>
      <Image src={photo} alt={name} style={{ width: "100%" }} />
      <Heading level={3}>{name}</Heading>
      <Paragraph>{description}</Paragraph>
      <Paragraph style={{ color: accent }}>{price}</Paragraph>
      <Button href={href} style={{ backgroundColor: accent }}>{cta}</Button>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Row style={{ gap: 16 }}>
        <ProductCard photo={{ src: "https://example.com/lamp.png", width: 600, height: 300 }} name="Desk lamp" description="Warm, dimmable light." price="$89" href="https://example.com/lamp" />
        <ProductCard style={{ flex: 2 }} photo={{ src: "https://example.com/phones.png", width: 600, height: 300 }} name="Headphones" description="Closed-back, with a case." price="$149" href="https://example.com/phones" cta="Buy now" accent="#0EA5E9" />
      </Row>
    </Section>
  </Email>
);`,e=>t.jsx(e,{width:640,style:{color:w,fontFamily:b,backgroundColor:ee},children:t.jsx(h,{style:{padding:24},children:t.jsxs(j,{style:{gap:16},children:[t.jsx(R,{photo:P("#F5C6A5",600,300),name:"Desk lamp",description:"Warm, dimmable light with a machined aluminum base.",price:"$89",href:"https://example.com/lamp"}),t.jsx(R,{style:{flex:2},photo:P("#99D6CF",600,300),name:"Headphones",description:"Closed-back studio headphones with a detachable cable, memory-foam pads, and a case that survives checked luggage.",price:"$149",href:"https://example.com/phones",cta:"Buy now",accent:"#0EA5E9"})]})})})),C=x({type:"acme.Rating",label:"Rating",props:{score:n.number({label:"Score",min:0,max:5,integer:!0,required:!0}),size:n.choice(["small","large"],{label:"Size",default:"small"}),showScore:n.boolean({label:"Show the score",default:!1})},render:({score:e,size:o,showScore:r})=>t.jsx(F,{style:{fontSize:o==="large"?28:16,color:"#B7791F"},children:"★".repeat(e)+"☆".repeat(5-e)+(r?` ${e} of 5`:"")})}),m=S(`import { component, Email, prop, Section, Text } from "@unlayer/react-elements";

const Rating = component({
  type: "acme.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 28 : 16, color: "#B7791F" }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? \` \${score} of 5\` : "")}
    </Text>
  ),
});

const template = (
  <Email>
    <Section>
      <Rating score={3} />
      <Rating score={4} showScore />
      <Rating score={5} size="large" />
    </Section>
  </Email>
);`,e=>t.jsx(e,{width:560,style:{color:w,fontFamily:b},children:t.jsxs(h,{style:{padding:24,gap:12},children:[t.jsx(C,{score:3}),t.jsx(C,{score:4,showScore:!0}),t.jsx(C,{score:5,size:"large"})]})})),H=x({type:"acme.Hero",label:"Hero",placement:"section",props:{title:n.text({label:"Title",required:!0}),background:n.color({label:"Background",default:"#111827"})},render:({title:e,background:o})=>t.jsx(h,{style:{backgroundColor:o,color:"#FFFFFF",padding:[40,24]},children:t.jsx(A,{level:1,style:{fontSize:30,textAlign:"center"},children:e})})}),u=S(`import { component, Email, Heading, Paragraph, prop, Section } from "@unlayer/react-elements";

const Hero = component({
  type: "acme.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    background: prop.color({ label: "Background", default: "#111827" }),
  },
  render: ({ title, background }) => (
    <Section style={{ backgroundColor: background, color: "#FFFFFF", padding: [40, 24] }}>
      <Heading level={1} style={{ fontSize: 30, textAlign: "center" }}>{title}</Heading>
    </Section>
  ),
});

const template = (
  <Email>
    <Hero title="New arrivals" />
    <Section>
      <Paragraph>The rest of the email goes on under it.</Paragraph>
    </Section>
    <Hero title="Last chance" background="#0F766E" />
  </Email>
);`,e=>t.jsxs(e,{width:560,style:{color:w,fontFamily:b},children:[t.jsx(H,{title:"New arrivals"}),t.jsx(h,{style:{padding:24},children:t.jsx(f,{style:{fontSize:15,color:T},children:"The rest of the email goes on under it."})}),t.jsx(H,{title:"Last chance",background:"#0F766E"})]}));p.__docgenInfo={description:"A countdown from its props: with their defaults, and with its own.",methods:[],displayName:"CountdownTimer"};d.__docgenInfo={description:"A product card: a required picture and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`.",methods:[],displayName:"ProductCards"};m.__docgenInfo={description:"A rating worked out from its props in `render`: a number, a choice of sizes, and a switch.",methods:[],displayName:"WorkedOutFromProps"};u.__docgenInfo={description:'`placement: "section"` makes a custom component a band of its own: it goes where a `Section` goes, and renders one.',methods:[],displayName:"AWholeSection"};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`story(\`import { Column, component, Email, Paragraph, prop, Row, Section, Text } from "@unlayer/react-elements";

const Countdown = component({
  type: "acme.Countdown",
  label: "Countdown",
  props: {
    headline: prop.text({ label: "Headline", default: "Offer ends in" }),
    days: prop.text({ label: "Days", default: "02" }),
    hours: prop.text({ label: "Hours", default: "11" }),
    minutes: prop.text({ label: "Minutes", default: "45" }),
    accent: prop.color({ label: "Accent", default: "#E11D48" }),
  },
  render: ({ headline, days, hours, minutes, accent }) => (
    <Column style={{ gap: 12, alignItems: "center" }}>
      <Paragraph style={{ textAlign: "center", color: accent }}>{headline}</Paragraph>
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
      <Countdown headline="Doors open in" days="00" hours="03" minutes="20" accent="#0F766E" />
    </Section>
  </Email>
);\`, Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
      <Section style={{
    padding: 24,
    gap: 24
  }}>
        <Countdown />
        <Countdown headline="Doors open in" days="00" hours="03" minutes="20" accent="#0F766E" />
      </Section>
    </Root>)`,...p.parameters?.docs?.source},description:{story:"A countdown from its props: with their defaults, and with its own.",...p.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`story(\`import { Button, Column, component, Email, Heading, Image, Paragraph, prop, Row, Section } from "@unlayer/react-elements";

const ProductCard = component({
  type: "acme.ProductCard",
  label: "Product card",
  props: {
    photo: prop.image({ label: "Photo", required: true }),
    name: prop.text({ label: "Name", required: true }),
    description: prop.text({ label: "Description", required: true }),
    price: prop.text({ label: "Price", required: true }),
    href: prop.link({ label: "Link", required: true }),
    cta: prop.text({ label: "Button", default: "Add to cart" }),
    accent: prop.color({ label: "Accent", default: "#6366F1" }),
  },
  render: ({ photo, name, description, price, href, cta, accent }) => (
    <Column style={{ gap: 12 }}>
      <Image src={photo} alt={name} style={{ width: "100%" }} />
      <Heading level={3}>{name}</Heading>
      <Paragraph>{description}</Paragraph>
      <Paragraph style={{ color: accent }}>{price}</Paragraph>
      <Button href={href} style={{ backgroundColor: accent }}>{cta}</Button>
    </Column>
  ),
});

const template = (
  <Email>
    <Section>
      <Row style={{ gap: 16 }}>
        <ProductCard photo={{ src: "https://example.com/lamp.png", width: 600, height: 300 }} name="Desk lamp" description="Warm, dimmable light." price="$89" href="https://example.com/lamp" />
        <ProductCard style={{ flex: 2 }} photo={{ src: "https://example.com/phones.png", width: 600, height: 300 }} name="Headphones" description="Closed-back, with a case." price="$149" href="https://example.com/phones" cta="Buy now" accent="#0EA5E9" />
      </Row>
    </Section>
  </Email>
);\`, Root => <Root width={640} style={{
  color: INK,
  fontFamily: FONT,
  backgroundColor: WASH
}}>
      <Section style={{
    padding: 24
  }}>
        <Row style={{
      gap: 16
    }}>
          <ProductCard photo={picture("#F5C6A5", 600, 300)} name="Desk lamp" description="Warm, dimmable light with a machined aluminum base." price="$89" href="https://example.com/lamp" />
          <ProductCard style={{
        flex: 2
      }} photo={picture("#99D6CF", 600, 300)} name="Headphones" description="Closed-back studio headphones with a detachable cable, memory-foam pads, and a case that survives checked luggage." price="$149" href="https://example.com/phones" cta="Buy now" accent="#0EA5E9" />
        </Row>
      </Section>
    </Root>)`,...d.parameters?.docs?.source},description:{story:"A product card: a required picture and link, and a color and a button's words with defaults. Two sit in a `Row`, one with a larger `flex`.",...d.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`story(\`import { component, Email, prop, Section, Text } from "@unlayer/react-elements";

const Rating = component({
  type: "acme.Rating",
  label: "Rating",
  props: {
    score: prop.number({ label: "Score", min: 0, max: 5, integer: true, required: true }),
    size: prop.choice(["small", "large"], { label: "Size", default: "small" }),
    showScore: prop.boolean({ label: "Show the score", default: false }),
  },
  render: ({ score, size, showScore }) => (
    <Text style={{ fontSize: size === "large" ? 28 : 16, color: "#B7791F" }}>
      {"★".repeat(score) + "☆".repeat(5 - score) + (showScore ? \\\` \\\${score} of 5\\\` : "")}
    </Text>
  ),
});

const template = (
  <Email>
    <Section>
      <Rating score={3} />
      <Rating score={4} showScore />
      <Rating score={5} size="large" />
    </Section>
  </Email>
);\`, Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
      <Section style={{
    padding: 24,
    gap: 12
  }}>
        <Rating score={3} />
        <Rating score={4} showScore />
        <Rating score={5} size="large" />
      </Section>
    </Root>)`,...m.parameters?.docs?.source},description:{story:"A rating worked out from its props in `render`: a number, a choice of sizes, and a switch.",...m.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`story(\`import { component, Email, Heading, Paragraph, prop, Section } from "@unlayer/react-elements";

const Hero = component({
  type: "acme.Hero",
  label: "Hero",
  placement: "section",
  props: {
    title: prop.text({ label: "Title", required: true }),
    background: prop.color({ label: "Background", default: "#111827" }),
  },
  render: ({ title, background }) => (
    <Section style={{ backgroundColor: background, color: "#FFFFFF", padding: [40, 24] }}>
      <Heading level={1} style={{ fontSize: 30, textAlign: "center" }}>{title}</Heading>
    </Section>
  ),
});

const template = (
  <Email>
    <Hero title="New arrivals" />
    <Section>
      <Paragraph>The rest of the email goes on under it.</Paragraph>
    </Section>
    <Hero title="Last chance" background="#0F766E" />
  </Email>
);\`, Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
      <Hero title="New arrivals" />
      <Section style={{
    padding: 24
  }}>
        <Paragraph style={{
      fontSize: 15,
      color: MUTED
    }}>The rest of the email goes on under it.</Paragraph>
      </Section>
      <Hero title="Last chance" background="#0F766E" />
    </Root>)`,...u.parameters?.docs?.source},description:{story:'`placement: "section"` makes a custom component a band of its own: it goes where a `Section` goes, and renders one.',...u.parameters?.docs?.description}}};const ie=["CountdownTimer","ProductCards","WorkedOutFromProps","AWholeSection"];export{u as AWholeSection,p as CountdownTimer,d as ProductCards,m as WorkedOutFromProps,ie as __namedExportsOrder,le as default};
