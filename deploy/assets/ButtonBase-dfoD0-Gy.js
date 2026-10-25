import{i as e,t}from"./react-SIfiwpqq.js";import{D as n,E as r,G as i,J as a,O as o,X as s,a as c,c as l,i as u,n as d,o as f,r as p,s as m,t as h,v as g}from"./TransitionGroupContext-DW0TFUyY.js";var _=e(t()),v=typeof window<`u`?_.useLayoutEffect:_.useEffect;function y(e){let t=_.useRef(e);return v(()=>{t.current=e}),_.useRef((...e)=>(0,t.current)(...e)).current}var b={};function x(e,t){let n=_.useRef(b);return n.current===b&&(n.current=e(t)),n}var S=[];function C(e){_.useEffect(e,S)}var w=class e{static create(){return new e}currentId=null;start(e,t){this.clear(),this.currentId=setTimeout(()=>{this.currentId=null,t()},e)}clear=()=>{this.currentId!==null&&(clearTimeout(this.currentId),this.currentId=null)};disposeEffect=()=>this.clear};function T(){let e=x(w.create).current;return C(e.disposeEffect),e}function E(e){try{return e.matches(`:focus-visible`)}catch{}return!1}function D(e){return n(`MuiSvgIcon`,e)}r(`MuiSvgIcon`,[`root`,`colorPrimary`,`colorSecondary`,`colorAction`,`colorError`,`colorDisabled`,`fontSizeInherit`,`fontSizeSmall`,`fontSizeMedium`,`fontSizeLarge`]);var O=i(),k=e=>{let{color:t,fontSize:n,classes:r}=e,i={root:[`root`,t!==`inherit`&&`color${m(t)}`,`fontSize${m(n)}`]};return g(i,D,r)},ee=l(`svg`,{name:`MuiSvgIcon`,slot:`Root`,overridesResolver:(e,t)=>{let{ownerState:n}=e;return[t.root,n.color!==`inherit`&&t[`color${m(n.color)}`],t[`fontSize${m(n.fontSize)}`]]}})(f(({theme:e})=>({userSelect:`none`,width:`1em`,height:`1em`,display:`inline-block`,flexShrink:0,transition:e.transitions?.create?.(`fill`,{duration:(e.vars??e).transitions?.duration?.shorter}),variants:[{props:e=>!e.hasSvgAsChild,style:{fill:`currentColor`}},{props:{fontSize:`inherit`},style:{fontSize:`inherit`}},{props:{fontSize:`small`},style:{fontSize:e.typography?.pxToRem?.(20)||`1.25rem`}},{props:{fontSize:`medium`},style:{fontSize:e.typography?.pxToRem?.(24)||`1.5rem`}},{props:{fontSize:`large`},style:{fontSize:e.typography?.pxToRem?.(35)||`2.1875rem`}},...Object.entries((e.vars??e).palette).filter(([,e])=>e&&e.main).map(([t])=>({props:{color:t},style:{color:(e.vars??e).palette?.[t]?.main}})),{props:{color:`action`},style:{color:(e.vars??e).palette?.action?.active}},{props:{color:`disabled`},style:{color:(e.vars??e).palette?.action?.disabled}},{props:{color:`inherit`},style:{color:void 0}}]}))),A=_.forwardRef(function(e,t){let n=c({props:e,name:`MuiSvgIcon`}),{children:r,className:i,color:a=`inherit`,component:s=`svg`,fontSize:l=`medium`,htmlColor:u,inheritViewBox:d=!1,titleAccess:f,viewBox:p=`0 0 24 24`,...m}=n,h=_.isValidElement(r)&&r.type===`svg`,g={...n,color:a,component:s,fontSize:l,instanceFontSize:e.fontSize,inheritViewBox:d,viewBox:p,hasSvgAsChild:h},v={};d||(v.viewBox=p);let y=k(g);return(0,O.jsxs)(ee,{as:s,className:o(y.root,i),focusable:`false`,color:u,"aria-hidden":!f||void 0,role:f?`img`:void 0,ref:t,...v,...m,...h&&r.props,ownerState:g,children:[h?r.props.children:r,f?(0,O.jsx)(`title`,{children:f}):null]})});A.muiName=`SvgIcon`;function te(e,t){function n(n,r){return(0,O.jsx)(A,{"data-testid":`${t}Icon`,ref:r,...n,children:e})}return n.muiName=A.muiName,_.memo(_.forwardRef(n))}var j=y;function ne(e){if(e===void 0)throw ReferenceError(`this hasn't been initialised - super() hasn't been called`);return e}function M(e,t){var n=function(e){return t&&(0,_.isValidElement)(e)?t(e):e},r=Object.create(null);return e&&_.Children.map(e,function(e){return e}).forEach(function(e){r[e.key]=n(e)}),r}function N(e,t){e||={},t||={};function n(n){return n in t?t[n]:e[n]}var r=Object.create(null),i=[];for(var a in e)a in t?i.length&&(r[a]=i,i=[]):i.push(a);var o,s={};for(var c in t){if(r[c])for(o=0;o<r[c].length;o++){var l=r[c][o];s[r[c][o]]=n(l)}s[c]=n(c)}for(o=0;o<i.length;o++)s[i[o]]=n(i[o]);return s}function P(e,t,n){return n[t]==null?e.props[t]:n[t]}function F(e,t){return M(e.children,function(n){return(0,_.cloneElement)(n,{onExited:t.bind(null,n),in:!0,appear:P(n,`appear`,e),enter:P(n,`enter`,e),exit:P(n,`exit`,e)})})}function I(e,t,n){var r=M(e.children),i=N(t,r);return Object.keys(i).forEach(function(a){var o=i[a];if((0,_.isValidElement)(o)){var s=a in t,c=a in r,l=t[a],u=(0,_.isValidElement)(l)&&!l.props.in;c&&(!s||u)?i[a]=(0,_.cloneElement)(o,{onExited:n.bind(null,o),in:!0,exit:P(o,`exit`,e),enter:P(o,`enter`,e)}):!c&&s&&!u?i[a]=(0,_.cloneElement)(o,{in:!1}):c&&s&&(0,_.isValidElement)(l)&&(i[a]=(0,_.cloneElement)(o,{onExited:n.bind(null,o),in:l.props.in,exit:P(o,`exit`,e),enter:P(o,`enter`,e)}))}}),i}var L=Object.values||function(e){return Object.keys(e).map(function(t){return e[t]})},R={component:`div`,childFactory:function(e){return e}},z=function(e){d(t,e);function t(t,n){var r=e.call(this,t,n)||this;return r.state={contextValue:{isMounting:!0},handleExited:r.handleExited.bind(ne(r)),firstRender:!0},r}var n=t.prototype;return n.componentDidMount=function(){this.mounted=!0,this.setState({contextValue:{isMounting:!1}})},n.componentWillUnmount=function(){this.mounted=!1},t.getDerivedStateFromProps=function(e,t){var n=t.children,r=t.handleExited;return{children:t.firstRender?F(e,r):I(e,n,r),firstRender:!1}},n.handleExited=function(e,t){var n=M(this.props.children);e.key in n||(e.props.onExited&&e.props.onExited(t),this.mounted&&this.setState(function(t){var n=s({},t.children);return delete n[e.key],{children:n}}))},n.render=function(){var e=this.props,t=e.component,n=e.childFactory,r=p(e,[`component`,`childFactory`]),i=this.state.contextValue,a=L(this.state.children).map(n);return delete r.appear,delete r.enter,delete r.exit,t===null?_.createElement(h.Provider,{value:i},a):_.createElement(h.Provider,{value:i},_.createElement(t,r,a))},t}(_.Component);z.propTypes={},z.defaultProps=R;var B=class e{static create(){return new e}static use(){let t=x(e.create).current,[n,r]=_.useState(!1);return t.shouldMount=n,t.setShouldMount=r,_.useEffect(t.mountEffect,[n]),t}constructor(){this.ref={current:null},this.mounted=null,this.didMount=!1,this.shouldMount=!1,this.setShouldMount=null}mount(){return this.mounted||(this.mounted=V(),this.shouldMount=!0,this.setShouldMount(this.shouldMount)),this.mounted}mountEffect=()=>{this.shouldMount&&!this.didMount&&this.ref.current!==null&&(this.didMount=!0,this.mounted.resolve())};start(...e){this.mount().then(()=>this.ref.current?.start(...e))}stop(...e){this.mount().then(()=>this.ref.current?.stop(...e))}pulsate(...e){this.mount().then(()=>this.ref.current?.pulsate(...e))}};function re(){return B.use()}function V(){let e,t,n=new Promise((n,r)=>{e=n,t=r});return n.resolve=e,n.reject=t,n}function ie(e){let{className:t,classes:n,pulsate:r=!1,rippleX:i,rippleY:a,rippleSize:s,in:c,onExited:l,timeout:u}=e,[d,f]=_.useState(!1),p=o(t,n.ripple,n.rippleVisible,r&&n.ripplePulsate),m={width:s,height:s,top:-(s/2)+a,left:-(s/2)+i},h=o(n.child,d&&n.childLeaving,r&&n.childPulsate);return!c&&!d&&f(!0),_.useEffect(()=>{if(!c&&l!=null){let e=setTimeout(l,u);return()=>{clearTimeout(e)}}},[l,c,u]),(0,O.jsx)(`span`,{className:p,style:m,children:(0,O.jsx)(`span`,{className:h})})}var H=r(`MuiTouchRipple`,[`root`,`ripple`,`rippleVisible`,`ripplePulsate`,`child`,`childLeaving`,`childPulsate`]),U=550,W=a`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`,G=a`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`,K=a`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`,q=l(`span`,{name:`MuiTouchRipple`,slot:`Root`})({overflow:`hidden`,pointerEvents:`none`,position:`absolute`,zIndex:0,top:0,right:0,bottom:0,left:0,borderRadius:`inherit`}),J=l(ie,{name:`MuiTouchRipple`,slot:`Ripple`})`
  opacity: 0;
  position: absolute;

  &.${H.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${W};
    animation-duration: ${U}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  &.${H.ripplePulsate} {
    animation-duration: ${({theme:e})=>e.transitions.duration.shorter}ms;
  }

  & .${H.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${H.childLeaving} {
    opacity: 0;
    animation-name: ${G};
    animation-duration: ${U}ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
  }

  & .${H.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${K};
    animation-duration: 2500ms;
    animation-timing-function: ${({theme:e})=>e.transitions.easing.easeInOut};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`,ae=_.forwardRef(function(e,t){let{center:n=!1,classes:r={},className:i,...a}=c({props:e,name:`MuiTouchRipple`}),[s,l]=_.useState([]),u=_.useRef(0),d=_.useRef(null);_.useEffect(()=>{d.current&&=(d.current(),null)},[s]);let f=_.useRef(!1),p=T(),m=_.useRef(null),h=_.useRef(null),g=_.useCallback(e=>{let{pulsate:t,rippleX:n,rippleY:i,rippleSize:a,cb:s}=e;l(e=>[...e,(0,O.jsx)(J,{classes:{ripple:o(r.ripple,H.ripple),rippleVisible:o(r.rippleVisible,H.rippleVisible),ripplePulsate:o(r.ripplePulsate,H.ripplePulsate),child:o(r.child,H.child),childLeaving:o(r.childLeaving,H.childLeaving),childPulsate:o(r.childPulsate,H.childPulsate)},timeout:U,pulsate:t,rippleX:n,rippleY:i,rippleSize:a},u.current)]),u.current+=1,d.current=s},[r]),v=_.useCallback((e={},t={},r=()=>{})=>{let{pulsate:i=!1,center:a=n||t.pulsate,fakeElement:o=!1}=t;if(e?.type===`mousedown`&&f.current){f.current=!1;return}e?.type===`touchstart`&&(f.current=!0);let s=o?null:h.current,c=s?s.getBoundingClientRect():{width:0,height:0,left:0,top:0},l,u,d;if(a||e===void 0||e.clientX===0&&e.clientY===0||!e.clientX&&!e.touches)l=Math.round(c.width/2),u=Math.round(c.height/2);else{let{clientX:t,clientY:n}=e.touches&&e.touches.length>0?e.touches[0]:e;l=Math.round(t-c.left),u=Math.round(n-c.top)}if(a)d=Math.sqrt((2*c.width**2+c.height**2)/3),d%2==0&&(d+=1);else{let e=Math.max(Math.abs((s?s.clientWidth:0)-l),l)*2+2,t=Math.max(Math.abs((s?s.clientHeight:0)-u),u)*2+2;d=Math.sqrt(e**2+t**2)}e?.touches?m.current===null&&(m.current=()=>{g({pulsate:i,rippleX:l,rippleY:u,rippleSize:d,cb:r})},p.start(80,()=>{m.current&&=(m.current(),null)})):g({pulsate:i,rippleX:l,rippleY:u,rippleSize:d,cb:r})},[n,g,p]),y=_.useCallback(()=>{v({},{pulsate:!0})},[v]),b=_.useCallback((e,t)=>{if(p.clear(),e?.type===`touchend`&&m.current){m.current(),m.current=null,p.start(0,()=>{b(e,t)});return}m.current=null,l(e=>e.length>0?e.slice(1):e),d.current=t},[p]);return _.useImperativeHandle(t,()=>({pulsate:y,start:v,stop:b}),[y,v,b]),(0,O.jsx)(q,{className:o(H.root,r.root,i),ref:h,...a,children:(0,O.jsx)(z,{component:null,exit:!0,children:s})})});function oe(e){return n(`MuiButtonBase`,e)}var Y=r(`MuiButtonBase`,[`root`,`disabled`,`focusVisible`]),se=e=>{let{disabled:t,focusVisible:n,focusVisibleClassName:r,classes:i}=e,a=g({root:[`root`,t&&`disabled`,n&&`focusVisible`]},oe,i);return n&&r&&(a.root+=` ${r}`),a},ce=l(`button`,{name:`MuiButtonBase`,slot:`Root`,overridesResolver:(e,t)=>t.root})({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,position:`relative`,boxSizing:`border-box`,WebkitTapHighlightColor:`transparent`,backgroundColor:`transparent`,outline:0,border:0,margin:0,borderRadius:0,padding:0,cursor:`pointer`,userSelect:`none`,verticalAlign:`middle`,MozAppearance:`none`,WebkitAppearance:`none`,textDecoration:`none`,color:`inherit`,"&::-moz-focus-inner":{borderStyle:`none`},[`&.${Y.disabled}`]:{pointerEvents:`none`,cursor:`default`},"@media print":{colorAdjust:`exact`}}),le=_.forwardRef(function(e,t){let n=c({props:e,name:`MuiButtonBase`}),{action:r,centerRipple:i=!1,children:a,className:s,component:l=`button`,disabled:d=!1,disableRipple:f=!1,disableTouchRipple:p=!1,focusRipple:m=!1,focusVisibleClassName:h,LinkComponent:g=`a`,onBlur:v,onClick:y,onContextMenu:b,onDragLeave:x,onFocus:S,onFocusVisible:C,onKeyDown:w,onKeyUp:T,onMouseDown:D,onMouseLeave:k,onMouseUp:ee,onTouchEnd:A,onTouchMove:te,onTouchStart:ne,tabIndex:M=0,TouchRippleProps:N,touchRippleRef:P,type:F,...I}=n,L=_.useRef(null),R=re(),z=u(R.ref,P),[B,V]=_.useState(!1);d&&B&&V(!1),_.useImperativeHandle(r,()=>({focusVisible:()=>{V(!0),L.current.focus()}}),[]);let ie=R.shouldMount&&!f&&!d;_.useEffect(()=>{B&&m&&!f&&R.pulsate()},[f,m,B,R]);let H=X(R,`start`,D,p),U=X(R,`stop`,b,p),W=X(R,`stop`,x,p),G=X(R,`stop`,ee,p),K=X(R,`stop`,e=>{B&&e.preventDefault(),k&&k(e)},p),q=X(R,`start`,ne,p),J=X(R,`stop`,A,p),oe=X(R,`stop`,te,p),Y=X(R,`stop`,e=>{E(e.target)||V(!1),v&&v(e)},!1),le=j(e=>{L.current||=e.currentTarget,E(e.target)&&(V(!0),C&&C(e)),S&&S(e)}),Z=()=>{let e=L.current;return l&&l!==`button`&&!(e.tagName===`A`&&e.href)},ue=j(e=>{m&&!e.repeat&&B&&e.key===` `&&R.stop(e,()=>{R.start(e)}),e.target===e.currentTarget&&Z()&&e.key===` `&&e.preventDefault(),w&&w(e),e.target===e.currentTarget&&Z()&&e.key===`Enter`&&!d&&(e.preventDefault(),y&&y(e))}),de=j(e=>{m&&e.key===` `&&B&&!e.defaultPrevented&&R.stop(e,()=>{R.pulsate(e)}),T&&T(e),y&&e.target===e.currentTarget&&Z()&&e.key===` `&&!e.defaultPrevented&&y(e)}),Q=l;Q===`button`&&(I.href||I.to)&&(Q=g);let $={};Q===`button`?($.type=F===void 0?`button`:F,$.disabled=d):(!I.href&&!I.to&&($.role=`button`),d&&($[`aria-disabled`]=d));let fe=u(t,L),pe={...n,centerRipple:i,component:l,disabled:d,disableRipple:f,disableTouchRipple:p,focusRipple:m,tabIndex:M,focusVisible:B},me=se(pe);return(0,O.jsxs)(ce,{as:Q,className:o(me.root,s),ownerState:pe,onBlur:Y,onClick:y,onContextMenu:U,onFocus:le,onKeyDown:ue,onKeyUp:de,onMouseDown:H,onMouseLeave:K,onMouseUp:G,onDragLeave:W,onTouchEnd:J,onTouchMove:oe,onTouchStart:q,ref:fe,tabIndex:d?-1:M,type:F,...$,...I,children:[a,ie?(0,O.jsx)(ae,{ref:z,center:i,...N}):null]})});function X(e,t,n,r=!1){return j(i=>(n&&n(i),r||e[t](i),!0))}export{w as a,v as c,E as i,j as n,T as o,te as r,y as s,le as t};