import{j as G}from"./jsx-runtime-DOZxwFIM.js";import{R as h}from"./iframe-azBv6pMr.js";import{a8 as mn,a9 as dn,aa as un,M as A,g as M,ab as k,Y as pn,R as E,w as Q,D as z,b as J,ac as q,d as fn,a4 as X,a5 as S,ad as wn,a6 as Z,ae as nn,af as en,ag as F,ah as hn,f as yn,U as _n,p as gn,e as xn,ai as Cn,s as En,aj as B,ak as Y}from"./create-component-3Af5kufL.js";const Tn=Object.fromEntries(Object.entries(dn).filter(([n])=>!n.startsWith("popup"))),Nn={...un},$n={...mn},T=Symbol.for("@unlayer/react-elements/tailwind"),vn={},H=()=>A(vn,()=>({})),Fn=Symbol.for("@unlayer/react-elements/tailwind-loader"),bn=n=>!!n?.[T];function Bn(n,t,e,o){const a=pn(),i=k(),c=H();return M(()=>n[T](n,t,e,o,a,i,c))}function Yn(n,t){const e=k(),o=H();M(()=>n[T].prepare?.({scope:n,records:t,compiled:e,render:o}))}function tn(n){const t=Array.isArray(n)?n.filter(o=>o!=null&&typeof o!="boolean"):[n],e=t.length===1&&h.isValidElement(t[0])?t[0]:void 0;if(e)return e.type?.[T]?e:typeof e.type=="string"?void 0:tn(e.props.children)}function Kn(n,t){const e=n.className?tn(n.children):void 0;if(!e)return n;const{children:o,mode:a,config:i,...c}=n,l=A(e.props,()=>new Map),m=k(),r=H();return l.has(n.className)||l.set(n.className,M(()=>e.type[T](e.props,t,void 0,c,void 0,m,r))),{...n,...l.get(n.className),className:void 0}}const Rn={},on=()=>A(Rn,()=>new WeakMap);function an(n,t,e,o){try{return o()}catch(a){if(a instanceof E||bn(a))throw a;const i=new E(`${n} failed to render: ${String(a?.message??a)}`,n,Q(t)??e,a);throw t&&on().set(i,t),i}}const Gn=n=>n instanceof E?on().get(n):void 0,K=Nn,In=Tn;function Dn(n){if(n.length===0)return[];const t=n.reduce((e,o)=>e+o,0);return t<=0?[]:n.map(e=>{const o=Math.round(e/t*100*100)/100,a=`${o}`.replace(/\./g,"p");return{value:o,className:a}})}function Ln(n,t,e=600,o=480){const a=Dn(n);if(t==="email"){const m=`@media only screen and (min-width: ${e+20}px)`,r=`@media only screen and (max-width: ${e+20}px)`;return`
${m} {
  .u-row { width: ${e}px !important; }
  .u-row .u-col { vertical-align: top; }
${a.map(({value:u,className:f})=>`  .u-row .u-col-${f} { width: ${Math.round(e*u/100)}px !important; }`).join(`
`)}
}

${r} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .u-row.no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${a.map(({value:u,className:f})=>`  .u-row.no-stack .u-col-${f} { width: ${u}% !important; }`).join(`
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
}`,c=a.map(({value:m,className:r})=>`.u-row .u-col.u-col-${r} { flex: 0 0 ${m}%; max-width: ${m}%; }`).join(`
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
`+l}function Sn(n,t=500){return hn(n?.contentWidth,t)}function An(n,t,e,o,a,i="rows"){const l=(F[o]||F.web)(n,t,e,{collection:i,variant:o}),m=Sn(e),r=Ln(a,o,m);return r?`<style>${r}</style>${l}`:l}function Mn(n,t,e,o,a,i){if(!n)return"";let c="";const l=h.Children.toArray(n);let m=0;return l.forEach(r=>{if(!h.isValidElement(r)){(typeof r=="string"||typeof r=="number")&&(c+=en(r,"Row"));return}const u=r.type;if((u?.displayName==="Column"||u?.name==="Column")&&typeof r.type=="function"){const p=r.type({...r.props,index:m++,cells:t,bodyValues:e,rowValues:o,mode:a,_config:i});p?.props?.dangerouslySetInnerHTML?.__html&&(c+=p.props.dangerouslySetInnerHTML.__html)}else if(h.isValidElement(r)){const p=r.type?.displayName||r.type?.name||"Unknown";console.warn(`Row: <${p}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${p} /></Column></Row>`)}}),c}function kn(n){const{layout:t,cells:e,children:o,mode:a,className:i,style:c,index:l=0,bodyValues:m={},collection:r="rows",_config:u,_record:f,...p}=n,g=a??u?.mode??"web",N=h.Children.toArray(o).filter(_=>h.isValidElement(_)&&/^Column$/.test(_.type?.displayName||_.type?.name||"")).length,y=t?.cells??e??Array(Math.max(1,N)).fill(1),$={...In,...m},s=J(p,K,"Row");q(f,s.backgroundImage?{...s}:s),fn(s,K.backgroundImage);const d={...s,cells:y,_meta:X({htmlID:S(u,"u_row"),htmlClassNames:"u_row",...s._meta||{}})};s.anchor&&(d.anchor=wn(String(s.anchor),!0));const x=Mn(o,y,$,d,g,u),b=Z(An(x,d,$,g,y,r),/<div[^>]*class="u-row[ "][^>]*>/,c,i,p);return G.jsx("div",{dangerouslySetInnerHTML:{__html:nn(b,d)}})}const rn=n=>an("Row",n._record,"Row",()=>kn(n));rn.displayName="Row";rn[z]=!0;const Hn=$n;function On(n,t,e,o,a,i,c){return(Y[c]||Y.web)(n,t,e,o,a,i)}function Un(n,t,e,o){return(B[o]||B.web)(n,t,e,{})}const sn=n=>an("Column",n._record,`Column ${(n.index??0)+1}`,()=>Pn(n));function Pn(n){const{children:t,index:e=0,cells:o=[1],bodyValues:a={},rowValues:i={},mode:c,className:l,style:m,_config:r,_record:u,...f}=n,p=c??r?.mode??"web",g=J(f,Hn,"Column");q(u,g);const N={...g,_meta:X({htmlID:S(r,"u_column"),htmlClassNames:"u_column",...g._meta||{}})};let y="";for(const s of h.Children.toArray(t)){if(typeof s=="string"||typeof s=="number"){y+=en(s,"Column");continue}if(!h.isValidElement(s)||typeof s.type!="function"||yn(s.props._record))continue;const d=s.type,x=d[_n],b=d[gn]||d,_=x?.metaName??(d.displayName||d.name||"component").toLowerCase(),O=S(r,`u_content_${_}`);let R;try{R=b({...s.props,_config:r,_metaHtmlId:O,colIndex:e,cells:o,bodyValues:a,rowValues:i,columnValues:N})}catch(C){const j=r?.__ids;j&&j[`u_content_${_}`]--;const W=s.props._record,L=x?.name??(d.displayName||d.name||"Block");xn(C instanceof E?C:new E(`${L} failed to render: ${String(C?.message??C)}`,L,Q(W)??`Column ${e+1} › ${L}`,C),W);continue}const U=R?.props?.dangerouslySetInnerHTML;if(!U){R&&console.warn(`Column: <${d.displayName||d.name||"Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);continue}const P=U.__html;if(!P&&x?.omitEmptyOutput)continue;const w=s.props,I=w.containerPadding??w.values?.containerPadding??Cn,cn=typeof I=="number"?`${I}px`:I,v=x?.contentType==="custom"?{}:w,D=w.values?._override,ln={containerPadding:cn,_override:{...D,mobile:{...D?.mobile,...v.hideOnMobile!==void 0?{hideMobile:v.hideOnMobile}:{}},desktop:{...D?.desktop,...v.hideOnDesktop!==void 0?{hideDesktop:v.hideOnDesktop}:{}}},_meta:{htmlID:O,htmlClassNames:`u_content_${_}`,...w.values?._meta?.htmlID?{htmlID:En(w.values._meta.htmlID)}:{}}},V=Un(P,ln,a,p);y+=nn(w.skipInText?V.replace(/<[a-z]+/,'$& data-skip-in-text="true"'):V,w.values)}const $=Z(On(y,N,e,o,a,i,p),/<div[^>]*class="u-col[ "][^>]*>/,m,l,f);return G.jsx("div",{dangerouslySetInnerHTML:{__html:$}})}sn.displayName="Column";sn[z]=!0;export{Tn as B,sn as C,rn as R,T,Nn as a,$n as b,Fn as c,Gn as d,Bn as e,bn as i,Yn as p,Kn as r};
