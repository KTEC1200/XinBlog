import{i as e,t}from"./react-SIfiwpqq.js";import{i as n}from"./Fade-CmuJI99T.js";import{D as r,E as i,G as a,J as o,O as s,a as c,c as l,o as u,q as d,s as f,v as p}from"./TransitionGroupContext-DW0TFUyY.js";var m=e(t());function h(e){return r(`MuiCircularProgress`,e)}i(`MuiCircularProgress`,[`root`,`determinate`,`indeterminate`,`colorPrimary`,`colorSecondary`,`svg`,`circle`,`circleDeterminate`,`circleIndeterminate`,`circleDisableShrink`]);var g=a(),_=44,v=o`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`,y=o`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: -126px;
  }
`,b=typeof v==`string`?null:d`
        animation: ${v} 1.4s linear infinite;
      `,x=typeof y==`string`?null:d`
        animation: ${y} 1.4s ease-in-out infinite;
      `,S=e=>{let{classes:t,variant:n,color:r,disableShrink:i}=e,a={root:[`root`,n,`color${f(r)}`],svg:[`svg`],circle:[`circle`,`circle${f(n)}`,i&&`circleDisableShrink`]};return p(a,h,t)},C=l(`span`,{name:`MuiCircularProgress`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,t[n.variant],t[`color${f(n.color)}`]]}})(u(({theme:e})=>({display:`inline-block`,variants:[{props:{variant:`determinate`},style:{transition:e.transitions.create(`transform`)}},{props:{variant:`indeterminate`},style:b||{animation:`${v} 1.4s linear infinite`}},...Object.entries(e.palette).filter(n()).map(([t])=>({props:{color:t},style:{color:(e.vars||e).palette[t].main}}))]}))),w=l(`svg`,{name:`MuiCircularProgress`,slot:`Svg`,overridesResolver:(e,t)=>t.svg})({display:`block`}),T=l(`circle`,{name:`MuiCircularProgress`,slot:`Circle`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.circle,t[`circle${f(n.variant)}`],n.disableShrink&&t.circleDisableShrink]}})(u(({theme:e})=>({stroke:`currentColor`,variants:[{props:{variant:`determinate`},style:{transition:e.transitions.create(`stroke-dashoffset`)}},{props:{variant:`indeterminate`},style:{strokeDasharray:`80px, 200px`,strokeDashoffset:0}},{props:({ownerState:e})=>e.variant===`indeterminate`&&!e.disableShrink,style:x||{animation:`${y} 1.4s ease-in-out infinite`}}]}))),E=m.forwardRef(function(e,t){let n=c({props:e,name:`MuiCircularProgress`}),{className:r,color:i=`primary`,disableShrink:a=!1,size:o=40,style:l,thickness:u=3.6,value:d=0,variant:f=`indeterminate`,...p}=n,m={...n,color:i,disableShrink:a,size:o,thickness:u,value:d,variant:f},h=S(m),v={},y={},b={};if(f===`determinate`){let e=2*Math.PI*((_-u)/2);v.strokeDasharray=e.toFixed(3),b[`aria-valuenow`]=Math.round(d),v.strokeDashoffset=`${((100-d)/100*e).toFixed(3)}px`,y.transform=`rotate(-90deg)`}return(0,g.jsx)(C,{className:s(h.root,r),style:{width:o,height:o,...y,...l},ownerState:m,ref:t,role:`progressbar`,...b,...p,children:(0,g.jsx)(w,{className:h.svg,ownerState:m,viewBox:`${_/2} ${_/2} ${_} ${_}`,children:(0,g.jsx)(T,{className:h.circle,style:v,ownerState:m,cx:_,cy:_,r:(_-u)/2,fill:`none`,strokeWidth:u})})})});export{E as t};