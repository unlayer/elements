import{j as Q}from"./jsx-runtime-CVX2z3_u.js";import{R as y}from"./iframe-NiJwOdJf.js";import{a8 as mn,a9 as un,aa as pn,M as k,g as H,ab as U,Y as fn,R as v,w as J,D as q,b as X,ac as Z,d as wn,a4 as nn,a5 as M,ad as hn,a6 as O,ae as tn,af as en,ag as Y,ah as yn,f as gn,U as _n,p as xn,e as Cn,ai as En,s as bn,aj as K,ak as z}from"./create-component-CcOa5vY0.js";const vn=Object.fromEntries(Object.entries(un).filter(([n])=>!n.startsWith("popup"))),Tn={...pn},Nn={...mn},T=Symbol.for("@unlayer/react-elements/tailwind"),$n={},P=()=>k($n,()=>({})),Yn=Symbol.for("@unlayer/react-elements/tailwind-loader"),Rn=n=>!!n?.[T];function Kn(n,e,t,o){const r=fn(),i=U(),c=P();return H(()=>n[T](n,e,t,o,r,i,c))}function zn(n,e){const t=U(),o=P();H(()=>n[T].prepare?.({scope:n,records:e,compiled:t,render:o}))}function on(n){const e=Array.isArray(n)?n.filter(o=>o!=null&&typeof o!="boolean"):[n],t=e.length===1&&y.isValidElement(e[0])?e[0]:void 0;if(t)return t.type?.[T]?t:typeof t.type=="string"?void 0:on(t.props.children)}function Gn(n,e){const t=n.className?on(n.children):void 0;if(!t)return n;const{children:o,mode:r,config:i,...c}=n,d=k(t.props,()=>new Map),s=U(),a=P();return d.has(n.className)||d.set(n.className,H(()=>t.type[T](t.props,e,void 0,c,void 0,s,a))),{...n,...d.get(n.className),className:void 0}}const Sn={},rn=()=>k(Sn,()=>new WeakMap);function an(n,e,t,o){try{return o()}catch(r){if(r instanceof v||Rn(r))throw r;const i=new v(`${n} failed to render: ${String(r?.message??r)}`,n,J(e)??t,r);throw e&&rn().set(i,e),i}}const Qn=n=>n instanceof v?rn().get(n):void 0,G=Tn,In=vn;function Ln(n){if(n.length===0)return[];const e=n.reduce((t,o)=>t+o,0);return e<=0?[]:n.map(t=>{const o=Math.round(t/e*100*100)/100,r=`${o}`.replace(/\./g,"p");return{value:o,className:r}})}function Dn(n,e,t=600,o=480){const r=Ln(n);if(e==="email"){const s=`@media only screen and (min-width: ${t+20}px)`,a=`@media only screen and (max-width: ${t+20}px)`;return`
${s} {
  .u-row { width: ${t}px !important; }
  .u-row .u-col { vertical-align: top; }
${r.map(({value:m,className:w})=>`  .u-row .u-col-${w} { width: ${Math.round(t*m/100)}px !important; }`).join(`
`)}
}

${a} {
  .u-row-container { max-width: 100% !important; padding-left: 0px !important; padding-right: 0px !important; }
  .u-row { width: 100% !important; }
  .u-row .u-col { display: block !important; width: 100% !important; min-width: 320px !important; max-width: 100% !important; }
  .u-row .u-col > div { margin: 0 auto; }
  .u-row.no-stack .u-col { min-width: 0 !important; display: table-cell !important; }
${r.map(({value:m,className:w})=>`  .u-row.no-stack .u-col-${w} { width: ${m}% !important; }`).join(`
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
}`,c=r.map(({value:s,className:a})=>`.u-row .u-col.u-col-${a} { flex: 0 0 ${s}%; max-width: ${s}%; }`).join(`
`),d=e==="document"?"":`
@media (max-width: ${o}px) {
  .u_row .container { max-width: 100% !important; }
  .u-row:not(.no-stack) { flex-wrap: wrap; }
  .u-row:not(.no-stack) .u-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}`;return i+`
`+c+`
`+d}function An(n,e=500){return yn(n?.contentWidth,e)}function Mn(n,e,t,o,r,i="rows"){const d=(Y[o]||Y.web)(n,e,t,{collection:i,variant:o}),s=An(t),a=Dn(r,o,s);return a?`<style>${a}</style>${d}`:d}function On(n,e,t,o,r,i){if(!n)return"";let c="";const d=y.Children.toArray(n);let s=0;return d.forEach(a=>{if(!y.isValidElement(a)){(typeof a=="string"||typeof a=="number")&&(c+=en(a,"Row"));return}const m=a.type;if((m?.displayName==="Column"||m?.name==="Column")&&typeof a.type=="function"){const u=a.type({...a.props,index:s++,cells:e,bodyValues:t,rowValues:o,mode:r,_config:i});u?.props?.dangerouslySetInnerHTML?.__html&&(c+=u.props.dangerouslySetInnerHTML.__html)}else if(y.isValidElement(a)){const u=a.type?.displayName||a.type?.name||"Unknown";console.warn(`Row: <${u}> is not a valid Row child. Only <Column> components can be direct children of <Row>. Wrap it in a <Column>: <Row><Column><${u} /></Column></Row>`)}}),c}function kn(n){const{layout:e,cells:t,children:o,mode:r,className:i,style:c,index:d=0,bodyValues:s={},collection:a="rows",_config:m,_record:w,...u}=n,g=r??m?.mode??"web",N=y.Children.toArray(o).filter(E=>y.isValidElement(E)&&/^Column$/.test(E.type?.displayName||E.type?.name||"")).length,_=e?.cells??t??Array(Math.max(1,N)).fill(1),$={...In,...s},f=X(u,G,"Row");Z(w,f.backgroundImage?{...f}:f),wn(f,G.backgroundImage);const l={...f,cells:_,_meta:nn({htmlID:M(m,"u_row"),htmlClassNames:"u_row",...f._meta||{}})};f.anchor&&(l.anchor=hn(String(f.anchor),!0));const p=On(o,_,$,l,g,m),[x,S]=g==="email"?Hn(c):[void 0,c];let C=O(Mn(p,l,$,g,_,a),/<div[^>]*class="u-row[ "][^>]*>/,S,i,u);return x&&(C=O(C,/<div[^>]*class="u-row-container[ "][^>]*>/,x,void 0,u)),Q.jsx("div",{dangerouslySetInnerHTML:{__html:tn(C,l)}})}function Hn(n){if(!n||typeof n!="object")return[void 0,n];const e=Object.entries(n),t=e.filter(([r])=>/^padding/.test(r));if(!t.length)return[void 0,n];const o=e.filter(([r])=>!/^padding/.test(r));return[Object.fromEntries(t),o.length?Object.fromEntries(o):void 0]}const sn=n=>an("Row",n._record,"Row",()=>kn(n));sn.displayName="Row";sn[q]=!0;const Un=Nn;function Pn(n,e,t,o,r,i,c){return(z[c]||z.web)(n,e,t,o,r,i)}function jn(n,e,t,o){return(K[o]||K.web)(n,e,t,{})}const cn=n=>an("Column",n._record,`Column ${(n.index??0)+1}`,()=>Vn(n));function Vn(n){const{children:e,index:t=0,cells:o=[1],bodyValues:r={},rowValues:i={},mode:c,className:d,style:s,_config:a,_record:m,...w}=n,u=c??a?.mode??"web",g=X(w,Un,"Column");Z(m,g);const N={...g,_meta:nn({htmlID:M(a,"u_column"),htmlClassNames:"u_column",...g._meta||{}})};let _="";for(const l of y.Children.toArray(e)){if(typeof l=="string"||typeof l=="number"){_+=en(l,"Column");continue}if(!y.isValidElement(l)||typeof l.type!="function"||gn(l.props._record))continue;const p=l.type,x=p[_n],S=p[xn]||p,C=x?.metaName??(p.displayName||p.name||"component").toLowerCase(),E=M(a,`u_content_${C}`);let I;try{I=S({...l.props,_config:a,_metaHtmlId:E,colIndex:t,cells:o,bodyValues:r,rowValues:i,columnValues:N})}catch(b){const F=a?.__ids;F&&F[`u_content_${C}`]--;const B=l.props._record,A=x?.name??(p.displayName||p.name||"Block");Cn(b instanceof v?b:new v(`${A} failed to render: ${String(b?.message??b)}`,A,J(B)??`Column ${t+1} › ${A}`,b),B);continue}const j=I?.props?.dangerouslySetInnerHTML;if(!j){I&&console.warn(`Column: <${p.displayName||p.name||"Unknown"}> did not produce renderable HTML. Ensure it is an Unlayer component (Button, Text, Image, etc.).`);continue}const V=j.__html;if(!V&&x?.omitEmptyOutput)continue;const h=l.props,L=h.containerPadding??h.values?.containerPadding??En,ln=typeof L=="number"?`${L}px`:L,R=x?.contentType==="custom"?{}:h,D=h.values?._override,dn={containerPadding:ln,_override:{...D,mobile:{...D?.mobile,...R.hideOnMobile!==void 0?{hideMobile:R.hideOnMobile}:{}},desktop:{...D?.desktop,...R.hideOnDesktop!==void 0?{hideDesktop:R.hideOnDesktop}:{}}},_meta:{htmlID:E,htmlClassNames:`u_content_${C}`,...h.values?._meta?.htmlID?{htmlID:bn(h.values._meta.htmlID)}:{}}},W=jn(V,dn,r,u);_+=tn(h.skipInText?W.replace(/<[a-z]+/,'$& data-skip-in-text="true"'):W,h.values)}const $=s&&typeof s=="object"&&s.boxSizing===void 0&&Object.keys(s).some(l=>/^(padding|border(?!Radius|Collapse|Spacing|Image|(Top|Bottom|Start|End)(Left|Right|Start|End)Radius))/.test(l)),f=O(Pn(_,N,t,o,r,i,u),/<div[^>]*class="u-col[ "][^>]*>/,$?{...s,boxSizing:"border-box"}:s,d,w);return Q.jsx("div",{dangerouslySetInnerHTML:{__html:f}})}cn.displayName="Column";cn[q]=!0;export{vn as B,cn as C,sn as R,T,Tn as a,Nn as b,Yn as c,Qn as d,Kn as e,Rn as i,zn as p,Gn as r};
