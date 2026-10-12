import{j as b}from"./jsx-runtime-BD5twxbH.js";import{R as g}from"./iframe-BHQHUxHe.js";import{T as V,S as M,A as D,q as k,m as v,l as S,J as $,r as B,w as j,U as A,y as q,K as P}from"./create-component-DJtlfo84.js";const F=V,{popupPosition:le,popupDisplayDelay:me,popupWidth:de,popupHeight:ue,popupBackgroundColor:ce,popupBackgroundImage:ye,popupOverlay_backgroundColor:fe,popupCloseButton_position:we,popupCloseButton_backgroundColor:ge,popupCloseButton_iconColor:Ce,popupCloseButton_borderRadius:_e,popupCloseButton_margin:xe,popupCloseButton_action:he,...O}=F,W=O,K={...M},Y={...D},G=K,J=W;function Q(r){if(r.length===0)return[];const n=r.reduce((t,e)=>t+e,0);return n<=0?[]:r.map(t=>{const e=Math.round(t/n*100*100)/100,a=`${e}`.replace(/\./g,"p");return{value:e,className:a}})}function z(r,n,t=600,e=480){const a=Q(r);if(n==="email"){const o=`@media only screen and (min-width: ${t+20}px)`,s=`@media only screen and (max-width: ${t+20}px)`;return`
${o} {
  .u-row { width: ${t}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:m,className:y})=>`  .u-row .u-col-${y} { width: ${Math.round(t*m/100)}px !important; }`).join(`
`)}
}

${s} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:m,className:y})=>`  .no-stack .u-col-${y} { width: ${m}% !important; }`).join(`
`)}
}`}const i=`
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
}`,p=a.map(({value:o,className:s})=>`.u-row .u-col.u-col-${s} { flex: 0 0 ${o}%; max-width: ${o}%; }`).join(`
`),c=n==="document"?"":`
@media (max-width: ${e}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return i+`
`+p+`
`+c}function X(r,n=500){return B(r?.contentWidth,n)}function Z(r,n,t,e,a,i="rows"){const c=($[e]||$.web)(r,n,t,{collection:i,variant:e}),o=X(t),s=z(a,e,o);return s?`<style>${s}</style>${c}`:c}function ee(r,n,t,e,a,i){if(!r)return"";let p="";return g.Children.toArray(r).forEach((o,s)=>{if(!g.isValidElement(o)){(typeof o=="string"||typeof o=="number")&&(p+=String(o));return}const m=o.type;if((m?.displayName==="Column"||m?.name==="Column")&&typeof o.type=="function"){const u=o.type({...o.props,index:s,cells:n,bodyValues:t,rowValues:e,mode:a,_config:i});u?.props?.dangerouslySetInnerHTML?.__html&&(p+=u.props.dangerouslySetInnerHTML.__html)}else if(g.isValidElement(o)){const u=o.type?.displayName||o.type?.name||"Unknown";console.warn(`Row: <${u}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${u} /></Column></Row>`)}}),p}const U=r=>{const{layout:n,cells:t,children:e,mode:a,className:i,style:p,index:c=0,bodyValues:o={},collection:s="rows",_config:m,...y}=r,u=a??m?.mode??"web";let f;if(n)k(n,g.Children.count(e)),f=n.cells;else if(t)f=t;else{const d=g.Children.toArray(e).filter(x=>g.isValidElement(x)&&/^Column$/.test(x.type?.displayName||x.type?.name||"")).length;f=Array(Math.max(1,d)).fill(1)}const C={...J,...o},w=v(y,G,"Row"),l={...w,cells:f,_meta:{htmlID:S(m,"u_row"),htmlClassNames:"u_row",...w._meta||{}}},N=ee(e,f,C,l,u,m);try{const d=Z(N,l,C,u,f,s);return b.jsx("div",{dangerouslySetInnerHTML:{__html:d},className:i,style:p})}catch(d){return console.error("Row rendering failed:",d),b.jsx("div",{className:i,style:p,children:e})}};U.displayName="Row";U.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px 40px") or a number (px).'},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}}};const ne="10px",te=Y;function oe(r,n,t,e,a,i,p){return(P[p]||P.web)(r,n,t,e,a,i)}function re(r,n,t,e){return(q[e]||q.web)(r,n,t,{})}const I=r=>{const{children:n,index:t=0,cells:e=[1],bodyValues:a={},rowValues:i={},mode:p,className:c,style:o,_config:s,...m}=r,y=p??s?.mode??"web",u=v(m,te,"Column"),f={...u,_meta:{htmlID:S(s,"u_column"),htmlClassNames:"u_column",...u._meta||{}}};let C="";if(n)try{g.Children.toArray(n).forEach((l,N)=>{if(typeof l=="string"||typeof l=="number")C+=String(l);else if(g.isValidElement(l)&&typeof l.type=="function"){const d=l.type,x=d[j]||d,R=d?.[A]?.metaName??(d?.displayName||d?.name||"component").toLowerCase(),E=S(s,`u_content_${R}`),_=x({...l.props,_config:s,_metaHtmlId:E,colIndex:t,cells:e,bodyValues:a,rowValues:i,columnValues:f});if(_&&typeof _=="object"&&_.props&&_.props.dangerouslySetInnerHTML){const h=_.props.dangerouslySetInnerHTML.__html;if(!h&&d?.[A]?.omitEmptyOutput)return;const L=l.props,T=L.containerPadding??L.values?.containerPadding??ne,H={containerPadding:typeof T=="number"?`${T}px`:T,_meta:{htmlID:E,htmlClassNames:`u_content_${R}`}};C+=re(h,H,a,y)}else if(_){const h=l.type?.displayName||l.type?.name||"Unknown";console.warn(`Column: <${h}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(w){console.error("Column: Failed to render children:",w),C=""}try{const w=oe(C,f,t,e,a,i,y);return b.jsx("div",{dangerouslySetInnerHTML:{__html:w},className:c,style:o})}catch(w){return console.error("Column rendering failed:",w),b.jsx("div",{className:c,style:o,children:n})}};I.displayName="Column";I.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 24px", "10px") or a number (px).'},borderRadius:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Corner radius — a number (→ px) or CSS string ("8px").'},border:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  [K in keyof NonNullable<ColumnValues["border"]>]?: K extends \`\${string}Width\`
    ? SizeInput
    : NonNullable<ColumnValues["border"]>[K];
}`,signature:{properties:[{key:{name:"NonNullable",elements:[{name:'ColumnValues["border"]',raw:'ColumnValues["border"]'}],raw:'NonNullable<ColumnValues["border"]>',required:!1},value:{name:"unknown"}}]}},description:"Per-side border object (great for hairline dividers). Width fields accept\n a number/px string; reuse it as a factored-out const without `as const`."},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}}};export{W as B,I as C,U as R,K as a,Y as b};
