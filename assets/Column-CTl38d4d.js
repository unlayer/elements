import{j as h}from"./jsx-runtime-CzIGWkPA.js";import{R as C}from"./iframe-C3uaC-jS.js";import{O as q,F as P,B as A,v as B,m as v,J as $,U as M,Z as b}from"./create-component-D1HwNzNo.js";const D=q,{popupPosition:ee,popupDisplayDelay:oe,popupWidth:ne,popupHeight:te,popupBackgroundColor:re,popupBackgroundImage:ae,popupOverlay_backgroundColor:se,popupCloseButton_position:ie,popupCloseButton_backgroundColor:pe,popupCloseButton_iconColor:le,popupCloseButton_borderRadius:me,popupCloseButton_margin:ce,popupCloseButton_action:de,...H}=D,V=H,k={...A},I={...P},j=k,F=V;function O(r){if(r.length===0)return[];const t=r.reduce((n,o)=>n+o,0);return t<=0?[]:r.map(n=>{const o=Math.round(n/t*100*100)/100,a=`${o}`.replace(/\./g,"p");return{value:o,className:a}})}function W(r,t,n=600,o=620){const a=O(r);if(t==="email"){const e=`@media only screen and (min-width: ${n+20}px)`,l=`@media only screen and (max-width: ${n+20}px)`;return`
${e} {
  .u-row { width: ${n}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:c,className:y})=>`  .u-row .u-col-${y} { width: ${Math.round(n*c/100)}px !important; }`).join(`
`)}
}

${l} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:c,className:y})=>`  .no-stack .u-col-${y} { width: ${c}% !important; }`).join(`
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
}`,i=a.map(({value:e,className:l})=>`.u-row .u-col.u-col-${l} { flex: 0 0 ${e}%; max-width: ${e}%; }`).join(`
`),m=`
@media only screen and (max-width: ${o}px) {
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
${a.map(({value:e,className:l})=>`  .no-stack .u-col-${l} { width: ${e}% !important; }`).join(`
`)}
}`;return p+`
`+i+`
`+m}function Y(r,t,n,o,a,p="rows"){const m=($[o]||$.web)(r,t,n,{collection:p,variant:o}),e=W(a,o);return e?`<style>${e}</style>${m}`:m}function J(r,t,n,o,a,p){if(!r)return"";let i="";return C.Children.toArray(r).forEach((e,l)=>{if(!C.isValidElement(e)){(typeof e=="string"||typeof e=="number")&&(i+=String(e));return}const c=e.type;if((c?.displayName==="Column"||c?.name==="Column")&&typeof e.type=="function"){const d=e.type({...e.props,index:l,cells:t,bodyValues:n,rowValues:o,mode:a,_config:p});d?.props?.dangerouslySetInnerHTML?.__html&&(i+=d.props.dangerouslySetInnerHTML.__html)}else if(C.isValidElement(e)){const d=e.type?.displayName||e.type?.name||"Unknown";console.warn(`Row: <${d}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${d} /></Column></Row>`)}}),i}const E=r=>{const{layout:t,cells:n,children:o,mode:a,className:p,style:i,index:m=0,bodyValues:e={},collection:l="rows",_config:c,...y}=r,d=a??c?.mode??"web";let w=n||[1];t&&(B(t,C.Children.count(o)),w=t.cells);const f={...F,...e},u=v(y,j,"Row"),s={...u,cells:w,_meta:{htmlID:`u_row_${m+1}`,htmlClassNames:"u_row",...u._meta||{}}},T=J(o,w,f,s,d,c);try{const _=Y(T,s,f,d,w,l);return h.jsx("div",{dangerouslySetInnerHTML:{__html:_},className:p,style:i})}catch(_){return console.error("Row rendering failed:",_),h.jsx("div",{className:p,style:i,children:o})}};E.displayName="Row";E.__docgenInfo={description:"",methods:[],displayName:"Row",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},layout:{required:!1,tsType:{name:"ColumnLayout"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},index:{required:!1,tsType:{name:"number"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},collection:{required:!1,tsType:{name:"string"},description:""},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body"}},composes:["SemanticProps"]};const L=I;function Q(r,t,n,o,a,p,i){return(b[i]||b.web)(r,t,n,o,a,p)}const N=r=>{const{children:t,index:n=0,cells:o=[1],bodyValues:a={},rowValues:p={},mode:i,className:m,style:e,_config:l,...c}=r,y=i??l?.mode??"web",d=v(c,L,"Column"),w={...d,_meta:{htmlID:`u_column_${n+1}`,htmlClassNames:"u_column",...d._meta||{}}};let f="";if(t)try{C.Children.toArray(t).forEach((s,T)=>{if(typeof s=="string"||typeof s=="number")f+=String(s);else if(C.isValidElement(s)&&typeof s.type=="function"){const _=s.type,g=(_[M]||_)({...s.props,_config:l});if(g&&typeof g=="object"&&g.props&&g.props.dangerouslySetInnerHTML){const x=g.props.dangerouslySetInnerHTML.__html,R=s.type,S=R?.displayName||R?.name||"component",U=s.props.values?.containerPadding||L.padding||"10px";f+=`<div id="u_content_${S.toLowerCase()}_${T+1}" class="u_content_${S.toLowerCase()}" style="padding: ${U};">${x}</div>`}else if(g){const x=s.type?.displayName||s.type?.name||"Unknown";console.warn(`Column: <${x}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`)}}})}catch(u){console.error("Column: Failed to render children:",u),f=""}try{const u=Q(f,w,n,o,a,p,y);return h.jsx("div",{dangerouslySetInnerHTML:{__html:u},className:m,style:e})}catch(u){return console.error("Column rendering failed:",u),h.jsx("div",{className:m,style:e,children:t})}};N.displayName="Column";N.__docgenInfo={description:"",methods:[],displayName:"Column",props:{children:{required:!1,tsType:{name:"ReactReactNode",raw:"React.ReactNode"},description:""},index:{required:!1,tsType:{name:"number"},description:""},cells:{required:!1,tsType:{name:"Array",elements:[{name:"number"}],raw:"number[]"},description:""},bodyValues:{required:!1,tsType:{name:"any"},description:""},rowValues:{required:!1,tsType:{name:"any"},description:""},mode:{required:!1,tsType:{name:"RenderMode"},description:""},className:{required:!1,tsType:{name:"string"},description:""},style:{required:!1,tsType:{name:"ReactCSSProperties",raw:"React.CSSProperties"},description:""},_config:{required:!1,tsType:{name:"UnlayerConfig"},description:"@internal - Unlayer config threaded from UnlayerProvider via Body/Row"}},composes:["SemanticProps"]};export{V as B,N as C,E as R};
