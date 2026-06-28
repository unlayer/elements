import{j as x}from"./jsx-runtime-D0Ax_1V6.js";import{R as g}from"./iframe-DbtyXCV9.js";import{w as I,x as M,v as k,o as D,m as P,j as R,J as L,q as B,U as H,r as v,K as q}from"./create-component-D81WrlbS.js";const j=I,{popupPosition:pe,popupDisplayDelay:le,popupWidth:de,popupHeight:me,popupBackgroundColor:ue,popupBackgroundImage:ce,popupOverlay_backgroundColor:ye,popupCloseButton_position:fe,popupCloseButton_backgroundColor:we,popupCloseButton_iconColor:ge,popupCloseButton_borderRadius:Ce,popupCloseButton_margin:_e,popupCloseButton_action:he,...F}=j,W=F,O={...M},K={...k},Y=O,G=W;function J(r){if(r.length===0)return[];const t=r.reduce((o,n)=>o+n,0);return t<=0?[]:r.map(o=>{const n=Math.round(o/t*100*100)/100,a=`${n}`.replace(/\./g,"p");return{value:n,className:a}})}function Q(r,t,o=600,n=620){const a=J(r);if(t==="email"){const e=`@media only screen and (min-width: ${o+20}px)`,s=`@media only screen and (max-width: ${o+20}px)`;return`
${e} {
  .u-row { width: ${o}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:d,className:c})=>`  .u-row .u-col-${c} { width: ${Math.round(o*d/100)}px !important; }`).join(`
`)}
}

${s} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:d,className:c})=>`  .no-stack .u-col-${c} { width: ${d}% !important; }`).join(`
`)}
}`}const p=`
.u-row {
  display: flex;
  flex-wrap: nowrap;
  margin-left: 0;
  margin-right: 0;
}
.u-row .u-col {
  position: relative;
  width: 100%;
  padding-right: 0;
  padding-left: 0;
}`,l=a.map(({value:e,className:s})=>`.u-row .u-col.u-col-${s} { flex: 0 0 ${e}%; max-width: ${e}%; }`).join(`
`),u=`
@media only screen and (max-width: ${n}px) {
  .u-row { width: 100% !important; }
  .u-row .u-col {
    display: block !important;
    width: 100% !important;
    min-width: 320px !important;
    max-width: 100% !important;
  }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col {
    min-width: 0 !important;
    display: table-cell !important;
  }
${a.map(({value:e,className:s})=>`  .no-stack .u-col-${s} { width: ${e}% !important; }`).join(`
`)}
}`;return p+`
`+l+`
`+u}function z(r,t=500){return B(r?.contentWidth,t)}function X(r,t,o,n,a,p="rows"){const u=(L[n]||L.web)(r,t,o,{collection:p,variant:n}),e=z(o),s=Q(a,n,e);return s?`<style>${s}</style>${u}`:u}function Z(r,t,o,n,a,p){if(!r)return"";let l="";return g.Children.toArray(r).forEach((e,s)=>{if(!g.isValidElement(e)){(typeof e=="string"||typeof e=="number")&&(l+=String(e));return}const d=e.type;if((d?.displayName==="Column"||d?.name==="Column")&&typeof e.type=="function"){const m=e.type({...e.props,index:s,cells:t,bodyValues:o,rowValues:n,mode:a,_config:p});m?.props?.dangerouslySetInnerHTML?.__html&&(l+=m.props.dangerouslySetInnerHTML.__html)}else if(g.isValidElement(e)){const m=e.type?.displayName||e.type?.name||"Unknown";console.warn(`Row: <${m}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${m} /></Column></Row>`)}}),l}const A=r=>{const{layout:t,cells:o,children:n,mode:a,className:p,style:l,index:u=0,bodyValues:e={},collection:s="rows",_config:d,...c}=r,m=a??d?.mode??"web";let y;if(t)D(t,g.Children.count(n)),y=t.cells;else if(o)y=o;else{const w=g.Children.toArray(n).filter(h=>g.isValidElement(h)&&/^Column$/.test(h.type?.displayName||h.type?.name||"")).length;y=Array(Math.max(1,w)).fill(1)}const C={...G,...e},f=P(c,Y,"Row"),i={...f,cells:y,_meta:{htmlID:R(d,"u_row"),htmlClassNames:"u_row",...f._meta||{}}},S=Z(n,y,C,i,m,d);try{const w=X(S,i,C,m,y,s);return x.jsx("div",{dangerouslySetInnerHTML:{__html:w},className:p,style:l})}catch(w){return console.error("Row rendering failed:",w),x.jsx("div",{className:p,style:l,children:n})}};A.displayName="Row";A.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px 40px") or a number (px).'},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}}};const ee="10px",ne=K;function oe(r,t,o,n,a,p,l){return(q[l]||q.web)(r,t,o,n,a,p)}function te(r,t,o,n){return(v[n]||v.web)(r,t,o,{})}const U=r=>{const{children:t,index:o=0,cells:n=[1],bodyValues:a={},rowValues:p={},mode:l,className:u,style:e,_config:s,...d}=r,c=l??s?.mode??"web",m=P(d,ne,"Column"),y={...m,_meta:{htmlID:R(s,"u_column"),htmlClassNames:"u_column",...m._meta||{}}};let C="";if(t)try{g.Children.toArray(t).forEach((i,S)=>{if(typeof i=="string"||typeof i=="number")C+=String(i);else if(g.isValidElement(i)&&typeof i.type=="function"){const w=i.type,_=(w[H]||w)({...i.props,_config:s,colIndex:o,cells:n,bodyValues:a,rowValues:p,columnValues:y});if(_&&typeof _=="object"&&_.props&&_.props.dangerouslySetInnerHTML){const b=_.props.dangerouslySetInnerHTML.__html,N=i.type,$=(N?.displayName||N?.name||"component").toLowerCase(),E=i.props,T=E.containerPadding??E.values?.containerPadding??ee,V={containerPadding:typeof T=="number"?`${T}px`:T,_meta:{htmlID:R(s,`u_content_${$}`),htmlClassNames:`u_content_${$}`}};C+=te(b,V,a,c)}else if(_){const b=i.type?.displayName||i.type?.name||"Unknown";console.warn(`Column: <${b}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(f){console.error("Column: Failed to render children:",f),C=""}try{const f=oe(C,y,o,n,a,p,c);return x.jsx("div",{dangerouslySetInnerHTML:{__html:f},className:u,style:e})}catch(f){return console.error("Column rendering failed:",f),x.jsx("div",{className:u,style:e,children:t})}};U.displayName="Column";U.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 24px", "10px") or a number (px).'},borderRadius:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Corner radius — a number (→ px) or CSS string ("8px").'},border:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  [K in keyof NonNullable<ColumnValues["border"]>]?: K extends \`\${string}Width\`
    ? SizeInput
    : NonNullable<ColumnValues["border"]>[K];
}`,signature:{properties:[{key:{name:"NonNullable",elements:[{name:'ColumnValues["border"]',raw:'ColumnValues["border"]'}],raw:'NonNullable<ColumnValues["border"]>',required:!1},value:{name:"unknown"}}]}},description:"Per-side border object (great for hairline dividers). Width fields accept\n a number/px string; reuse it as a factored-out const without `as const`."},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}}};export{W as B,U as C,A as R};
