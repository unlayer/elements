import{j as b}from"./jsx-runtime-Dihhmoxy.js";import{R as C}from"./iframe-eEQ_RtDy.js";import{w as U,x as A,v as k,l as D,m as E,J as N,U as M,o as $,K as L}from"./create-component-BYYd9Nb5.js";const V=U,{popupPosition:ae,popupDisplayDelay:se,popupWidth:ie,popupHeight:pe,popupBackgroundColor:le,popupBackgroundImage:me,popupOverlay_backgroundColor:ue,popupCloseButton_position:de,popupCloseButton_backgroundColor:ce,popupCloseButton_iconColor:ye,popupCloseButton_borderRadius:fe,popupCloseButton_margin:we,popupCloseButton_action:ge,...I}=V,B=I,H={...A},j={...k},F=H,W=B;function O(r){if(r.length===0)return[];const t=r.reduce((e,n)=>e+n,0);return t<=0?[]:r.map(e=>{const n=Math.round(e/t*100*100)/100,a=`${n}`.replace(/\./g,"p");return{value:n,className:a}})}function K(r,t,e=600,n=620){const a=O(r);if(t==="email"){const o=`@media only screen and (min-width: ${e+20}px)`,s=`@media only screen and (max-width: ${e+20}px)`;return`
${o} {
  .u-row { width: ${e}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:u,className:c})=>`  .u-row .u-col-${c} { width: ${Math.round(e*u/100)}px !important; }`).join(`
`)}
}

${s} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:u,className:c})=>`  .no-stack .u-col-${c} { width: ${u}% !important; }`).join(`
`)}
}`}const l=`
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
`),m=`
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
${a.map(({value:o,className:s})=>`  .no-stack .u-col-${s} { width: ${o}% !important; }`).join(`
`)}
}`;return l+`
`+p+`
`+m}function Y(r,t=500){const e=r?.contentWidth;if(typeof e=="number"&&Number.isFinite(e))return e;if(typeof e=="string"){const n=parseInt(e,10);if(Number.isFinite(n))return n}return t}function G(r,t,e,n,a,l="rows"){const m=(N[n]||N.web)(r,t,e,{collection:l,variant:n}),o=Y(e),s=K(a,n,o);return s?`<style>${s}</style>${m}`:m}function J(r,t,e,n,a,l){if(!r)return"";let p="";return C.Children.toArray(r).forEach((o,s)=>{if(!C.isValidElement(o)){(typeof o=="string"||typeof o=="number")&&(p+=String(o));return}const u=o.type;if((u?.displayName==="Column"||u?.name==="Column")&&typeof o.type=="function"){const d=o.type({...o.props,index:s,cells:t,bodyValues:e,rowValues:n,mode:a,_config:l});d?.props?.dangerouslySetInnerHTML?.__html&&(p+=d.props.dangerouslySetInnerHTML.__html)}else if(C.isValidElement(o)){const d=o.type?.displayName||o.type?.name||"Unknown";console.warn(`Row: <${d}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${d} /></Column></Row>`)}}),p}const v=r=>{const{layout:t,cells:e,children:n,mode:a,className:l,style:p,index:m=0,bodyValues:o={},collection:s="rows",_config:u,...c}=r,d=a??u?.mode??"web";let w=e||[1];t&&(D(t,C.Children.count(n)),w=t.cells);const f={...W,...o},y=E(c,F,"Row"),i={...y,cells:w,_meta:{htmlID:`u_row_${m+1}`,htmlClassNames:"u_row",...y._meta||{}}},h=J(n,w,f,i,d,u);try{const g=G(h,i,f,d,w,s);return b.jsx("div",{dangerouslySetInnerHTML:{__html:g},className:l,style:p})}catch(g){return console.error("Row rendering failed:",g),b.jsx("div",{className:l,style:p,children:n})}};v.displayName="Row";v.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px 40px") or a number (px).'},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}}};const Q="10px",z=j;function X(r,t,e,n,a,l,p){return(L[p]||L.web)(r,t,e,n,a,l)}function Z(r,t,e,n){return($[n]||$.web)(r,t,e,{})}const q=r=>{const{children:t,index:e=0,cells:n=[1],bodyValues:a={},rowValues:l={},mode:p,className:m,style:o,_config:s,...u}=r,c=p??s?.mode??"web",d=E(u,z,"Column"),w={...d,_meta:{htmlID:`u_column_${e+1}`,htmlClassNames:"u_column",...d._meta||{}}};let f="";if(t)try{C.Children.toArray(t).forEach((i,h)=>{if(typeof i=="string"||typeof i=="number")f+=String(i);else if(C.isValidElement(i)&&typeof i.type=="function"){const g=i.type,_=(g[M]||g)({...i.props,_config:s});if(_&&typeof _=="object"&&_.props&&_.props.dangerouslySetInnerHTML){const x=_.props.dangerouslySetInnerHTML.__html,T=i.type,R=(T?.displayName||T?.name||"component").toLowerCase(),S=i.props,P={containerPadding:S.containerPadding??S.values?.containerPadding??Q,_meta:{htmlID:`u_content_${R}_${h+1}`,htmlClassNames:`u_content_${R}`}};f+=Z(x,P,a,c)}else if(_){const x=i.type?.displayName||i.type?.name||"Unknown";console.warn(`Column: <${x}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(y){console.error("Column: Failed to render children:",y),f=""}try{const y=X(f,w,e,n,a,l,c);return b.jsx("div",{dangerouslySetInnerHTML:{__html:y},className:m,style:o})}catch(y){return console.error("Column rendering failed:",y),b.jsx("div",{className:m,style:o,children:t})}};q.displayName="Column";q.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 24px", "10px") or a number (px).'},borderRadius:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Corner radius — a number (→ px) or CSS string ("8px").'},border:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  [K in keyof NonNullable<ColumnValues["border"]>]?: K extends \`\${string}Width\`
    ? SizeInput
    : NonNullable<ColumnValues["border"]>[K];
}`,signature:{properties:[{key:{name:"NonNullable",elements:[{name:'ColumnValues["border"]',raw:'ColumnValues["border"]'}],raw:'NonNullable<ColumnValues["border"]>',required:!1},value:{name:"unknown"}}]}},description:"Per-side border object (great for hairline dividers). Width fields accept\n a number/px string; reuse it as a factored-out const without `as const`."},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}}};export{B,q as C,v as R};
