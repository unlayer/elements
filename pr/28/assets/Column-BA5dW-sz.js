import{j as h}from"./jsx-runtime-7XW1Bamv.js";import{R as C}from"./iframe-C9_knxBk.js";import{w as q,x as A,v as D,l as M,m as E,J as $,U as B,o as L,K as N}from"./create-component-BiMLqGDD.js";const I=q,{popupPosition:ae,popupDisplayDelay:se,popupWidth:ie,popupHeight:pe,popupBackgroundColor:le,popupBackgroundImage:me,popupOverlay_backgroundColor:ce,popupCloseButton_position:de,popupCloseButton_backgroundColor:ue,popupCloseButton_iconColor:ye,popupCloseButton_borderRadius:fe,popupCloseButton_margin:we,popupCloseButton_action:_e,...H}=I,k=H,V={...A},F={...D},j=V,O=k;function W(r){if(r.length===0)return[];const t=r.reduce((e,n)=>e+n,0);return t<=0?[]:r.map(e=>{const n=Math.round(e/t*100*100)/100,a=`${n}`.replace(/\./g,"p");return{value:n,className:a}})}function Y(r,t,e=600,n=620){const a=W(r);if(t==="email"){const o=`@media only screen and (min-width: ${e+20}px)`,s=`@media only screen and (max-width: ${e+20}px)`;return`
${o} {
  .u-row { width: ${e}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:c,className:u})=>`  .u-row .u-col-${u} { width: ${Math.round(e*c/100)}px !important; }`).join(`
`)}
}

${s} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:c,className:u})=>`  .no-stack .u-col-${u} { width: ${c}% !important; }`).join(`
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
`+m}function K(r,t=500){const e=r?.contentWidth;if(typeof e=="number"&&Number.isFinite(e))return e;if(typeof e=="string"){const n=parseInt(e,10);if(Number.isFinite(n))return n}return t}function G(r,t,e,n,a,l="rows"){const m=($[n]||$.web)(r,t,e,{collection:l,variant:n}),o=K(e),s=Y(a,n,o);return s?`<style>${s}</style>${m}`:m}function J(r,t,e,n,a,l){if(!r)return"";let p="";return C.Children.toArray(r).forEach((o,s)=>{if(!C.isValidElement(o)){(typeof o=="string"||typeof o=="number")&&(p+=String(o));return}const c=o.type;if((c?.displayName==="Column"||c?.name==="Column")&&typeof o.type=="function"){const d=o.type({...o.props,index:s,cells:t,bodyValues:e,rowValues:n,mode:a,_config:l});d?.props?.dangerouslySetInnerHTML?.__html&&(p+=d.props.dangerouslySetInnerHTML.__html)}else if(C.isValidElement(o)){const d=o.type?.displayName||o.type?.name||"Unknown";console.warn(`Row: <${d}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${d} /></Column></Row>`)}}),p}const v=r=>{const{layout:t,cells:e,children:n,mode:a,className:l,style:p,index:m=0,bodyValues:o={},collection:s="rows",_config:c,...u}=r,d=a??c?.mode??"web";let w=e||[1];t&&(M(t,C.Children.count(n)),w=t.cells);const f={...O,...o},y=E(u,j,"Row"),i={...y,cells:w,_meta:{htmlID:`u_row_${m+1}`,htmlClassNames:"u_row",...y._meta||{}}},x=J(n,w,f,i,d,c);try{const _=G(x,i,f,d,w,s);return h.jsx("div",{dangerouslySetInnerHTML:{__html:_},className:l,style:p})}catch(_){return console.error("Row rendering failed:",_),h.jsx("div",{className:l,style:p,children:n})}};v.displayName="Row";v.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 48px", "20px 40px") or a number (px).'},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}}};const Q="10px",z=F;function X(r,t,e,n,a,l,p){return(N[p]||N.web)(r,t,e,n,a,l)}function Z(r,t,e,n){return(L[n]||L.web)(r,t,e,{})}const P=r=>{const{children:t,index:e=0,cells:n=[1],bodyValues:a={},rowValues:l={},mode:p,className:m,style:o,_config:s,...c}=r,u=p??s?.mode??"web",d=E(c,z,"Column"),w={...d,_meta:{htmlID:`u_column_${e+1}`,htmlClassNames:"u_column",...d._meta||{}}};let f="";if(t)try{C.Children.toArray(t).forEach((i,x)=>{if(typeof i=="string"||typeof i=="number")f+=String(i);else if(C.isValidElement(i)&&typeof i.type=="function"){const _=i.type,g=(_[B]||_)({...i.props,_config:s});if(g&&typeof g=="object"&&g.props&&g.props.dangerouslySetInnerHTML){const T=g.props.dangerouslySetInnerHTML.__html,b=i.type,R=(b?.displayName||b?.name||"component").toLowerCase(),S=i.props,U={containerPadding:S.containerPadding??S.values?.containerPadding??Q,_meta:{htmlID:`u_content_${R}_${x+1}`,htmlClassNames:`u_content_${R}`}};f+=Z(T,U,a,u)}else if(g){const T=i.type?.displayName||i.type?.name||"Unknown";console.warn(`Column: <${T}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(y){console.error("Column: Failed to render children:",y),f=""}try{const y=X(f,w,e,n,a,l,u);return h.jsx("div",{dangerouslySetInnerHTML:{__html:y},className:m,style:o})}catch(y){return console.error("Column rendering failed:",y),h.jsx("div",{className:m,style:o,children:t})}};P.displayName="Column";P.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},padding:{required:!1,tsType:{name:"union",raw:"number | (string & {})",elements:[{name:"number"},{name:"unknown"}]},description:'Padding — a CSS string ("0 24px", "10px") or a number (px).'},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}}};export{k as B,P as C,v as R};
