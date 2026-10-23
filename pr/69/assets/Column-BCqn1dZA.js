import{j as Y}from"./jsx-runtime-BqD__LlO.js";import{R as w}from"./iframe-DmKvf261.js";import{T as cn,V as ln,W as mn,z as G,X as D,g as M,G as dn,R as E,w as K,y as Q,b as z,Y as J,d as un,Z as X,N as A,Q as Z,$ as q,a0 as W,a1 as pn,f as fn,U as wn,p as yn,e as hn,a2 as _n,s as gn,a3 as j,a4 as F}from"./create-component-CyxHZdmH.js";const xn=Object.fromEntries(Object.entries(ln).filter(([n])=>!n.startsWith("popup"))),Cn={...mn},En={...cn},T=Symbol.for("@unlayer/react-elements/tailwind"),Pn=Symbol.for("@unlayer/react-elements/tailwind-loader"),Tn=n=>!!n?.[T];function Vn(n,t,e,o){const r=dn(),s=D();return M(()=>n[T](n,t,e,o,r,s))}function Wn(n,t){const e=D();M(()=>n[T].prepare?.({scope:n,records:t,compiled:e}))}function nn(n){const t=Array.isArray(n)?n.filter(o=>o!=null&&typeof o!="boolean"):[n],e=t.length===1&&w.isValidElement(t[0])?t[0]:void 0;if(e)return e.type?.[T]?e:typeof e.type=="string"?void 0:nn(e.props.children)}function jn(n,t){const e=n.className?nn(n.children):void 0;if(!e)return n;const{children:o,mode:r,config:s,...c}=n,l=G(e.props,()=>new Map),m=D();return l.has(n.className)||l.set(n.className,M(()=>e.type[T](e.props,t,void 0,c,void 0,m))),{...n,...l.get(n.className),className:void 0}}const $n={},en=()=>G($n,()=>new WeakMap);function tn(n,t,e,o){try{return o()}catch(r){if(r instanceof E||Tn(r))throw r;const s=new E(`${n} failed to render: ${String(r?.message??r)}`,n,K(t)??e,r);throw t&&en().set(s,t),s}}const Fn=n=>n instanceof E?en().get(n):void 0,B=Cn,Nn=xn;function vn(n){if(n.length===0)return[];const t=n.reduce((e,o)=>e+o,0);return t<=0?[]:n.map(e=>{const o=Math.round(e/t*100*100)/100,r=`${o}`.replace(/\./g,"p");return{value:o,className:r}})}function bn(n,t,e=600,o=480){const r=vn(n);if(t==="email"){const m=`@media only screen and (min-width: ${e+20}px)`,a=`@media only screen and (max-width: ${e+20}px)`;return`
${m} {
  .u-row { width: ${e}px !important; }
  .u-row .u-col { vertical-align: top; }
${r.map(({value:d,className:f})=>`  .u-row .u-col-${f} { width: ${Math.round(e*d/100)}px !important; }`).join(`
`)}
}

${a} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .u-row.no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${r.map(({value:d,className:f})=>`  .u-row.no-stack .u-col-${f} { width: ${d}% !important; }`).join(`
`)}
}`}const s=`
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
}`,c=r.map(({value:m,className:a})=>`.u-row .u-col.u-col-${a} { flex: 0 0 ${m}%; max-width: ${m}%; }`).join(`
`),l=t==="document"?"":`
@media (max-width: ${o}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return s+`
`+c+`
`+l}function In(n,t=500){return pn(n?.contentWidth,t)}function Rn(n,t,e,o,r,s="rows"){const l=(W[o]||W.web)(n,t,e,{collection:s,variant:o}),m=In(e),a=bn(r,o,m);return a?`<style>${a}</style>${l}`:l}function Ln(n,t,e,o,r,s){if(!n)return"";let c="";const l=w.Children.toArray(n);let m=0;return l.forEach(a=>{if(!w.isValidElement(a)){(typeof a=="string"||typeof a=="number")&&(c+=q(a,"Row"));return}const d=a.type;if((d?.displayName==="Column"||d?.name==="Column")&&typeof a.type=="function"){const p=a.type({...a.props,index:m++,cells:t,bodyValues:e,rowValues:o,mode:r,_config:s});p?.props?.dangerouslySetInnerHTML?.__html&&(c+=p.props.dangerouslySetInnerHTML.__html)}else if(w.isValidElement(a)){const p=a.type?.displayName||a.type?.name||"Unknown";console.warn(`Row: <${p}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${p} /></Column></Row>`)}}),c}function Sn(n){const{layout:t,cells:e,children:o,mode:r,className:s,style:c,index:l=0,bodyValues:m={},collection:a="rows",_config:d,_record:f,...p}=n,g=r??d?.mode??"web",$=w.Children.toArray(o).filter(h=>w.isValidElement(h)&&/^Column$/.test(h.type?.displayName||h.type?.name||"")).length,y=t?.cells??e??Array(Math.max(1,$)).fill(1),N={...Nn,...m},i=z(p,B,"Row");J(f,i.backgroundImage?{...i}:i),un(i,B.backgroundImage);const u={...i,cells:y,_meta:X({htmlID:A(d,"u_row"),htmlClassNames:"u_row",...i._meta||{}})},x=Ln(o,y,N,u,g,d),b=Z(Rn(x,u,N,g,y,a),/<div[^>]*class="u-row[ "][^>]*>/,c,s,p);return Y.jsx("div",{dangerouslySetInnerHTML:{__html:b}})}const on=n=>tn("Row",n._record,"Row",()=>Sn(n));on.displayName="Row";on[Q]=!0;const An=En;function Dn(n,t,e,o,r,s,c){return(F[c]||F.web)(n,t,e,o,r,s)}function Mn(n,t,e,o){return(j[o]||j.web)(n,t,e,{})}const rn=n=>tn("Column",n._record,`Column ${(n.index??0)+1}`,()=>Hn(n));function Hn(n){const{children:t,index:e=0,cells:o=[1],bodyValues:r={},rowValues:s={},mode:c,className:l,style:m,_config:a,_record:d,...f}=n,p=c??a?.mode??"web",g=z(f,An,"Column");J(d,g);const $={...g,_meta:X({htmlID:A(a,"u_column"),htmlClassNames:"u_column",...g._meta||{}})};let y="";for(const i of w.Children.toArray(t)){if(typeof i=="string"||typeof i=="number"){y+=q(i,"Column");continue}if(!w.isValidElement(i)||typeof i.type!="function"||fn(i.props._record))continue;const u=i.type,x=u[wn],b=u[yn]||u,h=x?.metaName??(u.displayName||u.name||"component").toLowerCase(),H=A(a,`u_content_${h}`);let I;try{I=b({...i.props,_config:a,_metaHtmlId:H,colIndex:e,cells:o,bodyValues:r,rowValues:s,columnValues:$})}catch(C){const P=a?.__ids;P&&P[`u_content_${h}`]--;const V=i.props._record,S=x?.name??(u.displayName||u.name||"Block");hn(C instanceof E?C:new E(`${S} failed to render: ${String(C?.message??C)}`,S,K(V)??`Column ${e+1} › ${S}`,C),V);continue}const k=I?.props?.dangerouslySetInnerHTML;if(!k){I&&console.warn(`Column: <${u.displayName||u.name||"Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);continue}const O=k.__html;if(!O&&x?.omitEmptyOutput)continue;const _=i.props,R=_.containerPadding??_.values?.containerPadding??_n,an=typeof R=="number"?`${R}px`:R,v=x?.contentType==="custom"?{}:_,L=_.values?._override,sn={containerPadding:an,_override:{...L,mobile:{...L?.mobile,...v.hideOnMobile!==void 0?{hideMobile:v.hideOnMobile}:{}},desktop:{...L?.desktop,...v.hideOnDesktop!==void 0?{hideDesktop:v.hideOnDesktop}:{}}},_meta:{htmlID:H,htmlClassNames:`u_content_${h}`,..._.values?._meta?.htmlID?{htmlID:gn(_.values._meta.htmlID)}:{}}},U=Mn(O,sn,r,p);y+=_.skipInText?U.replace(/<[a-z]+/,'$& data-skip-in-text="true"'):U}const N=Z(Dn(y,$,e,o,r,s,p),/<div[^>]*class="u-col[ "][^>]*>/,m,l,f);return Y.jsx("div",{dangerouslySetInnerHTML:{__html:N}})}rn.displayName="Column";rn[Q]=!0;export{xn as B,rn as C,on as R,T,Cn as a,En as b,Pn as c,Fn as d,Vn as e,Tn as i,Wn as p,jn as r};
