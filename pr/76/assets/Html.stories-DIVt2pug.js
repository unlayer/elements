import{j as e}from"./jsx-runtime-DIqnCnE3.js";import{ad as y,ae as h,ax as x,S as a,aT as r,H as b}from"./SideBySide-CTZXQXkZ.js";import{F as d,I as l}from"./shared-DuwPCDP_.js";import"./iframe-PnVPNnO0.js";import"./preload-helper-PPVm8Dsz.js";const z={title:"Components/Html",args:h,argTypes:y,parameters:{docs:{description:{component:'Markup written as it is, for what no component says: nothing in it is checked or escaped, so only markup you trust. Each story is drawn as an Email and as a Page, from one template; "Show code" has it.'}}}},c=x,p="font-family:Arial,Helvetica,sans-serif;color:#1f2933;line-height:1.5",o=c(t=>e.jsx(t,{width:560,style:{color:l,fontFamily:d},children:e.jsx(a,{style:{padding:24},children:e.jsx(r,{html:`<div style="${p};padding:12px;border:1px dashed #9AA5B1;font-size:14px">Written as it is, <b>nothing in it checked</b>.</div>`})})})),s=c(t=>e.jsx(t,{width:560,style:{color:l,fontFamily:d},children:e.jsx(a,{style:{padding:24},children:e.jsx(r,{html:`<div style="${p};padding:32px;border-radius:16px;color:#ffffff;text-align:center;background:linear-gradient(135deg,#0f766e 0%,#334e68 100%);box-shadow:0 10px 25px rgba(15,118,110,.3)">
  <h2 style="margin:0 0 12px;font-size:24px">A card of your own</h2>
  <p style="margin:0;line-height:1.6;opacity:.9">A gradient and a shadow, written as CSS.</p>
</div>`})})})),m=(t,g,f)=>`<div style="margin-bottom:16px">
  <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:14px"><span>${t}</span><span style="color:#616e7c">${g}%</span></div>
  <div style="height:8px;overflow:hidden;border-radius:10px;background:#e4e7eb"><div style="width:${g}%;height:100%;border-radius:10px;background:${f}"></div></div>
</div>`,i=c(t=>e.jsx(t,{width:560,style:{color:l,fontFamily:d},children:e.jsxs(a,{style:{padding:24,gap:16},children:[e.jsx(b,{level:3,style:{fontSize:18},children:"This week's goals"}),e.jsx(r,{html:`<div style="${p}">${m("Orders",90,"#0f766e")+m("Signups",75,"#334e68")+m("Reviews",40,"#b7791f")}</div>`})]})})),n=c(t=>e.jsx(t,{width:560,style:{color:l,fontFamily:d},children:e.jsx(a,{style:{padding:24},children:e.jsx(r,{text:"12k subscribers, 48% opened, 9% clicked",html:`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${p};text-align:center">
  <tr>
    <td style="padding:16px;background:#f5f7fa"><div style="font-size:28px;font-weight:bold;color:#0f766e">12k</div><div style="font-size:12px;color:#616e7c">subscribers</div></td>
    <td style="padding:16px"><div style="font-size:28px;font-weight:bold;color:#0f766e">48%</div><div style="font-size:12px;color:#616e7c">opened</div></td>
    <td style="padding:16px;background:#f5f7fa"><div style="font-size:28px;font-weight:bold;color:#0f766e">9%</div><div style="font-size:12px;color:#616e7c">clicked</div></td>
  </tr>
</table>`})})}));o.__docgenInfo={description:"`Html` is markup written as it is, for what no component says.",methods:[],displayName:"YourOwnHtml"};s.__docgenInfo={description:"A card with a gradient and a shadow, which `style` doesn't have.",methods:[],displayName:"GradientCard"};i.__docgenInfo={description:"Progress bars, next to a heading that's a component: `Html` is one block among others.",methods:[],displayName:"ProgressBars"};n.__docgenInfo={description:"A table of figures in markup every mail client reads: `text` says what it reads as in the plain-text version.",methods:[],displayName:"PlainTextVersion"};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Html html={\`<div style="\${TYPE};padding:12px;border:1px dashed #9AA5B1;font-size:14px">Written as it is, <b>nothing in it checked</b>.</div>\`} />
    </Section>
  </Root>)`,...o.parameters?.docs?.source},description:{story:"`Html` is markup written as it is, for what no component says.",...o.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Html html={\`<div style="\${TYPE};padding:32px;border-radius:16px;color:#ffffff;text-align:center;background:linear-gradient(135deg,#0f766e 0%,#334e68 100%);box-shadow:0 10px 25px rgba(15,118,110,.3)">
  <h2 style="margin:0 0 12px;font-size:24px">A card of your own</h2>
  <p style="margin:0;line-height:1.6;opacity:.9">A gradient and a shadow, written as CSS.</p>
</div>\`} />
    </Section>
  </Root>)`,...s.parameters?.docs?.source},description:{story:"A card with a gradient and a shadow, which `style` doesn't have.",...s.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24,
    gap: 16
  }}>
      <Heading level={3} style={{
      fontSize: 18
    }}>This week's goals</Heading>
      <Html html={\`<div style="\${TYPE}">\${bar("Orders", 90, "#0f766e") + bar("Signups", 75, "#334e68") + bar("Reviews", 40, "#b7791f")}</div>\`} />
    </Section>
  </Root>)`,...i.parameters?.docs?.source},description:{story:"Progress bars, next to a heading that's a component: `Html` is one block among others.",...i.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`story(Root => <Root width={560} style={{
  color: INK,
  fontFamily: FONT
}}>
    <Section style={{
    padding: 24
  }}>
      <Html text="12k subscribers, 48% opened, 9% clicked" html={\`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="\${TYPE};text-align:center">
  <tr>
    <td style="padding:16px;background:#f5f7fa"><div style="font-size:28px;font-weight:bold;color:#0f766e">12k</div><div style="font-size:12px;color:#616e7c">subscribers</div></td>
    <td style="padding:16px"><div style="font-size:28px;font-weight:bold;color:#0f766e">48%</div><div style="font-size:12px;color:#616e7c">opened</div></td>
    <td style="padding:16px;background:#f5f7fa"><div style="font-size:28px;font-weight:bold;color:#0f766e">9%</div><div style="font-size:12px;color:#616e7c">clicked</div></td>
  </tr>
</table>\`} />
    </Section>
  </Root>)`,...n.parameters?.docs?.source},description:{story:"A table of figures in markup every mail client reads: `text` says what it reads as in the plain-text version.",...n.parameters?.docs?.description}}};const H=["YourOwnHtml","GradientCard","ProgressBars","PlainTextVersion"];export{s as GradientCard,n as PlainTextVersion,i as ProgressBars,o as YourOwnHtml,H as __namedExportsOrder,z as default};
