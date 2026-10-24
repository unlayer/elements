import{j as G}from"./jsx-runtime-BHQlVzQQ.js";import{R as w}from"./iframe-Bf4iAsVq.js";import{a7 as ln,a8 as mn,a9 as dn,M as A,g as M,aa as H,Y as un,R as E,w as Q,D as z,b as J,ab as q,d as pn,ac as X,a4 as D,ad as fn,a5 as Z,ae as nn,af as F,ag as wn,f as hn,U as yn,p as _n,e as gn,ah as xn,s as Cn,ai as B,aj as Y}from"./create-component-C2cFSXic.js";const En=Object.fromEntries(Object.entries(mn).filter(([n])=>!n.startsWith("popup"))),Tn={...dn},Nn={...ln},T=Symbol.for("@unlayer/react-elements/tailwind"),$n={},k=()=>A($n,()=>({})),Wn=Symbol.for("@unlayer/react-elements/tailwind-loader"),vn=n=>!!n?.[T];function Fn(n,t,e,o){const r=un(),i=H(),c=k();return M(()=>n[T](n,t,e,o,r,i,c))}function Bn(n,t){const e=H(),o=k();M(()=>n[T].prepare?.({scope:n,records:t,compiled:e,render:o}))}function en(n){const t=Array.isArray(n)?n.filter(o=>o!=null&&typeof o!="boolean"):[n],e=t.length===1&&w.isValidElement(t[0])?t[0]:void 0;if(e)return e.type?.[T]?e:typeof e.type=="string"?void 0:en(e.props.children)}function Yn(n,t){const e=n.className?en(n.children):void 0;if(!e)return n;const{children:o,mode:r,config:i,...c}=n,l=A(e.props,()=>new Map),m=H(),a=k();return l.has(n.className)||l.set(n.className,M(()=>e.type[T](e.props,t,void 0,c,void 0,m,a))),{...n,...l.get(n.className),className:void 0}}const bn={},tn=()=>A(bn,()=>new WeakMap);function on(n,t,e,o){try{return o()}catch(r){if(r instanceof E||vn(r))throw r;const i=new E(`${n} failed to render: ${String(r?.message??r)}`,n,Q(t)??e,r);throw t&&tn().set(i,t),i}}const Kn=n=>n instanceof E?tn().get(n):void 0,K=Tn,Rn=En;function In(n){if(n.length===0)return[];const t=n.reduce((e,o)=>e+o,0);return t<=0?[]:n.map(e=>{const o=Math.round(e/t*100*100)/100,r=`${o}`.replace(/\./g,"p");return{value:o,className:r}})}function Ln(n,t,e=600,o=480){const r=In(n);if(t==="email"){const m=`@media only screen and (min-width: ${e+20}px)`,a=`@media only screen and (max-width: ${e+20}px)`;return`
${m} {
  .u-row { width: ${e}px !important; }
  .u-row .u-col { vertical-align: top; }
${r.map(({value:u,className:f})=>`  .u-row .u-col-${f} { width: ${Math.round(e*u/100)}px !important; }`).join(`
`)}
}

${a} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .u-row.no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${r.map(({value:u,className:f})=>`  .u-row.no-stack .u-col-${f} { width: ${u}% !important; }`).join(`
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
}`,c=r.map(({value:m,className:a})=>`.u-row .u-col.u-col-${a} { flex: 0 0 ${m}%; max-width: ${m}%; }`).join(`
`),l=t==="document"?"":`
@media (max-width: ${o}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return i+`
`+c+`
`+l}function Sn(n,t=500){return wn(n?.contentWidth,t)}function Dn(n,t,e,o,r,i="rows"){const l=(F[o]||F.web)(n,t,e,{collection:i,variant:o}),m=Sn(e),a=Ln(r,o,m);return a?`<style>${a}</style>${l}`:l}function An(n,t,e,o,r,i){if(!n)return"";let c="";const l=w.Children.toArray(n);let m=0;return l.forEach(a=>{if(!w.isValidElement(a)){(typeof a=="string"||typeof a=="number")&&(c+=nn(a,"Row"));return}const u=a.type;if((u?.displayName==="Column"||u?.name==="Column")&&typeof a.type=="function"){const p=a.type({...a.props,index:m++,cells:t,bodyValues:e,rowValues:o,mode:r,_config:i});p?.props?.dangerouslySetInnerHTML?.__html&&(c+=p.props.dangerouslySetInnerHTML.__html)}else if(w.isValidElement(a)){const p=a.type?.displayName||a.type?.name||"Unknown";console.warn(`Row: <${p}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${p} /></Column></Row>`)}}),c}function Mn(n){const{layout:t,cells:e,children:o,mode:r,className:i,style:c,index:l=0,bodyValues:m={},collection:a="rows",_config:u,_record:f,...p}=n,g=r??u?.mode??"web",N=w.Children.toArray(o).filter(y=>w.isValidElement(y)&&/^Column$/.test(y.type?.displayName||y.type?.name||"")).length,h=t?.cells??e??Array(Math.max(1,N)).fill(1),$={...Rn,...m},s=J(p,K,"Row");q(f,s.backgroundImage?{...s}:s),pn(s,K.backgroundImage);const d={...s,cells:h,_meta:X({htmlID:D(u,"u_row"),htmlClassNames:"u_row",...s._meta||{}})};s.anchor&&(d.anchor=fn(String(s.anchor),!0));const x=An(o,h,$,d,g,u),b=Z(Dn(x,d,$,g,h,a),/<div[^>]*class="u-row[ "][^>]*>/,c,i,p);return G.jsx("div",{dangerouslySetInnerHTML:{__html:b}})}const rn=n=>on("Row",n._record,"Row",()=>Mn(n));rn.displayName="Row";rn[z]=!0;const Hn=Nn;function kn(n,t,e,o,r,i,c){return(Y[c]||Y.web)(n,t,e,o,r,i)}function On(n,t,e,o){return(B[o]||B.web)(n,t,e,{})}const an=n=>on("Column",n._record,`Column ${(n.index??0)+1}`,()=>Un(n));function Un(n){const{children:t,index:e=0,cells:o=[1],bodyValues:r={},rowValues:i={},mode:c,className:l,style:m,_config:a,_record:u,...f}=n,p=c??a?.mode??"web",g=J(f,Hn,"Column");q(u,g);const N={...g,_meta:X({htmlID:D(a,"u_column"),htmlClassNames:"u_column",...g._meta||{}})};let h="";for(const s of w.Children.toArray(t)){if(typeof s=="string"||typeof s=="number"){h+=nn(s,"Column");continue}if(!w.isValidElement(s)||typeof s.type!="function"||hn(s.props._record))continue;const d=s.type,x=d[yn],b=d[_n]||d,y=x?.metaName??(d.displayName||d.name||"component").toLowerCase(),O=D(a,`u_content_${y}`);let R;try{R=b({...s.props,_config:a,_metaHtmlId:O,colIndex:e,cells:o,bodyValues:r,rowValues:i,columnValues:N})}catch(C){const j=a?.__ids;j&&j[`u_content_${y}`]--;const W=s.props._record,S=x?.name??(d.displayName||d.name||"Block");gn(C instanceof E?C:new E(`${S} failed to render: ${String(C?.message??C)}`,S,Q(W)??`Column ${e+1} › ${S}`,C),W);continue}const U=R?.props?.dangerouslySetInnerHTML;if(!U){R&&console.warn(`Column: <${d.displayName||d.name||"Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);continue}const P=U.__html;if(!P&&x?.omitEmptyOutput)continue;const _=s.props,I=_.containerPadding??_.values?.containerPadding??xn,sn=typeof I=="number"?`${I}px`:I,v=x?.contentType==="custom"?{}:_,L=_.values?._override,cn={containerPadding:sn,_override:{...L,mobile:{...L?.mobile,...v.hideOnMobile!==void 0?{hideMobile:v.hideOnMobile}:{}},desktop:{...L?.desktop,...v.hideOnDesktop!==void 0?{hideDesktop:v.hideOnDesktop}:{}}},_meta:{htmlID:O,htmlClassNames:`u_content_${y}`,..._.values?._meta?.htmlID?{htmlID:Cn(_.values._meta.htmlID)}:{}}},V=On(P,cn,r,p);h+=_.skipInText?V.replace(/<[a-z]+/,'$& data-skip-in-text="true"'):V}const $=Z(kn(h,N,e,o,r,i,p),/<div[^>]*class="u-col[ "][^>]*>/,m,l,f);return G.jsx("div",{dangerouslySetInnerHTML:{__html:$}})}an.displayName="Column";an[z]=!0;export{En as B,an as C,rn as R,T,Tn as a,Nn as b,Wn as c,Kn as d,Fn as e,vn as i,Bn as p,Yn as r};
