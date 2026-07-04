import{j as h}from"./jsx-runtime-CVaIbG5g.js";import{R as g}from"./iframe-3RHH_bR_.js";import{w as I,x as M,v as D,o as k,m as P,j as R,J as $,q as B,U as H,r as q,K as v}from"./create-component-CXhWhFJO.js";const j=I,{popupPosition:pe,popupDisplayDelay:le,popupWidth:de,popupHeight:me,popupBackgroundColor:ue,popupBackgroundImage:ce,popupOverlay_backgroundColor:ye,popupCloseButton_position:fe,popupCloseButton_backgroundColor:we,popupCloseButton_iconColor:ge,popupCloseButton_borderRadius:Ce,popupCloseButton_margin:_e,popupCloseButton_action:xe,...F}=j,W=F,O={...M},K={...D},Y=O,G=W;function J(r){if(r.length===0)return[];const n=r.reduce((o,e)=>o+e,0);return n<=0?[]:r.map(o=>{const e=Math.round(o/n*100*100)/100,a=`${e}`.replace(/\./g,"p");return{value:e,className:a}})}function Q(r,n,o=600,e=480){const a=J(r);if(n==="email"){const t=`@media only screen and (min-width: ${o+20}px)`,s=`@media only screen and (max-width: ${o+20}px)`;return`
${t} {
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
}`,l=a.map(({value:t,className:s})=>`.u-row .u-col.u-col-${s} { flex: 0 0 ${t}%; max-width: ${t}%; }`).join(`
`),u=n==="document"?"":`
@media (max-width: ${e}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return p+`
`+l+`
`+u}function z(r,n=500){return B(r?.contentWidth,n)}function X(r,n,o,e,a,p="rows"){const u=($[e]||$.web)(r,n,o,{collection:p,variant:e}),t=z(o),s=Q(a,e,t);return s?`<style>${s}</style>${u}`:u}function Z(r,n,o,e,a,p){if(!r)return"";let l="";return g.Children.toArray(r).forEach((t,s)=>{if(!g.isValidElement(t)){(typeof t=="string"||typeof t=="number")&&(l+=String(t));return}const d=t.type;if((d?.displayName==="Column"||d?.name==="Column")&&typeof t.type=="function"){const m=t.type({...t.props,index:s,cells:n,bodyValues:o,rowValues:e,mode:a,_config:p});m?.props?.dangerouslySetInnerHTML?.__html&&(l+=m.props.dangerouslySetInnerHTML.__html)}else if(g.isValidElement(t)){const m=t.type?.displayName||t.type?.name||"Unknown";console.warn(`Row: <${m}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${m} /></Column></Row>`)}}),l}const A=r=>{const{layout:n,cells:o,children:e,mode:a,className:p,style:l,index:u=0,bodyValues:t={},collection:s="rows",_config:d,...c}=r,m=a??d?.mode??"web";let y;if(n)k(n,g.Children.count(e)),y=n.cells;else if(o)y=o;else{const w=g.Children.toArray(e).filter(x=>g.isValidElement(x)&&/^Column$/.test(x.type?.displayName||x.type?.name||"")).length;y=Array(Math.max(1,w)).fill(1)}const C={...G,...t},f=P(c,Y,"Row"),i={...f,cells:y,_meta:{htmlID:R(d,"u_row"),htmlClassNames:"u_row",...f._meta||{}}},S=Z(e,y,C,i,m,d);try{const w=X(S,i,C,m,y,s);return h.jsx("div",{dangerouslySetInnerHTML:{__html:w},className:p,style:l})}catch(w){return console.error("Row rendering failed:",w),h.jsx("div",{className:p,style:l,children:e})}};A.displayName="Row";A.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px 40px") or a number (px).'},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}}};const ee="10px",ne=K;function oe(r,n,o,e,a,p,l){return(v[l]||v.web)(r,n,o,e,a,p)}function te(r,n,o,e){return(q[e]||q.web)(r,n,o,{})}const U=r=>{const{children:n,index:o=0,cells:e=[1],bodyValues:a={},rowValues:p={},mode:l,className:u,style:t,_config:s,...d}=r,c=l??s?.mode??"web",m=P(d,ne,"Column"),y={...m,_meta:{htmlID:R(s,"u_column"),htmlClassNames:"u_column",...m._meta||{}}};let C="";if(n)try{g.Children.toArray(n).forEach((i,S)=>{if(typeof i=="string"||typeof i=="number")C+=String(i);else if(g.isValidElement(i)&&typeof i.type=="function"){const w=i.type,_=(w[H]||w)({...i.props,_config:s,colIndex:o,cells:e,bodyValues:a,rowValues:p,columnValues:y});if(_&&typeof _=="object"&&_.props&&_.props.dangerouslySetInnerHTML){const b=_.props.dangerouslySetInnerHTML.__html,N=i.type,E=(N?.displayName||N?.name||"component").toLowerCase(),L=i.props,T=L.containerPadding??L.values?.containerPadding??ee,V={containerPadding:typeof T=="number"?`${T}px`:T,_meta:{htmlID:R(s,`u_content_${E}`),htmlClassNames:`u_content_${E}`}};C+=te(b,V,a,c)}else if(_){const b=i.type?.displayName||i.type?.name||"Unknown";console.warn(`Column: <${b}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(f){console.error("Column: Failed to render children:",f),C=""}try{const f=oe(C,y,o,e,a,p,c);return h.jsx("div",{dangerouslySetInnerHTML:{__html:f},className:u,style:t})}catch(f){return console.error("Column rendering failed:",f),h.jsx("div",{className:u,style:t,children:n})}};U.displayName="Column";U.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 24px", "10px") or a number (px).'},borderRadius:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Corner radius — a number (→ px) or CSS string ("8px").'},border:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  [K in keyof NonNullable<ColumnValues["border"]>]?: K extends \`\${string}Width\`
    ? SizeInput
    : NonNullable<ColumnValues["border"]>[K];
}`,signature:{properties:[{key:{name:"NonNullable",elements:[{name:'ColumnValues["border"]',raw:'ColumnValues["border"]'}],raw:'NonNullable<ColumnValues["border"]>',required:!1},value:{name:"unknown"}}]}},description:"Per-side border object (great for hairline dividers). Width fields accept\n a number/px string; reuse it as a factored-out const without `as const`."},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}}};export{W as B,U as C,A as R};
