(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();var Gt;(function(s){s.Range="range",s.Steps="steps",s.Positions="positions",s.Count="count",s.Values="values"})(Gt||(Gt={}));var yt;(function(s){s[s.None=-1]="None",s[s.NoValue=0]="NoValue",s[s.LargeValue=1]="LargeValue",s[s.SmallValue=2]="SmallValue"})(yt||(yt={}));function pl(s){return ws(s)&&typeof s.from=="function"}function ws(s){return typeof s=="object"&&typeof s.to=="function"}function Ja(s){s.parentElement.removeChild(s)}function ra(s){return s!=null}function ti(s){s.preventDefault()}function fl(s){return s.filter(function(t){return this[t]?!1:this[t]=!0},{})}function bl(s,t){return Math.round(s/t)*t}function gl(s,t){var e=s.getBoundingClientRect(),a=s.ownerDocument,i=a.documentElement,n=Tn(a);return/webkit.*Chrome.*Mobile/i.test(navigator.userAgent)&&(n.x=0),t?e.top+n.y-i.clientTop:e.left+n.x-i.clientLeft}function Dt(s){return typeof s=="number"&&!isNaN(s)&&isFinite(s)}function ei(s,t,e){e>0&&(pt(s,t),setTimeout(function(){ms(s,t)},e))}function si(s){return Math.max(Math.min(s,100),0)}function Ts(s){return Array.isArray(s)?s:[s]}function vl(s){s=String(s);var t=s.split(".");return t.length>1?t[1].length:0}function pt(s,t){s.classList&&!/\s/.test(t)?s.classList.add(t):s.className+=" "+t}function ms(s,t){s.classList&&!/\s/.test(t)?s.classList.remove(t):s.className=s.className.replace(new RegExp("(^|\\b)"+t.split(" ").join("|")+"(\\b|$)","gi")," ")}function ml(s,t){return s.classList?s.classList.contains(t):new RegExp("\\b"+t+"\\b").test(s.className)}function Tn(s){var t=window.pageXOffset!==void 0,e=(s.compatMode||"")==="CSS1Compat",a=t?window.pageXOffset:e?s.documentElement.scrollLeft:s.body.scrollLeft,i=t?window.pageYOffset:e?s.documentElement.scrollTop:s.body.scrollTop;return{x:a,y:i}}function xl(){return window.navigator.pointerEnabled?{start:"pointerdown",move:"pointermove",end:"pointerup"}:window.navigator.msPointerEnabled?{start:"MSPointerDown",move:"MSPointerMove",end:"MSPointerUp"}:{start:"mousedown touchstart",move:"mousemove touchmove",end:"mouseup touchend"}}function yl(){var s=!1;try{var t=Object.defineProperty({},"passive",{get:function(){s=!0}});window.addEventListener("test",null,t)}catch{}return s}function wl(){return window.CSS&&CSS.supports&&CSS.supports("touch-action","none")}function Sa(s,t){return 100/(t-s)}function ca(s,t,e){return t*100/(s[e+1]-s[e])}function kl(s,t){return ca(s,s[0]<0?t+Math.abs(s[0]):t-s[0],0)}function Sl(s,t){return t*(s[1]-s[0])/100+s[0]}function We(s,t){for(var e=1;s>=t[e];)e+=1;return e}function _l(s,t,e){if(e>=s.slice(-1)[0])return 100;var a=We(e,s),i=s[a-1],n=s[a],o=t[a-1],l=t[a];return o+kl([i,n],e)/Sa(o,l)}function Cl(s,t,e){if(e>=100)return s.slice(-1)[0];var a=We(e,t),i=s[a-1],n=s[a],o=t[a-1],l=t[a];return Sl([i,n],(e-o)*Sa(o,l))}function Ml(s,t,e,a){if(a===100)return a;var i=We(a,s),n=s[i-1],o=s[i];return e?a-n>(o-n)/2?o:n:t[i-1]?s[i-1]+bl(a-s[i-1],t[i-1]):a}var Ln=(function(){function s(t,e,a){this.xPct=[],this.xVal=[],this.xSteps=[],this.xNumSteps=[],this.xHighestCompleteStep=[],this.xSteps=[a||!1],this.xNumSteps=[!1],this.snap=e;var i,n=[];for(Object.keys(t).forEach(function(o){n.push([Ts(t[o]),o])}),n.sort(function(o,l){return o[0][0]-l[0][0]}),i=0;i<n.length;i++)this.handleEntryPoint(n[i][1],n[i][0]);for(this.xNumSteps=this.xSteps.slice(0),i=0;i<this.xNumSteps.length;i++)this.handleStepPoint(i,this.xNumSteps[i])}return s.prototype.getDistance=function(t){for(var e=[],a=0;a<this.xNumSteps.length-1;a++)e[a]=ca(this.xVal,t,a);return e},s.prototype.getAbsoluteDistance=function(t,e,a){var i=0;if(t<this.xPct[this.xPct.length-1])for(;t>this.xPct[i+1];)i++;else t===this.xPct[this.xPct.length-1]&&(i=this.xPct.length-2);!a&&t===this.xPct[i+1]&&i++,e===null&&(e=[]);var n,o=1,l=e[i],r=0,c=0,d=0,u=0;for(a?n=(t-this.xPct[i])/(this.xPct[i+1]-this.xPct[i]):n=(this.xPct[i+1]-t)/(this.xPct[i+1]-this.xPct[i]);l>0;)r=this.xPct[i+1+u]-this.xPct[i+u],e[i+u]*o+100-n*100>100?(c=r*n,o=(l-100*n)/e[i+u],n=1):(c=e[i+u]*r/100*o,o=0),a?(d=d-c,this.xPct.length+u>=1&&u--):(d=d+c,this.xPct.length-u>=1&&u++),l=e[i+u]*o;return t+d},s.prototype.toStepping=function(t){return t=_l(this.xVal,this.xPct,t),t},s.prototype.fromStepping=function(t){return Cl(this.xVal,this.xPct,t)},s.prototype.getStep=function(t){return t=Ml(this.xPct,this.xSteps,this.snap,t),t},s.prototype.getDefaultStep=function(t,e,a){var i=We(t,this.xPct);return(t===100||e&&t===this.xPct[i-1])&&(i=Math.max(i-1,1)),(this.xVal[i]-this.xVal[i-1])/a},s.prototype.getNearbySteps=function(t){var e=We(t,this.xPct);return{stepBefore:{startValue:this.xVal[e-2],step:this.xNumSteps[e-2],highestStep:this.xHighestCompleteStep[e-2]},thisStep:{startValue:this.xVal[e-1],step:this.xNumSteps[e-1],highestStep:this.xHighestCompleteStep[e-1]},stepAfter:{startValue:this.xVal[e],step:this.xNumSteps[e],highestStep:this.xHighestCompleteStep[e]}}},s.prototype.countStepDecimals=function(){var t=this.xNumSteps.map(vl);return Math.max.apply(null,t)},s.prototype.hasNoSize=function(){return this.xVal[0]===this.xVal[this.xVal.length-1]},s.prototype.convert=function(t){return this.getStep(this.toStepping(t))},s.prototype.handleEntryPoint=function(t,e){var a;if(t==="min"?a=0:t==="max"?a=100:a=parseFloat(t),!Dt(a)||!Dt(e[0]))throw new Error("noUiSlider: 'range' value isn't numeric.");this.xPct.push(a),this.xVal.push(e[0]);var i=Number(e[1]);a?this.xSteps.push(isNaN(i)?!1:i):isNaN(i)||(this.xSteps[0]=i),this.xHighestCompleteStep.push(0)},s.prototype.handleStepPoint=function(t,e){if(e){if(this.xVal[t]===this.xVal[t+1]){this.xSteps[t]=this.xHighestCompleteStep[t]=this.xVal[t];return}this.xSteps[t]=ca([this.xVal[t],this.xVal[t+1]],e,0)/Sa(this.xPct[t],this.xPct[t+1]);var a=(this.xVal[t+1]-this.xVal[t])/this.xNumSteps[t],i=Math.ceil(Number(a.toFixed(3))-1),n=this.xVal[t]+this.xNumSteps[t]*i;this.xHighestCompleteStep[t]=n}},s})(),ai={to:function(s){return s===void 0?"":s.toFixed(2)},from:Number},On={target:"target",base:"base",origin:"origin",handle:"handle",handleLower:"handle-lower",handleUpper:"handle-upper",touchArea:"touch-area",horizontal:"horizontal",vertical:"vertical",background:"background",connect:"connect",connects:"connects",ltr:"ltr",rtl:"rtl",textDirectionLtr:"txt-dir-ltr",textDirectionRtl:"txt-dir-rtl",draggable:"draggable",drag:"state-drag",tap:"state-tap",active:"active",tooltip:"tooltip",pips:"pips",pipsHorizontal:"pips-horizontal",pipsVertical:"pips-vertical",marker:"marker",markerHorizontal:"marker-horizontal",markerVertical:"marker-vertical",markerNormal:"marker-normal",markerLarge:"marker-large",markerSub:"marker-sub",value:"value",valueHorizontal:"value-horizontal",valueVertical:"value-vertical",valueNormal:"value-normal",valueLarge:"value-large",valueSub:"value-sub"},Yt={tooltips:".__tooltips",aria:".__aria"};function Pl(s,t){if(!Dt(t))throw new Error("noUiSlider: 'step' is not numeric.");s.singleStep=t}function Al(s,t){if(!Dt(t))throw new Error("noUiSlider: 'keyboardPageMultiplier' is not numeric.");s.keyboardPageMultiplier=t}function Dl(s,t){if(!Dt(t))throw new Error("noUiSlider: 'keyboardMultiplier' is not numeric.");s.keyboardMultiplier=t}function Tl(s,t){if(!Dt(t))throw new Error("noUiSlider: 'keyboardDefaultStep' is not numeric.");s.keyboardDefaultStep=t}function Ll(s,t){if(typeof t!="object"||Array.isArray(t))throw new Error("noUiSlider: 'range' is not an object.");if(t.min===void 0||t.max===void 0)throw new Error("noUiSlider: Missing 'min' or 'max' in 'range'.");s.spectrum=new Ln(t,s.snap||!1,s.singleStep)}function Ol(s,t){if(t=Ts(t),!Array.isArray(t)||!t.length)throw new Error("noUiSlider: 'start' option is incorrect.");s.handles=t.length,s.start=t}function El(s,t){if(typeof t!="boolean")throw new Error("noUiSlider: 'snap' option must be a boolean.");s.snap=t}function Il(s,t){if(typeof t!="boolean")throw new Error("noUiSlider: 'animate' option must be a boolean.");s.animate=t}function Rl(s,t){if(typeof t!="number")throw new Error("noUiSlider: 'animationDuration' option must be a number.");s.animationDuration=t}function En(s,t){var e=[!1],a;if(t==="lower"?t=[!0,!1]:t==="upper"&&(t=[!1,!0]),t===!0||t===!1){for(a=1;a<s.handles;a++)e.push(t);e.push(!1)}else{if(!Array.isArray(t)||!t.length||t.length!==s.handles+1)throw new Error("noUiSlider: 'connect' option doesn't match handle count.");e=t}s.connect=e}function zl(s,t){switch(t){case"horizontal":s.ort=0;break;case"vertical":s.ort=1;break;default:throw new Error("noUiSlider: 'orientation' option is invalid.")}}function In(s,t){if(!Dt(t))throw new Error("noUiSlider: 'margin' option must be numeric.");t!==0&&(s.margin=s.spectrum.getDistance(t))}function Bl(s,t){if(!Dt(t))throw new Error("noUiSlider: 'limit' option must be numeric.");if(s.limit=s.spectrum.getDistance(t),!s.limit||s.handles<2)throw new Error("noUiSlider: 'limit' option is only supported on linear sliders with 2 or more handles.")}function Fl(s,t){var e;if(!Dt(t)&&!Array.isArray(t))throw new Error("noUiSlider: 'padding' option must be numeric or array of exactly 2 numbers.");if(Array.isArray(t)&&!(t.length===2||Dt(t[0])||Dt(t[1])))throw new Error("noUiSlider: 'padding' option must be numeric or array of exactly 2 numbers.");if(t!==0){for(Array.isArray(t)||(t=[t,t]),s.padding=[s.spectrum.getDistance(t[0]),s.spectrum.getDistance(t[1])],e=0;e<s.spectrum.xNumSteps.length-1;e++)if(s.padding[0][e]<0||s.padding[1][e]<0)throw new Error("noUiSlider: 'padding' option must be a positive number(s).");var a=t[0]+t[1],i=s.spectrum.xVal[0],n=s.spectrum.xVal[s.spectrum.xVal.length-1];if(a/(n-i)>1)throw new Error("noUiSlider: 'padding' option must not exceed 100% of the range.")}}function Vl(s,t){switch(t){case"ltr":s.dir=0;break;case"rtl":s.dir=1;break;default:throw new Error("noUiSlider: 'direction' option was not recognized.")}}function Hl(s,t){if(typeof t!="string")throw new Error("noUiSlider: 'behaviour' must be a string containing options.");var e=t.indexOf("tap")>=0,a=t.indexOf("drag")>=0,i=t.indexOf("fixed")>=0,n=t.indexOf("snap")>=0,o=t.indexOf("hover")>=0,l=t.indexOf("unconstrained")>=0,r=t.indexOf("invert-connects")>=0,c=t.indexOf("drag-all")>=0,d=t.indexOf("smooth-steps")>=0;if(i){if(s.handles!==2)throw new Error("noUiSlider: 'fixed' behaviour must be used with 2 handles");In(s,s.start[1]-s.start[0])}if(r&&s.handles!==2)throw new Error("noUiSlider: 'invert-connects' behaviour must be used with 2 handles");if(l&&(s.margin||s.limit))throw new Error("noUiSlider: 'unconstrained' behaviour cannot be used with margin or limit");s.events={tap:e||n,drag:a,dragAll:c,smoothSteps:d,fixed:i,snap:n,hover:o,unconstrained:l,invertConnects:r}}function jl(s,t){if(t!==!1)if(t===!0||ws(t)){s.tooltips=[];for(var e=0;e<s.handles;e++)s.tooltips.push(t)}else{if(t=Ts(t),t.length!==s.handles)throw new Error("noUiSlider: must pass a formatter for all handles.");t.forEach(function(a){if(typeof a!="boolean"&&!ws(a))throw new Error("noUiSlider: 'tooltips' must be passed a formatter or 'false'.")}),s.tooltips=t}}function Nl(s,t){if(t.length!==s.handles)throw new Error("noUiSlider: must pass a attributes for all handles.");s.handleAttributes=t}function Wl(s,t){if(!ws(t))throw new Error("noUiSlider: 'ariaFormat' requires 'to' method.");s.ariaFormat=t}function Ul(s,t){if(!pl(t))throw new Error("noUiSlider: 'format' requires 'to' and 'from' methods.");s.format=t}function $l(s,t){if(typeof t!="boolean")throw new Error("noUiSlider: 'keyboardSupport' option must be a boolean.");s.keyboardSupport=t}function Yl(s,t){s.documentElement=t}function Gl(s,t){if(typeof t!="string"&&t!==!1)throw new Error("noUiSlider: 'cssPrefix' must be a string or `false`.");s.cssPrefix=t}function Xl(s,t){if(typeof t!="object")throw new Error("noUiSlider: 'cssClasses' must be an object.");typeof s.cssPrefix=="string"?(s.cssClasses={},Object.keys(t).forEach(function(e){s.cssClasses[e]=s.cssPrefix+t[e]})):s.cssClasses=t}function Rn(s){var t={margin:null,limit:null,padding:null,animate:!0,animationDuration:300,ariaFormat:ai,format:ai},e={step:{r:!1,t:Pl},keyboardPageMultiplier:{r:!1,t:Al},keyboardMultiplier:{r:!1,t:Dl},keyboardDefaultStep:{r:!1,t:Tl},start:{r:!0,t:Ol},connect:{r:!0,t:En},direction:{r:!0,t:Vl},snap:{r:!1,t:El},animate:{r:!1,t:Il},animationDuration:{r:!1,t:Rl},range:{r:!0,t:Ll},orientation:{r:!1,t:zl},margin:{r:!1,t:In},limit:{r:!1,t:Bl},padding:{r:!1,t:Fl},behaviour:{r:!0,t:Hl},ariaFormat:{r:!1,t:Wl},format:{r:!1,t:Ul},tooltips:{r:!1,t:jl},keyboardSupport:{r:!0,t:$l},documentElement:{r:!1,t:Yl},cssPrefix:{r:!0,t:Gl},cssClasses:{r:!0,t:Xl},handleAttributes:{r:!1,t:Nl}},a={connect:!1,direction:"ltr",behaviour:"tap",orientation:"horizontal",keyboardSupport:!0,cssPrefix:"noUi-",cssClasses:On,keyboardPageMultiplier:5,keyboardMultiplier:1,keyboardDefaultStep:10};s.format&&!s.ariaFormat&&(s.ariaFormat=s.format),Object.keys(e).forEach(function(r){if(!ra(s[r])&&a[r]===void 0){if(e[r].r)throw new Error("noUiSlider: '"+r+"' is required.");return}e[r].t(t,ra(s[r])?s[r]:a[r])}),t.pips=s.pips;var i=document.createElement("div"),n=i.style.msTransform!==void 0,o=i.style.transform!==void 0;t.transformRule=o?"transform":n?"msTransform":"webkitTransform";var l=[["left","top"],["right","bottom"]];return t.style=l[t.dir][t.ort],t}function ql(s,t,e){var a=xl(),i=wl(),n=i&&yl(),o=s,l,r,c,d,u,h,p=t.spectrum,b=[],f=[],v=[],x=0,w={},_=!1,S=s.ownerDocument,k=t.documentElement||S.documentElement,P=S.body,T=S.dir==="rtl"||t.ort===1?0:100;function M(g,m){var y=S.createElement("div");return m&&pt(y,m),g.appendChild(y),y}function O(g,m){var y=M(g,t.cssClasses.origin),C=M(y,t.cssClasses.handle);if(M(C,t.cssClasses.touchArea),C.setAttribute("data-handle",String(m)),t.keyboardSupport&&(C.setAttribute("tabindex","0"),C.addEventListener("keydown",function(D){return al(D,m)})),t.handleAttributes!==void 0){var A=t.handleAttributes[m];Object.keys(A).forEach(function(D){C.setAttribute(D,A[D])})}return C.setAttribute("role","slider"),C.setAttribute("aria-orientation",t.ort?"vertical":"horizontal"),m===0?pt(C,t.cssClasses.handleLower):m===t.handles-1&&pt(C,t.cssClasses.handleUpper),y.handle=C,y}function R(g,m){return m?M(g,t.cssClasses.connect):!1}function z(g,m){r=M(m,t.cssClasses.connects),c=[],d=[],d.push(R(r,g[0]));for(var y=0;y<t.handles;y++)c.push(O(m,y)),v[y]=y,d.push(R(r,g[y+1]))}function F(g){pt(g,t.cssClasses.target),t.dir===0?pt(g,t.cssClasses.ltr):pt(g,t.cssClasses.rtl),t.ort===0?pt(g,t.cssClasses.horizontal):pt(g,t.cssClasses.vertical);var m=getComputedStyle(g).direction;return m==="rtl"?pt(g,t.cssClasses.textDirectionRtl):pt(g,t.cssClasses.textDirectionLtr),M(g,t.cssClasses.base)}function it(g,m){return!t.tooltips||!t.tooltips[m]?!1:M(g.firstChild,t.cssClasses.tooltip)}function ut(){return o.hasAttribute("disabled")}function H(g){var m=c[g];return m.hasAttribute("disabled")}function Y(g){g!=null?(c[g].setAttribute("disabled",""),c[g].handle.removeAttribute("tabindex")):(o.setAttribute("disabled",""),c.forEach(function(m){m.handle.removeAttribute("tabindex")}))}function Z(g){g!=null?(c[g].removeAttribute("disabled"),c[g].handle.setAttribute("tabindex","0")):(o.removeAttribute("disabled"),c.forEach(function(m){m.removeAttribute("disabled"),m.handle.setAttribute("tabindex","0")}))}function xt(){h&&(Me("update"+Yt.tooltips),h.forEach(function(g){g&&Ja(g)}),h=null)}function nt(){xt(),h=c.map(it),js("update"+Yt.tooltips,function(g,m,y){if(!(!h||!t.tooltips)&&h[m]!==!1){var C=g[m];t.tooltips[m]!==!0&&(C=t.tooltips[m].to(y[m])),h[m].innerHTML=C}})}function $t(){Me("update"+Yt.aria),js("update"+Yt.aria,function(g,m,y,C,A){v.forEach(function(D){var E=c[D],L=ts(f,D,0,!0,!0,!0),U=ts(f,D,100,!0,!0,!0),$=A[D],Q=String(t.ariaFormat.to(y[D]));L=p.fromStepping(L).toFixed(1),U=p.fromStepping(U).toFixed(1),$=p.fromStepping($).toFixed(1),E.children[0].setAttribute("aria-valuemin",L),E.children[0].setAttribute("aria-valuemax",U),E.children[0].setAttribute("aria-valuenow",$),E.children[0].setAttribute("aria-valuetext",Q)})})}function me(g){if(g.mode===Gt.Range||g.mode===Gt.Steps)return p.xVal;if(g.mode===Gt.Count){if(g.values<2)throw new Error("noUiSlider: 'values' (>= 2) required for mode 'count'.");for(var m=g.values-1,y=100/m,C=[];m--;)C[m]=m*y;return C.push(100),Et(C,g.stepped)}return g.mode===Gt.Positions?Et(g.values,g.stepped):g.mode===Gt.Values?g.stepped?g.values.map(function(A){return p.fromStepping(p.getStep(p.toStepping(A)))}):g.values:[]}function Et(g,m){return g.map(function(y){return p.fromStepping(m?p.getStep(y):y)})}function ae(g){function m($,Q){return Number(($+Q).toFixed(7))}var y=me(g),C={},A=p.xVal[0],D=p.xVal[p.xVal.length-1],E=!1,L=!1,U=0;return y=fl(y.slice().sort(function($,Q){return $-Q})),y[0]!==A&&(y.unshift(A),E=!0),y[y.length-1]!==D&&(y.push(D),L=!0),y.forEach(function($,Q){var J,N,at,ht=$,rt=y[Q+1],dt,Us,$s,Ys,Ka,Gs,Za,Qa=g.mode===Gt.Steps;for(Qa&&(J=p.xNumSteps[Q]),J||(J=rt-ht),rt===void 0&&(rt=ht),J=Math.max(J,1e-7),N=ht;N<=rt;N=m(N,J)){for(dt=p.toStepping(N),Us=dt-U,Ka=Us/(g.density||1),Gs=Math.round(Ka),Za=Us/Gs,at=1;at<=Gs;at+=1)$s=U+at*Za,C[$s.toFixed(5)]=[p.fromStepping($s),0];Ys=y.indexOf(N)>-1?yt.LargeValue:Qa?yt.SmallValue:yt.NoValue,!Q&&E&&N!==rt&&(Ys=0),N===rt&&L||(C[dt.toFixed(5)]=[N,Ys]),U=dt}}),C}function It(g,m,y){var C,A,D=S.createElement("div"),E=(C={},C[yt.None]="",C[yt.NoValue]=t.cssClasses.valueNormal,C[yt.LargeValue]=t.cssClasses.valueLarge,C[yt.SmallValue]=t.cssClasses.valueSub,C),L=(A={},A[yt.None]="",A[yt.NoValue]=t.cssClasses.markerNormal,A[yt.LargeValue]=t.cssClasses.markerLarge,A[yt.SmallValue]=t.cssClasses.markerSub,A),U=[t.cssClasses.valueHorizontal,t.cssClasses.valueVertical],$=[t.cssClasses.markerHorizontal,t.cssClasses.markerVertical];pt(D,t.cssClasses.pips),pt(D,t.ort===0?t.cssClasses.pipsHorizontal:t.cssClasses.pipsVertical);function Q(N,at){var ht=at===t.cssClasses.value,rt=ht?U:$,dt=ht?E:L;return at+" "+rt[t.ort]+" "+dt[N]}function J(N,at,ht){if(ht=m?m(at,ht):ht,ht!==yt.None){var rt=M(D,!1);rt.className=Q(ht,t.cssClasses.marker),rt.style[t.style]=N+"%",ht>yt.NoValue&&(rt=M(D,!1),rt.className=Q(ht,t.cssClasses.value),rt.setAttribute("data-value",String(at)),rt.style[t.style]=N+"%",rt.innerHTML=String(y.to(at)))}}return Object.keys(g).forEach(function(N){J(N,g[N][0],g[N][1])}),D}function Rt(){u&&(Ja(u),u=null)}function Pt(g){Rt();var m=ae(g),y=g.filter,C=g.format||{to:function(A){return String(Math.round(A))}};return u=o.appendChild(It(m,y,C)),u}function ja(){var g=l.getBoundingClientRect(),m="offset"+["Width","Height"][t.ort];return t.ort===0?g.width||l[m]:g.height||l[m]}function ie(g,m,y,C){var A=function(E){var L=Zo(E,C.pageOffset,C.target||m);if(!L||ut()&&!C.doNotReject||ml(o,t.cssClasses.tap)&&!C.doNotReject||g===a.start&&L.buttons!==void 0&&L.buttons>1||C.hover&&L.buttons)return!1;n||L.preventDefault(),L.calcPoint=L.points[t.ort],y(L,C)},D=[];return g.split(" ").forEach(function(E){m.addEventListener(E,A,n?{passive:!0}:!1),D.push([E,A])}),D}function Zo(g,m,y){var C=g.type.indexOf("touch")===0,A=g.type.indexOf("mouse")===0,D=g.type.indexOf("pointer")===0,E=0,L=0;if(g.type.indexOf("MSPointer")===0&&(D=!0),g.type==="mousedown"&&!g.buttons&&!g.touches)return!1;if(C){var U=function(J){var N=J.target;return N===y||y.contains(N)||g.composed&&g.composedPath().shift()===y};if(g.type==="touchstart"){var $=Array.prototype.filter.call(g.touches,U);if($.length>1)return!1;E=$[0].pageX,L=$[0].pageY}else{var Q=Array.prototype.find.call(g.changedTouches,U);if(!Q)return!1;E=Q.pageX,L=Q.pageY}}return m=m||Tn(S),(A||D)&&(E=g.clientX+m.x,L=g.clientY+m.y),g.pageOffset=m,g.points=[E,L],g.cursor=A||D,g}function Na(g){var m=g-gl(l,t.ort),y=m*100/ja();return y=si(y),t.dir?100-y:y}function Qo(g){var m=100,y=!1;return c.forEach(function(C,A){if(!H(A)){var D=f[A],E=Math.abs(D-g),L=E===100&&m===100,U=E<m,$=E<=m&&g>D;(U||$||L)&&(y=A,m=E)}}),y}function Jo(g,m){g.type==="mouseout"&&g.target.nodeName==="HTML"&&g.relatedTarget===null&&Vs(g,m)}function tl(g,m){if(navigator.appVersion.indexOf("MSIE 9")===-1&&g.buttons===0&&m.buttonsProperty!==0)return Vs(g,m);var y=(t.dir?-1:1)*(g.calcPoint-m.startCalcPoint),C=y*100/m.baseSize;Ua(y>0,C,m.locations,m.handleNumbers,m.connect)}function Vs(g,m){m.handle&&(ms(m.handle,t.cssClasses.active),x-=1),m.listeners.forEach(function(y){k.removeEventListener(y[0],y[1])}),x===0&&(ms(o,t.cssClasses.drag),Ws(),g.cursor&&(P.style.cursor="",P.removeEventListener("selectstart",ti))),t.events.smoothSteps&&(m.handleNumbers.forEach(function(y){ne(y,f[y],!0,!0,!1,!1)}),m.handleNumbers.forEach(function(y){et("update",y)})),m.handleNumbers.forEach(function(y){et("change",y),et("set",y),et("end",y)})}function Hs(g,m){if(!m.handleNumbers.some(H)){var y;if(m.handleNumbers.length===1){var C=c[m.handleNumbers[0]];y=C.children[0],x+=1,pt(y,t.cssClasses.active)}g.stopPropagation();var A=[],D=ie(a.move,k,tl,{target:g.target,handle:y,connect:m.connect,listeners:A,startCalcPoint:g.calcPoint,baseSize:ja(),pageOffset:g.pageOffset,handleNumbers:m.handleNumbers,buttonsProperty:g.buttons,locations:f.slice()}),E=ie(a.end,k,Vs,{target:g.target,handle:y,listeners:A,doNotReject:!0,handleNumbers:m.handleNumbers}),L=ie("mouseout",k,Jo,{target:g.target,handle:y,listeners:A,doNotReject:!0,handleNumbers:m.handleNumbers});A.push.apply(A,D.concat(E,L)),g.cursor&&(P.style.cursor=getComputedStyle(g.target).cursor,c.length>1&&pt(o,t.cssClasses.drag),P.addEventListener("selectstart",ti,!1)),m.handleNumbers.forEach(function(U){et("start",U)})}}function el(g){g.stopPropagation();var m=Na(g.calcPoint),y=Qo(m);y!==!1&&(t.events.snap||ei(o,t.cssClasses.tap,t.animationDuration),ne(y,m,!0,!0),Ws(),et("slide",y,!0),et("update",y,!0),t.events.snap?Hs(g,{handleNumbers:[y]}):(et("change",y,!0),et("set",y,!0)))}function sl(g){var m=Na(g.calcPoint),y=p.getStep(m),C=p.fromStepping(y);Object.keys(w).forEach(function(A){A.split(".")[0]==="hover"&&w[A].forEach(function(D){D.call(ss,C)})})}function al(g,m){if(ut()||H(m))return!1;var y=["Left","Right"],C=["Down","Up"],A=["PageDown","PageUp"],D=["Home","End"];t.dir&&!t.ort?y.reverse():t.ort&&!t.dir&&(C.reverse(),A.reverse());var E=g.key.replace("Arrow",""),L=E===A[0],U=E===A[1],$=E===C[0]||E===y[0]||L,Q=E===C[1]||E===y[1]||U,J=E===D[0],N=E===D[1];if(!$&&!Q&&!J&&!N)return!0;g.preventDefault();var at;if(Q||$){var ht=$?0:1,rt=Xa(m),dt=rt[ht];if(dt===null)return!1;dt===!1&&(dt=p.getDefaultStep(f[m],$,t.keyboardDefaultStep)),U||L?dt*=t.keyboardPageMultiplier:dt*=t.keyboardMultiplier,dt=Math.max(dt,1e-7),dt=($?-1:1)*dt,at=b[m]+dt}else N?at=t.spectrum.xVal[t.spectrum.xVal.length-1]:at=t.spectrum.xVal[0];return ne(m,p.toStepping(at),!0,!0),et("slide",m),et("update",m),et("change",m),et("set",m),!1}function Wa(g){g.fixed||c.forEach(function(m,y){ie(a.start,m.children[0],Hs,{handleNumbers:[y]})}),g.tap&&ie(a.start,l,el,{}),g.hover&&ie(a.move,l,sl,{hover:!0}),g.drag&&d.forEach(function(m,y){if(!(m===!1||y===0||y===d.length-1)){var C=c[y-1],A=c[y],D=[m],E=[C,A],L=[y-1,y];pt(m,t.cssClasses.draggable),g.fixed&&(D.push(C.children[0]),D.push(A.children[0])),g.dragAll&&(E=c,L=v),D.forEach(function(U){ie(a.start,U,Hs,{handles:E,handleNumbers:L,connect:m})})}})}function js(g,m){w[g]=w[g]||[],w[g].push(m),g.split(".")[0]==="update"&&c.forEach(function(y,C){et("update",C)})}function il(g){return g===Yt.aria||g===Yt.tooltips}function Me(g){var m=g&&g.split(".")[0],y=m?g.substring(m.length):g;Object.keys(w).forEach(function(C){var A=C.split(".")[0],D=C.substring(A.length);(!m||m===A)&&(!y||y===D)&&(!il(D)||y===D)&&delete w[C]})}function et(g,m,y){Object.keys(w).forEach(function(C){var A=C.split(".")[0];g===A&&w[C].forEach(function(D){D.call(ss,b.map(t.format.to),m,b.slice(),y||!1,f.slice(),ss)})})}function ts(g,m,y,C,A,D,E){var L;return c.length>1&&!t.events.unconstrained&&(C&&m>0&&(L=p.getAbsoluteDistance(g[m-1],t.margin,!1),y=Math.max(y,L)),A&&m<c.length-1&&(L=p.getAbsoluteDistance(g[m+1],t.margin,!0),y=Math.min(y,L))),c.length>1&&t.limit&&(C&&m>0&&(L=p.getAbsoluteDistance(g[m-1],t.limit,!1),y=Math.min(y,L)),A&&m<c.length-1&&(L=p.getAbsoluteDistance(g[m+1],t.limit,!0),y=Math.max(y,L))),t.padding&&(m===0&&(L=p.getAbsoluteDistance(0,t.padding[0],!1),y=Math.max(y,L)),m===c.length-1&&(L=p.getAbsoluteDistance(100,t.padding[1],!0),y=Math.min(y,L))),E||(y=p.getStep(y)),y=si(y),y===g[m]&&!D?!1:y}function Ns(g,m){var y=t.ort;return(y?m:g)+", "+(y?g:m)}function Ua(g,m,y,C,A){var D=y.slice(),E=C[0],L=t.events.smoothSteps,U=[!g,g],$=[g,!g];C=C.slice(),g&&C.reverse(),C.length>1?C.forEach(function(J,N){var at=ts(D,J,D[J]+m,U[N],$[N],!1,L);at===!1?m=0:(m=at-D[J],D[J]=at)}):U=$=[!0];var Q=!1;C.forEach(function(J,N){Q=ne(J,y[J]+m,U[N],$[N],!1,L)||Q}),Q&&(C.forEach(function(J){et("update",J),et("slide",J)}),A!=null&&et("drag",E))}function $a(g,m){return t.dir?100-g-m:g}function nl(g,m){f[g]=m,b[g]=p.fromStepping(m);var y=$a(m,0)-T,C="translate("+Ns(y+"%","0")+")";if(c[g].style[t.transformRule]=C,t.events.invertConnects&&f.length>1){var A=f.every(function(D,E,L){return E===0||D>=L[E-1]});if(_!==!A){ul();return}}Pe(g),Pe(g+1),_&&(Pe(g-1),Pe(g+2))}function Ws(){v.forEach(function(g){var m=f[g]>50?-1:1,y=3+(c.length+m*g);c[g].style.zIndex=String(y)})}function ne(g,m,y,C,A,D){return A||(m=ts(f,g,m,y,C,!1,D)),m===!1?!1:(nl(g,m),!0)}function Pe(g){if(d[g]){var m=f.slice();_&&m.sort(function(L,U){return L-U});var y=0,C=100;g!==0&&(y=m[g-1]),g!==d.length-1&&(C=m[g]);var A=C-y,D="translate("+Ns($a(y,A)+"%","0")+")",E="scale("+Ns(A/100,"1")+")";d[g].style[t.transformRule]=D+" "+E}}function Ya(g,m){return g===null||g===!1||g===void 0||(typeof g=="number"&&(g=String(g)),g=t.format.from(g),g!==!1&&(g=p.toStepping(g)),g===!1||isNaN(g))?f[m]:g}function es(g,m,y){var C=Ts(g),A=f[0]===void 0;m=m===void 0?!0:m,t.animate&&!A&&ei(o,t.cssClasses.tap,t.animationDuration),v.forEach(function(L){ne(L,Ya(C[L],L),!0,!1,y)});var D=v.length===1?0:1;if(A&&p.hasNoSize()&&(y=!0,f[0]=0,v.length>1)){var E=100/(v.length-1);v.forEach(function(L){f[L]=L*E})}for(;D<v.length;++D)v.forEach(function(L){ne(L,f[L],!0,!0,y)});Ws(),v.forEach(function(L){et("update",L),C[L]!==null&&m&&et("set",L)})}function ol(g){es(t.start,g)}function ll(g,m,y,C){if(g=Number(g),!(g>=0&&g<v.length))throw new Error("noUiSlider: invalid handle number, got: "+g);ne(g,Ya(m,g),!0,!0,C),et("update",g),y&&et("set",g)}function Ga(g){if(g===void 0&&(g=!1),g)return b.length===1?b[0]:b.slice(0);var m=b.map(t.format.to);return m.length===1?m[0]:m}function rl(){for(Me(Yt.aria),Me(Yt.tooltips),Object.keys(t.cssClasses).forEach(function(g){ms(o,t.cssClasses[g])});o.firstChild;)o.removeChild(o.firstChild);delete o.noUiSlider}function Xa(g){var m=f[g],y=p.getNearbySteps(m),C=b[g],A=y.thisStep.step,D=null;if(t.snap)return[C-y.stepBefore.startValue||null,y.stepAfter.startValue-C||null];A!==!1&&C+A>y.stepAfter.startValue&&(A=y.stepAfter.startValue-C),C>y.thisStep.startValue?D=y.thisStep.step:y.stepBefore.step===!1?D=!1:D=C-y.stepBefore.highestStep,m===100?A=null:m===0&&(D=null);var E=p.countStepDecimals();return A!==null&&A!==!1&&(A=Number(A.toFixed(E))),D!==null&&D!==!1&&(D=Number(D.toFixed(E))),[D,A]}function cl(){return v.map(Xa)}function dl(g,m){var y=Ga(),C=["margin","limit","padding","range","animate","snap","step","format","pips","tooltips","connect"];C.forEach(function(D){g[D]!==void 0&&(e[D]=g[D])});var A=Rn(e);C.forEach(function(D){g[D]!==void 0&&(t[D]=A[D])}),p=A.spectrum,t.margin=A.margin,t.limit=A.limit,t.padding=A.padding,t.pips?Pt(t.pips):Rt(),t.tooltips?nt():xt(),f=[],es(ra(g.start)?g.start:y,m),g.connect&&qa()}function qa(){for(;r.firstChild;)r.removeChild(r.firstChild);for(var g=0;g<=t.handles;g++)d[g]=R(r,t.connect[g]),Pe(g);Wa({drag:t.events.drag,fixed:!0})}function ul(){_=!_,En(t,t.connect.map(function(g){return!g})),qa()}function hl(){l=F(o),z(t.connect,l),Wa(t.events),es(t.start),t.pips&&Pt(t.pips),t.tooltips&&nt(),$t()}hl();var ss={destroy:rl,steps:cl,on:js,off:Me,get:Ga,set:es,setHandle:ll,reset:ol,disable:Y,enable:Z,__moveHandles:function(g,m,y){Ua(g,m,f,y)},options:e,updateOptions:dl,target:o,removePips:Rt,removeTooltips:xt,getPositions:function(){return f.slice()},getTooltips:function(){return h},getOrigins:function(){return c},pips:Pt};return ss}function Kl(s,t){if(!s||!s.nodeName)throw new Error("noUiSlider: create requires a single element, got: "+s);if(s.noUiSlider)throw new Error("noUiSlider: Slider was already initialized.");var e=Rn(t),a=ql(s,e,t);return s.noUiSlider=a,a}const zn={__spectrum:Ln,cssClasses:On,create:Kl};function Ze(s){return s+.5|0}const Xt=(s,t,e)=>Math.max(Math.min(s,e),t);function Ee(s){return Xt(Ze(s*2.55),0,255)}function Qt(s){return Xt(Ze(s*255),0,255)}function Vt(s){return Xt(Ze(s/2.55)/100,0,1)}function ii(s){return Xt(Ze(s*100),0,100)}const Ct={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,A:10,B:11,C:12,D:13,E:14,F:15,a:10,b:11,c:12,d:13,e:14,f:15},da=[..."0123456789ABCDEF"],Zl=s=>da[s&15],Ql=s=>da[(s&240)>>4]+da[s&15],as=s=>(s&240)>>4===(s&15),Jl=s=>as(s.r)&&as(s.g)&&as(s.b)&&as(s.a);function tr(s){var t=s.length,e;return s[0]==="#"&&(t===4||t===5?e={r:255&Ct[s[1]]*17,g:255&Ct[s[2]]*17,b:255&Ct[s[3]]*17,a:t===5?Ct[s[4]]*17:255}:(t===7||t===9)&&(e={r:Ct[s[1]]<<4|Ct[s[2]],g:Ct[s[3]]<<4|Ct[s[4]],b:Ct[s[5]]<<4|Ct[s[6]],a:t===9?Ct[s[7]]<<4|Ct[s[8]]:255})),e}const er=(s,t)=>s<255?t(s):"";function sr(s){var t=Jl(s)?Zl:Ql;return s?"#"+t(s.r)+t(s.g)+t(s.b)+er(s.a,t):void 0}const ar=/^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;function Bn(s,t,e){const a=t*Math.min(e,1-e),i=(n,o=(n+s/30)%12)=>e-a*Math.max(Math.min(o-3,9-o,1),-1);return[i(0),i(8),i(4)]}function ir(s,t,e){const a=(i,n=(i+s/60)%6)=>e-e*t*Math.max(Math.min(n,4-n,1),0);return[a(5),a(3),a(1)]}function nr(s,t,e){const a=Bn(s,1,.5);let i;for(t+e>1&&(i=1/(t+e),t*=i,e*=i),i=0;i<3;i++)a[i]*=1-t-e,a[i]+=t;return a}function or(s,t,e,a,i){return s===i?(t-e)/a+(t<e?6:0):t===i?(e-s)/a+2:(s-t)/a+4}function _a(s){const e=s.r/255,a=s.g/255,i=s.b/255,n=Math.max(e,a,i),o=Math.min(e,a,i),l=(n+o)/2;let r,c,d;return n!==o&&(d=n-o,c=l>.5?d/(2-n-o):d/(n+o),r=or(e,a,i,d,n),r=r*60+.5),[r|0,c||0,l]}function Ca(s,t,e,a){return(Array.isArray(t)?s(t[0],t[1],t[2]):s(t,e,a)).map(Qt)}function Ma(s,t,e){return Ca(Bn,s,t,e)}function lr(s,t,e){return Ca(nr,s,t,e)}function rr(s,t,e){return Ca(ir,s,t,e)}function Fn(s){return(s%360+360)%360}function cr(s){const t=ar.exec(s);let e=255,a;if(!t)return;t[5]!==a&&(e=t[6]?Ee(+t[5]):Qt(+t[5]));const i=Fn(+t[2]),n=+t[3]/100,o=+t[4]/100;return t[1]==="hwb"?a=lr(i,n,o):t[1]==="hsv"?a=rr(i,n,o):a=Ma(i,n,o),{r:a[0],g:a[1],b:a[2],a:e}}function dr(s,t){var e=_a(s);e[0]=Fn(e[0]+t),e=Ma(e),s.r=e[0],s.g=e[1],s.b=e[2]}function ur(s){if(!s)return;const t=_a(s),e=t[0],a=ii(t[1]),i=ii(t[2]);return s.a<255?`hsla(${e}, ${a}%, ${i}%, ${Vt(s.a)})`:`hsl(${e}, ${a}%, ${i}%)`}const ni={x:"dark",Z:"light",Y:"re",X:"blu",W:"gr",V:"medium",U:"slate",A:"ee",T:"ol",S:"or",B:"ra",C:"lateg",D:"ights",R:"in",Q:"turquois",E:"hi",P:"ro",O:"al",N:"le",M:"de",L:"yello",F:"en",K:"ch",G:"arks",H:"ea",I:"ightg",J:"wh"},oi={OiceXe:"f0f8ff",antiquewEte:"faebd7",aqua:"ffff",aquamarRe:"7fffd4",azuY:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"0",blanKedOmond:"ffebcd",Xe:"ff",XeviTet:"8a2be2",bPwn:"a52a2a",burlywood:"deb887",caMtXe:"5f9ea0",KartYuse:"7fff00",KocTate:"d2691e",cSO:"ff7f50",cSnflowerXe:"6495ed",cSnsilk:"fff8dc",crimson:"dc143c",cyan:"ffff",xXe:"8b",xcyan:"8b8b",xgTMnPd:"b8860b",xWay:"a9a9a9",xgYF:"6400",xgYy:"a9a9a9",xkhaki:"bdb76b",xmagFta:"8b008b",xTivegYF:"556b2f",xSange:"ff8c00",xScEd:"9932cc",xYd:"8b0000",xsOmon:"e9967a",xsHgYF:"8fbc8f",xUXe:"483d8b",xUWay:"2f4f4f",xUgYy:"2f4f4f",xQe:"ced1",xviTet:"9400d3",dAppRk:"ff1493",dApskyXe:"bfff",dimWay:"696969",dimgYy:"696969",dodgerXe:"1e90ff",fiYbrick:"b22222",flSOwEte:"fffaf0",foYstWAn:"228b22",fuKsia:"ff00ff",gaRsbSo:"dcdcdc",ghostwEte:"f8f8ff",gTd:"ffd700",gTMnPd:"daa520",Way:"808080",gYF:"8000",gYFLw:"adff2f",gYy:"808080",honeyMw:"f0fff0",hotpRk:"ff69b4",RdianYd:"cd5c5c",Rdigo:"4b0082",ivSy:"fffff0",khaki:"f0e68c",lavFMr:"e6e6fa",lavFMrXsh:"fff0f5",lawngYF:"7cfc00",NmoncEffon:"fffacd",ZXe:"add8e6",ZcSO:"f08080",Zcyan:"e0ffff",ZgTMnPdLw:"fafad2",ZWay:"d3d3d3",ZgYF:"90ee90",ZgYy:"d3d3d3",ZpRk:"ffb6c1",ZsOmon:"ffa07a",ZsHgYF:"20b2aa",ZskyXe:"87cefa",ZUWay:"778899",ZUgYy:"778899",ZstAlXe:"b0c4de",ZLw:"ffffe0",lime:"ff00",limegYF:"32cd32",lRF:"faf0e6",magFta:"ff00ff",maPon:"800000",VaquamarRe:"66cdaa",VXe:"cd",VScEd:"ba55d3",VpurpN:"9370db",VsHgYF:"3cb371",VUXe:"7b68ee",VsprRggYF:"fa9a",VQe:"48d1cc",VviTetYd:"c71585",midnightXe:"191970",mRtcYam:"f5fffa",mistyPse:"ffe4e1",moccasR:"ffe4b5",navajowEte:"ffdead",navy:"80",Tdlace:"fdf5e6",Tive:"808000",TivedBb:"6b8e23",Sange:"ffa500",SangeYd:"ff4500",ScEd:"da70d6",pOegTMnPd:"eee8aa",pOegYF:"98fb98",pOeQe:"afeeee",pOeviTetYd:"db7093",papayawEp:"ffefd5",pHKpuff:"ffdab9",peru:"cd853f",pRk:"ffc0cb",plum:"dda0dd",powMrXe:"b0e0e6",purpN:"800080",YbeccapurpN:"663399",Yd:"ff0000",Psybrown:"bc8f8f",PyOXe:"4169e1",saddNbPwn:"8b4513",sOmon:"fa8072",sandybPwn:"f4a460",sHgYF:"2e8b57",sHshell:"fff5ee",siFna:"a0522d",silver:"c0c0c0",skyXe:"87ceeb",UXe:"6a5acd",UWay:"708090",UgYy:"708090",snow:"fffafa",sprRggYF:"ff7f",stAlXe:"4682b4",tan:"d2b48c",teO:"8080",tEstN:"d8bfd8",tomato:"ff6347",Qe:"40e0d0",viTet:"ee82ee",JHt:"f5deb3",wEte:"ffffff",wEtesmoke:"f5f5f5",Lw:"ffff00",LwgYF:"9acd32"};function hr(){const s={},t=Object.keys(oi),e=Object.keys(ni);let a,i,n,o,l;for(a=0;a<t.length;a++){for(o=l=t[a],i=0;i<e.length;i++)n=e[i],l=l.replace(n,ni[n]);n=parseInt(oi[o],16),s[l]=[n>>16&255,n>>8&255,n&255]}return s}let is;function pr(s){is||(is=hr(),is.transparent=[0,0,0,0]);const t=is[s.toLowerCase()];return t&&{r:t[0],g:t[1],b:t[2],a:t.length===4?t[3]:255}}const fr=/^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;function br(s){const t=fr.exec(s);let e=255,a,i,n;if(t){if(t[7]!==a){const o=+t[7];e=t[8]?Ee(o):Xt(o*255,0,255)}return a=+t[1],i=+t[3],n=+t[5],a=255&(t[2]?Ee(a):Xt(a,0,255)),i=255&(t[4]?Ee(i):Xt(i,0,255)),n=255&(t[6]?Ee(n):Xt(n,0,255)),{r:a,g:i,b:n,a:e}}}function gr(s){return s&&(s.a<255?`rgba(${s.r}, ${s.g}, ${s.b}, ${Vt(s.a)})`:`rgb(${s.r}, ${s.g}, ${s.b})`)}const Xs=s=>s<=.0031308?s*12.92:Math.pow(s,1/2.4)*1.055-.055,xe=s=>s<=.04045?s/12.92:Math.pow((s+.055)/1.055,2.4);function vr(s,t,e){const a=xe(Vt(s.r)),i=xe(Vt(s.g)),n=xe(Vt(s.b));return{r:Qt(Xs(a+e*(xe(Vt(t.r))-a))),g:Qt(Xs(i+e*(xe(Vt(t.g))-i))),b:Qt(Xs(n+e*(xe(Vt(t.b))-n))),a:s.a+e*(t.a-s.a)}}function ns(s,t,e){if(s){let a=_a(s);a[t]=Math.max(0,Math.min(a[t]+a[t]*e,t===0?360:1)),a=Ma(a),s.r=a[0],s.g=a[1],s.b=a[2]}}function Vn(s,t){return s&&Object.assign(t||{},s)}function li(s){var t={r:0,g:0,b:0,a:255};return Array.isArray(s)?s.length>=3&&(t={r:s[0],g:s[1],b:s[2],a:255},s.length>3&&(t.a=Qt(s[3]))):(t=Vn(s,{r:0,g:0,b:0,a:1}),t.a=Qt(t.a)),t}function mr(s){return s.charAt(0)==="r"?br(s):cr(s)}class Ue{constructor(t){if(t instanceof Ue)return t;const e=typeof t;let a;e==="object"?a=li(t):e==="string"&&(a=tr(t)||pr(t)||mr(t)),this._rgb=a,this._valid=!!a}get valid(){return this._valid}get rgb(){var t=Vn(this._rgb);return t&&(t.a=Vt(t.a)),t}set rgb(t){this._rgb=li(t)}rgbString(){return this._valid?gr(this._rgb):void 0}hexString(){return this._valid?sr(this._rgb):void 0}hslString(){return this._valid?ur(this._rgb):void 0}mix(t,e){if(t){const a=this.rgb,i=t.rgb;let n;const o=e===n?.5:e,l=2*o-1,r=a.a-i.a,c=((l*r===-1?l:(l+r)/(1+l*r))+1)/2;n=1-c,a.r=255&c*a.r+n*i.r+.5,a.g=255&c*a.g+n*i.g+.5,a.b=255&c*a.b+n*i.b+.5,a.a=o*a.a+(1-o)*i.a,this.rgb=a}return this}interpolate(t,e){return t&&(this._rgb=vr(this._rgb,t._rgb,e)),this}clone(){return new Ue(this.rgb)}alpha(t){return this._rgb.a=Qt(t),this}clearer(t){const e=this._rgb;return e.a*=1-t,this}greyscale(){const t=this._rgb,e=Ze(t.r*.3+t.g*.59+t.b*.11);return t.r=t.g=t.b=e,this}opaquer(t){const e=this._rgb;return e.a*=1+t,this}negate(){const t=this._rgb;return t.r=255-t.r,t.g=255-t.g,t.b=255-t.b,this}lighten(t){return ns(this._rgb,2,t),this}darken(t){return ns(this._rgb,2,-t),this}saturate(t){return ns(this._rgb,1,t),this}desaturate(t){return ns(this._rgb,1,-t),this}rotate(t){return dr(this._rgb,t),this}}function zt(){}const xr=(()=>{let s=0;return()=>s++})();function B(s){return s==null}function q(s){if(Array.isArray&&Array.isArray(s))return!0;const t=Object.prototype.toString.call(s);return t.slice(0,7)==="[object"&&t.slice(-6)==="Array]"}function V(s){return s!==null&&Object.prototype.toString.call(s)==="[object Object]"}function tt(s){return(typeof s=="number"||s instanceof Number)&&isFinite(+s)}function _t(s,t){return tt(s)?s:t}function I(s,t){return typeof s>"u"?t:s}const yr=(s,t)=>typeof s=="string"&&s.endsWith("%")?parseFloat(s)/100:+s/t,Hn=(s,t)=>typeof s=="string"&&s.endsWith("%")?parseFloat(s)/100*t:+s;function G(s,t,e){if(s&&typeof s.call=="function")return s.apply(e,t)}function W(s,t,e,a){let i,n,o;if(q(s))for(n=s.length,i=0;i<n;i++)t.call(e,s[i],i);else if(V(s))for(o=Object.keys(s),n=o.length,i=0;i<n;i++)t.call(e,s[o[i]],o[i])}function ks(s,t){let e,a,i,n;if(!s||!t||s.length!==t.length)return!1;for(e=0,a=s.length;e<a;++e)if(i=s[e],n=t[e],i.datasetIndex!==n.datasetIndex||i.index!==n.index)return!1;return!0}function Ss(s){if(q(s))return s.map(Ss);if(V(s)){const t=Object.create(null),e=Object.keys(s),a=e.length;let i=0;for(;i<a;++i)t[e[i]]=Ss(s[e[i]]);return t}return s}function jn(s){return["__proto__","prototype","constructor"].indexOf(s)===-1}function wr(s,t,e,a){if(!jn(s))return;const i=t[s],n=e[s];V(i)&&V(n)?$e(i,n,a):t[s]=Ss(n)}function $e(s,t,e){const a=q(t)?t:[t],i=a.length;if(!V(s))return s;e=e||{};const n=e.merger||wr;let o;for(let l=0;l<i;++l){if(o=a[l],!V(o))continue;const r=Object.keys(o);for(let c=0,d=r.length;c<d;++c)n(r[c],s,o,e)}return s}function Fe(s,t){return $e(s,t,{merger:kr})}function kr(s,t,e){if(!jn(s))return;const a=t[s],i=e[s];V(a)&&V(i)?Fe(a,i):Object.prototype.hasOwnProperty.call(t,s)||(t[s]=Ss(i))}const ri={"":s=>s,x:s=>s.x,y:s=>s.y};function Sr(s){const t=s.split("."),e=[];let a="";for(const i of t)a+=i,a.endsWith("\\")?a=a.slice(0,-1)+".":(e.push(a),a="");return e}function _r(s){const t=Sr(s);return e=>{for(const a of t){if(a==="")break;e=e&&e[a]}return e}}function Jt(s,t){return(ri[t]||(ri[t]=_r(t)))(s)}function Pa(s){return s.charAt(0).toUpperCase()+s.slice(1)}const Ye=s=>typeof s<"u",te=s=>typeof s=="function",ci=(s,t)=>{if(s.size!==t.size)return!1;for(const e of s)if(!t.has(e))return!1;return!0};function Cr(s){return s.type==="mouseup"||s.type==="click"||s.type==="contextmenu"}const j=Math.PI,X=2*j,Mr=X+j,_s=Number.POSITIVE_INFINITY,Pr=j/180,st=j/2,oe=j/4,di=j*2/3,qt=Math.log10,Ot=Math.sign;function Ve(s,t,e){return Math.abs(s-t)<e}function ui(s){const t=Math.round(s);s=Ve(s,t,s/1e3)?t:s;const e=Math.pow(10,Math.floor(qt(s))),a=s/e;return(a<=1?1:a<=2?2:a<=5?5:10)*e}function Ar(s){const t=[],e=Math.sqrt(s);let a;for(a=1;a<e;a++)s%a===0&&(t.push(a),t.push(s/a));return e===(e|0)&&t.push(e),t.sort((i,n)=>i-n).pop(),t}function Dr(s){return typeof s=="symbol"||typeof s=="object"&&s!==null&&!(Symbol.toPrimitive in s||"toString"in s||"valueOf"in s)}function Se(s){return!Dr(s)&&!isNaN(parseFloat(s))&&isFinite(s)}function Tr(s,t){const e=Math.round(s);return e-t<=s&&e+t>=s}function Nn(s,t,e){let a,i,n;for(a=0,i=s.length;a<i;a++)n=s[a][e],isNaN(n)||(t.min=Math.min(t.min,n),t.max=Math.max(t.max,n))}function At(s){return s*(j/180)}function Aa(s){return s*(180/j)}function hi(s){if(!tt(s))return;let t=1,e=0;for(;Math.round(s*t)/t!==s;)t*=10,e++;return e}function Wn(s,t){const e=t.x-s.x,a=t.y-s.y,i=Math.sqrt(e*e+a*a);let n=Math.atan2(a,e);return n<-.5*j&&(n+=X),{angle:n,distance:i}}function ua(s,t){return Math.sqrt(Math.pow(t.x-s.x,2)+Math.pow(t.y-s.y,2))}function Lr(s,t){return(s-t+Mr)%X-j}function bt(s){return(s%X+X)%X}function Ge(s,t,e,a){const i=bt(s),n=bt(t),o=bt(e),l=bt(n-i),r=bt(o-i),c=bt(i-n),d=bt(i-o);return i===n||i===o||a&&n===o||l>r&&c<d}function ct(s,t,e){return Math.max(t,Math.min(e,s))}function Or(s){return ct(s,-32768,32767)}function jt(s,t,e,a=1e-6){return s>=Math.min(t,e)-a&&s<=Math.max(t,e)+a}function Da(s,t,e){e=e||(o=>s[o]<t);let a=s.length-1,i=0,n;for(;a-i>1;)n=i+a>>1,e(n)?i=n:a=n;return{lo:i,hi:a}}const Nt=(s,t,e,a)=>Da(s,e,a?i=>{const n=s[i][t];return n<e||n===e&&s[i+1][t]===e}:i=>s[i][t]<e),Er=(s,t,e)=>Da(s,e,a=>s[a][t]>=e);function Ir(s,t,e){let a=0,i=s.length;for(;a<i&&s[a]<t;)a++;for(;i>a&&s[i-1]>e;)i--;return a>0||i<s.length?s.slice(a,i):s}const Un=["push","pop","shift","splice","unshift"];function Rr(s,t){if(s._chartjs){s._chartjs.listeners.push(t);return}Object.defineProperty(s,"_chartjs",{configurable:!0,enumerable:!1,value:{listeners:[t]}}),Un.forEach(e=>{const a="_onData"+Pa(e),i=s[e];Object.defineProperty(s,e,{configurable:!0,enumerable:!1,value(...n){const o=i.apply(this,n);return s._chartjs.listeners.forEach(l=>{typeof l[a]=="function"&&l[a](...n)}),o}})})}function pi(s,t){const e=s._chartjs;if(!e)return;const a=e.listeners,i=a.indexOf(t);i!==-1&&a.splice(i,1),!(a.length>0)&&(Un.forEach(n=>{delete s[n]}),delete s._chartjs)}function $n(s){const t=new Set(s);return t.size===s.length?s:Array.from(t)}const Yn=(function(){return typeof window>"u"?function(s){return s()}:window.requestAnimationFrame})();function Gn(s,t){let e=[],a=!1;return function(...i){e=i,a||(a=!0,Yn.call(window,()=>{a=!1,s.apply(t,e)}))}}function zr(s,t){let e;return function(...a){return t?(clearTimeout(e),e=setTimeout(s,t,a)):s.apply(this,a),t}}const Ta=s=>s==="start"?"left":s==="end"?"right":"center",ft=(s,t,e)=>s==="start"?t:s==="end"?e:(t+e)/2,Br=(s,t,e,a)=>s===(a?"left":"right")?e:s==="center"?(t+e)/2:t;function Xn(s,t,e){const a=t.length;let i=0,n=a;if(s._sorted){const{iScale:o,vScale:l,_parsed:r}=s,c=s.dataset&&s.dataset.options?s.dataset.options.spanGaps:null,d=o.axis,{min:u,max:h,minDefined:p,maxDefined:b}=o.getUserBounds();if(p){if(i=Math.min(Nt(r,d,u).lo,e?a:Nt(t,d,o.getPixelForValue(u)).lo),c){const f=r.slice(0,i+1).reverse().findIndex(v=>!B(v[l.axis]));i-=Math.max(0,f)}i=ct(i,0,a-1)}if(b){let f=Math.max(Nt(r,o.axis,h,!0).hi+1,e?0:Nt(t,d,o.getPixelForValue(h),!0).hi+1);if(c){const v=r.slice(f-1).findIndex(x=>!B(x[l.axis]));f+=Math.max(0,v)}n=ct(f,i,a)-i}else n=a-i}return{start:i,count:n}}function qn(s){const{xScale:t,yScale:e,_scaleRanges:a}=s,i={xmin:t.min,xmax:t.max,ymin:e.min,ymax:e.max};if(!a)return s._scaleRanges=i,!0;const n=a.xmin!==t.min||a.xmax!==t.max||a.ymin!==e.min||a.ymax!==e.max;return Object.assign(a,i),n}const os=s=>s===0||s===1,fi=(s,t,e)=>-(Math.pow(2,10*(s-=1))*Math.sin((s-t)*X/e)),bi=(s,t,e)=>Math.pow(2,-10*s)*Math.sin((s-t)*X/e)+1,He={linear:s=>s,easeInQuad:s=>s*s,easeOutQuad:s=>-s*(s-2),easeInOutQuad:s=>(s/=.5)<1?.5*s*s:-.5*(--s*(s-2)-1),easeInCubic:s=>s*s*s,easeOutCubic:s=>(s-=1)*s*s+1,easeInOutCubic:s=>(s/=.5)<1?.5*s*s*s:.5*((s-=2)*s*s+2),easeInQuart:s=>s*s*s*s,easeOutQuart:s=>-((s-=1)*s*s*s-1),easeInOutQuart:s=>(s/=.5)<1?.5*s*s*s*s:-.5*((s-=2)*s*s*s-2),easeInQuint:s=>s*s*s*s*s,easeOutQuint:s=>(s-=1)*s*s*s*s+1,easeInOutQuint:s=>(s/=.5)<1?.5*s*s*s*s*s:.5*((s-=2)*s*s*s*s+2),easeInSine:s=>-Math.cos(s*st)+1,easeOutSine:s=>Math.sin(s*st),easeInOutSine:s=>-.5*(Math.cos(j*s)-1),easeInExpo:s=>s===0?0:Math.pow(2,10*(s-1)),easeOutExpo:s=>s===1?1:-Math.pow(2,-10*s)+1,easeInOutExpo:s=>os(s)?s:s<.5?.5*Math.pow(2,10*(s*2-1)):.5*(-Math.pow(2,-10*(s*2-1))+2),easeInCirc:s=>s>=1?s:-(Math.sqrt(1-s*s)-1),easeOutCirc:s=>Math.sqrt(1-(s-=1)*s),easeInOutCirc:s=>(s/=.5)<1?-.5*(Math.sqrt(1-s*s)-1):.5*(Math.sqrt(1-(s-=2)*s)+1),easeInElastic:s=>os(s)?s:fi(s,.075,.3),easeOutElastic:s=>os(s)?s:bi(s,.075,.3),easeInOutElastic(s){return os(s)?s:s<.5?.5*fi(s*2,.1125,.45):.5+.5*bi(s*2-1,.1125,.45)},easeInBack(s){return s*s*((1.70158+1)*s-1.70158)},easeOutBack(s){return(s-=1)*s*((1.70158+1)*s+1.70158)+1},easeInOutBack(s){let t=1.70158;return(s/=.5)<1?.5*(s*s*(((t*=1.525)+1)*s-t)):.5*((s-=2)*s*(((t*=1.525)+1)*s+t)+2)},easeInBounce:s=>1-He.easeOutBounce(1-s),easeOutBounce(s){return s<1/2.75?7.5625*s*s:s<2/2.75?7.5625*(s-=1.5/2.75)*s+.75:s<2.5/2.75?7.5625*(s-=2.25/2.75)*s+.9375:7.5625*(s-=2.625/2.75)*s+.984375},easeInOutBounce:s=>s<.5?He.easeInBounce(s*2)*.5:He.easeOutBounce(s*2-1)*.5+.5};function La(s){if(s&&typeof s=="object"){const t=s.toString();return t==="[object CanvasPattern]"||t==="[object CanvasGradient]"}return!1}function gi(s){return La(s)?s:new Ue(s)}function qs(s){return La(s)?s:new Ue(s).saturate(.5).darken(.1).hexString()}const Fr=["x","y","borderWidth","radius","tension"],Vr=["color","borderColor","backgroundColor"];function Hr(s){s.set("animation",{delay:void 0,duration:1e3,easing:"easeOutQuart",fn:void 0,from:void 0,loop:void 0,to:void 0,type:void 0}),s.describe("animation",{_fallback:!1,_indexable:!1,_scriptable:t=>t!=="onProgress"&&t!=="onComplete"&&t!=="fn"}),s.set("animations",{colors:{type:"color",properties:Vr},numbers:{type:"number",properties:Fr}}),s.describe("animations",{_fallback:"animation"}),s.set("transitions",{active:{animation:{duration:400}},resize:{animation:{duration:0}},show:{animations:{colors:{from:"transparent"},visible:{type:"boolean",duration:0}}},hide:{animations:{colors:{to:"transparent"},visible:{type:"boolean",easing:"linear",fn:t=>t|0}}}})}function jr(s){s.set("layout",{autoPadding:!0,padding:{top:0,right:0,bottom:0,left:0}})}const vi=new Map;function Nr(s,t){t=t||{};const e=s+JSON.stringify(t);let a=vi.get(e);return a||(a=new Intl.NumberFormat(s,t),vi.set(e,a)),a}function Qe(s,t,e){return Nr(t,e).format(s)}const Kn={values(s){return q(s)?s:""+s},numeric(s,t,e){if(s===0)return"0";const a=this.chart.options.locale;let i,n=s;if(e.length>1){const c=Math.max(Math.abs(e[0].value),Math.abs(e[e.length-1].value));(c<1e-4||c>1e15)&&(i="scientific"),n=Wr(s,e)}const o=qt(Math.abs(n)),l=isNaN(o)?1:Math.max(Math.min(-1*Math.floor(o),20),0),r={notation:i,minimumFractionDigits:l,maximumFractionDigits:l};return Object.assign(r,this.options.ticks.format),Qe(s,a,r)},logarithmic(s,t,e){if(s===0)return"0";const a=e[t].significand||s/Math.pow(10,Math.floor(qt(s)));return[1,2,3,5,10,15].includes(a)||t>.8*e.length?Kn.numeric.call(this,s,t,e):""}};function Wr(s,t){let e=t.length>3?t[2].value-t[1].value:t[1].value-t[0].value;return Math.abs(e)>=1&&s!==Math.floor(s)&&(e=s-Math.floor(s)),e}var Ls={formatters:Kn};function Ur(s){s.set("scale",{display:!0,offset:!1,reverse:!1,beginAtZero:!1,bounds:"ticks",clip:!0,grace:0,grid:{display:!0,lineWidth:1,drawOnChartArea:!0,drawTicks:!0,tickLength:8,tickWidth:(t,e)=>e.lineWidth,tickColor:(t,e)=>e.color,offset:!1},border:{display:!0,dash:[],dashOffset:0,width:1},title:{display:!1,text:"",padding:{top:4,bottom:4}},ticks:{minRotation:0,maxRotation:50,mirror:!1,textStrokeWidth:0,textStrokeColor:"",padding:3,display:!0,autoSkip:!0,autoSkipPadding:3,labelOffset:0,callback:Ls.formatters.values,minor:{},major:{},align:"center",crossAlign:"near",showLabelBackdrop:!1,backdropColor:"rgba(255, 255, 255, 0.75)",backdropPadding:2}}),s.route("scale.ticks","color","","color"),s.route("scale.grid","color","","borderColor"),s.route("scale.border","color","","borderColor"),s.route("scale.title","color","","color"),s.describe("scale",{_fallback:!1,_scriptable:t=>!t.startsWith("before")&&!t.startsWith("after")&&t!=="callback"&&t!=="parser",_indexable:t=>t!=="borderDash"&&t!=="tickBorderDash"&&t!=="dash"}),s.describe("scales",{_fallback:"scale"}),s.describe("scale.ticks",{_scriptable:t=>t!=="backdropPadding"&&t!=="callback",_indexable:t=>t!=="backdropPadding"})}const fe=Object.create(null),ha=Object.create(null);function je(s,t){if(!t)return s;const e=t.split(".");for(let a=0,i=e.length;a<i;++a){const n=e[a];s=s[n]||(s[n]=Object.create(null))}return s}function Ks(s,t,e){return typeof t=="string"?$e(je(s,t),e):$e(je(s,""),t)}class $r{constructor(t,e){this.animation=void 0,this.backgroundColor="rgba(0,0,0,0.1)",this.borderColor="rgba(0,0,0,0.1)",this.color="#666",this.datasets={},this.devicePixelRatio=a=>a.chart.platform.getDevicePixelRatio(),this.elements={},this.events=["mousemove","mouseout","click","touchstart","touchmove"],this.font={family:"'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",size:12,style:"normal",lineHeight:1.2,weight:null},this.hover={},this.hoverBackgroundColor=(a,i)=>qs(i.backgroundColor),this.hoverBorderColor=(a,i)=>qs(i.borderColor),this.hoverColor=(a,i)=>qs(i.color),this.indexAxis="x",this.interaction={mode:"nearest",intersect:!0,includeInvisible:!1},this.maintainAspectRatio=!0,this.onHover=null,this.onClick=null,this.parsing=!0,this.plugins={},this.responsive=!0,this.scale=void 0,this.scales={},this.showLine=!0,this.drawActiveElementsOnTop=!0,this.describe(t),this.apply(e)}set(t,e){return Ks(this,t,e)}get(t){return je(this,t)}describe(t,e){return Ks(ha,t,e)}override(t,e){return Ks(fe,t,e)}route(t,e,a,i){const n=je(this,t),o=je(this,a),l="_"+e;Object.defineProperties(n,{[l]:{value:n[e],writable:!0},[e]:{enumerable:!0,get(){const r=this[l],c=o[i];return V(r)?Object.assign({},c,r):I(r,c)},set(r){this[l]=r}}})}apply(t){t.forEach(e=>e(this))}}var K=new $r({_scriptable:s=>!s.startsWith("on"),_indexable:s=>s!=="events",hover:{_fallback:"interaction"},interaction:{_scriptable:!1,_indexable:!1}},[Hr,jr,Ur]);function Yr(s){return!s||B(s.size)||B(s.family)?null:(s.style?s.style+" ":"")+(s.weight?s.weight+" ":"")+s.size+"px "+s.family}function Cs(s,t,e,a,i){let n=t[i];return n||(n=t[i]=s.measureText(i).width,e.push(i)),n>a&&(a=n),a}function Gr(s,t,e,a){a=a||{};let i=a.data=a.data||{},n=a.garbageCollect=a.garbageCollect||[];a.font!==t&&(i=a.data={},n=a.garbageCollect=[],a.font=t),s.save(),s.font=t;let o=0;const l=e.length;let r,c,d,u,h;for(r=0;r<l;r++)if(u=e[r],u!=null&&!q(u))o=Cs(s,i,n,o,u);else if(q(u))for(c=0,d=u.length;c<d;c++)h=u[c],h!=null&&!q(h)&&(o=Cs(s,i,n,o,h));s.restore();const p=n.length/2;if(p>e.length){for(r=0;r<p;r++)delete i[n[r]];n.splice(0,p)}return o}function le(s,t,e){const a=s.currentDevicePixelRatio,i=e!==0?Math.max(e/2,.5):0;return Math.round((t-i)*a)/a+i}function mi(s,t){!t&&!s||(t=t||s.getContext("2d"),t.save(),t.resetTransform(),t.clearRect(0,0,s.width,s.height),t.restore())}function pa(s,t,e,a){Zn(s,t,e,a,null)}function Zn(s,t,e,a,i){let n,o,l,r,c,d,u,h;const p=t.pointStyle,b=t.rotation,f=t.radius;let v=(b||0)*Pr;if(p&&typeof p=="object"&&(n=p.toString(),n==="[object HTMLImageElement]"||n==="[object HTMLCanvasElement]")){s.save(),s.translate(e,a),s.rotate(v),s.drawImage(p,-p.width/2,-p.height/2,p.width,p.height),s.restore();return}if(!(isNaN(f)||f<=0)){switch(s.beginPath(),p){default:i?s.ellipse(e,a,i/2,f,0,0,X):s.arc(e,a,f,0,X),s.closePath();break;case"triangle":d=i?i/2:f,s.moveTo(e+Math.sin(v)*d,a-Math.cos(v)*f),v+=di,s.lineTo(e+Math.sin(v)*d,a-Math.cos(v)*f),v+=di,s.lineTo(e+Math.sin(v)*d,a-Math.cos(v)*f),s.closePath();break;case"rectRounded":c=f*.516,r=f-c,o=Math.cos(v+oe)*r,u=Math.cos(v+oe)*(i?i/2-c:r),l=Math.sin(v+oe)*r,h=Math.sin(v+oe)*(i?i/2-c:r),s.arc(e-u,a-l,c,v-j,v-st),s.arc(e+h,a-o,c,v-st,v),s.arc(e+u,a+l,c,v,v+st),s.arc(e-h,a+o,c,v+st,v+j),s.closePath();break;case"rect":if(!b){r=Math.SQRT1_2*f,d=i?i/2:r,s.rect(e-d,a-r,2*d,2*r);break}v+=oe;case"rectRot":u=Math.cos(v)*(i?i/2:f),o=Math.cos(v)*f,l=Math.sin(v)*f,h=Math.sin(v)*(i?i/2:f),s.moveTo(e-u,a-l),s.lineTo(e+h,a-o),s.lineTo(e+u,a+l),s.lineTo(e-h,a+o),s.closePath();break;case"crossRot":v+=oe;case"cross":u=Math.cos(v)*(i?i/2:f),o=Math.cos(v)*f,l=Math.sin(v)*f,h=Math.sin(v)*(i?i/2:f),s.moveTo(e-u,a-l),s.lineTo(e+u,a+l),s.moveTo(e+h,a-o),s.lineTo(e-h,a+o);break;case"star":u=Math.cos(v)*(i?i/2:f),o=Math.cos(v)*f,l=Math.sin(v)*f,h=Math.sin(v)*(i?i/2:f),s.moveTo(e-u,a-l),s.lineTo(e+u,a+l),s.moveTo(e+h,a-o),s.lineTo(e-h,a+o),v+=oe,u=Math.cos(v)*(i?i/2:f),o=Math.cos(v)*f,l=Math.sin(v)*f,h=Math.sin(v)*(i?i/2:f),s.moveTo(e-u,a-l),s.lineTo(e+u,a+l),s.moveTo(e+h,a-o),s.lineTo(e-h,a+o);break;case"line":o=i?i/2:Math.cos(v)*f,l=Math.sin(v)*f,s.moveTo(e-o,a-l),s.lineTo(e+o,a+l);break;case"dash":s.moveTo(e,a),s.lineTo(e+Math.cos(v)*(i?i/2:f),a+Math.sin(v)*f);break;case!1:s.closePath();break}s.fill(),t.borderWidth>0&&s.stroke()}}function Wt(s,t,e){return e=e||.5,!t||s&&s.x>t.left-e&&s.x<t.right+e&&s.y>t.top-e&&s.y<t.bottom+e}function Os(s,t){s.save(),s.beginPath(),s.rect(t.left,t.top,t.right-t.left,t.bottom-t.top),s.clip()}function Es(s){s.restore()}function Xr(s,t,e,a,i){if(!t)return s.lineTo(e.x,e.y);if(i==="middle"){const n=(t.x+e.x)/2;s.lineTo(n,t.y),s.lineTo(n,e.y)}else i==="after"!=!!a?s.lineTo(t.x,e.y):s.lineTo(e.x,t.y);s.lineTo(e.x,e.y)}function qr(s,t,e,a){if(!t)return s.lineTo(e.x,e.y);s.bezierCurveTo(a?t.cp1x:t.cp2x,a?t.cp1y:t.cp2y,a?e.cp2x:e.cp1x,a?e.cp2y:e.cp1y,e.x,e.y)}function Kr(s,t){t.translation&&s.translate(t.translation[0],t.translation[1]),B(t.rotation)||s.rotate(t.rotation),t.color&&(s.fillStyle=t.color),t.textAlign&&(s.textAlign=t.textAlign),t.textBaseline&&(s.textBaseline=t.textBaseline)}function Zr(s,t,e,a,i){if(i.strikethrough||i.underline){const n=s.measureText(a),o=t-n.actualBoundingBoxLeft,l=t+n.actualBoundingBoxRight,r=e-n.actualBoundingBoxAscent,c=e+n.actualBoundingBoxDescent,d=i.strikethrough?(r+c)/2:c;s.strokeStyle=s.fillStyle,s.beginPath(),s.lineWidth=i.decorationWidth||2,s.moveTo(o,d),s.lineTo(l,d),s.stroke()}}function Qr(s,t){const e=s.fillStyle;s.fillStyle=t.color,s.fillRect(t.left,t.top,t.width,t.height),s.fillStyle=e}function be(s,t,e,a,i,n={}){const o=q(t)?t:[t],l=n.strokeWidth>0&&n.strokeColor!=="";let r,c;for(s.save(),s.font=i.string,Kr(s,n),r=0;r<o.length;++r)c=o[r],n.backdrop&&Qr(s,n.backdrop),l&&(n.strokeColor&&(s.strokeStyle=n.strokeColor),B(n.strokeWidth)||(s.lineWidth=n.strokeWidth),s.strokeText(c,e,a,n.maxWidth)),s.fillText(c,e,a,n.maxWidth),Zr(s,e,a,c,n),a+=Number(i.lineHeight);s.restore()}function Xe(s,t){const{x:e,y:a,w:i,h:n,radius:o}=t;s.arc(e+o.topLeft,a+o.topLeft,o.topLeft,1.5*j,j,!0),s.lineTo(e,a+n-o.bottomLeft),s.arc(e+o.bottomLeft,a+n-o.bottomLeft,o.bottomLeft,j,st,!0),s.lineTo(e+i-o.bottomRight,a+n),s.arc(e+i-o.bottomRight,a+n-o.bottomRight,o.bottomRight,st,0,!0),s.lineTo(e+i,a+o.topRight),s.arc(e+i-o.topRight,a+o.topRight,o.topRight,0,-st,!0),s.lineTo(e+o.topLeft,a)}const Jr=/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/,tc=/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;function ec(s,t){const e=(""+s).match(Jr);if(!e||e[1]==="normal")return t*1.2;switch(s=+e[2],e[3]){case"px":return s;case"%":s/=100;break}return t*s}const sc=s=>+s||0;function Oa(s,t){const e={},a=V(t),i=a?Object.keys(t):t,n=V(s)?a?o=>I(s[o],s[t[o]]):o=>s[o]:()=>s;for(const o of i)e[o]=sc(n(o));return e}function Qn(s){return Oa(s,{top:"y",right:"x",bottom:"y",left:"x"})}function he(s){return Oa(s,["topLeft","topRight","bottomLeft","bottomRight"])}function mt(s){const t=Qn(s);return t.width=t.left+t.right,t.height=t.top+t.bottom,t}function lt(s,t){s=s||{},t=t||K.font;let e=I(s.size,t.size);typeof e=="string"&&(e=parseInt(e,10));let a=I(s.style,t.style);a&&!(""+a).match(tc)&&(console.warn('Invalid font style specified: "'+a+'"'),a=void 0);const i={family:I(s.family,t.family),lineHeight:ec(I(s.lineHeight,t.lineHeight),e),size:e,style:a,weight:I(s.weight,t.weight),string:""};return i.string=Yr(i),i}function Ie(s,t,e,a){let i,n,o;for(i=0,n=s.length;i<n;++i)if(o=s[i],o!==void 0&&o!==void 0)return o}function ac(s,t,e){const{min:a,max:i}=s,n=Hn(t,(i-a)/2),o=(l,r)=>e&&l===0?0:l+r;return{min:o(a,-Math.abs(n)),max:o(i,n)}}function ee(s,t){return Object.assign(Object.create(s),t)}function Ea(s,t=[""],e,a,i=()=>s[0]){const n=e||s;typeof a>"u"&&(a=so("_fallback",s));const o={[Symbol.toStringTag]:"Object",_cacheable:!0,_scopes:s,_rootScopes:n,_fallback:a,_getTarget:i,override:l=>Ea([l,...s],t,n,a)};return new Proxy(o,{deleteProperty(l,r){return delete l[r],delete l._keys,delete s[0][r],!0},get(l,r){return to(l,r,()=>uc(r,t,s,l))},getOwnPropertyDescriptor(l,r){return Reflect.getOwnPropertyDescriptor(l._scopes[0],r)},getPrototypeOf(){return Reflect.getPrototypeOf(s[0])},has(l,r){return yi(l).includes(r)},ownKeys(l){return yi(l)},set(l,r,c){const d=l._storage||(l._storage=i());return l[r]=d[r]=c,delete l._keys,!0}})}function _e(s,t,e,a){const i={_cacheable:!1,_proxy:s,_context:t,_subProxy:e,_stack:new Set,_descriptors:Jn(s,a),setContext:n=>_e(s,n,e,a),override:n=>_e(s.override(n),t,e,a)};return new Proxy(i,{deleteProperty(n,o){return delete n[o],delete s[o],!0},get(n,o,l){return to(n,o,()=>nc(n,o,l))},getOwnPropertyDescriptor(n,o){return n._descriptors.allKeys?Reflect.has(s,o)?{enumerable:!0,configurable:!0}:void 0:Reflect.getOwnPropertyDescriptor(s,o)},getPrototypeOf(){return Reflect.getPrototypeOf(s)},has(n,o){return Reflect.has(s,o)},ownKeys(){return Reflect.ownKeys(s)},set(n,o,l){return s[o]=l,delete n[o],!0}})}function Jn(s,t={scriptable:!0,indexable:!0}){const{_scriptable:e=t.scriptable,_indexable:a=t.indexable,_allKeys:i=t.allKeys}=s;return{allKeys:i,scriptable:e,indexable:a,isScriptable:te(e)?e:()=>e,isIndexable:te(a)?a:()=>a}}const ic=(s,t)=>s?s+Pa(t):t,Ia=(s,t)=>V(t)&&s!=="adapters"&&(Object.getPrototypeOf(t)===null||t.constructor===Object);function to(s,t,e){if(Object.prototype.hasOwnProperty.call(s,t)||t==="constructor")return s[t];const a=e();return s[t]=a,a}function nc(s,t,e){const{_proxy:a,_context:i,_subProxy:n,_descriptors:o}=s;let l=a[t];return te(l)&&o.isScriptable(t)&&(l=oc(t,l,s,e)),q(l)&&l.length&&(l=lc(t,l,s,o.isIndexable)),Ia(t,l)&&(l=_e(l,i,n&&n[t],o)),l}function oc(s,t,e,a){const{_proxy:i,_context:n,_subProxy:o,_stack:l}=e;if(l.has(s))throw new Error("Recursion detected: "+Array.from(l).join("->")+"->"+s);l.add(s);let r=t(n,o||a);return l.delete(s),Ia(s,r)&&(r=Ra(i._scopes,i,s,r)),r}function lc(s,t,e,a){const{_proxy:i,_context:n,_subProxy:o,_descriptors:l}=e;if(typeof n.index<"u"&&a(s))return t[n.index%t.length];if(V(t[0])){const r=t,c=i._scopes.filter(d=>d!==r);t=[];for(const d of r){const u=Ra(c,i,s,d);t.push(_e(u,n,o&&o[s],l))}}return t}function eo(s,t,e){return te(s)?s(t,e):s}const rc=(s,t)=>s===!0?t:typeof s=="string"?Jt(t,s):void 0;function cc(s,t,e,a,i){for(const n of t){const o=rc(e,n);if(o){s.add(o);const l=eo(o._fallback,e,i);if(typeof l<"u"&&l!==e&&l!==a)return l}else if(o===!1&&typeof a<"u"&&e!==a)return null}return!1}function Ra(s,t,e,a){const i=t._rootScopes,n=eo(t._fallback,e,a),o=[...s,...i],l=new Set;l.add(a);let r=xi(l,o,e,n||e,a);return r===null||typeof n<"u"&&n!==e&&(r=xi(l,o,n,r,a),r===null)?!1:Ea(Array.from(l),[""],i,n,()=>dc(t,e,a))}function xi(s,t,e,a,i){for(;e;)e=cc(s,t,e,a,i);return e}function dc(s,t,e){const a=s._getTarget();t in a||(a[t]={});const i=a[t];return q(i)&&V(e)?e:i||{}}function uc(s,t,e,a){let i;for(const n of t)if(i=so(ic(n,s),e),typeof i<"u")return Ia(s,i)?Ra(e,a,s,i):i}function so(s,t){for(const e of t){if(!e)continue;const a=e[s];if(typeof a<"u")return a}}function yi(s){let t=s._keys;return t||(t=s._keys=hc(s._scopes)),t}function hc(s){const t=new Set;for(const e of s)for(const a of Object.keys(e).filter(i=>!i.startsWith("_")))t.add(a);return Array.from(t)}function ao(s,t,e,a){const{iScale:i}=s,{key:n="r"}=this._parsing,o=new Array(a);let l,r,c,d;for(l=0,r=a;l<r;++l)c=l+e,d=t[c],o[l]={r:i.parse(Jt(d,n),c)};return o}const pc=Number.EPSILON||1e-14,Ce=(s,t)=>t<s.length&&!s[t].skip&&s[t],io=s=>s==="x"?"y":"x";function fc(s,t,e,a){const i=s.skip?t:s,n=t,o=e.skip?t:e,l=ua(n,i),r=ua(o,n);let c=l/(l+r),d=r/(l+r);c=isNaN(c)?0:c,d=isNaN(d)?0:d;const u=a*c,h=a*d;return{previous:{x:n.x-u*(o.x-i.x),y:n.y-u*(o.y-i.y)},next:{x:n.x+h*(o.x-i.x),y:n.y+h*(o.y-i.y)}}}function bc(s,t,e){const a=s.length;let i,n,o,l,r,c=Ce(s,0);for(let d=0;d<a-1;++d)if(r=c,c=Ce(s,d+1),!(!r||!c)){if(Ve(t[d],0,pc)){e[d]=e[d+1]=0;continue}i=e[d]/t[d],n=e[d+1]/t[d],l=Math.pow(i,2)+Math.pow(n,2),!(l<=9)&&(o=3/Math.sqrt(l),e[d]=i*o*t[d],e[d+1]=n*o*t[d])}}function gc(s,t,e="x"){const a=io(e),i=s.length;let n,o,l,r=Ce(s,0);for(let c=0;c<i;++c){if(o=l,l=r,r=Ce(s,c+1),!l)continue;const d=l[e],u=l[a];o&&(n=(d-o[e])/3,l[`cp1${e}`]=d-n,l[`cp1${a}`]=u-n*t[c]),r&&(n=(r[e]-d)/3,l[`cp2${e}`]=d+n,l[`cp2${a}`]=u+n*t[c])}}function vc(s,t="x"){const e=io(t),a=s.length,i=Array(a).fill(0),n=Array(a);let o,l,r,c=Ce(s,0);for(o=0;o<a;++o)if(l=r,r=c,c=Ce(s,o+1),!!r){if(c){const d=c[t]-r[t];i[o]=d!==0?(c[e]-r[e])/d:0}n[o]=l?c?Ot(i[o-1])!==Ot(i[o])?0:(i[o-1]+i[o])/2:i[o-1]:i[o]}bc(s,i,n),gc(s,n,t)}function ls(s,t,e){return Math.max(Math.min(s,e),t)}function mc(s,t){let e,a,i,n,o,l=Wt(s[0],t);for(e=0,a=s.length;e<a;++e)o=n,n=l,l=e<a-1&&Wt(s[e+1],t),n&&(i=s[e],o&&(i.cp1x=ls(i.cp1x,t.left,t.right),i.cp1y=ls(i.cp1y,t.top,t.bottom)),l&&(i.cp2x=ls(i.cp2x,t.left,t.right),i.cp2y=ls(i.cp2y,t.top,t.bottom)))}function xc(s,t,e,a,i){let n,o,l,r;if(t.spanGaps&&(s=s.filter(c=>!c.skip)),t.cubicInterpolationMode==="monotone")vc(s,i);else{let c=a?s[s.length-1]:s[0];for(n=0,o=s.length;n<o;++n)l=s[n],r=fc(c,l,s[Math.min(n+1,o-(a?0:1))%o],t.tension),l.cp1x=r.previous.x,l.cp1y=r.previous.y,l.cp2x=r.next.x,l.cp2y=r.next.y,c=l}t.capBezierPoints&&mc(s,e)}function za(){return typeof window<"u"&&typeof document<"u"}function Ba(s){let t=s.parentNode;return t&&t.toString()==="[object ShadowRoot]"&&(t=t.host),t}function Ms(s,t,e){let a;return typeof s=="string"?(a=parseInt(s,10),s.indexOf("%")!==-1&&(a=a/100*t.parentNode[e])):a=s,a}const Is=s=>s.ownerDocument.defaultView.getComputedStyle(s,null);function yc(s,t){return Is(s).getPropertyValue(t)}const wc=["top","right","bottom","left"];function pe(s,t,e){const a={};e=e?"-"+e:"";for(let i=0;i<4;i++){const n=wc[i];a[n]=parseFloat(s[t+"-"+n+e])||0}return a.width=a.left+a.right,a.height=a.top+a.bottom,a}const kc=(s,t,e)=>(s>0||t>0)&&(!e||!e.shadowRoot);function Sc(s,t){const e=s.touches,a=e&&e.length?e[0]:s,{offsetX:i,offsetY:n}=a;let o=!1,l,r;if(kc(i,n,s.target))l=i,r=n;else{const c=t.getBoundingClientRect();l=a.clientX-c.left,r=a.clientY-c.top,o=!0}return{x:l,y:r,box:o}}function de(s,t){if("native"in s)return s;const{canvas:e,currentDevicePixelRatio:a}=t,i=Is(e),n=i.boxSizing==="border-box",o=pe(i,"padding"),l=pe(i,"border","width"),{x:r,y:c,box:d}=Sc(s,e),u=o.left+(d&&l.left),h=o.top+(d&&l.top);let{width:p,height:b}=t;return n&&(p-=o.width+l.width,b-=o.height+l.height),{x:Math.round((r-u)/p*e.width/a),y:Math.round((c-h)/b*e.height/a)}}function _c(s,t,e){let a,i;if(t===void 0||e===void 0){const n=s&&Ba(s);if(!n)t=s.clientWidth,e=s.clientHeight;else{const o=n.getBoundingClientRect(),l=Is(n),r=pe(l,"border","width"),c=pe(l,"padding");t=o.width-c.width-r.width,e=o.height-c.height-r.height,a=Ms(l.maxWidth,n,"clientWidth"),i=Ms(l.maxHeight,n,"clientHeight")}}return{width:t,height:e,maxWidth:a||_s,maxHeight:i||_s}}const Kt=s=>Math.round(s*10)/10;function Cc(s,t,e,a){const i=Is(s),n=pe(i,"margin"),o=Ms(i.maxWidth,s,"clientWidth")||_s,l=Ms(i.maxHeight,s,"clientHeight")||_s,r=_c(s,t,e);let{width:c,height:d}=r;if(i.boxSizing==="content-box"){const h=pe(i,"border","width"),p=pe(i,"padding");c-=p.width+h.width,d-=p.height+h.height}return c=Math.max(0,c-n.width),d=Math.max(0,a?c/a:d-n.height),c=Kt(Math.min(c,o,r.maxWidth)),d=Kt(Math.min(d,l,r.maxHeight)),c&&!d&&(d=Kt(c/2)),(t!==void 0||e!==void 0)&&a&&r.height&&d>r.height&&(d=r.height,c=Kt(Math.floor(d*a))),{width:c,height:d}}function wi(s,t,e){const a=t||1,i=Kt(s.height*a),n=Kt(s.width*a);s.height=Kt(s.height),s.width=Kt(s.width);const o=s.canvas;return o.style&&(e||!o.style.height&&!o.style.width)&&(o.style.height=`${s.height}px`,o.style.width=`${s.width}px`),s.currentDevicePixelRatio!==a||o.height!==i||o.width!==n?(s.currentDevicePixelRatio=a,o.height=i,o.width=n,s.ctx.setTransform(a,0,0,a,0,0),!0):!1}const Mc=(function(){let s=!1;try{const t={get passive(){return s=!0,!1}};za()&&(window.addEventListener("test",null,t),window.removeEventListener("test",null,t))}catch{}return s})();function ki(s,t){const e=yc(s,t),a=e&&e.match(/^(\d+)(\.\d+)?px$/);return a?+a[1]:void 0}function ue(s,t,e,a){return{x:s.x+e*(t.x-s.x),y:s.y+e*(t.y-s.y)}}function Pc(s,t,e,a){return{x:s.x+e*(t.x-s.x),y:a==="middle"?e<.5?s.y:t.y:a==="after"?e<1?s.y:t.y:e>0?t.y:s.y}}function Ac(s,t,e,a){const i={x:s.cp2x,y:s.cp2y},n={x:t.cp1x,y:t.cp1y},o=ue(s,i,e),l=ue(i,n,e),r=ue(n,t,e),c=ue(o,l,e),d=ue(l,r,e);return ue(c,d,e)}const Dc=function(s,t){return{x(e){return s+s+t-e},setWidth(e){t=e},textAlign(e){return e==="center"?e:e==="right"?"left":"right"},xPlus(e,a){return e-a},leftForLtr(e,a){return e-a}}},Tc=function(){return{x(s){return s},setWidth(s){},textAlign(s){return s},xPlus(s,t){return s+t},leftForLtr(s,t){return s}}};function we(s,t,e){return s?Dc(t,e):Tc()}function no(s,t){let e,a;(t==="ltr"||t==="rtl")&&(e=s.canvas.style,a=[e.getPropertyValue("direction"),e.getPropertyPriority("direction")],e.setProperty("direction",t,"important"),s.prevTextDirection=a)}function oo(s,t){t!==void 0&&(delete s.prevTextDirection,s.canvas.style.setProperty("direction",t[0],t[1]))}function lo(s){return s==="angle"?{between:Ge,compare:Lr,normalize:bt}:{between:jt,compare:(t,e)=>t-e,normalize:t=>t}}function Si({start:s,end:t,count:e,loop:a,style:i}){return{start:s%e,end:t%e,loop:a&&(t-s+1)%e===0,style:i}}function Lc(s,t,e){const{property:a,start:i,end:n}=e,{between:o,normalize:l}=lo(a),r=t.length;let{start:c,end:d,loop:u}=s,h,p;if(u){for(c+=r,d+=r,h=0,p=r;h<p&&o(l(t[c%r][a]),i,n);++h)c--,d--;c%=r,d%=r}return d<c&&(d+=r),{start:c,end:d,loop:u,style:s.style}}function ro(s,t,e){if(!e)return[s];const{property:a,start:i,end:n}=e,o=t.length,{compare:l,between:r,normalize:c}=lo(a),{start:d,end:u,loop:h,style:p}=Lc(s,t,e),b=[];let f=!1,v=null,x,w,_;const S=()=>r(i,_,x)&&l(i,_)!==0,k=()=>l(n,x)===0||r(n,_,x),P=()=>f||S(),T=()=>!f||k();for(let M=d,O=d;M<=u;++M)w=t[M%o],!w.skip&&(x=c(w[a]),x!==_&&(f=r(x,i,n),v===null&&P()&&(v=l(x,i)===0?M:O),v!==null&&T()&&(b.push(Si({start:v,end:M,loop:h,count:o,style:p})),v=null),O=M,_=x));return v!==null&&b.push(Si({start:v,end:u,loop:h,count:o,style:p})),b}function co(s,t){const e=[],a=s.segments;for(let i=0;i<a.length;i++){const n=ro(a[i],s.points,t);n.length&&e.push(...n)}return e}function Oc(s,t,e,a){let i=0,n=t-1;if(e&&!a)for(;i<t&&!s[i].skip;)i++;for(;i<t&&s[i].skip;)i++;for(i%=t,e&&(n+=i);n>i&&s[n%t].skip;)n--;return n%=t,{start:i,end:n}}function Ec(s,t,e,a){const i=s.length,n=[];let o=t,l=s[t],r;for(r=t+1;r<=e;++r){const c=s[r%i];c.skip||c.stop?l.skip||(a=!1,n.push({start:t%i,end:(r-1)%i,loop:a}),t=o=c.stop?r:null):(o=r,l.skip&&(t=r)),l=c}return o!==null&&n.push({start:t%i,end:o%i,loop:a}),n}function Ic(s,t){const e=s.points,a=s.options.spanGaps,i=e.length;if(!i)return[];const n=!!s._loop,{start:o,end:l}=Oc(e,i,n,a);if(a===!0)return _i(s,[{start:o,end:l,loop:n}],e,t);const r=l<o?l+i:l,c=!!s._fullLoop&&o===0&&l===i-1;return _i(s,Ec(e,o,r,c),e,t)}function _i(s,t,e,a){return!a||!a.setContext||!e?t:Rc(s,t,e,a)}function Rc(s,t,e,a){const i=s._chart.getContext(),n=Ci(s.options),{_datasetIndex:o,options:{spanGaps:l}}=s,r=e.length,c=[];let d=n,u=t[0].start,h=u;function p(b,f,v,x){const w=l?-1:1;if(b!==f){for(b+=r;e[b%r].skip;)b-=w;for(;e[f%r].skip;)f+=w;b%r!==f%r&&(c.push({start:b%r,end:f%r,loop:v,style:x}),d=x,u=f%r)}}for(const b of t){u=l?u:b.start;let f=e[u%r],v;for(h=u+1;h<=b.end;h++){const x=e[h%r];v=Ci(a.setContext(ee(i,{type:"segment",p0:f,p1:x,p0DataIndex:(h-1)%r,p1DataIndex:h%r,datasetIndex:o}))),zc(v,d)&&p(u,h-1,b.loop,d),f=x,d=v}u<h-1&&p(u,h-1,b.loop,d)}return c}function Ci(s){return{backgroundColor:s.backgroundColor,borderCapStyle:s.borderCapStyle,borderDash:s.borderDash,borderDashOffset:s.borderDashOffset,borderJoinStyle:s.borderJoinStyle,borderWidth:s.borderWidth,borderColor:s.borderColor}}function zc(s,t){if(!t)return!1;const e=[],a=function(i,n){return La(n)?(e.includes(n)||e.push(n),e.indexOf(n)):n};return JSON.stringify(s,a)!==JSON.stringify(t,a)}function rs(s,t,e){return s.options.clip?s[e]:t[e]}function Bc(s,t){const{xScale:e,yScale:a}=s;return e&&a?{left:rs(e,t,"left"),right:rs(e,t,"right"),top:rs(a,t,"top"),bottom:rs(a,t,"bottom")}:t}function uo(s,t){const e=t._clip;if(e.disabled)return!1;const a=Bc(t,s.chartArea);return{left:e.left===!1?0:a.left-(e.left===!0?0:e.left),right:e.right===!1?s.width:a.right+(e.right===!0?0:e.right),top:e.top===!1?0:a.top-(e.top===!0?0:e.top),bottom:e.bottom===!1?s.height:a.bottom+(e.bottom===!0?0:e.bottom)}}class Fc{constructor(){this._request=null,this._charts=new Map,this._running=!1,this._lastDate=void 0}_notify(t,e,a,i){const n=e.listeners[i],o=e.duration;n.forEach(l=>l({chart:t,initial:e.initial,numSteps:o,currentStep:Math.min(a-e.start,o)}))}_refresh(){this._request||(this._running=!0,this._request=Yn.call(window,()=>{this._update(),this._request=null,this._running&&this._refresh()}))}_update(t=Date.now()){let e=0;this._charts.forEach((a,i)=>{if(!a.running||!a.items.length)return;const n=a.items;let o=n.length-1,l=!1,r;for(;o>=0;--o)r=n[o],r._active?(r._total>a.duration&&(a.duration=r._total),r.tick(t),l=!0):(n[o]=n[n.length-1],n.pop());l&&(i.draw(),this._notify(i,a,t,"progress")),n.length||(a.running=!1,this._notify(i,a,t,"complete"),a.initial=!1),e+=n.length}),this._lastDate=t,e===0&&(this._running=!1)}_getAnims(t){const e=this._charts;let a=e.get(t);return a||(a={running:!1,initial:!0,items:[],listeners:{complete:[],progress:[]}},e.set(t,a)),a}listen(t,e,a){this._getAnims(t).listeners[e].push(a)}add(t,e){!e||!e.length||this._getAnims(t).items.push(...e)}has(t){return this._getAnims(t).items.length>0}start(t){const e=this._charts.get(t);e&&(e.running=!0,e.start=Date.now(),e.duration=e.items.reduce((a,i)=>Math.max(a,i._duration),0),this._refresh())}running(t){if(!this._running)return!1;const e=this._charts.get(t);return!(!e||!e.running||!e.items.length)}stop(t){const e=this._charts.get(t);if(!e||!e.items.length)return;const a=e.items;let i=a.length-1;for(;i>=0;--i)a[i].cancel();e.items=[],this._notify(t,e,Date.now(),"complete")}remove(t){return this._charts.delete(t)}}var Bt=new Fc;const Mi="transparent",Vc={boolean(s,t,e){return e>.5?t:s},color(s,t,e){const a=gi(s||Mi),i=a.valid&&gi(t||Mi);return i&&i.valid?i.mix(a,e).hexString():t},number(s,t,e){return s+(t-s)*e}};class Hc{constructor(t,e,a,i){const n=e[a];i=Ie([t.to,i,n,t.from]);const o=Ie([t.from,n,i]);this._active=!0,this._fn=t.fn||Vc[t.type||typeof o],this._easing=He[t.easing]||He.linear,this._start=Math.floor(Date.now()+(t.delay||0)),this._duration=this._total=Math.floor(t.duration),this._loop=!!t.loop,this._target=e,this._prop=a,this._from=o,this._to=i,this._promises=void 0}active(){return this._active}update(t,e,a){if(this._active){this._notify(!1);const i=this._target[this._prop],n=a-this._start,o=this._duration-n;this._start=a,this._duration=Math.floor(Math.max(o,t.duration)),this._total+=n,this._loop=!!t.loop,this._to=Ie([t.to,e,i,t.from]),this._from=Ie([t.from,i,e])}}cancel(){this._active&&(this.tick(Date.now()),this._active=!1,this._notify(!1))}tick(t){const e=t-this._start,a=this._duration,i=this._prop,n=this._from,o=this._loop,l=this._to;let r;if(this._active=n!==l&&(o||e<a),!this._active){this._target[i]=l,this._notify(!0);return}if(e<0){this._target[i]=n;return}r=e/a%2,r=o&&r>1?2-r:r,r=this._easing(Math.min(1,Math.max(0,r))),this._target[i]=this._fn(n,l,r)}wait(){const t=this._promises||(this._promises=[]);return new Promise((e,a)=>{t.push({res:e,rej:a})})}_notify(t){const e=t?"res":"rej",a=this._promises||[];for(let i=0;i<a.length;i++)a[i][e]()}}class ho{constructor(t,e){this._chart=t,this._properties=new Map,this.configure(e)}configure(t){if(!V(t))return;const e=Object.keys(K.animation),a=this._properties;Object.getOwnPropertyNames(t).forEach(i=>{const n=t[i];if(!V(n))return;const o={};for(const l of e)o[l]=n[l];(q(n.properties)&&n.properties||[i]).forEach(l=>{(l===i||!a.has(l))&&a.set(l,o)})})}_animateOptions(t,e){const a=e.options,i=Nc(t,a);if(!i)return[];const n=this._createAnimations(i,a);return a.$shared&&jc(t.options.$animations,a).then(()=>{t.options=a},()=>{}),n}_createAnimations(t,e){const a=this._properties,i=[],n=t.$animations||(t.$animations={}),o=Object.keys(e),l=Date.now();let r;for(r=o.length-1;r>=0;--r){const c=o[r];if(c.charAt(0)==="$")continue;if(c==="options"){i.push(...this._animateOptions(t,e));continue}const d=e[c];let u=n[c];const h=a.get(c);if(u)if(h&&u.active()){u.update(h,d,l);continue}else u.cancel();if(!h||!h.duration){t[c]=d;continue}n[c]=u=new Hc(h,t,c,d),i.push(u)}return i}update(t,e){if(this._properties.size===0){Object.assign(t,e);return}const a=this._createAnimations(t,e);if(a.length)return Bt.add(this._chart,a),!0}}function jc(s,t){const e=[],a=Object.keys(t);for(let i=0;i<a.length;i++){const n=s[a[i]];n&&n.active()&&e.push(n.wait())}return Promise.all(e)}function Nc(s,t){if(!t)return;let e=s.options;if(!e){s.options=t;return}return e.$shared&&(s.options=e=Object.assign({},e,{$shared:!1,$animations:{}})),e}function Pi(s,t){const e=s&&s.options||{},a=e.reverse,i=e.min===void 0?t:0,n=e.max===void 0?t:0;return{start:a?n:i,end:a?i:n}}function Wc(s,t,e){if(e===!1)return!1;const a=Pi(s,e),i=Pi(t,e);return{top:i.end,right:a.end,bottom:i.start,left:a.start}}function Uc(s){let t,e,a,i;return V(s)?(t=s.top,e=s.right,a=s.bottom,i=s.left):t=e=a=i=s,{top:t,right:e,bottom:a,left:i,disabled:s===!1}}function po(s,t){const e=[],a=s._getSortedDatasetMetas(t);let i,n;for(i=0,n=a.length;i<n;++i)e.push(a[i].index);return e}function Ai(s,t,e,a={}){const i=s.keys,n=a.mode==="single";let o,l,r,c;if(t===null)return;let d=!1;for(o=0,l=i.length;o<l;++o){if(r=+i[o],r===e){if(d=!0,a.all)continue;break}c=s.values[r],tt(c)&&(n||t===0||Ot(t)===Ot(c))&&(t+=c)}return!d&&!a.all?0:t}function $c(s,t){const{iScale:e,vScale:a}=t,i=e.axis==="x"?"x":"y",n=a.axis==="x"?"x":"y",o=Object.keys(s),l=new Array(o.length);let r,c,d;for(r=0,c=o.length;r<c;++r)d=o[r],l[r]={[i]:d,[n]:s[d]};return l}function Zs(s,t){const e=s&&s.options.stacked;return e||e===void 0&&t.stack!==void 0}function Yc(s,t,e){return`${s.id}.${t.id}.${e.stack||e.type}`}function Gc(s){const{min:t,max:e,minDefined:a,maxDefined:i}=s.getUserBounds();return{min:a?t:Number.NEGATIVE_INFINITY,max:i?e:Number.POSITIVE_INFINITY}}function Xc(s,t,e){const a=s[t]||(s[t]={});return a[e]||(a[e]={})}function Di(s,t,e,a){for(const i of t.getMatchingVisibleMetas(a).reverse()){const n=s[i.index];if(e&&n>0||!e&&n<0)return i.index}return null}function Ti(s,t){const{chart:e,_cachedMeta:a}=s,i=e._stacks||(e._stacks={}),{iScale:n,vScale:o,index:l}=a,r=n.axis,c=o.axis,d=Yc(n,o,a),u=t.length;let h;for(let p=0;p<u;++p){const b=t[p],{[r]:f,[c]:v}=b,x=b._stacks||(b._stacks={});h=x[c]=Xc(i,d,f),h[l]=v,h._top=Di(h,o,!0,a.type),h._bottom=Di(h,o,!1,a.type);const w=h._visualValues||(h._visualValues={});w[l]=v}}function Qs(s,t){const e=s.scales;return Object.keys(e).filter(a=>e[a].axis===t).shift()}function qc(s,t){return ee(s,{active:!1,dataset:void 0,datasetIndex:t,index:t,mode:"default",type:"dataset"})}function Kc(s,t,e){return ee(s,{active:!1,dataIndex:t,parsed:void 0,raw:void 0,element:e,index:t,mode:"default",type:"data"})}function Ae(s,t){const e=s.controller.index,a=s.vScale&&s.vScale.axis;if(a){t=t||s._parsed;for(const i of t){const n=i._stacks;if(!n||n[a]===void 0||n[a][e]===void 0)return;delete n[a][e],n[a]._visualValues!==void 0&&n[a]._visualValues[e]!==void 0&&delete n[a]._visualValues[e]}}}const Js=s=>s==="reset"||s==="none",Li=(s,t)=>t?s:Object.assign({},s),Zc=(s,t,e)=>s&&!t.hidden&&t._stacked&&{keys:po(e,!0),values:null};class se{static defaults={};static datasetElementType=null;static dataElementType=null;constructor(t,e){this.chart=t,this._ctx=t.ctx,this.index=e,this._cachedDataOpts={},this._cachedMeta=this.getMeta(),this._type=this._cachedMeta.type,this.options=void 0,this._parsing=!1,this._data=void 0,this._objectData=void 0,this._sharedOptions=void 0,this._drawStart=void 0,this._drawCount=void 0,this.enableOptionSharing=!1,this.supportsDecimation=!1,this.$context=void 0,this._syncList=[],this.datasetElementType=new.target.datasetElementType,this.dataElementType=new.target.dataElementType,this.initialize()}initialize(){const t=this._cachedMeta;this.configure(),this.linkScales(),t._stacked=Zs(t.vScale,t),this.addElements(),this.options.fill&&!this.chart.isPluginEnabled("filler")&&console.warn("Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options")}updateIndex(t){this.index!==t&&Ae(this._cachedMeta),this.index=t}linkScales(){const t=this.chart,e=this._cachedMeta,a=this.getDataset(),i=(u,h,p,b)=>u==="x"?h:u==="r"?b:p,n=e.xAxisID=I(a.xAxisID,Qs(t,"x")),o=e.yAxisID=I(a.yAxisID,Qs(t,"y")),l=e.rAxisID=I(a.rAxisID,Qs(t,"r")),r=e.indexAxis,c=e.iAxisID=i(r,n,o,l),d=e.vAxisID=i(r,o,n,l);e.xScale=this.getScaleForId(n),e.yScale=this.getScaleForId(o),e.rScale=this.getScaleForId(l),e.iScale=this.getScaleForId(c),e.vScale=this.getScaleForId(d)}getDataset(){return this.chart.data.datasets[this.index]}getMeta(){return this.chart.getDatasetMeta(this.index)}getScaleForId(t){return this.chart.scales[t]}_getOtherScale(t){const e=this._cachedMeta;return t===e.iScale?e.vScale:e.iScale}reset(){this._update("reset")}_destroy(){const t=this._cachedMeta;this._data&&pi(this._data,this),t._stacked&&Ae(t)}_dataCheck(){const t=this.getDataset(),e=t.data||(t.data=[]),a=this._data;if(V(e)){const i=this._cachedMeta;this._data=$c(e,i)}else if(a!==e){if(a){pi(a,this);const i=this._cachedMeta;Ae(i),i._parsed=[]}e&&Object.isExtensible(e)&&Rr(e,this),this._syncList=[],this._data=e}}addElements(){const t=this._cachedMeta;this._dataCheck(),this.datasetElementType&&(t.dataset=new this.datasetElementType)}buildOrUpdateElements(t){const e=this._cachedMeta,a=this.getDataset();let i=!1;this._dataCheck();const n=e._stacked;e._stacked=Zs(e.vScale,e),e.stack!==a.stack&&(i=!0,Ae(e),e.stack=a.stack),this._resyncElements(t),(i||n!==e._stacked)&&(Ti(this,e._parsed),e._stacked=Zs(e.vScale,e))}configure(){const t=this.chart.config,e=t.datasetScopeKeys(this._type),a=t.getOptionScopes(this.getDataset(),e,!0);this.options=t.createResolver(a,this.getContext()),this._parsing=this.options.parsing,this._cachedDataOpts={}}parse(t,e){const{_cachedMeta:a,_data:i}=this,{iScale:n,_stacked:o}=a,l=n.axis;let r=t===0&&e===i.length?!0:a._sorted,c=t>0&&a._parsed[t-1],d,u,h;if(this._parsing===!1)a._parsed=i,a._sorted=!0,h=i;else{q(i[t])?h=this.parseArrayData(a,i,t,e):V(i[t])?h=this.parseObjectData(a,i,t,e):h=this.parsePrimitiveData(a,i,t,e);const p=()=>u[l]===null||c&&u[l]<c[l];for(d=0;d<e;++d)a._parsed[d+t]=u=h[d],r&&(p()&&(r=!1),c=u);a._sorted=r}o&&Ti(this,h)}parsePrimitiveData(t,e,a,i){const{iScale:n,vScale:o}=t,l=n.axis,r=o.axis,c=n.getLabels(),d=n===o,u=new Array(i);let h,p,b;for(h=0,p=i;h<p;++h)b=h+a,u[h]={[l]:d||n.parse(c[b],b),[r]:o.parse(e[b],b)};return u}parseArrayData(t,e,a,i){const{xScale:n,yScale:o}=t,l=new Array(i);let r,c,d,u;for(r=0,c=i;r<c;++r)d=r+a,u=e[d],l[r]={x:n.parse(u[0],d),y:o.parse(u[1],d)};return l}parseObjectData(t,e,a,i){const{xScale:n,yScale:o}=t,{xAxisKey:l="x",yAxisKey:r="y"}=this._parsing,c=new Array(i);let d,u,h,p;for(d=0,u=i;d<u;++d)h=d+a,p=e[h],c[d]={x:n.parse(Jt(p,l),h),y:o.parse(Jt(p,r),h)};return c}getParsed(t){return this._cachedMeta._parsed[t]}getDataElement(t){return this._cachedMeta.data[t]}applyStack(t,e,a){const i=this.chart,n=this._cachedMeta,o=e[t.axis],l={keys:po(i,!0),values:e._stacks[t.axis]._visualValues};return Ai(l,o,n.index,{mode:a})}updateRangeFromParsed(t,e,a,i){const n=a[e.axis];let o=n===null?NaN:n;const l=i&&a._stacks[e.axis];i&&l&&(i.values=l,o=Ai(i,n,this._cachedMeta.index)),t.min=Math.min(t.min,o),t.max=Math.max(t.max,o)}getMinMax(t,e){const a=this._cachedMeta,i=a._parsed,n=a._sorted&&t===a.iScale,o=i.length,l=this._getOtherScale(t),r=Zc(e,a,this.chart),c={min:Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY},{min:d,max:u}=Gc(l);let h,p;function b(){p=i[h];const f=p[l.axis];return!tt(p[t.axis])||d>f||u<f}for(h=0;h<o&&!(!b()&&(this.updateRangeFromParsed(c,t,p,r),n));++h);if(n){for(h=o-1;h>=0;--h)if(!b()){this.updateRangeFromParsed(c,t,p,r);break}}return c}getAllParsedValues(t){const e=this._cachedMeta._parsed,a=[];let i,n,o;for(i=0,n=e.length;i<n;++i)o=e[i][t.axis],tt(o)&&a.push(o);return a}getMaxOverflow(){return!1}getLabelAndValue(t){const e=this._cachedMeta,a=e.iScale,i=e.vScale,n=this.getParsed(t);return{label:a?""+a.getLabelForValue(n[a.axis]):"",value:i?""+i.getLabelForValue(n[i.axis]):""}}_update(t){const e=this._cachedMeta;this.update(t||"default"),e._clip=Uc(I(this.options.clip,Wc(e.xScale,e.yScale,this.getMaxOverflow())))}update(t){}draw(){const t=this._ctx,e=this.chart,a=this._cachedMeta,i=a.data||[],n=e.chartArea,o=[],l=this._drawStart||0,r=this._drawCount||i.length-l,c=this.options.drawActiveElementsOnTop;let d;for(a.dataset&&a.dataset.draw(t,n,l,r),d=l;d<l+r;++d){const u=i[d];u.hidden||(u.active&&c?o.push(u):u.draw(t,n))}for(d=0;d<o.length;++d)o[d].draw(t,n)}getStyle(t,e){const a=e?"active":"default";return t===void 0&&this._cachedMeta.dataset?this.resolveDatasetElementOptions(a):this.resolveDataElementOptions(t||0,a)}getContext(t,e,a){const i=this.getDataset();let n;if(t>=0&&t<this._cachedMeta.data.length){const o=this._cachedMeta.data[t];n=o.$context||(o.$context=Kc(this.getContext(),t,o)),n.parsed=this.getParsed(t),n.raw=i.data[t],n.index=n.dataIndex=t}else n=this.$context||(this.$context=qc(this.chart.getContext(),this.index)),n.dataset=i,n.index=n.datasetIndex=this.index;return n.active=!!e,n.mode=a,n}resolveDatasetElementOptions(t){return this._resolveElementOptions(this.datasetElementType.id,t)}resolveDataElementOptions(t,e){return this._resolveElementOptions(this.dataElementType.id,e,t)}_resolveElementOptions(t,e="default",a){const i=e==="active",n=this._cachedDataOpts,o=t+"-"+e,l=n[o],r=this.enableOptionSharing&&Ye(a);if(l)return Li(l,r);const c=this.chart.config,d=c.datasetElementScopeKeys(this._type,t),u=i?[`${t}Hover`,"hover",t,""]:[t,""],h=c.getOptionScopes(this.getDataset(),d),p=Object.keys(K.elements[t]),b=()=>this.getContext(a,i,e),f=c.resolveNamedOptions(h,p,b,u);return f.$shared&&(f.$shared=r,n[o]=Object.freeze(Li(f,r))),f}_resolveAnimations(t,e,a){const i=this.chart,n=this._cachedDataOpts,o=`animation-${e}`,l=n[o];if(l)return l;let r;if(i.options.animation!==!1){const d=this.chart.config,u=d.datasetAnimationScopeKeys(this._type,e),h=d.getOptionScopes(this.getDataset(),u);r=d.createResolver(h,this.getContext(t,a,e))}const c=new ho(i,r&&r.animations);return r&&r._cacheable&&(n[o]=Object.freeze(c)),c}getSharedOptions(t){if(t.$shared)return this._sharedOptions||(this._sharedOptions=Object.assign({},t))}includeOptions(t,e){return!e||Js(t)||this.chart._animationsDisabled}_getSharedOptions(t,e){const a=this.resolveDataElementOptions(t,e),i=this._sharedOptions,n=this.getSharedOptions(a),o=this.includeOptions(e,n)||n!==i;return this.updateSharedOptions(n,e,a),{sharedOptions:n,includeOptions:o}}updateElement(t,e,a,i){Js(i)?Object.assign(t,a):this._resolveAnimations(e,i).update(t,a)}updateSharedOptions(t,e,a){t&&!Js(e)&&this._resolveAnimations(void 0,e).update(t,a)}_setStyle(t,e,a,i){t.active=i;const n=this.getStyle(e,i);this._resolveAnimations(e,a,i).update(t,{options:!i&&this.getSharedOptions(n)||n})}removeHoverStyle(t,e,a){this._setStyle(t,a,"active",!1)}setHoverStyle(t,e,a){this._setStyle(t,a,"active",!0)}_removeDatasetHoverStyle(){const t=this._cachedMeta.dataset;t&&this._setStyle(t,void 0,"active",!1)}_setDatasetHoverStyle(){const t=this._cachedMeta.dataset;t&&this._setStyle(t,void 0,"active",!0)}_resyncElements(t){const e=this._data,a=this._cachedMeta.data;for(const[l,r,c]of this._syncList)this[l](r,c);this._syncList=[];const i=a.length,n=e.length,o=Math.min(n,i);o&&this.parse(0,o),n>i?this._insertElements(i,n-i,t):n<i&&this._removeElements(n,i-n)}_insertElements(t,e,a=!0){const i=this._cachedMeta,n=i.data,o=t+e;let l;const r=c=>{for(c.length+=e,l=c.length-1;l>=o;l--)c[l]=c[l-e]};for(r(n),l=t;l<o;++l)n[l]=new this.dataElementType;this._parsing&&r(i._parsed),this.parse(t,e),a&&this.updateElements(n,t,e,"reset")}updateElements(t,e,a,i){}_removeElements(t,e){const a=this._cachedMeta;if(this._parsing){const i=a._parsed.splice(t,e);a._stacked&&Ae(a,i)}a.data.splice(t,e)}_sync(t){if(this._parsing)this._syncList.push(t);else{const[e,a,i]=t;this[e](a,i)}this.chart._dataChanges.push([this.index,...t])}_onDataPush(){const t=arguments.length;this._sync(["_insertElements",this.getDataset().data.length-t,t])}_onDataPop(){this._sync(["_removeElements",this._cachedMeta.data.length-1,1])}_onDataShift(){this._sync(["_removeElements",0,1])}_onDataSplice(t,e){e&&this._sync(["_removeElements",t,e]);const a=arguments.length-2;a&&this._sync(["_insertElements",t,a])}_onDataUnshift(){this._sync(["_insertElements",0,arguments.length])}}function Qc(s,t){if(!s._cache.$bar){const e=s.getMatchingVisibleMetas(t);let a=[];for(let i=0,n=e.length;i<n;i++)a=a.concat(e[i].controller.getAllParsedValues(s));s._cache.$bar=$n(a.sort((i,n)=>i-n))}return s._cache.$bar}function Jc(s){const t=s.iScale,e=Qc(t,s.type);let a=t._length,i,n,o,l;const r=()=>{o===32767||o===-32768||(Ye(l)&&(a=Math.min(a,Math.abs(o-l)||a)),l=o)};for(i=0,n=e.length;i<n;++i)o=t.getPixelForValue(e[i]),r();for(l=void 0,i=0,n=t.ticks.length;i<n;++i)o=t.getPixelForTick(i),r();return a}function td(s,t,e,a){const i=e.barThickness;let n,o;return B(i)?(n=t.min*e.categoryPercentage,o=e.barPercentage):(n=i*a,o=1),{chunk:n/a,ratio:o,start:t.pixels[s]-n/2}}function ed(s,t,e,a){const i=t.pixels,n=i[s];let o=s>0?i[s-1]:null,l=s<i.length-1?i[s+1]:null;const r=e.categoryPercentage;o===null&&(o=n-(l===null?t.end-t.start:l-n)),l===null&&(l=n+n-o);const c=n-(n-Math.min(o,l))/2*r;return{chunk:Math.abs(l-o)/2*r/a,ratio:e.barPercentage,start:c}}function sd(s,t,e,a){const i=e.parse(s[0],a),n=e.parse(s[1],a),o=Math.min(i,n),l=Math.max(i,n);let r=o,c=l;Math.abs(o)>Math.abs(l)&&(r=l,c=o),t[e.axis]=c,t._custom={barStart:r,barEnd:c,start:i,end:n,min:o,max:l}}function fo(s,t,e,a){return q(s)?sd(s,t,e,a):t[e.axis]=e.parse(s,a),t}function Oi(s,t,e,a){const i=s.iScale,n=s.vScale,o=i.getLabels(),l=i===n,r=[];let c,d,u,h;for(c=e,d=e+a;c<d;++c)h=t[c],u={},u[i.axis]=l||i.parse(o[c],c),r.push(fo(h,u,n,c));return r}function ta(s){return s&&s.barStart!==void 0&&s.barEnd!==void 0}function ad(s,t,e){return s!==0?Ot(s):(t.isHorizontal()?1:-1)*(t.min>=e?1:-1)}function id(s){let t,e,a,i,n;return s.horizontal?(t=s.base>s.x,e="left",a="right"):(t=s.base<s.y,e="bottom",a="top"),t?(i="end",n="start"):(i="start",n="end"),{start:e,end:a,reverse:t,top:i,bottom:n}}function nd(s,t,e,a){let i=t.borderSkipped;const n={};if(!i){s.borderSkipped=n;return}if(i===!0){s.borderSkipped={top:!0,right:!0,bottom:!0,left:!0};return}const{start:o,end:l,reverse:r,top:c,bottom:d}=id(s);i==="middle"&&e&&(s.enableBorderRadius=!0,(e._top||0)===a?i=c:(e._bottom||0)===a?i=d:(n[Ei(d,o,l,r)]=!0,i=c)),n[Ei(i,o,l,r)]=!0,s.borderSkipped=n}function Ei(s,t,e,a){return a?(s=od(s,t,e),s=Ii(s,e,t)):s=Ii(s,t,e),s}function od(s,t,e){return s===t?e:s===e?t:s}function Ii(s,t,e){return s==="start"?t:s==="end"?e:s}function ld(s,{inflateAmount:t},e){s.inflateAmount=t==="auto"?e===1?.33:0:t}class bo extends se{static id="bar";static defaults={datasetElementType:!1,dataElementType:"bar",categoryPercentage:.8,barPercentage:.9,grouped:!0,animations:{numbers:{type:"number",properties:["x","y","base","width","height"]}}};static overrides={scales:{_index_:{type:"category",offset:!0,grid:{offset:!0}},_value_:{type:"linear",beginAtZero:!0}}};parsePrimitiveData(t,e,a,i){return Oi(t,e,a,i)}parseArrayData(t,e,a,i){return Oi(t,e,a,i)}parseObjectData(t,e,a,i){const{iScale:n,vScale:o}=t,{xAxisKey:l="x",yAxisKey:r="y"}=this._parsing,c=n.axis==="x"?l:r,d=o.axis==="x"?l:r,u=[];let h,p,b,f;for(h=a,p=a+i;h<p;++h)f=e[h],b={},b[n.axis]=n.parse(Jt(f,c),h),u.push(fo(Jt(f,d),b,o,h));return u}updateRangeFromParsed(t,e,a,i){super.updateRangeFromParsed(t,e,a,i);const n=a._custom;n&&e===this._cachedMeta.vScale&&(t.min=Math.min(t.min,n.min),t.max=Math.max(t.max,n.max))}getMaxOverflow(){return 0}getLabelAndValue(t){const e=this._cachedMeta,{iScale:a,vScale:i}=e,n=this.getParsed(t),o=n._custom,l=ta(o)?"["+o.start+", "+o.end+"]":""+i.getLabelForValue(n[i.axis]);return{label:""+a.getLabelForValue(n[a.axis]),value:l}}initialize(){this.enableOptionSharing=!0,super.initialize();const t=this._cachedMeta;t.stack=this.getDataset().stack}update(t){const e=this._cachedMeta;this.updateElements(e.data,0,e.data.length,t)}updateElements(t,e,a,i){const n=i==="reset",{index:o,_cachedMeta:{vScale:l}}=this,r=l.getBasePixel(),c=l.isHorizontal(),d=this._getRuler(),{sharedOptions:u,includeOptions:h}=this._getSharedOptions(e,i);for(let p=e;p<e+a;p++){const b=this.getParsed(p),f=n||B(b[l.axis])?{base:r,head:r}:this._calculateBarValuePixels(p),v=this._calculateBarIndexPixels(p,d),x=(b._stacks||{})[l.axis],w={horizontal:c,base:f.base,enableBorderRadius:!x||ta(b._custom)||o===x._top||o===x._bottom,x:c?f.head:v.center,y:c?v.center:f.head,height:c?v.size:Math.abs(f.size),width:c?Math.abs(f.size):v.size};h&&(w.options=u||this.resolveDataElementOptions(p,t[p].active?"active":i));const _=w.options||t[p].options;nd(w,_,x,o),ld(w,_,d.ratio),this.updateElement(t[p],p,w,i)}}_getStacks(t,e){const{iScale:a}=this._cachedMeta,i=a.getMatchingVisibleMetas(this._type).filter(d=>d.controller.options.grouped),n=a.options.stacked,o=[],l=this._cachedMeta.controller.getParsed(e),r=l&&l[a.axis],c=d=>{const u=d._parsed.find(p=>p[a.axis]===r),h=u&&u[d.vScale.axis];if(B(h)||isNaN(h))return!0};for(const d of i)if(!(e!==void 0&&c(d))&&((n===!1||o.indexOf(d.stack)===-1||n===void 0&&d.stack===void 0)&&o.push(d.stack),d.index===t))break;return o.length||o.push(void 0),o}_getStackCount(t){return this._getStacks(void 0,t).length}_getAxisCount(){return this._getAxis().length}getFirstScaleIdForIndexAxis(){const t=this.chart.scales,e=this.chart.options.indexAxis;return Object.keys(t).filter(a=>t[a].axis===e).shift()}_getAxis(){const t={},e=this.getFirstScaleIdForIndexAxis();for(const a of this.chart.data.datasets)t[I(this.chart.options.indexAxis==="x"?a.xAxisID:a.yAxisID,e)]=!0;return Object.keys(t)}_getStackIndex(t,e,a){const i=this._getStacks(t,a),n=e!==void 0?i.indexOf(e):-1;return n===-1?i.length-1:n}_getRuler(){const t=this.options,e=this._cachedMeta,a=e.iScale,i=[];let n,o;for(n=0,o=e.data.length;n<o;++n)i.push(a.getPixelForValue(this.getParsed(n)[a.axis],n));const l=t.barThickness;return{min:l||Jc(e),pixels:i,start:a._startPixel,end:a._endPixel,stackCount:this._getStackCount(),scale:a,grouped:t.grouped,ratio:l?1:t.categoryPercentage*t.barPercentage}}_calculateBarValuePixels(t){const{_cachedMeta:{vScale:e,_stacked:a,index:i},options:{base:n,minBarLength:o}}=this,l=n||0,r=this.getParsed(t),c=r._custom,d=ta(c);let u=r[e.axis],h=0,p=a?this.applyStack(e,r,a):u,b,f;p!==u&&(h=p-u,p=u),d&&(u=c.barStart,p=c.barEnd-c.barStart,u!==0&&Ot(u)!==Ot(c.barEnd)&&(h=0),h+=u);const v=!B(n)&&!d?n:h;let x=e.getPixelForValue(v);if(this.chart.getDataVisibility(t)?b=e.getPixelForValue(h+p):b=x,f=b-x,Math.abs(f)<o){f=ad(f,e,l)*o,u===l&&(x-=f/2);const w=e.getPixelForDecimal(0),_=e.getPixelForDecimal(1),S=Math.min(w,_),k=Math.max(w,_);x=Math.max(Math.min(x,k),S),b=x+f,a&&!d&&(r._stacks[e.axis]._visualValues[i]=e.getValueForPixel(b)-e.getValueForPixel(x))}if(x===e.getPixelForValue(l)){const w=Ot(f)*e.getLineWidthForValue(l)/2;x+=w,f-=w}return{size:f,base:x,head:b,center:b+f/2}}_calculateBarIndexPixels(t,e){const a=e.scale,i=this.options,n=i.skipNull,o=I(i.maxBarThickness,1/0);let l,r;const c=this._getAxisCount();if(e.grouped){const d=n?this._getStackCount(t):e.stackCount,u=i.barThickness==="flex"?ed(t,e,i,d*c):td(t,e,i,d*c),h=this.chart.options.indexAxis==="x"?this.getDataset().xAxisID:this.getDataset().yAxisID,p=this._getAxis().indexOf(I(h,this.getFirstScaleIdForIndexAxis())),b=this._getStackIndex(this.index,this._cachedMeta.stack,n?t:void 0)+p;l=u.start+u.chunk*b+u.chunk/2,r=Math.min(o,u.chunk*u.ratio)}else l=a.getPixelForValue(this.getParsed(t)[a.axis],t),r=Math.min(o,e.min*e.ratio);return{base:l-r/2,head:l+r/2,center:l,size:r}}draw(){const t=this._cachedMeta,e=t.vScale,a=t.data,i=a.length;let n=0;for(;n<i;++n)this.getParsed(n)[e.axis]!==null&&!a[n].hidden&&a[n].draw(this._ctx)}}class rd extends se{static id="bubble";static defaults={datasetElementType:!1,dataElementType:"point",animations:{numbers:{type:"number",properties:["x","y","borderWidth","radius"]}}};static overrides={scales:{x:{type:"linear"},y:{type:"linear"}}};initialize(){this.enableOptionSharing=!0,super.initialize()}parsePrimitiveData(t,e,a,i){const n=super.parsePrimitiveData(t,e,a,i);for(let o=0;o<n.length;o++)n[o]._custom=this.resolveDataElementOptions(o+a).radius;return n}parseArrayData(t,e,a,i){const n=super.parseArrayData(t,e,a,i);for(let o=0;o<n.length;o++){const l=e[a+o];n[o]._custom=I(l[2],this.resolveDataElementOptions(o+a).radius)}return n}parseObjectData(t,e,a,i){const n=super.parseObjectData(t,e,a,i);for(let o=0;o<n.length;o++){const l=e[a+o];n[o]._custom=I(l&&l.r&&+l.r,this.resolveDataElementOptions(o+a).radius)}return n}getMaxOverflow(){const t=this._cachedMeta.data;let e=0;for(let a=t.length-1;a>=0;--a)e=Math.max(e,t[a].size(this.resolveDataElementOptions(a))/2);return e>0&&e}getLabelAndValue(t){const e=this._cachedMeta,a=this.chart.data.labels||[],{xScale:i,yScale:n}=e,o=this.getParsed(t),l=i.getLabelForValue(o.x),r=n.getLabelForValue(o.y),c=o._custom;return{label:a[t]||"",value:"("+l+", "+r+(c?", "+c:"")+")"}}update(t){const e=this._cachedMeta.data;this.updateElements(e,0,e.length,t)}updateElements(t,e,a,i){const n=i==="reset",{iScale:o,vScale:l}=this._cachedMeta,{sharedOptions:r,includeOptions:c}=this._getSharedOptions(e,i),d=o.axis,u=l.axis;for(let h=e;h<e+a;h++){const p=t[h],b=!n&&this.getParsed(h),f={},v=f[d]=n?o.getPixelForDecimal(.5):o.getPixelForValue(b[d]),x=f[u]=n?l.getBasePixel():l.getPixelForValue(b[u]);f.skip=isNaN(v)||isNaN(x),c&&(f.options=r||this.resolveDataElementOptions(h,p.active?"active":i),n&&(f.options.radius=0)),this.updateElement(p,h,f,i)}}resolveDataElementOptions(t,e){const a=this.getParsed(t);let i=super.resolveDataElementOptions(t,e);i.$shared&&(i=Object.assign({},i,{$shared:!1}));const n=i.radius;return e!=="active"&&(i.radius=0),i.radius+=I(a&&a._custom,n),i}}function cd(s,t,e){let a=1,i=1,n=0,o=0;if(t<X){const l=s,r=l+t,c=Math.cos(l),d=Math.sin(l),u=Math.cos(r),h=Math.sin(r),p=(_,S,k)=>Ge(_,l,r,!0)?1:Math.max(S,S*e,k,k*e),b=(_,S,k)=>Ge(_,l,r,!0)?-1:Math.min(S,S*e,k,k*e),f=p(0,c,u),v=p(st,d,h),x=b(j,c,u),w=b(j+st,d,h);a=(f-x)/2,i=(v-w)/2,n=-(f+x)/2,o=-(v+w)/2}return{ratioX:a,ratioY:i,offsetX:n,offsetY:o}}class Rs extends se{static id="doughnut";static defaults={datasetElementType:!1,dataElementType:"arc",animation:{animateRotate:!0,animateScale:!1},animations:{numbers:{type:"number",properties:["circumference","endAngle","innerRadius","outerRadius","startAngle","x","y","offset","borderWidth","spacing"]}},cutout:"50%",rotation:0,circumference:360,radius:"100%",spacing:0,indexAxis:"r"};static descriptors={_scriptable:t=>t!=="spacing",_indexable:t=>t!=="spacing"&&!t.startsWith("borderDash")&&!t.startsWith("hoverBorderDash")};static overrides={aspectRatio:1,plugins:{legend:{labels:{generateLabels(t){const e=t.data,{labels:{pointStyle:a,textAlign:i,color:n,useBorderRadius:o,borderRadius:l}}=t.legend.options;return e.labels.length&&e.datasets.length?e.labels.map((r,c)=>{const u=t.getDatasetMeta(0).controller.getStyle(c);return{text:r,fillStyle:u.backgroundColor,fontColor:n,hidden:!t.getDataVisibility(c),lineDash:u.borderDash,lineDashOffset:u.borderDashOffset,lineJoin:u.borderJoinStyle,lineWidth:u.borderWidth,strokeStyle:u.borderColor,textAlign:i,pointStyle:a,borderRadius:o&&(l||u.borderRadius),index:c}}):[]}},onClick(t,e,a){a.chart.toggleDataVisibility(e.index),a.chart.update()}}}};constructor(t,e){super(t,e),this.enableOptionSharing=!0,this.innerRadius=void 0,this.outerRadius=void 0,this.offsetX=void 0,this.offsetY=void 0}linkScales(){}parse(t,e){const a=this.getDataset().data,i=this._cachedMeta;if(this._parsing===!1)i._parsed=a;else{let n=r=>+a[r];if(V(a[t])){const{key:r="value"}=this._parsing;n=c=>+Jt(a[c],r)}let o,l;for(o=t,l=t+e;o<l;++o)i._parsed[o]=n(o)}}_getRotation(){return At(this.options.rotation-90)}_getCircumference(){return At(this.options.circumference)}_getRotationExtents(){let t=X,e=-X;for(let a=0;a<this.chart.data.datasets.length;++a)if(this.chart.isDatasetVisible(a)&&this.chart.getDatasetMeta(a).type===this._type){const i=this.chart.getDatasetMeta(a).controller,n=i._getRotation(),o=i._getCircumference();t=Math.min(t,n),e=Math.max(e,n+o)}return{rotation:t,circumference:e-t}}update(t){const e=this.chart,{chartArea:a}=e,i=this._cachedMeta,n=i.data,o=this.getMaxBorderWidth()+this.getMaxOffset(n)+this.options.spacing,l=Math.max((Math.min(a.width,a.height)-o)/2,0),r=Math.min(yr(this.options.cutout,l),1),c=this._getRingWeight(this.index),{circumference:d,rotation:u}=this._getRotationExtents(),{ratioX:h,ratioY:p,offsetX:b,offsetY:f}=cd(u,d,r),v=(a.width-o)/h,x=(a.height-o)/p,w=Math.max(Math.min(v,x)/2,0),_=Hn(this.options.radius,w),S=Math.max(_*r,0),k=(_-S)/this._getVisibleDatasetWeightTotal();this.offsetX=b*_,this.offsetY=f*_,i.total=this.calculateTotal(),this.outerRadius=_-k*this._getRingWeightOffset(this.index),this.innerRadius=Math.max(this.outerRadius-k*c,0),this.updateElements(n,0,n.length,t)}_circumference(t,e){const a=this.options,i=this._cachedMeta,n=this._getCircumference();return e&&a.animation.animateRotate||!this.chart.getDataVisibility(t)||i._parsed[t]===null||i.data[t].hidden?0:this.calculateCircumference(i._parsed[t]*n/X)}updateElements(t,e,a,i){const n=i==="reset",o=this.chart,l=o.chartArea,c=o.options.animation,d=(l.left+l.right)/2,u=(l.top+l.bottom)/2,h=n&&c.animateScale,p=h?0:this.innerRadius,b=h?0:this.outerRadius,{sharedOptions:f,includeOptions:v}=this._getSharedOptions(e,i);let x=this._getRotation(),w;for(w=0;w<e;++w)x+=this._circumference(w,n);for(w=e;w<e+a;++w){const _=this._circumference(w,n),S=t[w],k={x:d+this.offsetX,y:u+this.offsetY,startAngle:x,endAngle:x+_,circumference:_,outerRadius:b,innerRadius:p};v&&(k.options=f||this.resolveDataElementOptions(w,S.active?"active":i)),x+=_,this.updateElement(S,w,k,i)}}calculateTotal(){const t=this._cachedMeta,e=t.data;let a=0,i;for(i=0;i<e.length;i++){const n=t._parsed[i];n!==null&&!isNaN(n)&&this.chart.getDataVisibility(i)&&!e[i].hidden&&(a+=Math.abs(n))}return a}calculateCircumference(t){const e=this._cachedMeta.total;return e>0&&!isNaN(t)?X*(Math.abs(t)/e):0}getLabelAndValue(t){const e=this._cachedMeta,a=this.chart,i=a.data.labels||[],n=Qe(e._parsed[t],a.options.locale);return{label:i[t]||"",value:n}}getMaxBorderWidth(t){let e=0;const a=this.chart;let i,n,o,l,r;if(!t){for(i=0,n=a.data.datasets.length;i<n;++i)if(a.isDatasetVisible(i)){o=a.getDatasetMeta(i),t=o.data,l=o.controller;break}}if(!t)return 0;for(i=0,n=t.length;i<n;++i)r=l.resolveDataElementOptions(i),r.borderAlign!=="inner"&&(e=Math.max(e,r.borderWidth||0,r.hoverBorderWidth||0));return e}getMaxOffset(t){let e=0;for(let a=0,i=t.length;a<i;++a){const n=this.resolveDataElementOptions(a);e=Math.max(e,n.offset||0,n.hoverOffset||0)}return e}_getRingWeightOffset(t){let e=0;for(let a=0;a<t;++a)this.chart.isDatasetVisible(a)&&(e+=this._getRingWeight(a));return e}_getRingWeight(t){return Math.max(I(this.chart.data.datasets[t].weight,1),0)}_getVisibleDatasetWeightTotal(){return this._getRingWeightOffset(this.chart.data.datasets.length)||1}}class go extends se{static id="line";static defaults={datasetElementType:"line",dataElementType:"point",showLine:!0,spanGaps:!1};static overrides={scales:{_index_:{type:"category"},_value_:{type:"linear"}}};initialize(){this.enableOptionSharing=!0,this.supportsDecimation=!0,super.initialize()}update(t){const e=this._cachedMeta,{dataset:a,data:i=[],_dataset:n}=e,o=this.chart._animationsDisabled;let{start:l,count:r}=Xn(e,i,o);this._drawStart=l,this._drawCount=r,qn(e)&&(l=0,r=i.length),a._chart=this.chart,a._datasetIndex=this.index,a._decimated=!!n._decimated,a.points=i;const c=this.resolveDatasetElementOptions(t);this.options.showLine||(c.borderWidth=0),c.segment=this.options.segment,this.updateElement(a,void 0,{animated:!o,options:c},t),this.updateElements(i,l,r,t)}updateElements(t,e,a,i){const n=i==="reset",{iScale:o,vScale:l,_stacked:r,_dataset:c}=this._cachedMeta,{sharedOptions:d,includeOptions:u}=this._getSharedOptions(e,i),h=o.axis,p=l.axis,{spanGaps:b,segment:f}=this.options,v=Se(b)?b:Number.POSITIVE_INFINITY,x=this.chart._animationsDisabled||n||i==="none",w=e+a,_=t.length;let S=e>0&&this.getParsed(e-1);for(let k=0;k<_;++k){const P=t[k],T=x?P:{};if(k<e||k>=w){T.skip=!0;continue}const M=this.getParsed(k),O=B(M[p]),R=T[h]=o.getPixelForValue(M[h],k),z=T[p]=n||O?l.getBasePixel():l.getPixelForValue(r?this.applyStack(l,M,r):M[p],k);T.skip=isNaN(R)||isNaN(z)||O,T.stop=k>0&&Math.abs(M[h]-S[h])>v,f&&(T.parsed=M,T.raw=c.data[k]),u&&(T.options=d||this.resolveDataElementOptions(k,P.active?"active":i)),x||this.updateElement(P,k,T,i),S=M}}getMaxOverflow(){const t=this._cachedMeta,e=t.dataset,a=e.options&&e.options.borderWidth||0,i=t.data||[];if(!i.length)return a;const n=i[0].size(this.resolveDataElementOptions(0)),o=i[i.length-1].size(this.resolveDataElementOptions(i.length-1));return Math.max(a,n,o)/2}draw(){const t=this._cachedMeta;t.dataset.updateControlPoints(this.chart.chartArea,t.iScale.axis),super.draw()}}class vo extends se{static id="polarArea";static defaults={dataElementType:"arc",animation:{animateRotate:!0,animateScale:!0},animations:{numbers:{type:"number",properties:["x","y","startAngle","endAngle","innerRadius","outerRadius"]}},indexAxis:"r",startAngle:0};static overrides={aspectRatio:1,plugins:{legend:{labels:{generateLabels(t){const e=t.data;if(e.labels.length&&e.datasets.length){const{labels:{pointStyle:a,color:i}}=t.legend.options;return e.labels.map((n,o)=>{const r=t.getDatasetMeta(0).controller.getStyle(o);return{text:n,fillStyle:r.backgroundColor,strokeStyle:r.borderColor,fontColor:i,lineWidth:r.borderWidth,pointStyle:a,hidden:!t.getDataVisibility(o),index:o}})}return[]}},onClick(t,e,a){a.chart.toggleDataVisibility(e.index),a.chart.update()}}},scales:{r:{type:"radialLinear",angleLines:{display:!1},beginAtZero:!0,grid:{circular:!0},pointLabels:{display:!1},startAngle:0}}};constructor(t,e){super(t,e),this.innerRadius=void 0,this.outerRadius=void 0}getLabelAndValue(t){const e=this._cachedMeta,a=this.chart,i=a.data.labels||[],n=Qe(e._parsed[t].r,a.options.locale);return{label:i[t]||"",value:n}}parseObjectData(t,e,a,i){return ao.bind(this)(t,e,a,i)}update(t){const e=this._cachedMeta.data;this._updateRadius(),this.updateElements(e,0,e.length,t)}getMinMax(){const t=this._cachedMeta,e={min:Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY};return t.data.forEach((a,i)=>{const n=this.getParsed(i).r;!isNaN(n)&&this.chart.getDataVisibility(i)&&(n<e.min&&(e.min=n),n>e.max&&(e.max=n))}),e}_updateRadius(){const t=this.chart,e=t.chartArea,a=t.options,i=Math.min(e.right-e.left,e.bottom-e.top),n=Math.max(i/2,0),o=Math.max(a.cutoutPercentage?n/100*a.cutoutPercentage:1,0),l=(n-o)/t.getVisibleDatasetCount();this.outerRadius=n-l*this.index,this.innerRadius=this.outerRadius-l}updateElements(t,e,a,i){const n=i==="reset",o=this.chart,r=o.options.animation,c=this._cachedMeta.rScale,d=c.xCenter,u=c.yCenter,h=c.getIndexAngle(0)-.5*j;let p=h,b;const f=360/this.countVisibleElements();for(b=0;b<e;++b)p+=this._computeAngle(b,i,f);for(b=e;b<e+a;b++){const v=t[b];let x=p,w=p+this._computeAngle(b,i,f),_=o.getDataVisibility(b)?c.getDistanceFromCenterForValue(this.getParsed(b).r):0;p=w,n&&(r.animateScale&&(_=0),r.animateRotate&&(x=w=h));const S={x:d,y:u,innerRadius:0,outerRadius:_,startAngle:x,endAngle:w,options:this.resolveDataElementOptions(b,v.active?"active":i)};this.updateElement(v,b,S,i)}}countVisibleElements(){const t=this._cachedMeta;let e=0;return t.data.forEach((a,i)=>{!isNaN(this.getParsed(i).r)&&this.chart.getDataVisibility(i)&&e++}),e}_computeAngle(t,e,a){return this.chart.getDataVisibility(t)?At(this.resolveDataElementOptions(t,e).angle||a):0}}class dd extends Rs{static id="pie";static defaults={cutout:0,rotation:0,circumference:360,radius:"100%"}}class ud extends se{static id="radar";static defaults={datasetElementType:"line",dataElementType:"point",indexAxis:"r",showLine:!0,elements:{line:{fill:"start"}}};static overrides={aspectRatio:1,scales:{r:{type:"radialLinear"}}};getLabelAndValue(t){const e=this._cachedMeta.vScale,a=this.getParsed(t);return{label:e.getLabels()[t],value:""+e.getLabelForValue(a[e.axis])}}parseObjectData(t,e,a,i){return ao.bind(this)(t,e,a,i)}update(t){const e=this._cachedMeta,a=e.dataset,i=e.data||[],n=e.iScale.getLabels();if(a.points=i,t!=="resize"){const o=this.resolveDatasetElementOptions(t);this.options.showLine||(o.borderWidth=0);const l={_loop:!0,_fullLoop:n.length===i.length,options:o};this.updateElement(a,void 0,l,t)}this.updateElements(i,0,i.length,t)}updateElements(t,e,a,i){const n=this._cachedMeta.rScale,o=i==="reset";for(let l=e;l<e+a;l++){const r=t[l],c=this.resolveDataElementOptions(l,r.active?"active":i),d=n.getPointPositionForValue(l,this.getParsed(l).r),u=o?n.xCenter:d.x,h=o?n.yCenter:d.y,p={x:u,y:h,angle:d.angle,skip:isNaN(u)||isNaN(h),options:c};this.updateElement(r,l,p,i)}}}class hd extends se{static id="scatter";static defaults={datasetElementType:!1,dataElementType:"point",showLine:!1,fill:!1};static overrides={interaction:{mode:"point"},scales:{x:{type:"linear"},y:{type:"linear"}}};getLabelAndValue(t){const e=this._cachedMeta,a=this.chart.data.labels||[],{xScale:i,yScale:n}=e,o=this.getParsed(t),l=i.getLabelForValue(o.x),r=n.getLabelForValue(o.y);return{label:a[t]||"",value:"("+l+", "+r+")"}}update(t){const e=this._cachedMeta,{data:a=[]}=e,i=this.chart._animationsDisabled;let{start:n,count:o}=Xn(e,a,i);if(this._drawStart=n,this._drawCount=o,qn(e)&&(n=0,o=a.length),this.options.showLine){this.datasetElementType||this.addElements();const{dataset:l,_dataset:r}=e;l._chart=this.chart,l._datasetIndex=this.index,l._decimated=!!r._decimated,l.points=a;const c=this.resolveDatasetElementOptions(t);c.segment=this.options.segment,this.updateElement(l,void 0,{animated:!i,options:c},t)}else this.datasetElementType&&(delete e.dataset,this.datasetElementType=!1);this.updateElements(a,n,o,t)}addElements(){const{showLine:t}=this.options;!this.datasetElementType&&t&&(this.datasetElementType=this.chart.registry.getElement("line")),super.addElements()}updateElements(t,e,a,i){const n=i==="reset",{iScale:o,vScale:l,_stacked:r,_dataset:c}=this._cachedMeta,d=this.resolveDataElementOptions(e,i),u=this.getSharedOptions(d),h=this.includeOptions(i,u),p=o.axis,b=l.axis,{spanGaps:f,segment:v}=this.options,x=Se(f)?f:Number.POSITIVE_INFINITY,w=this.chart._animationsDisabled||n||i==="none";let _=e>0&&this.getParsed(e-1);for(let S=e;S<e+a;++S){const k=t[S],P=this.getParsed(S),T=w?k:{},M=B(P[b]),O=T[p]=o.getPixelForValue(P[p],S),R=T[b]=n||M?l.getBasePixel():l.getPixelForValue(r?this.applyStack(l,P,r):P[b],S);T.skip=isNaN(O)||isNaN(R)||M,T.stop=S>0&&Math.abs(P[p]-_[p])>x,v&&(T.parsed=P,T.raw=c.data[S]),h&&(T.options=u||this.resolveDataElementOptions(S,k.active?"active":i)),w||this.updateElement(k,S,T,i),_=P}this.updateSharedOptions(u,i,d)}getMaxOverflow(){const t=this._cachedMeta,e=t.data||[];if(!this.options.showLine){let l=0;for(let r=e.length-1;r>=0;--r)l=Math.max(l,e[r].size(this.resolveDataElementOptions(r))/2);return l>0&&l}const a=t.dataset,i=a.options&&a.options.borderWidth||0;if(!e.length)return i;const n=e[0].size(this.resolveDataElementOptions(0)),o=e[e.length-1].size(this.resolveDataElementOptions(e.length-1));return Math.max(i,n,o)/2}}var pd=Object.freeze({__proto__:null,BarController:bo,BubbleController:rd,DoughnutController:Rs,LineController:go,PieController:dd,PolarAreaController:vo,RadarController:ud,ScatterController:hd});function re(){throw new Error("This method is not implemented: Check that a complete date adapter is provided.")}class Fa{static override(t){Object.assign(Fa.prototype,t)}options;constructor(t){this.options=t||{}}init(){}formats(){return re()}parse(){return re()}format(){return re()}add(){return re()}diff(){return re()}startOf(){return re()}endOf(){return re()}}var fd={_date:Fa};function bd(s,t,e,a){const{controller:i,data:n,_sorted:o}=s,l=i._cachedMeta.iScale,r=s.dataset&&s.dataset.options?s.dataset.options.spanGaps:null;if(l&&t===l.axis&&t!=="r"&&o&&n.length){const c=l._reversePixels?Er:Nt;if(a){if(i._sharedOptions){const d=n[0],u=typeof d.getRange=="function"&&d.getRange(t);if(u){const h=c(n,t,e-u),p=c(n,t,e+u);return{lo:h.lo,hi:p.hi}}}}else{const d=c(n,t,e);if(r){const{vScale:u}=i._cachedMeta,{_parsed:h}=s,p=h.slice(0,d.lo+1).reverse().findIndex(f=>!B(f[u.axis]));d.lo-=Math.max(0,p);const b=h.slice(d.hi).findIndex(f=>!B(f[u.axis]));d.hi+=Math.max(0,b)}return d}}return{lo:0,hi:n.length-1}}function zs(s,t,e,a,i){const n=s.getSortedVisibleDatasetMetas(),o=e[t];for(let l=0,r=n.length;l<r;++l){const{index:c,data:d}=n[l],{lo:u,hi:h}=bd(n[l],t,o,i);for(let p=u;p<=h;++p){const b=d[p];b.skip||a(b,c,p)}}}function gd(s){const t=s.indexOf("x")!==-1,e=s.indexOf("y")!==-1;return function(a,i){const n=t?Math.abs(a.x-i.x):0,o=e?Math.abs(a.y-i.y):0;return Math.sqrt(Math.pow(n,2)+Math.pow(o,2))}}function ea(s,t,e,a,i){const n=[];return!i&&!s.isPointInArea(t)||zs(s,e,t,function(l,r,c){!i&&!Wt(l,s.chartArea,0)||l.inRange(t.x,t.y,a)&&n.push({element:l,datasetIndex:r,index:c})},!0),n}function vd(s,t,e,a){let i=[];function n(o,l,r){const{startAngle:c,endAngle:d}=o.getProps(["startAngle","endAngle"],a),{angle:u}=Wn(o,{x:t.x,y:t.y});Ge(u,c,d)&&i.push({element:o,datasetIndex:l,index:r})}return zs(s,e,t,n),i}function md(s,t,e,a,i,n){let o=[];const l=gd(e);let r=Number.POSITIVE_INFINITY;function c(d,u,h){const p=d.inRange(t.x,t.y,i);if(a&&!p)return;const b=d.getCenterPoint(i);if(!(!!n||s.isPointInArea(b))&&!p)return;const v=l(t,b);v<r?(o=[{element:d,datasetIndex:u,index:h}],r=v):v===r&&o.push({element:d,datasetIndex:u,index:h})}return zs(s,e,t,c),o}function sa(s,t,e,a,i,n){return!n&&!s.isPointInArea(t)?[]:e==="r"&&!a?vd(s,t,e,i):md(s,t,e,a,i,n)}function Ri(s,t,e,a,i){const n=[],o=e==="x"?"inXRange":"inYRange";let l=!1;return zs(s,e,t,(r,c,d)=>{r[o]&&r[o](t[e],i)&&(n.push({element:r,datasetIndex:c,index:d}),l=l||r.inRange(t.x,t.y,i))}),a&&!l?[]:n}var xd={modes:{index(s,t,e,a){const i=de(t,s),n=e.axis||"x",o=e.includeInvisible||!1,l=e.intersect?ea(s,i,n,a,o):sa(s,i,n,!1,a,o),r=[];return l.length?(s.getSortedVisibleDatasetMetas().forEach(c=>{const d=l[0].index,u=c.data[d];u&&!u.skip&&r.push({element:u,datasetIndex:c.index,index:d})}),r):[]},dataset(s,t,e,a){const i=de(t,s),n=e.axis||"xy",o=e.includeInvisible||!1;let l=e.intersect?ea(s,i,n,a,o):sa(s,i,n,!1,a,o);if(l.length>0){const r=l[0].datasetIndex,c=s.getDatasetMeta(r).data;l=[];for(let d=0;d<c.length;++d)l.push({element:c[d],datasetIndex:r,index:d})}return l},point(s,t,e,a){const i=de(t,s),n=e.axis||"xy",o=e.includeInvisible||!1;return ea(s,i,n,a,o)},nearest(s,t,e,a){const i=de(t,s),n=e.axis||"xy",o=e.includeInvisible||!1;return sa(s,i,n,e.intersect,a,o)},x(s,t,e,a){const i=de(t,s);return Ri(s,i,"x",e.intersect,a)},y(s,t,e,a){const i=de(t,s);return Ri(s,i,"y",e.intersect,a)}}};const mo=["left","top","right","bottom"];function De(s,t){return s.filter(e=>e.pos===t)}function zi(s,t){return s.filter(e=>mo.indexOf(e.pos)===-1&&e.box.axis===t)}function Te(s,t){return s.sort((e,a)=>{const i=t?a:e,n=t?e:a;return i.weight===n.weight?i.index-n.index:i.weight-n.weight})}function yd(s){const t=[];let e,a,i,n,o,l;for(e=0,a=(s||[]).length;e<a;++e)i=s[e],{position:n,options:{stack:o,stackWeight:l=1}}=i,t.push({index:e,box:i,pos:n,horizontal:i.isHorizontal(),weight:i.weight,stack:o&&n+o,stackWeight:l});return t}function wd(s){const t={};for(const e of s){const{stack:a,pos:i,stackWeight:n}=e;if(!a||!mo.includes(i))continue;const o=t[a]||(t[a]={count:0,placed:0,weight:0,size:0});o.count++,o.weight+=n}return t}function kd(s,t){const e=wd(s),{vBoxMaxWidth:a,hBoxMaxHeight:i}=t;let n,o,l;for(n=0,o=s.length;n<o;++n){l=s[n];const{fullSize:r}=l.box,c=e[l.stack],d=c&&l.stackWeight/c.weight;l.horizontal?(l.width=d?d*a:r&&t.availableWidth,l.height=i):(l.width=a,l.height=d?d*i:r&&t.availableHeight)}return e}function Sd(s){const t=yd(s),e=Te(t.filter(c=>c.box.fullSize),!0),a=Te(De(t,"left"),!0),i=Te(De(t,"right")),n=Te(De(t,"top"),!0),o=Te(De(t,"bottom")),l=zi(t,"x"),r=zi(t,"y");return{fullSize:e,leftAndTop:a.concat(n),rightAndBottom:i.concat(r).concat(o).concat(l),chartArea:De(t,"chartArea"),vertical:a.concat(i).concat(r),horizontal:n.concat(o).concat(l)}}function Bi(s,t,e,a){return Math.max(s[e],t[e])+Math.max(s[a],t[a])}function xo(s,t){s.top=Math.max(s.top,t.top),s.left=Math.max(s.left,t.left),s.bottom=Math.max(s.bottom,t.bottom),s.right=Math.max(s.right,t.right)}function _d(s,t,e,a){const{pos:i,box:n}=e,o=s.maxPadding;if(!V(i)){e.size&&(s[i]-=e.size);const u=a[e.stack]||{size:0,count:1};u.size=Math.max(u.size,e.horizontal?n.height:n.width),e.size=u.size/u.count,s[i]+=e.size}n.getPadding&&xo(o,n.getPadding());const l=Math.max(0,t.outerWidth-Bi(o,s,"left","right")),r=Math.max(0,t.outerHeight-Bi(o,s,"top","bottom")),c=l!==s.w,d=r!==s.h;return s.w=l,s.h=r,e.horizontal?{same:c,other:d}:{same:d,other:c}}function Cd(s){const t=s.maxPadding;function e(a){const i=Math.max(t[a]-s[a],0);return s[a]+=i,i}s.y+=e("top"),s.x+=e("left"),e("right"),e("bottom")}function Md(s,t){const e=t.maxPadding;function a(i){const n={left:0,top:0,right:0,bottom:0};return i.forEach(o=>{n[o]=Math.max(t[o],e[o])}),n}return a(s?["left","right"]:["top","bottom"])}function Re(s,t,e,a){const i=[];let n,o,l,r,c,d;for(n=0,o=s.length,c=0;n<o;++n){l=s[n],r=l.box,r.update(l.width||t.w,l.height||t.h,Md(l.horizontal,t));const{same:u,other:h}=_d(t,e,l,a);c|=u&&i.length,d=d||h,r.fullSize||i.push(l)}return c&&Re(i,t,e,a)||d}function cs(s,t,e,a,i){s.top=e,s.left=t,s.right=t+a,s.bottom=e+i,s.width=a,s.height=i}function Fi(s,t,e,a){const i=e.padding;let{x:n,y:o}=t;for(const l of s){const r=l.box,c=a[l.stack]||{placed:0,weight:1},d=l.stackWeight/c.weight||1;if(l.horizontal){const u=t.w*d,h=c.size||r.height;Ye(c.start)&&(o=c.start),r.fullSize?cs(r,i.left,o,e.outerWidth-i.right-i.left,h):cs(r,t.left+c.placed,o,u,h),c.start=o,c.placed+=u,o=r.bottom}else{const u=t.h*d,h=c.size||r.width;Ye(c.start)&&(n=c.start),r.fullSize?cs(r,n,i.top,h,e.outerHeight-i.bottom-i.top):cs(r,n,t.top+c.placed,h,u),c.start=n,c.placed+=u,n=r.right}}t.x=n,t.y=o}var gt={addBox(s,t){s.boxes||(s.boxes=[]),t.fullSize=t.fullSize||!1,t.position=t.position||"top",t.weight=t.weight||0,t._layers=t._layers||function(){return[{z:0,draw(e){t.draw(e)}}]},s.boxes.push(t)},removeBox(s,t){const e=s.boxes?s.boxes.indexOf(t):-1;e!==-1&&s.boxes.splice(e,1)},configure(s,t,e){t.fullSize=e.fullSize,t.position=e.position,t.weight=e.weight},update(s,t,e,a){if(!s)return;const i=mt(s.options.layout.padding),n=Math.max(t-i.width,0),o=Math.max(e-i.height,0),l=Sd(s.boxes),r=l.vertical,c=l.horizontal;W(s.boxes,f=>{typeof f.beforeLayout=="function"&&f.beforeLayout()});const d=r.reduce((f,v)=>v.box.options&&v.box.options.display===!1?f:f+1,0)||1,u=Object.freeze({outerWidth:t,outerHeight:e,padding:i,availableWidth:n,availableHeight:o,vBoxMaxWidth:n/2/d,hBoxMaxHeight:o/2}),h=Object.assign({},i);xo(h,mt(a));const p=Object.assign({maxPadding:h,w:n,h:o,x:i.left,y:i.top},i),b=kd(r.concat(c),u);Re(l.fullSize,p,u,b),Re(r,p,u,b),Re(c,p,u,b)&&Re(r,p,u,b),Cd(p),Fi(l.leftAndTop,p,u,b),p.x+=p.w,p.y+=p.h,Fi(l.rightAndBottom,p,u,b),s.chartArea={left:p.left,top:p.top,right:p.left+p.w,bottom:p.top+p.h,height:p.h,width:p.w},W(l.chartArea,f=>{const v=f.box;Object.assign(v,s.chartArea),v.update(p.w,p.h,{left:0,top:0,right:0,bottom:0})})}};class yo{acquireContext(t,e){}releaseContext(t){return!1}addEventListener(t,e,a){}removeEventListener(t,e,a){}getDevicePixelRatio(){return 1}getMaximumSize(t,e,a,i){return e=Math.max(0,e||t.width),a=a||t.height,{width:e,height:Math.max(0,i?Math.floor(e/i):a)}}isAttached(t){return!0}updateConfig(t){}}class Pd extends yo{acquireContext(t){return t&&t.getContext&&t.getContext("2d")||null}updateConfig(t){t.options.animation=!1}}const xs="$chartjs",Ad={touchstart:"mousedown",touchmove:"mousemove",touchend:"mouseup",pointerenter:"mouseenter",pointerdown:"mousedown",pointermove:"mousemove",pointerup:"mouseup",pointerleave:"mouseout",pointerout:"mouseout"},Vi=s=>s===null||s==="";function Dd(s,t){const e=s.style,a=s.getAttribute("height"),i=s.getAttribute("width");if(s[xs]={initial:{height:a,width:i,style:{display:e.display,height:e.height,width:e.width}}},e.display=e.display||"block",e.boxSizing=e.boxSizing||"border-box",Vi(i)){const n=ki(s,"width");n!==void 0&&(s.width=n)}if(Vi(a))if(s.style.height==="")s.height=s.width/(t||2);else{const n=ki(s,"height");n!==void 0&&(s.height=n)}return s}const wo=Mc?{passive:!0}:!1;function Td(s,t,e){s&&s.addEventListener(t,e,wo)}function Ld(s,t,e){s&&s.canvas&&s.canvas.removeEventListener(t,e,wo)}function Od(s,t){const e=Ad[s.type]||s.type,{x:a,y:i}=de(s,t);return{type:e,chart:t,native:s,x:a!==void 0?a:null,y:i!==void 0?i:null}}function Ps(s,t){for(const e of s)if(e===t||e.contains(t))return!0}function Ed(s,t,e){const a=s.canvas,i=new MutationObserver(n=>{let o=!1;for(const l of n)o=o||Ps(l.addedNodes,a),o=o&&!Ps(l.removedNodes,a);o&&e()});return i.observe(document,{childList:!0,subtree:!0}),i}function Id(s,t,e){const a=s.canvas,i=new MutationObserver(n=>{let o=!1;for(const l of n)o=o||Ps(l.removedNodes,a),o=o&&!Ps(l.addedNodes,a);o&&e()});return i.observe(document,{childList:!0,subtree:!0}),i}const qe=new Map;let Hi=0;function ko(){const s=window.devicePixelRatio;s!==Hi&&(Hi=s,qe.forEach((t,e)=>{e.currentDevicePixelRatio!==s&&t()}))}function Rd(s,t){qe.size||window.addEventListener("resize",ko),qe.set(s,t)}function zd(s){qe.delete(s),qe.size||window.removeEventListener("resize",ko)}function Bd(s,t,e){const a=s.canvas,i=a&&Ba(a);if(!i)return;const n=Gn((l,r)=>{const c=i.clientWidth;e(l,r),c<i.clientWidth&&e()},window),o=new ResizeObserver(l=>{const r=l[0],c=r.contentRect.width,d=r.contentRect.height;c===0&&d===0||n(c,d)});return o.observe(i),Rd(s,n),o}function aa(s,t,e){e&&e.disconnect(),t==="resize"&&zd(s)}function Fd(s,t,e){const a=s.canvas,i=Gn(n=>{s.ctx!==null&&e(Od(n,s))},s);return Td(a,t,i),i}class Vd extends yo{acquireContext(t,e){const a=t&&t.getContext&&t.getContext("2d");return a&&a.canvas===t?(Dd(t,e),a):null}releaseContext(t){const e=t.canvas;if(!e[xs])return!1;const a=e[xs].initial;["height","width"].forEach(n=>{const o=a[n];B(o)?e.removeAttribute(n):e.setAttribute(n,o)});const i=a.style||{};return Object.keys(i).forEach(n=>{e.style[n]=i[n]}),e.width=e.width,delete e[xs],!0}addEventListener(t,e,a){this.removeEventListener(t,e);const i=t.$proxies||(t.$proxies={}),o={attach:Ed,detach:Id,resize:Bd}[e]||Fd;i[e]=o(t,e,a)}removeEventListener(t,e){const a=t.$proxies||(t.$proxies={}),i=a[e];if(!i)return;({attach:aa,detach:aa,resize:aa}[e]||Ld)(t,e,i),a[e]=void 0}getDevicePixelRatio(){return window.devicePixelRatio}getMaximumSize(t,e,a,i){return Cc(t,e,a,i)}isAttached(t){const e=t&&Ba(t);return!!(e&&e.isConnected)}}function Hd(s){return!za()||typeof OffscreenCanvas<"u"&&s instanceof OffscreenCanvas?Pd:Vd}class Ut{static defaults={};static defaultRoutes=void 0;x;y;active=!1;options;$animations;tooltipPosition(t){const{x:e,y:a}=this.getProps(["x","y"],t);return{x:e,y:a}}hasValue(){return Se(this.x)&&Se(this.y)}getProps(t,e){const a=this.$animations;if(!e||!a)return this;const i={};return t.forEach(n=>{i[n]=a[n]&&a[n].active()?a[n]._to:this[n]}),i}}function jd(s,t){const e=s.options.ticks,a=Nd(s),i=Math.min(e.maxTicksLimit||a,a),n=e.major.enabled?Ud(t):[],o=n.length,l=n[0],r=n[o-1],c=[];if(o>i)return $d(t,c,n,o/i),c;const d=Wd(n,t,i);if(o>0){let u,h;const p=o>1?Math.round((r-l)/(o-1)):null;for(ds(t,c,d,B(p)?0:l-p,l),u=0,h=o-1;u<h;u++)ds(t,c,d,n[u],n[u+1]);return ds(t,c,d,r,B(p)?t.length:r+p),c}return ds(t,c,d),c}function Nd(s){const t=s.options.offset,e=s._tickSize(),a=s._length/e+(t?0:1),i=s._maxLength/e;return Math.floor(Math.min(a,i))}function Wd(s,t,e){const a=Yd(s),i=t.length/e;if(!a)return Math.max(i,1);const n=Ar(a);for(let o=0,l=n.length-1;o<l;o++){const r=n[o];if(r>i)return r}return Math.max(i,1)}function Ud(s){const t=[];let e,a;for(e=0,a=s.length;e<a;e++)s[e].major&&t.push(e);return t}function $d(s,t,e,a){let i=0,n=e[0],o;for(a=Math.ceil(a),o=0;o<s.length;o++)o===n&&(t.push(s[o]),i++,n=e[i*a])}function ds(s,t,e,a,i){const n=I(a,0),o=Math.min(I(i,s.length),s.length);let l=0,r,c,d;for(e=Math.ceil(e),i&&(r=i-a,e=r/Math.floor(r/e)),d=n;d<0;)l++,d=Math.round(n+l*e);for(c=Math.max(n,0);c<o;c++)c===d&&(t.push(s[c]),l++,d=Math.round(n+l*e))}function Yd(s){const t=s.length;let e,a;if(t<2)return!1;for(a=s[0],e=1;e<t;++e)if(s[e]-s[e-1]!==a)return!1;return a}const Gd=s=>s==="left"?"right":s==="right"?"left":s,ji=(s,t,e)=>t==="top"||t==="left"?s[t]+e:s[t]-e,Ni=(s,t)=>Math.min(t||s,s);function Wi(s,t){const e=[],a=s.length/t,i=s.length;let n=0;for(;n<i;n+=a)e.push(s[Math.floor(n)]);return e}function Xd(s,t,e){const a=s.ticks.length,i=Math.min(t,a-1),n=s._startPixel,o=s._endPixel,l=1e-6;let r=s.getPixelForTick(i),c;if(!(e&&(a===1?c=Math.max(r-n,o-r):t===0?c=(s.getPixelForTick(1)-r)/2:c=(r-s.getPixelForTick(i-1))/2,r+=i<t?c:-c,r<n-l||r>o+l)))return r}function qd(s,t){W(s,e=>{const a=e.gc,i=a.length/2;let n;if(i>t){for(n=0;n<i;++n)delete e.data[a[n]];a.splice(0,i)}})}function Le(s){return s.drawTicks?s.tickLength:0}function Ui(s,t){if(!s.display)return 0;const e=lt(s.font,t),a=mt(s.padding);return(q(s.text)?s.text.length:1)*e.lineHeight+a.height}function Kd(s,t){return ee(s,{scale:t,type:"scale"})}function Zd(s,t,e){return ee(s,{tick:e,index:t,type:"tick"})}function Qd(s,t,e){let a=Ta(s);return(e&&t!=="right"||!e&&t==="right")&&(a=Gd(a)),a}function Jd(s,t,e,a){const{top:i,left:n,bottom:o,right:l,chart:r}=s,{chartArea:c,scales:d}=r;let u=0,h,p,b;const f=o-i,v=l-n;if(s.isHorizontal()){if(p=ft(a,n,l),V(e)){const x=Object.keys(e)[0],w=e[x];b=d[x].getPixelForValue(w)+f-t}else e==="center"?b=(c.bottom+c.top)/2+f-t:b=ji(s,e,t);h=l-n}else{if(V(e)){const x=Object.keys(e)[0],w=e[x];p=d[x].getPixelForValue(w)-v+t}else e==="center"?p=(c.left+c.right)/2-v+t:p=ji(s,e,t);b=ft(a,o,i),u=e==="left"?-st:st}return{titleX:p,titleY:b,maxWidth:h,rotation:u}}class ge extends Ut{constructor(t){super(),this.id=t.id,this.type=t.type,this.options=void 0,this.ctx=t.ctx,this.chart=t.chart,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.width=void 0,this.height=void 0,this._margins={left:0,right:0,top:0,bottom:0},this.maxWidth=void 0,this.maxHeight=void 0,this.paddingTop=void 0,this.paddingBottom=void 0,this.paddingLeft=void 0,this.paddingRight=void 0,this.axis=void 0,this.labelRotation=void 0,this.min=void 0,this.max=void 0,this._range=void 0,this.ticks=[],this._gridLineItems=null,this._labelItems=null,this._labelSizes=null,this._length=0,this._maxLength=0,this._longestTextCache={},this._startPixel=void 0,this._endPixel=void 0,this._reversePixels=!1,this._userMax=void 0,this._userMin=void 0,this._suggestedMax=void 0,this._suggestedMin=void 0,this._ticksLength=0,this._borderValue=0,this._cache={},this._dataLimitsCached=!1,this.$context=void 0}init(t){this.options=t.setContext(this.getContext()),this.axis=t.axis,this._userMin=this.parse(t.min),this._userMax=this.parse(t.max),this._suggestedMin=this.parse(t.suggestedMin),this._suggestedMax=this.parse(t.suggestedMax)}parse(t,e){return t}getUserBounds(){let{_userMin:t,_userMax:e,_suggestedMin:a,_suggestedMax:i}=this;return t=_t(t,Number.POSITIVE_INFINITY),e=_t(e,Number.NEGATIVE_INFINITY),a=_t(a,Number.POSITIVE_INFINITY),i=_t(i,Number.NEGATIVE_INFINITY),{min:_t(t,a),max:_t(e,i),minDefined:tt(t),maxDefined:tt(e)}}getMinMax(t){let{min:e,max:a,minDefined:i,maxDefined:n}=this.getUserBounds(),o;if(i&&n)return{min:e,max:a};const l=this.getMatchingVisibleMetas();for(let r=0,c=l.length;r<c;++r)o=l[r].controller.getMinMax(this,t),i||(e=Math.min(e,o.min)),n||(a=Math.max(a,o.max));return e=n&&e>a?a:e,a=i&&e>a?e:a,{min:_t(e,_t(a,e)),max:_t(a,_t(e,a))}}getPadding(){return{left:this.paddingLeft||0,top:this.paddingTop||0,right:this.paddingRight||0,bottom:this.paddingBottom||0}}getTicks(){return this.ticks}getLabels(){const t=this.chart.data;return this.options.labels||(this.isHorizontal()?t.xLabels:t.yLabels)||t.labels||[]}getLabelItems(t=this.chart.chartArea){return this._labelItems||(this._labelItems=this._computeLabelItems(t))}beforeLayout(){this._cache={},this._dataLimitsCached=!1}beforeUpdate(){G(this.options.beforeUpdate,[this])}update(t,e,a){const{beginAtZero:i,grace:n,ticks:o}=this.options,l=o.sampleSize;this.beforeUpdate(),this.maxWidth=t,this.maxHeight=e,this._margins=a=Object.assign({left:0,right:0,top:0,bottom:0},a),this.ticks=null,this._labelSizes=null,this._gridLineItems=null,this._labelItems=null,this.beforeSetDimensions(),this.setDimensions(),this.afterSetDimensions(),this._maxLength=this.isHorizontal()?this.width+a.left+a.right:this.height+a.top+a.bottom,this._dataLimitsCached||(this.beforeDataLimits(),this.determineDataLimits(),this.afterDataLimits(),this._range=ac(this,n,i),this._dataLimitsCached=!0),this.beforeBuildTicks(),this.ticks=this.buildTicks()||[],this.afterBuildTicks();const r=l<this.ticks.length;this._convertTicksToLabels(r?Wi(this.ticks,l):this.ticks),this.configure(),this.beforeCalculateLabelRotation(),this.calculateLabelRotation(),this.afterCalculateLabelRotation(),o.display&&(o.autoSkip||o.source==="auto")&&(this.ticks=jd(this,this.ticks),this._labelSizes=null,this.afterAutoSkip()),r&&this._convertTicksToLabels(this.ticks),this.beforeFit(),this.fit(),this.afterFit(),this.afterUpdate()}configure(){let t=this.options.reverse,e,a;this.isHorizontal()?(e=this.left,a=this.right):(e=this.top,a=this.bottom,t=!t),this._startPixel=e,this._endPixel=a,this._reversePixels=t,this._length=a-e,this._alignToPixels=this.options.alignToPixels}afterUpdate(){G(this.options.afterUpdate,[this])}beforeSetDimensions(){G(this.options.beforeSetDimensions,[this])}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=0,this.right=this.width):(this.height=this.maxHeight,this.top=0,this.bottom=this.height),this.paddingLeft=0,this.paddingTop=0,this.paddingRight=0,this.paddingBottom=0}afterSetDimensions(){G(this.options.afterSetDimensions,[this])}_callHooks(t){this.chart.notifyPlugins(t,this.getContext()),G(this.options[t],[this])}beforeDataLimits(){this._callHooks("beforeDataLimits")}determineDataLimits(){}afterDataLimits(){this._callHooks("afterDataLimits")}beforeBuildTicks(){this._callHooks("beforeBuildTicks")}buildTicks(){return[]}afterBuildTicks(){this._callHooks("afterBuildTicks")}beforeTickToLabelConversion(){G(this.options.beforeTickToLabelConversion,[this])}generateTickLabels(t){const e=this.options.ticks;let a,i,n;for(a=0,i=t.length;a<i;a++)n=t[a],n.label=G(e.callback,[n.value,a,t],this)}afterTickToLabelConversion(){G(this.options.afterTickToLabelConversion,[this])}beforeCalculateLabelRotation(){G(this.options.beforeCalculateLabelRotation,[this])}calculateLabelRotation(){const t=this.options,e=t.ticks,a=Ni(this.ticks.length,t.ticks.maxTicksLimit),i=e.minRotation||0,n=e.maxRotation;let o=i,l,r,c;if(!this._isVisible()||!e.display||i>=n||a<=1||!this.isHorizontal()){this.labelRotation=i;return}const d=this._getLabelSizes(),u=d.widest.width,h=d.highest.height,p=ct(this.chart.width-u,0,this.maxWidth);l=t.offset?this.maxWidth/a:p/(a-1),u+6>l&&(l=p/(a-(t.offset?.5:1)),r=this.maxHeight-Le(t.grid)-e.padding-Ui(t.title,this.chart.options.font),c=Math.sqrt(u*u+h*h),o=Aa(Math.min(Math.asin(ct((d.highest.height+6)/l,-1,1)),Math.asin(ct(r/c,-1,1))-Math.asin(ct(h/c,-1,1)))),o=Math.max(i,Math.min(n,o))),this.labelRotation=o}afterCalculateLabelRotation(){G(this.options.afterCalculateLabelRotation,[this])}afterAutoSkip(){}beforeFit(){G(this.options.beforeFit,[this])}fit(){const t={width:0,height:0},{chart:e,options:{ticks:a,title:i,grid:n}}=this,o=this._isVisible(),l=this.isHorizontal();if(o){const r=Ui(i,e.options.font);if(l?(t.width=this.maxWidth,t.height=Le(n)+r):(t.height=this.maxHeight,t.width=Le(n)+r),a.display&&this.ticks.length){const{first:c,last:d,widest:u,highest:h}=this._getLabelSizes(),p=a.padding*2,b=At(this.labelRotation),f=Math.cos(b),v=Math.sin(b);if(l){const x=a.mirror?0:v*u.width+f*h.height;t.height=Math.min(this.maxHeight,t.height+x+p)}else{const x=a.mirror?0:f*u.width+v*h.height;t.width=Math.min(this.maxWidth,t.width+x+p)}this._calculatePadding(c,d,v,f)}}this._handleMargins(),l?(this.width=this._length=e.width-this._margins.left-this._margins.right,this.height=t.height):(this.width=t.width,this.height=this._length=e.height-this._margins.top-this._margins.bottom)}_calculatePadding(t,e,a,i){const{ticks:{align:n,padding:o},position:l}=this.options,r=this.labelRotation!==0,c=l!=="top"&&this.axis==="x";if(this.isHorizontal()){const d=this.getPixelForTick(0)-this.left,u=this.right-this.getPixelForTick(this.ticks.length-1);let h=0,p=0;r?c?(h=i*t.width,p=a*e.height):(h=a*t.height,p=i*e.width):n==="start"?p=e.width:n==="end"?h=t.width:n!=="inner"&&(h=t.width/2,p=e.width/2),this.paddingLeft=Math.max((h-d+o)*this.width/(this.width-d),0),this.paddingRight=Math.max((p-u+o)*this.width/(this.width-u),0)}else{let d=e.height/2,u=t.height/2;n==="start"?(d=0,u=t.height):n==="end"&&(d=e.height,u=0),this.paddingTop=d+o,this.paddingBottom=u+o}}_handleMargins(){this._margins&&(this._margins.left=Math.max(this.paddingLeft,this._margins.left),this._margins.top=Math.max(this.paddingTop,this._margins.top),this._margins.right=Math.max(this.paddingRight,this._margins.right),this._margins.bottom=Math.max(this.paddingBottom,this._margins.bottom))}afterFit(){G(this.options.afterFit,[this])}isHorizontal(){const{axis:t,position:e}=this.options;return e==="top"||e==="bottom"||t==="x"}isFullSize(){return this.options.fullSize}_convertTicksToLabels(t){this.beforeTickToLabelConversion(),this.generateTickLabels(t);let e,a;for(e=0,a=t.length;e<a;e++)B(t[e].label)&&(t.splice(e,1),a--,e--);this.afterTickToLabelConversion()}_getLabelSizes(){let t=this._labelSizes;if(!t){const e=this.options.ticks.sampleSize;let a=this.ticks;e<a.length&&(a=Wi(a,e)),this._labelSizes=t=this._computeLabelSizes(a,a.length,this.options.ticks.maxTicksLimit)}return t}_computeLabelSizes(t,e,a){const{ctx:i,_longestTextCache:n}=this,o=[],l=[],r=Math.floor(e/Ni(e,a));let c=0,d=0,u,h,p,b,f,v,x,w,_,S,k;for(u=0;u<e;u+=r){if(b=t[u].label,f=this._resolveTickFontOptions(u),i.font=v=f.string,x=n[v]=n[v]||{data:{},gc:[]},w=f.lineHeight,_=S=0,!B(b)&&!q(b))_=Cs(i,x.data,x.gc,_,b),S=w;else if(q(b))for(h=0,p=b.length;h<p;++h)k=b[h],!B(k)&&!q(k)&&(_=Cs(i,x.data,x.gc,_,k),S+=w);o.push(_),l.push(S),c=Math.max(_,c),d=Math.max(S,d)}qd(n,e);const P=o.indexOf(c),T=l.indexOf(d),M=O=>({width:o[O]||0,height:l[O]||0});return{first:M(0),last:M(e-1),widest:M(P),highest:M(T),widths:o,heights:l}}getLabelForValue(t){return t}getPixelForValue(t,e){return NaN}getValueForPixel(t){}getPixelForTick(t){const e=this.ticks;return t<0||t>e.length-1?null:this.getPixelForValue(e[t].value)}getPixelForDecimal(t){this._reversePixels&&(t=1-t);const e=this._startPixel+t*this._length;return Or(this._alignToPixels?le(this.chart,e,0):e)}getDecimalForPixel(t){const e=(t-this._startPixel)/this._length;return this._reversePixels?1-e:e}getBasePixel(){return this.getPixelForValue(this.getBaseValue())}getBaseValue(){const{min:t,max:e}=this;return t<0&&e<0?e:t>0&&e>0?t:0}getContext(t){const e=this.ticks||[];if(t>=0&&t<e.length){const a=e[t];return a.$context||(a.$context=Zd(this.getContext(),t,a))}return this.$context||(this.$context=Kd(this.chart.getContext(),this))}_tickSize(){const t=this.options.ticks,e=At(this.labelRotation),a=Math.abs(Math.cos(e)),i=Math.abs(Math.sin(e)),n=this._getLabelSizes(),o=t.autoSkipPadding||0,l=n?n.widest.width+o:0,r=n?n.highest.height+o:0;return this.isHorizontal()?r*a>l*i?l/a:r/i:r*i<l*a?r/a:l/i}_isVisible(){const t=this.options.display;return t!=="auto"?!!t:this.getMatchingVisibleMetas().length>0}_computeGridLineItems(t){const e=this.axis,a=this.chart,i=this.options,{grid:n,position:o,border:l}=i,r=n.offset,c=this.isHorizontal(),u=this.ticks.length+(r?1:0),h=Le(n),p=[],b=l.setContext(this.getContext()),f=b.display?b.width:0,v=f/2,x=function(Y){return le(a,Y,f)};let w,_,S,k,P,T,M,O,R,z,F,it;if(o==="top")w=x(this.bottom),T=this.bottom-h,O=w-v,z=x(t.top)+v,it=t.bottom;else if(o==="bottom")w=x(this.top),z=t.top,it=x(t.bottom)-v,T=w+v,O=this.top+h;else if(o==="left")w=x(this.right),P=this.right-h,M=w-v,R=x(t.left)+v,F=t.right;else if(o==="right")w=x(this.left),R=t.left,F=x(t.right)-v,P=w+v,M=this.left+h;else if(e==="x"){if(o==="center")w=x((t.top+t.bottom)/2+.5);else if(V(o)){const Y=Object.keys(o)[0],Z=o[Y];w=x(this.chart.scales[Y].getPixelForValue(Z))}z=t.top,it=t.bottom,T=w+v,O=T+h}else if(e==="y"){if(o==="center")w=x((t.left+t.right)/2);else if(V(o)){const Y=Object.keys(o)[0],Z=o[Y];w=x(this.chart.scales[Y].getPixelForValue(Z))}P=w-v,M=P-h,R=t.left,F=t.right}const ut=I(i.ticks.maxTicksLimit,u),H=Math.max(1,Math.ceil(u/ut));for(_=0;_<u;_+=H){const Y=this.getContext(_),Z=n.setContext(Y),xt=l.setContext(Y),nt=Z.lineWidth,$t=Z.color,me=xt.dash||[],Et=xt.dashOffset,ae=Z.tickWidth,It=Z.tickColor,Rt=Z.tickBorderDash||[],Pt=Z.tickBorderDashOffset;S=Xd(this,_,r),S!==void 0&&(k=le(a,S,nt),c?P=M=R=F=k:T=O=z=it=k,p.push({tx1:P,ty1:T,tx2:M,ty2:O,x1:R,y1:z,x2:F,y2:it,width:nt,color:$t,borderDash:me,borderDashOffset:Et,tickWidth:ae,tickColor:It,tickBorderDash:Rt,tickBorderDashOffset:Pt}))}return this._ticksLength=u,this._borderValue=w,p}_computeLabelItems(t){const e=this.axis,a=this.options,{position:i,ticks:n}=a,o=this.isHorizontal(),l=this.ticks,{align:r,crossAlign:c,padding:d,mirror:u}=n,h=Le(a.grid),p=h+d,b=u?-d:p,f=-At(this.labelRotation),v=[];let x,w,_,S,k,P,T,M,O,R,z,F,it="middle";if(i==="top")P=this.bottom-b,T=this._getXAxisLabelAlignment();else if(i==="bottom")P=this.top+b,T=this._getXAxisLabelAlignment();else if(i==="left"){const H=this._getYAxisLabelAlignment(h);T=H.textAlign,k=H.x}else if(i==="right"){const H=this._getYAxisLabelAlignment(h);T=H.textAlign,k=H.x}else if(e==="x"){if(i==="center")P=(t.top+t.bottom)/2+p;else if(V(i)){const H=Object.keys(i)[0],Y=i[H];P=this.chart.scales[H].getPixelForValue(Y)+p}T=this._getXAxisLabelAlignment()}else if(e==="y"){if(i==="center")k=(t.left+t.right)/2-p;else if(V(i)){const H=Object.keys(i)[0],Y=i[H];k=this.chart.scales[H].getPixelForValue(Y)}T=this._getYAxisLabelAlignment(h).textAlign}e==="y"&&(r==="start"?it="top":r==="end"&&(it="bottom"));const ut=this._getLabelSizes();for(x=0,w=l.length;x<w;++x){_=l[x],S=_.label;const H=n.setContext(this.getContext(x));M=this.getPixelForTick(x)+n.labelOffset,O=this._resolveTickFontOptions(x),R=O.lineHeight,z=q(S)?S.length:1;const Y=z/2,Z=H.color,xt=H.textStrokeColor,nt=H.textStrokeWidth;let $t=T;o?(k=M,T==="inner"&&(x===w-1?$t=this.options.reverse?"left":"right":x===0?$t=this.options.reverse?"right":"left":$t="center"),i==="top"?c==="near"||f!==0?F=-z*R+R/2:c==="center"?F=-ut.highest.height/2-Y*R+R:F=-ut.highest.height+R/2:c==="near"||f!==0?F=R/2:c==="center"?F=ut.highest.height/2-Y*R:F=ut.highest.height-z*R,u&&(F*=-1),f!==0&&!H.showLabelBackdrop&&(k+=R/2*Math.sin(f))):(P=M,F=(1-z)*R/2);let me;if(H.showLabelBackdrop){const Et=mt(H.backdropPadding),ae=ut.heights[x],It=ut.widths[x];let Rt=F-Et.top,Pt=0-Et.left;switch(it){case"middle":Rt-=ae/2;break;case"bottom":Rt-=ae;break}switch(T){case"center":Pt-=It/2;break;case"right":Pt-=It;break;case"inner":x===w-1?Pt-=It:x>0&&(Pt-=It/2);break}me={left:Pt,top:Rt,width:It+Et.width,height:ae+Et.height,color:H.backdropColor}}v.push({label:S,font:O,textOffset:F,options:{rotation:f,color:Z,strokeColor:xt,strokeWidth:nt,textAlign:$t,textBaseline:it,translation:[k,P],backdrop:me}})}return v}_getXAxisLabelAlignment(){const{position:t,ticks:e}=this.options;if(-At(this.labelRotation))return t==="top"?"left":"right";let i="center";return e.align==="start"?i="left":e.align==="end"?i="right":e.align==="inner"&&(i="inner"),i}_getYAxisLabelAlignment(t){const{position:e,ticks:{crossAlign:a,mirror:i,padding:n}}=this.options,o=this._getLabelSizes(),l=t+n,r=o.widest.width;let c,d;return e==="left"?i?(d=this.right+n,a==="near"?c="left":a==="center"?(c="center",d+=r/2):(c="right",d+=r)):(d=this.right-l,a==="near"?c="right":a==="center"?(c="center",d-=r/2):(c="left",d=this.left)):e==="right"?i?(d=this.left+n,a==="near"?c="right":a==="center"?(c="center",d-=r/2):(c="left",d-=r)):(d=this.left+l,a==="near"?c="left":a==="center"?(c="center",d+=r/2):(c="right",d=this.right)):c="right",{textAlign:c,x:d}}_computeLabelArea(){if(this.options.ticks.mirror)return;const t=this.chart,e=this.options.position;if(e==="left"||e==="right")return{top:0,left:this.left,bottom:t.height,right:this.right};if(e==="top"||e==="bottom")return{top:this.top,left:0,bottom:this.bottom,right:t.width}}drawBackground(){const{ctx:t,options:{backgroundColor:e},left:a,top:i,width:n,height:o}=this;e&&(t.save(),t.fillStyle=e,t.fillRect(a,i,n,o),t.restore())}getLineWidthForValue(t){const e=this.options.grid;if(!this._isVisible()||!e.display)return 0;const i=this.ticks.findIndex(n=>n.value===t);return i>=0?e.setContext(this.getContext(i)).lineWidth:0}drawGrid(t){const e=this.options.grid,a=this.ctx,i=this._gridLineItems||(this._gridLineItems=this._computeGridLineItems(t));let n,o;const l=(r,c,d)=>{!d.width||!d.color||(a.save(),a.lineWidth=d.width,a.strokeStyle=d.color,a.setLineDash(d.borderDash||[]),a.lineDashOffset=d.borderDashOffset,a.beginPath(),a.moveTo(r.x,r.y),a.lineTo(c.x,c.y),a.stroke(),a.restore())};if(e.display)for(n=0,o=i.length;n<o;++n){const r=i[n];e.drawOnChartArea&&l({x:r.x1,y:r.y1},{x:r.x2,y:r.y2},r),e.drawTicks&&l({x:r.tx1,y:r.ty1},{x:r.tx2,y:r.ty2},{color:r.tickColor,width:r.tickWidth,borderDash:r.tickBorderDash,borderDashOffset:r.tickBorderDashOffset})}}drawBorder(){const{chart:t,ctx:e,options:{border:a,grid:i}}=this,n=a.setContext(this.getContext()),o=a.display?n.width:0;if(!o)return;const l=i.setContext(this.getContext(0)).lineWidth,r=this._borderValue;let c,d,u,h;this.isHorizontal()?(c=le(t,this.left,o)-o/2,d=le(t,this.right,l)+l/2,u=h=r):(u=le(t,this.top,o)-o/2,h=le(t,this.bottom,l)+l/2,c=d=r),e.save(),e.lineWidth=n.width,e.strokeStyle=n.color,e.beginPath(),e.moveTo(c,u),e.lineTo(d,h),e.stroke(),e.restore()}drawLabels(t){if(!this.options.ticks.display)return;const a=this.ctx,i=this._computeLabelArea();i&&Os(a,i);const n=this.getLabelItems(t);for(const o of n){const l=o.options,r=o.font,c=o.label,d=o.textOffset;be(a,c,0,d,r,l)}i&&Es(a)}drawTitle(){const{ctx:t,options:{position:e,title:a,reverse:i}}=this;if(!a.display)return;const n=lt(a.font),o=mt(a.padding),l=a.align;let r=n.lineHeight/2;e==="bottom"||e==="center"||V(e)?(r+=o.bottom,q(a.text)&&(r+=n.lineHeight*(a.text.length-1))):r+=o.top;const{titleX:c,titleY:d,maxWidth:u,rotation:h}=Jd(this,r,e,l);be(t,a.text,0,0,n,{color:a.color,maxWidth:u,rotation:h,textAlign:Qd(l,e,i),textBaseline:"middle",translation:[c,d]})}draw(t){this._isVisible()&&(this.drawBackground(),this.drawGrid(t),this.drawBorder(),this.drawTitle(),this.drawLabels(t))}_layers(){const t=this.options,e=t.ticks&&t.ticks.z||0,a=I(t.grid&&t.grid.z,-1),i=I(t.border&&t.border.z,0);return!this._isVisible()||this.draw!==ge.prototype.draw?[{z:e,draw:n=>{this.draw(n)}}]:[{z:a,draw:n=>{this.drawBackground(),this.drawGrid(n),this.drawTitle()}},{z:i,draw:()=>{this.drawBorder()}},{z:e,draw:n=>{this.drawLabels(n)}}]}getMatchingVisibleMetas(t){const e=this.chart.getSortedVisibleDatasetMetas(),a=this.axis+"AxisID",i=[];let n,o;for(n=0,o=e.length;n<o;++n){const l=e[n];l[a]===this.id&&(!t||l.type===t)&&i.push(l)}return i}_resolveTickFontOptions(t){const e=this.options.ticks.setContext(this.getContext(t));return lt(e.font)}_maxDigits(){const t=this._resolveTickFontOptions(0).lineHeight;return(this.isHorizontal()?this.width:this.height)/t}}class us{constructor(t,e,a){this.type=t,this.scope=e,this.override=a,this.items=Object.create(null)}isForType(t){return Object.prototype.isPrototypeOf.call(this.type.prototype,t.prototype)}register(t){const e=Object.getPrototypeOf(t);let a;su(e)&&(a=this.register(e));const i=this.items,n=t.id,o=this.scope+"."+n;if(!n)throw new Error("class does not have id: "+t);return n in i||(i[n]=t,tu(t,o,a),this.override&&K.override(t.id,t.overrides)),o}get(t){return this.items[t]}unregister(t){const e=this.items,a=t.id,i=this.scope;a in e&&delete e[a],i&&a in K[i]&&(delete K[i][a],this.override&&delete fe[a])}}function tu(s,t,e){const a=$e(Object.create(null),[e?K.get(e):{},K.get(t),s.defaults]);K.set(t,a),s.defaultRoutes&&eu(t,s.defaultRoutes),s.descriptors&&K.describe(t,s.descriptors)}function eu(s,t){Object.keys(t).forEach(e=>{const a=e.split("."),i=a.pop(),n=[s].concat(a).join("."),o=t[e].split("."),l=o.pop(),r=o.join(".");K.route(n,i,r,l)})}function su(s){return"id"in s&&"defaults"in s}class au{constructor(){this.controllers=new us(se,"datasets",!0),this.elements=new us(Ut,"elements"),this.plugins=new us(Object,"plugins"),this.scales=new us(ge,"scales"),this._typedRegistries=[this.controllers,this.scales,this.elements]}add(...t){this._each("register",t)}remove(...t){this._each("unregister",t)}addControllers(...t){this._each("register",t,this.controllers)}addElements(...t){this._each("register",t,this.elements)}addPlugins(...t){this._each("register",t,this.plugins)}addScales(...t){this._each("register",t,this.scales)}getController(t){return this._get(t,this.controllers,"controller")}getElement(t){return this._get(t,this.elements,"element")}getPlugin(t){return this._get(t,this.plugins,"plugin")}getScale(t){return this._get(t,this.scales,"scale")}removeControllers(...t){this._each("unregister",t,this.controllers)}removeElements(...t){this._each("unregister",t,this.elements)}removePlugins(...t){this._each("unregister",t,this.plugins)}removeScales(...t){this._each("unregister",t,this.scales)}_each(t,e,a){[...e].forEach(i=>{const n=a||this._getRegistryForType(i);a||n.isForType(i)||n===this.plugins&&i.id?this._exec(t,n,i):W(i,o=>{const l=a||this._getRegistryForType(o);this._exec(t,l,o)})})}_exec(t,e,a){const i=Pa(t);G(a["before"+i],[],a),e[t](a),G(a["after"+i],[],a)}_getRegistryForType(t){for(let e=0;e<this._typedRegistries.length;e++){const a=this._typedRegistries[e];if(a.isForType(t))return a}return this.plugins}_get(t,e,a){const i=e.get(t);if(i===void 0)throw new Error('"'+t+'" is not a registered '+a+".");return i}}var Lt=new au;class iu{constructor(){this._init=void 0}notify(t,e,a,i){if(e==="beforeInit"&&(this._init=this._createDescriptors(t,!0),this._notify(this._init,t,"install")),this._init===void 0)return;const n=i?this._descriptors(t).filter(i):this._descriptors(t),o=this._notify(n,t,e,a);return e==="afterDestroy"&&(this._notify(n,t,"stop"),this._notify(this._init,t,"uninstall"),this._init=void 0),o}_notify(t,e,a,i){i=i||{};for(const n of t){const o=n.plugin,l=o[a],r=[e,i,n.options];if(G(l,r,o)===!1&&i.cancelable)return!1}return!0}invalidate(){B(this._cache)||(this._oldCache=this._cache,this._cache=void 0)}_descriptors(t){if(this._cache)return this._cache;const e=this._cache=this._createDescriptors(t);return this._notifyStateChanges(t),e}_createDescriptors(t,e){const a=t&&t.config,i=I(a.options&&a.options.plugins,{}),n=nu(a);return i===!1&&!e?[]:lu(t,n,i,e)}_notifyStateChanges(t){const e=this._oldCache||[],a=this._cache,i=(n,o)=>n.filter(l=>!o.some(r=>l.plugin.id===r.plugin.id));this._notify(i(e,a),t,"stop"),this._notify(i(a,e),t,"start")}}function nu(s){const t={},e=[],a=Object.keys(Lt.plugins.items);for(let n=0;n<a.length;n++)e.push(Lt.getPlugin(a[n]));const i=s.plugins||[];for(let n=0;n<i.length;n++){const o=i[n];e.indexOf(o)===-1&&(e.push(o),t[o.id]=!0)}return{plugins:e,localIds:t}}function ou(s,t){return!t&&s===!1?null:s===!0?{}:s}function lu(s,{plugins:t,localIds:e},a,i){const n=[],o=s.getContext();for(const l of t){const r=l.id,c=ou(a[r],i);c!==null&&n.push({plugin:l,options:ru(s.config,{plugin:l,local:e[r]},c,o)})}return n}function ru(s,{plugin:t,local:e},a,i){const n=s.pluginScopeKeys(t),o=s.getOptionScopes(a,n);return e&&t.defaults&&o.push(t.defaults),s.createResolver(o,i,[""],{scriptable:!1,indexable:!1,allKeys:!0})}function fa(s,t){const e=K.datasets[s]||{};return((t.datasets||{})[s]||{}).indexAxis||t.indexAxis||e.indexAxis||"x"}function cu(s,t){let e=s;return s==="_index_"?e=t:s==="_value_"&&(e=t==="x"?"y":"x"),e}function du(s,t){return s===t?"_index_":"_value_"}function $i(s){if(s==="x"||s==="y"||s==="r")return s}function uu(s){if(s==="top"||s==="bottom")return"x";if(s==="left"||s==="right")return"y"}function ba(s,...t){if($i(s))return s;for(const e of t){const a=e.axis||uu(e.position)||s.length>1&&$i(s[0].toLowerCase());if(a)return a}throw new Error(`Cannot determine type of '${s}' axis. Please provide 'axis' or 'position' option.`)}function Yi(s,t,e){if(e[t+"AxisID"]===s)return{axis:t}}function hu(s,t){if(t.data&&t.data.datasets){const e=t.data.datasets.filter(a=>a.xAxisID===s||a.yAxisID===s);if(e.length)return Yi(s,"x",e[0])||Yi(s,"y",e[0])}return{}}function pu(s,t){const e=fe[s.type]||{scales:{}},a=t.scales||{},i=fa(s.type,t),n=Object.create(null);return Object.keys(a).forEach(o=>{const l=a[o];if(!V(l))return console.error(`Invalid scale configuration for scale: ${o}`);if(l._proxy)return console.warn(`Ignoring resolver passed as options for scale: ${o}`);const r=ba(o,l,hu(o,s),K.scales[l.type]),c=du(r,i),d=e.scales||{};n[o]=Fe(Object.create(null),[{axis:r},l,d[r],d[c]])}),s.data.datasets.forEach(o=>{const l=o.type||s.type,r=o.indexAxis||fa(l,t),d=(fe[l]||{}).scales||{};Object.keys(d).forEach(u=>{const h=cu(u,r),p=o[h+"AxisID"]||h;n[p]=n[p]||Object.create(null),Fe(n[p],[{axis:h},a[p],d[u]])})}),Object.keys(n).forEach(o=>{const l=n[o];Fe(l,[K.scales[l.type],K.scale])}),n}function So(s){const t=s.options||(s.options={});t.plugins=I(t.plugins,{}),t.scales=pu(s,t)}function _o(s){return s=s||{},s.datasets=s.datasets||[],s.labels=s.labels||[],s}function fu(s){return s=s||{},s.data=_o(s.data),So(s),s}const Gi=new Map,Co=new Set;function hs(s,t){let e=Gi.get(s);return e||(e=t(),Gi.set(s,e),Co.add(e)),e}const Oe=(s,t,e)=>{const a=Jt(t,e);a!==void 0&&s.add(a)};class bu{constructor(t){this._config=fu(t),this._scopeCache=new Map,this._resolverCache=new Map}get platform(){return this._config.platform}get type(){return this._config.type}set type(t){this._config.type=t}get data(){return this._config.data}set data(t){this._config.data=_o(t)}get options(){return this._config.options}set options(t){this._config.options=t}get plugins(){return this._config.plugins}update(){const t=this._config;this.clearCache(),So(t)}clearCache(){this._scopeCache.clear(),this._resolverCache.clear()}datasetScopeKeys(t){return hs(t,()=>[[`datasets.${t}`,""]])}datasetAnimationScopeKeys(t,e){return hs(`${t}.transition.${e}`,()=>[[`datasets.${t}.transitions.${e}`,`transitions.${e}`],[`datasets.${t}`,""]])}datasetElementScopeKeys(t,e){return hs(`${t}-${e}`,()=>[[`datasets.${t}.elements.${e}`,`datasets.${t}`,`elements.${e}`,""]])}pluginScopeKeys(t){const e=t.id,a=this.type;return hs(`${a}-plugin-${e}`,()=>[[`plugins.${e}`,...t.additionalOptionScopes||[]]])}_cachedScopes(t,e){const a=this._scopeCache;let i=a.get(t);return(!i||e)&&(i=new Map,a.set(t,i)),i}getOptionScopes(t,e,a){const{options:i,type:n}=this,o=this._cachedScopes(t,a),l=o.get(e);if(l)return l;const r=new Set;e.forEach(d=>{t&&(r.add(t),d.forEach(u=>Oe(r,t,u))),d.forEach(u=>Oe(r,i,u)),d.forEach(u=>Oe(r,fe[n]||{},u)),d.forEach(u=>Oe(r,K,u)),d.forEach(u=>Oe(r,ha,u))});const c=Array.from(r);return c.length===0&&c.push(Object.create(null)),Co.has(e)&&o.set(e,c),c}chartOptionScopes(){const{options:t,type:e}=this;return[t,fe[e]||{},K.datasets[e]||{},{type:e},K,ha]}resolveNamedOptions(t,e,a,i=[""]){const n={$shared:!0},{resolver:o,subPrefixes:l}=Xi(this._resolverCache,t,i);let r=o;if(vu(o,e)){n.$shared=!1,a=te(a)?a():a;const c=this.createResolver(t,a,l);r=_e(o,a,c)}for(const c of e)n[c]=r[c];return n}createResolver(t,e,a=[""],i){const{resolver:n}=Xi(this._resolverCache,t,a);return V(e)?_e(n,e,void 0,i):n}}function Xi(s,t,e){let a=s.get(t);a||(a=new Map,s.set(t,a));const i=e.join();let n=a.get(i);return n||(n={resolver:Ea(t,e),subPrefixes:e.filter(l=>!l.toLowerCase().includes("hover"))},a.set(i,n)),n}const gu=s=>V(s)&&Object.getOwnPropertyNames(s).some(t=>te(s[t]));function vu(s,t){const{isScriptable:e,isIndexable:a}=Jn(s);for(const i of t){const n=e(i),o=a(i),l=(o||n)&&s[i];if(n&&(te(l)||gu(l))||o&&q(l))return!0}return!1}var mu="4.5.1";const xu=["top","bottom","left","right","chartArea"];function qi(s,t){return s==="top"||s==="bottom"||xu.indexOf(s)===-1&&t==="x"}function Ki(s,t){return function(e,a){return e[s]===a[s]?e[t]-a[t]:e[s]-a[s]}}function Zi(s){const t=s.chart,e=t.options.animation;t.notifyPlugins("afterRender"),G(e&&e.onComplete,[s],t)}function yu(s){const t=s.chart,e=t.options.animation;G(e&&e.onProgress,[s],t)}function Mo(s){return za()&&typeof s=="string"?s=document.getElementById(s):s&&s.length&&(s=s[0]),s&&s.canvas&&(s=s.canvas),s}const ys={},Qi=s=>{const t=Mo(s);return Object.values(ys).filter(e=>e.canvas===t).pop()};function wu(s,t,e){const a=Object.keys(s);for(const i of a){const n=+i;if(n>=t){const o=s[i];delete s[i],(e>0||n>t)&&(s[n+e]=o)}}}function ku(s,t,e,a){return!e||s.type==="mouseout"?null:a?t:s}class vt{static defaults=K;static instances=ys;static overrides=fe;static registry=Lt;static version=mu;static getChart=Qi;static register(...t){Lt.add(...t),Ji()}static unregister(...t){Lt.remove(...t),Ji()}constructor(t,e){const a=this.config=new bu(e),i=Mo(t),n=Qi(i);if(n)throw new Error("Canvas is already in use. Chart with ID '"+n.id+"' must be destroyed before the canvas with ID '"+n.canvas.id+"' can be reused.");const o=a.createResolver(a.chartOptionScopes(),this.getContext());this.platform=new(a.platform||Hd(i)),this.platform.updateConfig(a);const l=this.platform.acquireContext(i,o.aspectRatio),r=l&&l.canvas,c=r&&r.height,d=r&&r.width;if(this.id=xr(),this.ctx=l,this.canvas=r,this.width=d,this.height=c,this._options=o,this._aspectRatio=this.aspectRatio,this._layers=[],this._metasets=[],this._stacks=void 0,this.boxes=[],this.currentDevicePixelRatio=void 0,this.chartArea=void 0,this._active=[],this._lastEvent=void 0,this._listeners={},this._responsiveListeners=void 0,this._sortedMetasets=[],this.scales={},this._plugins=new iu,this.$proxies={},this._hiddenIndices={},this.attached=!1,this._animationsDisabled=void 0,this.$context=void 0,this._doResize=zr(u=>this.update(u),o.resizeDelay||0),this._dataChanges=[],ys[this.id]=this,!l||!r){console.error("Failed to create chart: can't acquire context from the given item");return}Bt.listen(this,"complete",Zi),Bt.listen(this,"progress",yu),this._initialize(),this.attached&&this.update()}get aspectRatio(){const{options:{aspectRatio:t,maintainAspectRatio:e},width:a,height:i,_aspectRatio:n}=this;return B(t)?e&&n?n:i?a/i:null:t}get data(){return this.config.data}set data(t){this.config.data=t}get options(){return this._options}set options(t){this.config.options=t}get registry(){return Lt}_initialize(){return this.notifyPlugins("beforeInit"),this.options.responsive?this.resize():wi(this,this.options.devicePixelRatio),this.bindEvents(),this.notifyPlugins("afterInit"),this}clear(){return mi(this.canvas,this.ctx),this}stop(){return Bt.stop(this),this}resize(t,e){Bt.running(this)?this._resizeBeforeDraw={width:t,height:e}:this._resize(t,e)}_resize(t,e){const a=this.options,i=this.canvas,n=a.maintainAspectRatio&&this.aspectRatio,o=this.platform.getMaximumSize(i,t,e,n),l=a.devicePixelRatio||this.platform.getDevicePixelRatio(),r=this.width?"resize":"attach";this.width=o.width,this.height=o.height,this._aspectRatio=this.aspectRatio,wi(this,l,!0)&&(this.notifyPlugins("resize",{size:o}),G(a.onResize,[this,o],this),this.attached&&this._doResize(r)&&this.render())}ensureScalesHaveIDs(){const e=this.options.scales||{};W(e,(a,i)=>{a.id=i})}buildOrUpdateScales(){const t=this.options,e=t.scales,a=this.scales,i=Object.keys(a).reduce((o,l)=>(o[l]=!1,o),{});let n=[];e&&(n=n.concat(Object.keys(e).map(o=>{const l=e[o],r=ba(o,l),c=r==="r",d=r==="x";return{options:l,dposition:c?"chartArea":d?"bottom":"left",dtype:c?"radialLinear":d?"category":"linear"}}))),W(n,o=>{const l=o.options,r=l.id,c=ba(r,l),d=I(l.type,o.dtype);(l.position===void 0||qi(l.position,c)!==qi(o.dposition))&&(l.position=o.dposition),i[r]=!0;let u=null;if(r in a&&a[r].type===d)u=a[r];else{const h=Lt.getScale(d);u=new h({id:r,type:d,ctx:this.ctx,chart:this}),a[u.id]=u}u.init(l,t)}),W(i,(o,l)=>{o||delete a[l]}),W(a,o=>{gt.configure(this,o,o.options),gt.addBox(this,o)})}_updateMetasets(){const t=this._metasets,e=this.data.datasets.length,a=t.length;if(t.sort((i,n)=>i.index-n.index),a>e){for(let i=e;i<a;++i)this._destroyDatasetMeta(i);t.splice(e,a-e)}this._sortedMetasets=t.slice(0).sort(Ki("order","index"))}_removeUnreferencedMetasets(){const{_metasets:t,data:{datasets:e}}=this;t.length>e.length&&delete this._stacks,t.forEach((a,i)=>{e.filter(n=>n===a._dataset).length===0&&this._destroyDatasetMeta(i)})}buildOrUpdateControllers(){const t=[],e=this.data.datasets;let a,i;for(this._removeUnreferencedMetasets(),a=0,i=e.length;a<i;a++){const n=e[a];let o=this.getDatasetMeta(a);const l=n.type||this.config.type;if(o.type&&o.type!==l&&(this._destroyDatasetMeta(a),o=this.getDatasetMeta(a)),o.type=l,o.indexAxis=n.indexAxis||fa(l,this.options),o.order=n.order||0,o.index=a,o.label=""+n.label,o.visible=this.isDatasetVisible(a),o.controller)o.controller.updateIndex(a),o.controller.linkScales();else{const r=Lt.getController(l),{datasetElementType:c,dataElementType:d}=K.datasets[l];Object.assign(r,{dataElementType:Lt.getElement(d),datasetElementType:c&&Lt.getElement(c)}),o.controller=new r(this,a),t.push(o.controller)}}return this._updateMetasets(),t}_resetElements(){W(this.data.datasets,(t,e)=>{this.getDatasetMeta(e).controller.reset()},this)}reset(){this._resetElements(),this.notifyPlugins("reset")}update(t){const e=this.config;e.update();const a=this._options=e.createResolver(e.chartOptionScopes(),this.getContext()),i=this._animationsDisabled=!a.animation;if(this._updateScales(),this._checkEventBindings(),this._updateHiddenIndices(),this._plugins.invalidate(),this.notifyPlugins("beforeUpdate",{mode:t,cancelable:!0})===!1)return;const n=this.buildOrUpdateControllers();this.notifyPlugins("beforeElementsUpdate");let o=0;for(let c=0,d=this.data.datasets.length;c<d;c++){const{controller:u}=this.getDatasetMeta(c),h=!i&&n.indexOf(u)===-1;u.buildOrUpdateElements(h),o=Math.max(+u.getMaxOverflow(),o)}o=this._minPadding=a.layout.autoPadding?o:0,this._updateLayout(o),i||W(n,c=>{c.reset()}),this._updateDatasets(t),this.notifyPlugins("afterUpdate",{mode:t}),this._layers.sort(Ki("z","_idx"));const{_active:l,_lastEvent:r}=this;r?this._eventHandler(r,!0):l.length&&this._updateHoverStyles(l,l,!0),this.render()}_updateScales(){W(this.scales,t=>{gt.removeBox(this,t)}),this.ensureScalesHaveIDs(),this.buildOrUpdateScales()}_checkEventBindings(){const t=this.options,e=new Set(Object.keys(this._listeners)),a=new Set(t.events);(!ci(e,a)||!!this._responsiveListeners!==t.responsive)&&(this.unbindEvents(),this.bindEvents())}_updateHiddenIndices(){const{_hiddenIndices:t}=this,e=this._getUniformDataChanges()||[];for(const{method:a,start:i,count:n}of e){const o=a==="_removeElements"?-n:n;wu(t,i,o)}}_getUniformDataChanges(){const t=this._dataChanges;if(!t||!t.length)return;this._dataChanges=[];const e=this.data.datasets.length,a=n=>new Set(t.filter(o=>o[0]===n).map((o,l)=>l+","+o.splice(1).join(","))),i=a(0);for(let n=1;n<e;n++)if(!ci(i,a(n)))return;return Array.from(i).map(n=>n.split(",")).map(n=>({method:n[1],start:+n[2],count:+n[3]}))}_updateLayout(t){if(this.notifyPlugins("beforeLayout",{cancelable:!0})===!1)return;gt.update(this,this.width,this.height,t);const e=this.chartArea,a=e.width<=0||e.height<=0;this._layers=[],W(this.boxes,i=>{a&&i.position==="chartArea"||(i.configure&&i.configure(),this._layers.push(...i._layers()))},this),this._layers.forEach((i,n)=>{i._idx=n}),this.notifyPlugins("afterLayout")}_updateDatasets(t){if(this.notifyPlugins("beforeDatasetsUpdate",{mode:t,cancelable:!0})!==!1){for(let e=0,a=this.data.datasets.length;e<a;++e)this.getDatasetMeta(e).controller.configure();for(let e=0,a=this.data.datasets.length;e<a;++e)this._updateDataset(e,te(t)?t({datasetIndex:e}):t);this.notifyPlugins("afterDatasetsUpdate",{mode:t})}}_updateDataset(t,e){const a=this.getDatasetMeta(t),i={meta:a,index:t,mode:e,cancelable:!0};this.notifyPlugins("beforeDatasetUpdate",i)!==!1&&(a.controller._update(e),i.cancelable=!1,this.notifyPlugins("afterDatasetUpdate",i))}render(){this.notifyPlugins("beforeRender",{cancelable:!0})!==!1&&(Bt.has(this)?this.attached&&!Bt.running(this)&&Bt.start(this):(this.draw(),Zi({chart:this})))}draw(){let t;if(this._resizeBeforeDraw){const{width:a,height:i}=this._resizeBeforeDraw;this._resizeBeforeDraw=null,this._resize(a,i)}if(this.clear(),this.width<=0||this.height<=0||this.notifyPlugins("beforeDraw",{cancelable:!0})===!1)return;const e=this._layers;for(t=0;t<e.length&&e[t].z<=0;++t)e[t].draw(this.chartArea);for(this._drawDatasets();t<e.length;++t)e[t].draw(this.chartArea);this.notifyPlugins("afterDraw")}_getSortedDatasetMetas(t){const e=this._sortedMetasets,a=[];let i,n;for(i=0,n=e.length;i<n;++i){const o=e[i];(!t||o.visible)&&a.push(o)}return a}getSortedVisibleDatasetMetas(){return this._getSortedDatasetMetas(!0)}_drawDatasets(){if(this.notifyPlugins("beforeDatasetsDraw",{cancelable:!0})===!1)return;const t=this.getSortedVisibleDatasetMetas();for(let e=t.length-1;e>=0;--e)this._drawDataset(t[e]);this.notifyPlugins("afterDatasetsDraw")}_drawDataset(t){const e=this.ctx,a={meta:t,index:t.index,cancelable:!0},i=uo(this,t);this.notifyPlugins("beforeDatasetDraw",a)!==!1&&(i&&Os(e,i),t.controller.draw(),i&&Es(e),a.cancelable=!1,this.notifyPlugins("afterDatasetDraw",a))}isPointInArea(t){return Wt(t,this.chartArea,this._minPadding)}getElementsAtEventForMode(t,e,a,i){const n=xd.modes[e];return typeof n=="function"?n(this,t,a,i):[]}getDatasetMeta(t){const e=this.data.datasets[t],a=this._metasets;let i=a.filter(n=>n&&n._dataset===e).pop();return i||(i={type:null,data:[],dataset:null,controller:null,hidden:null,xAxisID:null,yAxisID:null,order:e&&e.order||0,index:t,_dataset:e,_parsed:[],_sorted:!1},a.push(i)),i}getContext(){return this.$context||(this.$context=ee(null,{chart:this,type:"chart"}))}getVisibleDatasetCount(){return this.getSortedVisibleDatasetMetas().length}isDatasetVisible(t){const e=this.data.datasets[t];if(!e)return!1;const a=this.getDatasetMeta(t);return typeof a.hidden=="boolean"?!a.hidden:!e.hidden}setDatasetVisibility(t,e){const a=this.getDatasetMeta(t);a.hidden=!e}toggleDataVisibility(t){this._hiddenIndices[t]=!this._hiddenIndices[t]}getDataVisibility(t){return!this._hiddenIndices[t]}_updateVisibility(t,e,a){const i=a?"show":"hide",n=this.getDatasetMeta(t),o=n.controller._resolveAnimations(void 0,i);Ye(e)?(n.data[e].hidden=!a,this.update()):(this.setDatasetVisibility(t,a),o.update(n,{visible:a}),this.update(l=>l.datasetIndex===t?i:void 0))}hide(t,e){this._updateVisibility(t,e,!1)}show(t,e){this._updateVisibility(t,e,!0)}_destroyDatasetMeta(t){const e=this._metasets[t];e&&e.controller&&e.controller._destroy(),delete this._metasets[t]}_stop(){let t,e;for(this.stop(),Bt.remove(this),t=0,e=this.data.datasets.length;t<e;++t)this._destroyDatasetMeta(t)}destroy(){this.notifyPlugins("beforeDestroy");const{canvas:t,ctx:e}=this;this._stop(),this.config.clearCache(),t&&(this.unbindEvents(),mi(t,e),this.platform.releaseContext(e),this.canvas=null,this.ctx=null),delete ys[this.id],this.notifyPlugins("afterDestroy")}toBase64Image(...t){return this.canvas.toDataURL(...t)}bindEvents(){this.bindUserEvents(),this.options.responsive?this.bindResponsiveEvents():this.attached=!0}bindUserEvents(){const t=this._listeners,e=this.platform,a=(n,o)=>{e.addEventListener(this,n,o),t[n]=o},i=(n,o,l)=>{n.offsetX=o,n.offsetY=l,this._eventHandler(n)};W(this.options.events,n=>a(n,i))}bindResponsiveEvents(){this._responsiveListeners||(this._responsiveListeners={});const t=this._responsiveListeners,e=this.platform,a=(r,c)=>{e.addEventListener(this,r,c),t[r]=c},i=(r,c)=>{t[r]&&(e.removeEventListener(this,r,c),delete t[r])},n=(r,c)=>{this.canvas&&this.resize(r,c)};let o;const l=()=>{i("attach",l),this.attached=!0,this.resize(),a("resize",n),a("detach",o)};o=()=>{this.attached=!1,i("resize",n),this._stop(),this._resize(0,0),a("attach",l)},e.isAttached(this.canvas)?l():o()}unbindEvents(){W(this._listeners,(t,e)=>{this.platform.removeEventListener(this,e,t)}),this._listeners={},W(this._responsiveListeners,(t,e)=>{this.platform.removeEventListener(this,e,t)}),this._responsiveListeners=void 0}updateHoverStyle(t,e,a){const i=a?"set":"remove";let n,o,l,r;for(e==="dataset"&&(n=this.getDatasetMeta(t[0].datasetIndex),n.controller["_"+i+"DatasetHoverStyle"]()),l=0,r=t.length;l<r;++l){o=t[l];const c=o&&this.getDatasetMeta(o.datasetIndex).controller;c&&c[i+"HoverStyle"](o.element,o.datasetIndex,o.index)}}getActiveElements(){return this._active||[]}setActiveElements(t){const e=this._active||[],a=t.map(({datasetIndex:n,index:o})=>{const l=this.getDatasetMeta(n);if(!l)throw new Error("No dataset found at index "+n);return{datasetIndex:n,element:l.data[o],index:o}});!ks(a,e)&&(this._active=a,this._lastEvent=null,this._updateHoverStyles(a,e))}notifyPlugins(t,e,a){return this._plugins.notify(this,t,e,a)}isPluginEnabled(t){return this._plugins._cache.filter(e=>e.plugin.id===t).length===1}_updateHoverStyles(t,e,a){const i=this.options.hover,n=(r,c)=>r.filter(d=>!c.some(u=>d.datasetIndex===u.datasetIndex&&d.index===u.index)),o=n(e,t),l=a?t:n(t,e);o.length&&this.updateHoverStyle(o,i.mode,!1),l.length&&i.mode&&this.updateHoverStyle(l,i.mode,!0)}_eventHandler(t,e){const a={event:t,replay:e,cancelable:!0,inChartArea:this.isPointInArea(t)},i=o=>(o.options.events||this.options.events).includes(t.native.type);if(this.notifyPlugins("beforeEvent",a,i)===!1)return;const n=this._handleEvent(t,e,a.inChartArea);return a.cancelable=!1,this.notifyPlugins("afterEvent",a,i),(n||a.changed)&&this.render(),this}_handleEvent(t,e,a){const{_active:i=[],options:n}=this,o=e,l=this._getActiveElements(t,i,a,o),r=Cr(t),c=ku(t,this._lastEvent,a,r);a&&(this._lastEvent=null,G(n.onHover,[t,l,this],this),r&&G(n.onClick,[t,l,this],this));const d=!ks(l,i);return(d||e)&&(this._active=l,this._updateHoverStyles(l,i,e)),this._lastEvent=c,d}_getActiveElements(t,e,a,i){if(t.type==="mouseout")return[];if(!a)return e;const n=this.options.hover;return this.getElementsAtEventForMode(t,n.mode,n,i)}}function Ji(){return W(vt.instances,s=>s._plugins.invalidate())}function Su(s,t,e){const{startAngle:a,x:i,y:n,outerRadius:o,innerRadius:l,options:r}=t,{borderWidth:c,borderJoinStyle:d}=r,u=Math.min(c/o,bt(a-e));if(s.beginPath(),s.arc(i,n,o-c/2,a+u/2,e-u/2),l>0){const h=Math.min(c/l,bt(a-e));s.arc(i,n,l+c/2,e-h/2,a+h/2,!0)}else{const h=Math.min(c/2,o*bt(a-e));if(d==="round")s.arc(i,n,h,e-j/2,a+j/2,!0);else if(d==="bevel"){const p=2*h*h,b=-p*Math.cos(e+j/2)+i,f=-p*Math.sin(e+j/2)+n,v=p*Math.cos(a+j/2)+i,x=p*Math.sin(a+j/2)+n;s.lineTo(b,f),s.lineTo(v,x)}}s.closePath(),s.moveTo(0,0),s.rect(0,0,s.canvas.width,s.canvas.height),s.clip("evenodd")}function _u(s,t,e){const{startAngle:a,pixelMargin:i,x:n,y:o,outerRadius:l,innerRadius:r}=t;let c=i/l;s.beginPath(),s.arc(n,o,l,a-c,e+c),r>i?(c=i/r,s.arc(n,o,r,e+c,a-c,!0)):s.arc(n,o,i,e+st,a-st),s.closePath(),s.clip()}function Cu(s){return Oa(s,["outerStart","outerEnd","innerStart","innerEnd"])}function Mu(s,t,e,a){const i=Cu(s.options.borderRadius),n=(e-t)/2,o=Math.min(n,a*t/2),l=r=>{const c=(e-Math.min(n,r))*a/2;return ct(r,0,Math.min(n,c))};return{outerStart:l(i.outerStart),outerEnd:l(i.outerEnd),innerStart:ct(i.innerStart,0,o),innerEnd:ct(i.innerEnd,0,o)}}function ye(s,t,e,a){return{x:e+s*Math.cos(t),y:a+s*Math.sin(t)}}function As(s,t,e,a,i,n){const{x:o,y:l,startAngle:r,pixelMargin:c,innerRadius:d}=t,u=Math.max(t.outerRadius+a+e-c,0),h=d>0?d+a+e+c:0;let p=0;const b=i-r;if(a){const H=d>0?d-a:0,Y=u>0?u-a:0,Z=(H+Y)/2,xt=Z!==0?b*Z/(Z+a):b;p=(b-xt)/2}const f=Math.max(.001,b*u-e/j)/u,v=(b-f)/2,x=r+v+p,w=i-v-p,{outerStart:_,outerEnd:S,innerStart:k,innerEnd:P}=Mu(t,h,u,w-x),T=u-_,M=u-S,O=x+_/T,R=w-S/M,z=h+k,F=h+P,it=x+k/z,ut=w-P/F;if(s.beginPath(),n){const H=(O+R)/2;if(s.arc(o,l,u,O,H),s.arc(o,l,u,H,R),S>0){const nt=ye(M,R,o,l);s.arc(nt.x,nt.y,S,R,w+st)}const Y=ye(F,w,o,l);if(s.lineTo(Y.x,Y.y),P>0){const nt=ye(F,ut,o,l);s.arc(nt.x,nt.y,P,w+st,ut+Math.PI)}const Z=(w-P/h+(x+k/h))/2;if(s.arc(o,l,h,w-P/h,Z,!0),s.arc(o,l,h,Z,x+k/h,!0),k>0){const nt=ye(z,it,o,l);s.arc(nt.x,nt.y,k,it+Math.PI,x-st)}const xt=ye(T,x,o,l);if(s.lineTo(xt.x,xt.y),_>0){const nt=ye(T,O,o,l);s.arc(nt.x,nt.y,_,x-st,O)}}else{s.moveTo(o,l);const H=Math.cos(O)*u+o,Y=Math.sin(O)*u+l;s.lineTo(H,Y);const Z=Math.cos(R)*u+o,xt=Math.sin(R)*u+l;s.lineTo(Z,xt)}s.closePath()}function Pu(s,t,e,a,i){const{fullCircles:n,startAngle:o,circumference:l}=t;let r=t.endAngle;if(n){As(s,t,e,a,r,i);for(let c=0;c<n;++c)s.fill();isNaN(l)||(r=o+(l%X||X))}return As(s,t,e,a,r,i),s.fill(),r}function Au(s,t,e,a,i){const{fullCircles:n,startAngle:o,circumference:l,options:r}=t,{borderWidth:c,borderJoinStyle:d,borderDash:u,borderDashOffset:h,borderRadius:p}=r,b=r.borderAlign==="inner";if(!c)return;s.setLineDash(u||[]),s.lineDashOffset=h,b?(s.lineWidth=c*2,s.lineJoin=d||"round"):(s.lineWidth=c,s.lineJoin=d||"bevel");let f=t.endAngle;if(n){As(s,t,e,a,f,i);for(let v=0;v<n;++v)s.stroke();isNaN(l)||(f=o+(l%X||X))}b&&_u(s,t,f),r.selfJoin&&f-o>=j&&p===0&&d!=="miter"&&Su(s,t,f),n||(As(s,t,e,a,f,i),s.stroke())}class Po extends Ut{static id="arc";static defaults={borderAlign:"center",borderColor:"#fff",borderDash:[],borderDashOffset:0,borderJoinStyle:void 0,borderRadius:0,borderWidth:2,offset:0,spacing:0,angle:void 0,circular:!0,selfJoin:!1};static defaultRoutes={backgroundColor:"backgroundColor"};static descriptors={_scriptable:!0,_indexable:t=>t!=="borderDash"};circumference;endAngle;fullCircles;innerRadius;outerRadius;pixelMargin;startAngle;constructor(t){super(),this.options=void 0,this.circumference=void 0,this.startAngle=void 0,this.endAngle=void 0,this.innerRadius=void 0,this.outerRadius=void 0,this.pixelMargin=0,this.fullCircles=0,t&&Object.assign(this,t)}inRange(t,e,a){const i=this.getProps(["x","y"],a),{angle:n,distance:o}=Wn(i,{x:t,y:e}),{startAngle:l,endAngle:r,innerRadius:c,outerRadius:d,circumference:u}=this.getProps(["startAngle","endAngle","innerRadius","outerRadius","circumference"],a),h=(this.options.spacing+this.options.borderWidth)/2,p=I(u,r-l),b=Ge(n,l,r)&&l!==r,f=p>=X||b,v=jt(o,c+h,d+h);return f&&v}getCenterPoint(t){const{x:e,y:a,startAngle:i,endAngle:n,innerRadius:o,outerRadius:l}=this.getProps(["x","y","startAngle","endAngle","innerRadius","outerRadius"],t),{offset:r,spacing:c}=this.options,d=(i+n)/2,u=(o+l+c+r)/2;return{x:e+Math.cos(d)*u,y:a+Math.sin(d)*u}}tooltipPosition(t){return this.getCenterPoint(t)}draw(t){const{options:e,circumference:a}=this,i=(e.offset||0)/4,n=(e.spacing||0)/2,o=e.circular;if(this.pixelMargin=e.borderAlign==="inner"?.33:0,this.fullCircles=a>X?Math.floor(a/X):0,a===0||this.innerRadius<0||this.outerRadius<0)return;t.save();const l=(this.startAngle+this.endAngle)/2;t.translate(Math.cos(l)*i,Math.sin(l)*i);const r=1-Math.sin(Math.min(j,a||0)),c=i*r;t.fillStyle=e.backgroundColor,t.strokeStyle=e.borderColor,Pu(t,this,c,n,o),Au(t,this,c,n,o),t.restore()}}function Ao(s,t,e=t){s.lineCap=I(e.borderCapStyle,t.borderCapStyle),s.setLineDash(I(e.borderDash,t.borderDash)),s.lineDashOffset=I(e.borderDashOffset,t.borderDashOffset),s.lineJoin=I(e.borderJoinStyle,t.borderJoinStyle),s.lineWidth=I(e.borderWidth,t.borderWidth),s.strokeStyle=I(e.borderColor,t.borderColor)}function Du(s,t,e){s.lineTo(e.x,e.y)}function Tu(s){return s.stepped?Xr:s.tension||s.cubicInterpolationMode==="monotone"?qr:Du}function Do(s,t,e={}){const a=s.length,{start:i=0,end:n=a-1}=e,{start:o,end:l}=t,r=Math.max(i,o),c=Math.min(n,l),d=i<o&&n<o||i>l&&n>l;return{count:a,start:r,loop:t.loop,ilen:c<r&&!d?a+c-r:c-r}}function Lu(s,t,e,a){const{points:i,options:n}=t,{count:o,start:l,loop:r,ilen:c}=Do(i,e,a),d=Tu(n);let{move:u=!0,reverse:h}=a||{},p,b,f;for(p=0;p<=c;++p)b=i[(l+(h?c-p:p))%o],!b.skip&&(u?(s.moveTo(b.x,b.y),u=!1):d(s,f,b,h,n.stepped),f=b);return r&&(b=i[(l+(h?c:0))%o],d(s,f,b,h,n.stepped)),!!r}function Ou(s,t,e,a){const i=t.points,{count:n,start:o,ilen:l}=Do(i,e,a),{move:r=!0,reverse:c}=a||{};let d=0,u=0,h,p,b,f,v,x;const w=S=>(o+(c?l-S:S))%n,_=()=>{f!==v&&(s.lineTo(d,v),s.lineTo(d,f),s.lineTo(d,x))};for(r&&(p=i[w(0)],s.moveTo(p.x,p.y)),h=0;h<=l;++h){if(p=i[w(h)],p.skip)continue;const S=p.x,k=p.y,P=S|0;P===b?(k<f?f=k:k>v&&(v=k),d=(u*d+S)/++u):(_(),s.lineTo(S,k),b=P,u=0,f=v=k),x=k}_()}function ga(s){const t=s.options,e=t.borderDash&&t.borderDash.length;return!s._decimated&&!s._loop&&!t.tension&&t.cubicInterpolationMode!=="monotone"&&!t.stepped&&!e?Ou:Lu}function Eu(s){return s.stepped?Pc:s.tension||s.cubicInterpolationMode==="monotone"?Ac:ue}function Iu(s,t,e,a){let i=t._path;i||(i=t._path=new Path2D,t.path(i,e,a)&&i.closePath()),Ao(s,t.options),s.stroke(i)}function Ru(s,t,e,a){const{segments:i,options:n}=t,o=ga(t);for(const l of i)Ao(s,n,l.style),s.beginPath(),o(s,t,l,{start:e,end:e+a-1})&&s.closePath(),s.stroke()}const zu=typeof Path2D=="function";function Bu(s,t,e,a){zu&&!t.options.segment?Iu(s,t,e,a):Ru(s,t,e,a)}class Je extends Ut{static id="line";static defaults={borderCapStyle:"butt",borderDash:[],borderDashOffset:0,borderJoinStyle:"miter",borderWidth:3,capBezierPoints:!0,cubicInterpolationMode:"default",fill:!1,spanGaps:!1,stepped:!1,tension:0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};static descriptors={_scriptable:!0,_indexable:t=>t!=="borderDash"&&t!=="fill"};constructor(t){super(),this.animated=!0,this.options=void 0,this._chart=void 0,this._loop=void 0,this._fullLoop=void 0,this._path=void 0,this._points=void 0,this._segments=void 0,this._decimated=!1,this._pointsUpdated=!1,this._datasetIndex=void 0,t&&Object.assign(this,t)}updateControlPoints(t,e){const a=this.options;if((a.tension||a.cubicInterpolationMode==="monotone")&&!a.stepped&&!this._pointsUpdated){const i=a.spanGaps?this._loop:this._fullLoop;xc(this._points,a,t,i,e),this._pointsUpdated=!0}}set points(t){this._points=t,delete this._segments,delete this._path,this._pointsUpdated=!1}get points(){return this._points}get segments(){return this._segments||(this._segments=Ic(this,this.options.segment))}first(){const t=this.segments,e=this.points;return t.length&&e[t[0].start]}last(){const t=this.segments,e=this.points,a=t.length;return a&&e[t[a-1].end]}interpolate(t,e){const a=this.options,i=t[e],n=this.points,o=co(this,{property:e,start:i,end:i});if(!o.length)return;const l=[],r=Eu(a);let c,d;for(c=0,d=o.length;c<d;++c){const{start:u,end:h}=o[c],p=n[u],b=n[h];if(p===b){l.push(p);continue}const f=Math.abs((i-p[e])/(b[e]-p[e])),v=r(p,b,f,a.stepped);v[e]=t[e],l.push(v)}return l.length===1?l[0]:l}pathSegment(t,e,a){return ga(this)(t,this,e,a)}path(t,e,a){const i=this.segments,n=ga(this);let o=this._loop;e=e||0,a=a||this.points.length-e;for(const l of i)o&=n(t,this,l,{start:e,end:e+a-1});return!!o}draw(t,e,a,i){const n=this.options||{};(this.points||[]).length&&n.borderWidth&&(t.save(),Bu(t,this,a,i),t.restore()),this.animated&&(this._pointsUpdated=!1,this._path=void 0)}}function tn(s,t,e,a){const i=s.options,{[e]:n}=s.getProps([e],a);return Math.abs(t-n)<i.radius+i.hitRadius}class To extends Ut{static id="point";parsed;skip;stop;static defaults={borderWidth:1,hitRadius:1,hoverBorderWidth:1,hoverRadius:4,pointStyle:"circle",radius:3,rotation:0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};constructor(t){super(),this.options=void 0,this.parsed=void 0,this.skip=void 0,this.stop=void 0,t&&Object.assign(this,t)}inRange(t,e,a){const i=this.options,{x:n,y:o}=this.getProps(["x","y"],a);return Math.pow(t-n,2)+Math.pow(e-o,2)<Math.pow(i.hitRadius+i.radius,2)}inXRange(t,e){return tn(this,t,"x",e)}inYRange(t,e){return tn(this,t,"y",e)}getCenterPoint(t){const{x:e,y:a}=this.getProps(["x","y"],t);return{x:e,y:a}}size(t){t=t||this.options||{};let e=t.radius||0;e=Math.max(e,e&&t.hoverRadius||0);const a=e&&t.borderWidth||0;return(e+a)*2}draw(t,e){const a=this.options;this.skip||a.radius<.1||!Wt(this,e,this.size(a)/2)||(t.strokeStyle=a.borderColor,t.lineWidth=a.borderWidth,t.fillStyle=a.backgroundColor,pa(t,a,this.x,this.y))}getRange(){const t=this.options||{};return t.radius+t.hitRadius}}function Lo(s,t){const{x:e,y:a,base:i,width:n,height:o}=s.getProps(["x","y","base","width","height"],t);let l,r,c,d,u;return s.horizontal?(u=o/2,l=Math.min(e,i),r=Math.max(e,i),c=a-u,d=a+u):(u=n/2,l=e-u,r=e+u,c=Math.min(a,i),d=Math.max(a,i)),{left:l,top:c,right:r,bottom:d}}function Zt(s,t,e,a){return s?0:ct(t,e,a)}function Fu(s,t,e){const a=s.options.borderWidth,i=s.borderSkipped,n=Qn(a);return{t:Zt(i.top,n.top,0,e),r:Zt(i.right,n.right,0,t),b:Zt(i.bottom,n.bottom,0,e),l:Zt(i.left,n.left,0,t)}}function Vu(s,t,e){const{enableBorderRadius:a}=s.getProps(["enableBorderRadius"]),i=s.options.borderRadius,n=he(i),o=Math.min(t,e),l=s.borderSkipped,r=a||V(i);return{topLeft:Zt(!r||l.top||l.left,n.topLeft,0,o),topRight:Zt(!r||l.top||l.right,n.topRight,0,o),bottomLeft:Zt(!r||l.bottom||l.left,n.bottomLeft,0,o),bottomRight:Zt(!r||l.bottom||l.right,n.bottomRight,0,o)}}function Hu(s){const t=Lo(s),e=t.right-t.left,a=t.bottom-t.top,i=Fu(s,e/2,a/2),n=Vu(s,e/2,a/2);return{outer:{x:t.left,y:t.top,w:e,h:a,radius:n},inner:{x:t.left+i.l,y:t.top+i.t,w:e-i.l-i.r,h:a-i.t-i.b,radius:{topLeft:Math.max(0,n.topLeft-Math.max(i.t,i.l)),topRight:Math.max(0,n.topRight-Math.max(i.t,i.r)),bottomLeft:Math.max(0,n.bottomLeft-Math.max(i.b,i.l)),bottomRight:Math.max(0,n.bottomRight-Math.max(i.b,i.r))}}}}function ia(s,t,e,a){const i=t===null,n=e===null,l=s&&!(i&&n)&&Lo(s,a);return l&&(i||jt(t,l.left,l.right))&&(n||jt(e,l.top,l.bottom))}function ju(s){return s.topLeft||s.topRight||s.bottomLeft||s.bottomRight}function Nu(s,t){s.rect(t.x,t.y,t.w,t.h)}function na(s,t,e={}){const a=s.x!==e.x?-t:0,i=s.y!==e.y?-t:0,n=(s.x+s.w!==e.x+e.w?t:0)-a,o=(s.y+s.h!==e.y+e.h?t:0)-i;return{x:s.x+a,y:s.y+i,w:s.w+n,h:s.h+o,radius:s.radius}}class Oo extends Ut{static id="bar";static defaults={borderSkipped:"start",borderWidth:0,borderRadius:0,inflateAmount:"auto",pointStyle:void 0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};constructor(t){super(),this.options=void 0,this.horizontal=void 0,this.base=void 0,this.width=void 0,this.height=void 0,this.inflateAmount=void 0,t&&Object.assign(this,t)}draw(t){const{inflateAmount:e,options:{borderColor:a,backgroundColor:i}}=this,{inner:n,outer:o}=Hu(this),l=ju(o.radius)?Xe:Nu;t.save(),(o.w!==n.w||o.h!==n.h)&&(t.beginPath(),l(t,na(o,e,n)),t.clip(),l(t,na(n,-e,o)),t.fillStyle=a,t.fill("evenodd")),t.beginPath(),l(t,na(n,e)),t.fillStyle=i,t.fill(),t.restore()}inRange(t,e,a){return ia(this,t,e,a)}inXRange(t,e){return ia(this,t,null,e)}inYRange(t,e){return ia(this,null,t,e)}getCenterPoint(t){const{x:e,y:a,base:i,horizontal:n}=this.getProps(["x","y","base","horizontal"],t);return{x:n?(e+i)/2:e,y:n?a:(a+i)/2}}getRange(t){return t==="x"?this.width/2:this.height/2}}var Wu=Object.freeze({__proto__:null,ArcElement:Po,BarElement:Oo,LineElement:Je,PointElement:To});const va=["rgb(54, 162, 235)","rgb(255, 99, 132)","rgb(255, 159, 64)","rgb(255, 205, 86)","rgb(75, 192, 192)","rgb(153, 102, 255)","rgb(201, 203, 207)"],en=va.map(s=>s.replace("rgb(","rgba(").replace(")",", 0.5)"));function Eo(s){return va[s%va.length]}function Io(s){return en[s%en.length]}function Uu(s,t){return s.borderColor=Eo(t),s.backgroundColor=Io(t),++t}function $u(s,t){return s.backgroundColor=s.data.map(()=>Eo(t++)),t}function Yu(s,t){return s.backgroundColor=s.data.map(()=>Io(t++)),t}function Gu(s){let t=0;return(e,a)=>{const i=s.getDatasetMeta(a).controller;i instanceof Rs?t=$u(e,t):i instanceof vo?t=Yu(e,t):i&&(t=Uu(e,t))}}function sn(s){let t;for(t in s)if(s[t].borderColor||s[t].backgroundColor)return!0;return!1}function Xu(s){return s&&(s.borderColor||s.backgroundColor)}function qu(){return K.borderColor!=="rgba(0,0,0,0.1)"||K.backgroundColor!=="rgba(0,0,0,0.1)"}var Ku={id:"colors",defaults:{enabled:!0,forceOverride:!1},beforeLayout(s,t,e){if(!e.enabled)return;const{data:{datasets:a},options:i}=s.config,{elements:n}=i,o=sn(a)||Xu(i)||n&&sn(n)||qu();if(!e.forceOverride&&o)return;const l=Gu(s);a.forEach(l)}};function Zu(s,t,e,a,i){const n=i.samples||a;if(n>=e)return s.slice(t,t+e);const o=[],l=(e-2)/(n-2);let r=0;const c=t+e-1;let d=t,u,h,p,b,f;for(o[r++]=s[d],u=0;u<n-2;u++){let v=0,x=0,w;const _=Math.floor((u+1)*l)+1+t,S=Math.min(Math.floor((u+2)*l)+1,e)+t,k=S-_;for(w=_;w<S;w++)v+=s[w].x,x+=s[w].y;v/=k,x/=k;const P=Math.floor(u*l)+1+t,T=Math.min(Math.floor((u+1)*l)+1,e)+t,{x:M,y:O}=s[d];for(p=b=-1,w=P;w<T;w++)b=.5*Math.abs((M-v)*(s[w].y-O)-(M-s[w].x)*(x-O)),b>p&&(p=b,h=s[w],f=w);o[r++]=h,d=f}return o[r++]=s[c],o}function Qu(s,t,e,a){let i=0,n=0,o,l,r,c,d,u,h,p,b,f;const v=[],x=t+e-1,w=s[t].x,S=s[x].x-w;for(o=t;o<t+e;++o){l=s[o],r=(l.x-w)/S*a,c=l.y;const k=r|0;if(k===d)c<b?(b=c,u=o):c>f&&(f=c,h=o),i=(n*i+l.x)/++n;else{const P=o-1;if(!B(u)&&!B(h)){const T=Math.min(u,h),M=Math.max(u,h);T!==p&&T!==P&&v.push({...s[T],x:i}),M!==p&&M!==P&&v.push({...s[M],x:i})}o>0&&P!==p&&v.push(s[P]),v.push(l),d=k,n=0,b=f=c,u=h=p=o}}return v}function Ro(s){if(s._decimated){const t=s._data;delete s._decimated,delete s._data,Object.defineProperty(s,"data",{configurable:!0,enumerable:!0,writable:!0,value:t})}}function an(s){s.data.datasets.forEach(t=>{Ro(t)})}function Ju(s,t){const e=t.length;let a=0,i;const{iScale:n}=s,{min:o,max:l,minDefined:r,maxDefined:c}=n.getUserBounds();return r&&(a=ct(Nt(t,n.axis,o).lo,0,e-1)),c?i=ct(Nt(t,n.axis,l).hi+1,a,e)-a:i=e-a,{start:a,count:i}}var th={id:"decimation",defaults:{algorithm:"min-max",enabled:!1},beforeElementsUpdate:(s,t,e)=>{if(!e.enabled){an(s);return}const a=s.width;s.data.datasets.forEach((i,n)=>{const{_data:o,indexAxis:l}=i,r=s.getDatasetMeta(n),c=o||i.data;if(Ie([l,s.options.indexAxis])==="y"||!r.controller.supportsDecimation)return;const d=s.scales[r.xAxisID];if(d.type!=="linear"&&d.type!=="time"||s.options.parsing)return;let{start:u,count:h}=Ju(r,c);const p=e.threshold||4*a;if(h<=p){Ro(i);return}B(o)&&(i._data=c,delete i.data,Object.defineProperty(i,"data",{configurable:!0,enumerable:!0,get:function(){return this._decimated},set:function(f){this._data=f}}));let b;switch(e.algorithm){case"lttb":b=Zu(c,u,h,a,e);break;case"min-max":b=Qu(c,u,h,a);break;default:throw new Error(`Unsupported decimation algorithm '${e.algorithm}'`)}i._decimated=b})},destroy(s){an(s)}};function eh(s,t,e){const a=s.segments,i=s.points,n=t.points,o=[];for(const l of a){let{start:r,end:c}=l;c=Bs(r,c,i);const d=ma(e,i[r],i[c],l.loop);if(!t.segments){o.push({source:l,target:d,start:i[r],end:i[c]});continue}const u=co(t,d);for(const h of u){const p=ma(e,n[h.start],n[h.end],h.loop),b=ro(l,i,p);for(const f of b)o.push({source:f,target:h,start:{[e]:nn(d,p,"start",Math.max)},end:{[e]:nn(d,p,"end",Math.min)}})}}return o}function ma(s,t,e,a){if(a)return;let i=t[s],n=e[s];return s==="angle"&&(i=bt(i),n=bt(n)),{property:s,start:i,end:n}}function sh(s,t){const{x:e=null,y:a=null}=s||{},i=t.points,n=[];return t.segments.forEach(({start:o,end:l})=>{l=Bs(o,l,i);const r=i[o],c=i[l];a!==null?(n.push({x:r.x,y:a}),n.push({x:c.x,y:a})):e!==null&&(n.push({x:e,y:r.y}),n.push({x:e,y:c.y}))}),n}function Bs(s,t,e){for(;t>s;t--){const a=e[t];if(!isNaN(a.x)&&!isNaN(a.y))break}return t}function nn(s,t,e,a){return s&&t?a(s[e],t[e]):s?s[e]:t?t[e]:0}function zo(s,t){let e=[],a=!1;return q(s)?(a=!0,e=s):e=sh(s,t),e.length?new Je({points:e,options:{tension:0},_loop:a,_fullLoop:a}):null}function on(s){return s&&s.fill!==!1}function ah(s,t,e){let i=s[t].fill;const n=[t];let o;if(!e)return i;for(;i!==!1&&n.indexOf(i)===-1;){if(!tt(i))return i;if(o=s[i],!o)return!1;if(o.visible)return i;n.push(i),i=o.fill}return!1}function ih(s,t,e){const a=rh(s);if(V(a))return isNaN(a.value)?!1:a;let i=parseFloat(a);return tt(i)&&Math.floor(i)===i?nh(a[0],t,i,e):["origin","start","end","stack","shape"].indexOf(a)>=0&&a}function nh(s,t,e,a){return(s==="-"||s==="+")&&(e=t+e),e===t||e<0||e>=a?!1:e}function oh(s,t){let e=null;return s==="start"?e=t.bottom:s==="end"?e=t.top:V(s)?e=t.getPixelForValue(s.value):t.getBasePixel&&(e=t.getBasePixel()),e}function lh(s,t,e){let a;return s==="start"?a=e:s==="end"?a=t.options.reverse?t.min:t.max:V(s)?a=s.value:a=t.getBaseValue(),a}function rh(s){const t=s.options,e=t.fill;let a=I(e&&e.target,e);return a===void 0&&(a=!!t.backgroundColor),a===!1||a===null?!1:a===!0?"origin":a}function ch(s){const{scale:t,index:e,line:a}=s,i=[],n=a.segments,o=a.points,l=dh(t,e);l.push(zo({x:null,y:t.bottom},a));for(let r=0;r<n.length;r++){const c=n[r];for(let d=c.start;d<=c.end;d++)uh(i,o[d],l)}return new Je({points:i,options:{}})}function dh(s,t){const e=[],a=s.getMatchingVisibleMetas("line");for(let i=0;i<a.length;i++){const n=a[i];if(n.index===t)break;n.hidden||e.unshift(n.dataset)}return e}function uh(s,t,e){const a=[];for(let i=0;i<e.length;i++){const n=e[i],{first:o,last:l,point:r}=hh(n,t,"x");if(!(!r||o&&l)){if(o)a.unshift(r);else if(s.push(r),!l)break}}s.push(...a)}function hh(s,t,e){const a=s.interpolate(t,e);if(!a)return{};const i=a[e],n=s.segments,o=s.points;let l=!1,r=!1;for(let c=0;c<n.length;c++){const d=n[c],u=o[d.start][e],h=o[d.end][e];if(jt(i,u,h)){l=i===u,r=i===h;break}}return{first:l,last:r,point:a}}class Bo{constructor(t){this.x=t.x,this.y=t.y,this.radius=t.radius}pathSegment(t,e,a){const{x:i,y:n,radius:o}=this;return e=e||{start:0,end:X},t.arc(i,n,o,e.end,e.start,!0),!a.bounds}interpolate(t){const{x:e,y:a,radius:i}=this,n=t.angle;return{x:e+Math.cos(n)*i,y:a+Math.sin(n)*i,angle:n}}}function ph(s){const{chart:t,fill:e,line:a}=s;if(tt(e))return fh(t,e);if(e==="stack")return ch(s);if(e==="shape")return!0;const i=bh(s);return i instanceof Bo?i:zo(i,a)}function fh(s,t){const e=s.getDatasetMeta(t);return e&&s.isDatasetVisible(t)?e.dataset:null}function bh(s){return(s.scale||{}).getPointPositionForValue?vh(s):gh(s)}function gh(s){const{scale:t={},fill:e}=s,a=oh(e,t);if(tt(a)){const i=t.isHorizontal();return{x:i?a:null,y:i?null:a}}return null}function vh(s){const{scale:t,fill:e}=s,a=t.options,i=t.getLabels().length,n=a.reverse?t.max:t.min,o=lh(e,t,n),l=[];if(a.grid.circular){const r=t.getPointPositionForValue(0,n);return new Bo({x:r.x,y:r.y,radius:t.getDistanceFromCenterForValue(o)})}for(let r=0;r<i;++r)l.push(t.getPointPositionForValue(r,o));return l}function oa(s,t,e){const a=ph(t),{chart:i,index:n,line:o,scale:l,axis:r}=t,c=o.options,d=c.fill,u=c.backgroundColor,{above:h=u,below:p=u}=d||{},b=i.getDatasetMeta(n),f=uo(i,b);a&&o.points.length&&(Os(s,e),mh(s,{line:o,target:a,above:h,below:p,area:e,scale:l,axis:r,clip:f}),Es(s))}function mh(s,t){const{line:e,target:a,above:i,below:n,area:o,scale:l,clip:r}=t,c=e._loop?"angle":t.axis;s.save();let d=n;n!==i&&(c==="x"?(ln(s,a,o.top),la(s,{line:e,target:a,color:i,scale:l,property:c,clip:r}),s.restore(),s.save(),ln(s,a,o.bottom)):c==="y"&&(rn(s,a,o.left),la(s,{line:e,target:a,color:n,scale:l,property:c,clip:r}),s.restore(),s.save(),rn(s,a,o.right),d=i)),la(s,{line:e,target:a,color:d,scale:l,property:c,clip:r}),s.restore()}function ln(s,t,e){const{segments:a,points:i}=t;let n=!0,o=!1;s.beginPath();for(const l of a){const{start:r,end:c}=l,d=i[r],u=i[Bs(r,c,i)];n?(s.moveTo(d.x,d.y),n=!1):(s.lineTo(d.x,e),s.lineTo(d.x,d.y)),o=!!t.pathSegment(s,l,{move:o}),o?s.closePath():s.lineTo(u.x,e)}s.lineTo(t.first().x,e),s.closePath(),s.clip()}function rn(s,t,e){const{segments:a,points:i}=t;let n=!0,o=!1;s.beginPath();for(const l of a){const{start:r,end:c}=l,d=i[r],u=i[Bs(r,c,i)];n?(s.moveTo(d.x,d.y),n=!1):(s.lineTo(e,d.y),s.lineTo(d.x,d.y)),o=!!t.pathSegment(s,l,{move:o}),o?s.closePath():s.lineTo(e,u.y)}s.lineTo(e,t.first().y),s.closePath(),s.clip()}function la(s,t){const{line:e,target:a,property:i,color:n,scale:o,clip:l}=t,r=eh(e,a,i);for(const{source:c,target:d,start:u,end:h}of r){const{style:{backgroundColor:p=n}={}}=c,b=a!==!0;s.save(),s.fillStyle=p,xh(s,o,l,b&&ma(i,u,h)),s.beginPath();const f=!!e.pathSegment(s,c);let v;if(b){f?s.closePath():cn(s,a,h,i);const x=!!a.pathSegment(s,d,{move:f,reverse:!0});v=f&&x,v||cn(s,a,u,i)}s.closePath(),s.fill(v?"evenodd":"nonzero"),s.restore()}}function xh(s,t,e,a){const i=t.chart.chartArea,{property:n,start:o,end:l}=a||{};if(n==="x"||n==="y"){let r,c,d,u;n==="x"?(r=o,c=i.top,d=l,u=i.bottom):(r=i.left,c=o,d=i.right,u=l),s.beginPath(),e&&(r=Math.max(r,e.left),d=Math.min(d,e.right),c=Math.max(c,e.top),u=Math.min(u,e.bottom)),s.rect(r,c,d-r,u-c),s.clip()}}function cn(s,t,e,a){const i=t.interpolate(e,a);i&&s.lineTo(i.x,i.y)}var Fo={id:"filler",afterDatasetsUpdate(s,t,e){const a=(s.data.datasets||[]).length,i=[];let n,o,l,r;for(o=0;o<a;++o)n=s.getDatasetMeta(o),l=n.dataset,r=null,l&&l.options&&l instanceof Je&&(r={visible:s.isDatasetVisible(o),index:o,fill:ih(l,o,a),chart:s,axis:n.controller.options.indexAxis,scale:n.vScale,line:l}),n.$filler=r,i.push(r);for(o=0;o<a;++o)r=i[o],!(!r||r.fill===!1)&&(r.fill=ah(i,o,e.propagate))},beforeDraw(s,t,e){const a=e.drawTime==="beforeDraw",i=s.getSortedVisibleDatasetMetas(),n=s.chartArea;for(let o=i.length-1;o>=0;--o){const l=i[o].$filler;l&&(l.line.updateControlPoints(n,l.axis),a&&l.fill&&oa(s.ctx,l,n))}},beforeDatasetsDraw(s,t,e){if(e.drawTime!=="beforeDatasetsDraw")return;const a=s.getSortedVisibleDatasetMetas();for(let i=a.length-1;i>=0;--i){const n=a[i].$filler;on(n)&&oa(s.ctx,n,s.chartArea)}},beforeDatasetDraw(s,t,e){const a=t.meta.$filler;!on(a)||e.drawTime!=="beforeDatasetDraw"||oa(s.ctx,a,s.chartArea)},defaults:{propagate:!0,drawTime:"beforeDatasetDraw"}};const dn=(s,t)=>{let{boxHeight:e=t,boxWidth:a=t}=s;return s.usePointStyle&&(e=Math.min(e,t),a=s.pointStyleWidth||Math.min(a,t)),{boxWidth:a,boxHeight:e,itemHeight:Math.max(t,e)}},yh=(s,t)=>s!==null&&t!==null&&s.datasetIndex===t.datasetIndex&&s.index===t.index;class un extends Ut{constructor(t){super(),this._added=!1,this.legendHitBoxes=[],this._hoveredItem=null,this.doughnutMode=!1,this.chart=t.chart,this.options=t.options,this.ctx=t.ctx,this.legendItems=void 0,this.columnSizes=void 0,this.lineWidths=void 0,this.maxHeight=void 0,this.maxWidth=void 0,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.height=void 0,this.width=void 0,this._margins=void 0,this.position=void 0,this.weight=void 0,this.fullSize=void 0}update(t,e,a){this.maxWidth=t,this.maxHeight=e,this._margins=a,this.setDimensions(),this.buildLabels(),this.fit()}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=this._margins.left,this.right=this.width):(this.height=this.maxHeight,this.top=this._margins.top,this.bottom=this.height)}buildLabels(){const t=this.options.labels||{};let e=G(t.generateLabels,[this.chart],this)||[];t.filter&&(e=e.filter(a=>t.filter(a,this.chart.data))),t.sort&&(e=e.sort((a,i)=>t.sort(a,i,this.chart.data))),this.options.reverse&&e.reverse(),this.legendItems=e}fit(){const{options:t,ctx:e}=this;if(!t.display){this.width=this.height=0;return}const a=t.labels,i=lt(a.font),n=i.size,o=this._computeTitleHeight(),{boxWidth:l,itemHeight:r}=dn(a,n);let c,d;e.font=i.string,this.isHorizontal()?(c=this.maxWidth,d=this._fitRows(o,n,l,r)+10):(d=this.maxHeight,c=this._fitCols(o,i,l,r)+10),this.width=Math.min(c,t.maxWidth||this.maxWidth),this.height=Math.min(d,t.maxHeight||this.maxHeight)}_fitRows(t,e,a,i){const{ctx:n,maxWidth:o,options:{labels:{padding:l}}}=this,r=this.legendHitBoxes=[],c=this.lineWidths=[0],d=i+l;let u=t;n.textAlign="left",n.textBaseline="middle";let h=-1,p=-d;return this.legendItems.forEach((b,f)=>{const v=a+e/2+n.measureText(b.text).width;(f===0||c[c.length-1]+v+2*l>o)&&(u+=d,c[c.length-(f>0?0:1)]=0,p+=d,h++),r[f]={left:0,top:p,row:h,width:v,height:i},c[c.length-1]+=v+l}),u}_fitCols(t,e,a,i){const{ctx:n,maxHeight:o,options:{labels:{padding:l}}}=this,r=this.legendHitBoxes=[],c=this.columnSizes=[],d=o-t;let u=l,h=0,p=0,b=0,f=0;return this.legendItems.forEach((v,x)=>{const{itemWidth:w,itemHeight:_}=wh(a,e,n,v,i);x>0&&p+_+2*l>d&&(u+=h+l,c.push({width:h,height:p}),b+=h+l,f++,h=p=0),r[x]={left:b,top:p,col:f,width:w,height:_},h=Math.max(h,w),p+=_+l}),u+=h,c.push({width:h,height:p}),u}adjustHitBoxes(){if(!this.options.display)return;const t=this._computeTitleHeight(),{legendHitBoxes:e,options:{align:a,labels:{padding:i},rtl:n}}=this,o=we(n,this.left,this.width);if(this.isHorizontal()){let l=0,r=ft(a,this.left+i,this.right-this.lineWidths[l]);for(const c of e)l!==c.row&&(l=c.row,r=ft(a,this.left+i,this.right-this.lineWidths[l])),c.top+=this.top+t+i,c.left=o.leftForLtr(o.x(r),c.width),r+=c.width+i}else{let l=0,r=ft(a,this.top+t+i,this.bottom-this.columnSizes[l].height);for(const c of e)c.col!==l&&(l=c.col,r=ft(a,this.top+t+i,this.bottom-this.columnSizes[l].height)),c.top=r,c.left+=this.left+i,c.left=o.leftForLtr(o.x(c.left),c.width),r+=c.height+i}}isHorizontal(){return this.options.position==="top"||this.options.position==="bottom"}draw(){if(this.options.display){const t=this.ctx;Os(t,this),this._draw(),Es(t)}}_draw(){const{options:t,columnSizes:e,lineWidths:a,ctx:i}=this,{align:n,labels:o}=t,l=K.color,r=we(t.rtl,this.left,this.width),c=lt(o.font),{padding:d}=o,u=c.size,h=u/2;let p;this.drawTitle(),i.textAlign=r.textAlign("left"),i.textBaseline="middle",i.lineWidth=.5,i.font=c.string;const{boxWidth:b,boxHeight:f,itemHeight:v}=dn(o,u),x=function(P,T,M){if(isNaN(b)||b<=0||isNaN(f)||f<0)return;i.save();const O=I(M.lineWidth,1);if(i.fillStyle=I(M.fillStyle,l),i.lineCap=I(M.lineCap,"butt"),i.lineDashOffset=I(M.lineDashOffset,0),i.lineJoin=I(M.lineJoin,"miter"),i.lineWidth=O,i.strokeStyle=I(M.strokeStyle,l),i.setLineDash(I(M.lineDash,[])),o.usePointStyle){const R={radius:f*Math.SQRT2/2,pointStyle:M.pointStyle,rotation:M.rotation,borderWidth:O},z=r.xPlus(P,b/2),F=T+h;Zn(i,R,z,F,o.pointStyleWidth&&b)}else{const R=T+Math.max((u-f)/2,0),z=r.leftForLtr(P,b),F=he(M.borderRadius);i.beginPath(),Object.values(F).some(it=>it!==0)?Xe(i,{x:z,y:R,w:b,h:f,radius:F}):i.rect(z,R,b,f),i.fill(),O!==0&&i.stroke()}i.restore()},w=function(P,T,M){be(i,M.text,P,T+v/2,c,{strikethrough:M.hidden,textAlign:r.textAlign(M.textAlign)})},_=this.isHorizontal(),S=this._computeTitleHeight();_?p={x:ft(n,this.left+d,this.right-a[0]),y:this.top+d+S,line:0}:p={x:this.left+d,y:ft(n,this.top+S+d,this.bottom-e[0].height),line:0},no(this.ctx,t.textDirection);const k=v+d;this.legendItems.forEach((P,T)=>{i.strokeStyle=P.fontColor,i.fillStyle=P.fontColor;const M=i.measureText(P.text).width,O=r.textAlign(P.textAlign||(P.textAlign=o.textAlign)),R=b+h+M;let z=p.x,F=p.y;r.setWidth(this.width),_?T>0&&z+R+d>this.right&&(F=p.y+=k,p.line++,z=p.x=ft(n,this.left+d,this.right-a[p.line])):T>0&&F+k>this.bottom&&(z=p.x=z+e[p.line].width+d,p.line++,F=p.y=ft(n,this.top+S+d,this.bottom-e[p.line].height));const it=r.x(z);if(x(it,F,P),z=Br(O,z+b+h,_?z+R:this.right,t.rtl),w(r.x(z),F,P),_)p.x+=R+d;else if(typeof P.text!="string"){const ut=c.lineHeight;p.y+=Vo(P,ut)+d}else p.y+=k}),oo(this.ctx,t.textDirection)}drawTitle(){const t=this.options,e=t.title,a=lt(e.font),i=mt(e.padding);if(!e.display)return;const n=we(t.rtl,this.left,this.width),o=this.ctx,l=e.position,r=a.size/2,c=i.top+r;let d,u=this.left,h=this.width;if(this.isHorizontal())h=Math.max(...this.lineWidths),d=this.top+c,u=ft(t.align,u,this.right-h);else{const b=this.columnSizes.reduce((f,v)=>Math.max(f,v.height),0);d=c+ft(t.align,this.top,this.bottom-b-t.labels.padding-this._computeTitleHeight())}const p=ft(l,u,u+h);o.textAlign=n.textAlign(Ta(l)),o.textBaseline="middle",o.strokeStyle=e.color,o.fillStyle=e.color,o.font=a.string,be(o,e.text,p,d,a)}_computeTitleHeight(){const t=this.options.title,e=lt(t.font),a=mt(t.padding);return t.display?e.lineHeight+a.height:0}_getLegendItemAt(t,e){let a,i,n;if(jt(t,this.left,this.right)&&jt(e,this.top,this.bottom)){for(n=this.legendHitBoxes,a=0;a<n.length;++a)if(i=n[a],jt(t,i.left,i.left+i.width)&&jt(e,i.top,i.top+i.height))return this.legendItems[a]}return null}handleEvent(t){const e=this.options;if(!_h(t.type,e))return;const a=this._getLegendItemAt(t.x,t.y);if(t.type==="mousemove"||t.type==="mouseout"){const i=this._hoveredItem,n=yh(i,a);i&&!n&&G(e.onLeave,[t,i,this],this),this._hoveredItem=a,a&&!n&&G(e.onHover,[t,a,this],this)}else a&&G(e.onClick,[t,a,this],this)}}function wh(s,t,e,a,i){const n=kh(a,s,t,e),o=Sh(i,a,t.lineHeight);return{itemWidth:n,itemHeight:o}}function kh(s,t,e,a){let i=s.text;return i&&typeof i!="string"&&(i=i.reduce((n,o)=>n.length>o.length?n:o)),t+e.size/2+a.measureText(i).width}function Sh(s,t,e){let a=s;return typeof t.text!="string"&&(a=Vo(t,e)),a}function Vo(s,t){const e=s.text?s.text.length:0;return t*e}function _h(s,t){return!!((s==="mousemove"||s==="mouseout")&&(t.onHover||t.onLeave)||t.onClick&&(s==="click"||s==="mouseup"))}var Ho={id:"legend",_element:un,start(s,t,e){const a=s.legend=new un({ctx:s.ctx,options:e,chart:s});gt.configure(s,a,e),gt.addBox(s,a)},stop(s){gt.removeBox(s,s.legend),delete s.legend},beforeUpdate(s,t,e){const a=s.legend;gt.configure(s,a,e),a.options=e},afterUpdate(s){const t=s.legend;t.buildLabels(),t.adjustHitBoxes()},afterEvent(s,t){t.replay||s.legend.handleEvent(t.event)},defaults:{display:!0,position:"top",align:"center",fullSize:!0,reverse:!1,weight:1e3,onClick(s,t,e){const a=t.datasetIndex,i=e.chart;i.isDatasetVisible(a)?(i.hide(a),t.hidden=!0):(i.show(a),t.hidden=!1)},onHover:null,onLeave:null,labels:{color:s=>s.chart.options.color,boxWidth:40,padding:10,generateLabels(s){const t=s.data.datasets,{labels:{usePointStyle:e,pointStyle:a,textAlign:i,color:n,useBorderRadius:o,borderRadius:l}}=s.legend.options;return s._getSortedDatasetMetas().map(r=>{const c=r.controller.getStyle(e?0:void 0),d=mt(c.borderWidth);return{text:t[r.index].label,fillStyle:c.backgroundColor,fontColor:n,hidden:!r.visible,lineCap:c.borderCapStyle,lineDash:c.borderDash,lineDashOffset:c.borderDashOffset,lineJoin:c.borderJoinStyle,lineWidth:(d.width+d.height)/4,strokeStyle:c.borderColor,pointStyle:a||c.pointStyle,rotation:c.rotation,textAlign:i||c.textAlign,borderRadius:o&&(l||c.borderRadius),datasetIndex:r.index}},this)}},title:{color:s=>s.chart.options.color,display:!1,position:"center",text:""}},descriptors:{_scriptable:s=>!s.startsWith("on"),labels:{_scriptable:s=>!["generateLabels","filter","sort"].includes(s)}}};class Va extends Ut{constructor(t){super(),this.chart=t.chart,this.options=t.options,this.ctx=t.ctx,this._padding=void 0,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.width=void 0,this.height=void 0,this.position=void 0,this.weight=void 0,this.fullSize=void 0}update(t,e){const a=this.options;if(this.left=0,this.top=0,!a.display){this.width=this.height=this.right=this.bottom=0;return}this.width=this.right=t,this.height=this.bottom=e;const i=q(a.text)?a.text.length:1;this._padding=mt(a.padding);const n=i*lt(a.font).lineHeight+this._padding.height;this.isHorizontal()?this.height=n:this.width=n}isHorizontal(){const t=this.options.position;return t==="top"||t==="bottom"}_drawArgs(t){const{top:e,left:a,bottom:i,right:n,options:o}=this,l=o.align;let r=0,c,d,u;return this.isHorizontal()?(d=ft(l,a,n),u=e+t,c=n-a):(o.position==="left"?(d=a+t,u=ft(l,i,e),r=j*-.5):(d=n-t,u=ft(l,e,i),r=j*.5),c=i-e),{titleX:d,titleY:u,maxWidth:c,rotation:r}}draw(){const t=this.ctx,e=this.options;if(!e.display)return;const a=lt(e.font),n=a.lineHeight/2+this._padding.top,{titleX:o,titleY:l,maxWidth:r,rotation:c}=this._drawArgs(n);be(t,e.text,0,0,a,{color:e.color,maxWidth:r,rotation:c,textAlign:Ta(e.align),textBaseline:"middle",translation:[o,l]})}}function Ch(s,t){const e=new Va({ctx:s.ctx,options:t,chart:s});gt.configure(s,e,t),gt.addBox(s,e),s.titleBlock=e}var Mh={id:"title",_element:Va,start(s,t,e){Ch(s,e)},stop(s){const t=s.titleBlock;gt.removeBox(s,t),delete s.titleBlock},beforeUpdate(s,t,e){const a=s.titleBlock;gt.configure(s,a,e),a.options=e},defaults:{align:"center",display:!1,font:{weight:"bold"},fullSize:!0,padding:10,position:"top",text:"",weight:2e3},defaultRoutes:{color:"color"},descriptors:{_scriptable:!0,_indexable:!1}};const ps=new WeakMap;var Ph={id:"subtitle",start(s,t,e){const a=new Va({ctx:s.ctx,options:e,chart:s});gt.configure(s,a,e),gt.addBox(s,a),ps.set(s,a)},stop(s){gt.removeBox(s,ps.get(s)),ps.delete(s)},beforeUpdate(s,t,e){const a=ps.get(s);gt.configure(s,a,e),a.options=e},defaults:{align:"center",display:!1,font:{weight:"normal"},fullSize:!0,padding:0,position:"top",text:"",weight:1500},defaultRoutes:{color:"color"},descriptors:{_scriptable:!0,_indexable:!1}};const ze={average(s){if(!s.length)return!1;let t,e,a=new Set,i=0,n=0;for(t=0,e=s.length;t<e;++t){const l=s[t].element;if(l&&l.hasValue()){const r=l.tooltipPosition();a.add(r.x),i+=r.y,++n}}return n===0||a.size===0?!1:{x:[...a].reduce((l,r)=>l+r)/a.size,y:i/n}},nearest(s,t){if(!s.length)return!1;let e=t.x,a=t.y,i=Number.POSITIVE_INFINITY,n,o,l;for(n=0,o=s.length;n<o;++n){const r=s[n].element;if(r&&r.hasValue()){const c=r.getCenterPoint(),d=ua(t,c);d<i&&(i=d,l=r)}}if(l){const r=l.tooltipPosition();e=r.x,a=r.y}return{x:e,y:a}}};function Tt(s,t){return t&&(q(t)?Array.prototype.push.apply(s,t):s.push(t)),s}function Ft(s){return(typeof s=="string"||s instanceof String)&&s.indexOf(`
`)>-1?s.split(`
`):s}function Ah(s,t){const{element:e,datasetIndex:a,index:i}=t,n=s.getDatasetMeta(a).controller,{label:o,value:l}=n.getLabelAndValue(i);return{chart:s,label:o,parsed:n.getParsed(i),raw:s.data.datasets[a].data[i],formattedValue:l,dataset:n.getDataset(),dataIndex:i,datasetIndex:a,element:e}}function hn(s,t){const e=s.chart.ctx,{body:a,footer:i,title:n}=s,{boxWidth:o,boxHeight:l}=t,r=lt(t.bodyFont),c=lt(t.titleFont),d=lt(t.footerFont),u=n.length,h=i.length,p=a.length,b=mt(t.padding);let f=b.height,v=0,x=a.reduce((S,k)=>S+k.before.length+k.lines.length+k.after.length,0);if(x+=s.beforeBody.length+s.afterBody.length,u&&(f+=u*c.lineHeight+(u-1)*t.titleSpacing+t.titleMarginBottom),x){const S=t.displayColors?Math.max(l,r.lineHeight):r.lineHeight;f+=p*S+(x-p)*r.lineHeight+(x-1)*t.bodySpacing}h&&(f+=t.footerMarginTop+h*d.lineHeight+(h-1)*t.footerSpacing);let w=0;const _=function(S){v=Math.max(v,e.measureText(S).width+w)};return e.save(),e.font=c.string,W(s.title,_),e.font=r.string,W(s.beforeBody.concat(s.afterBody),_),w=t.displayColors?o+2+t.boxPadding:0,W(a,S=>{W(S.before,_),W(S.lines,_),W(S.after,_)}),w=0,e.font=d.string,W(s.footer,_),e.restore(),v+=b.width,{width:v,height:f}}function Dh(s,t){const{y:e,height:a}=t;return e<a/2?"top":e>s.height-a/2?"bottom":"center"}function Th(s,t,e,a){const{x:i,width:n}=a,o=e.caretSize+e.caretPadding;if(s==="left"&&i+n+o>t.width||s==="right"&&i-n-o<0)return!0}function Lh(s,t,e,a){const{x:i,width:n}=e,{width:o,chartArea:{left:l,right:r}}=s;let c="center";return a==="center"?c=i<=(l+r)/2?"left":"right":i<=n/2?c="left":i>=o-n/2&&(c="right"),Th(c,s,t,e)&&(c="center"),c}function pn(s,t,e){const a=e.yAlign||t.yAlign||Dh(s,e);return{xAlign:e.xAlign||t.xAlign||Lh(s,t,e,a),yAlign:a}}function Oh(s,t){let{x:e,width:a}=s;return t==="right"?e-=a:t==="center"&&(e-=a/2),e}function Eh(s,t,e){let{y:a,height:i}=s;return t==="top"?a+=e:t==="bottom"?a-=i+e:a-=i/2,a}function fn(s,t,e,a){const{caretSize:i,caretPadding:n,cornerRadius:o}=s,{xAlign:l,yAlign:r}=e,c=i+n,{topLeft:d,topRight:u,bottomLeft:h,bottomRight:p}=he(o);let b=Oh(t,l);const f=Eh(t,r,c);return r==="center"?l==="left"?b+=c:l==="right"&&(b-=c):l==="left"?b-=Math.max(d,h)+i:l==="right"&&(b+=Math.max(u,p)+i),{x:ct(b,0,a.width-t.width),y:ct(f,0,a.height-t.height)}}function fs(s,t,e){const a=mt(e.padding);return t==="center"?s.x+s.width/2:t==="right"?s.x+s.width-a.right:s.x+a.left}function bn(s){return Tt([],Ft(s))}function Ih(s,t,e){return ee(s,{tooltip:t,tooltipItems:e,type:"tooltip"})}function gn(s,t){const e=t&&t.dataset&&t.dataset.tooltip&&t.dataset.tooltip.callbacks;return e?s.override(e):s}const jo={beforeTitle:zt,title(s){if(s.length>0){const t=s[0],e=t.chart.data.labels,a=e?e.length:0;if(this&&this.options&&this.options.mode==="dataset")return t.dataset.label||"";if(t.label)return t.label;if(a>0&&t.dataIndex<a)return e[t.dataIndex]}return""},afterTitle:zt,beforeBody:zt,beforeLabel:zt,label(s){if(this&&this.options&&this.options.mode==="dataset")return s.label+": "+s.formattedValue||s.formattedValue;let t=s.dataset.label||"";t&&(t+=": ");const e=s.formattedValue;return B(e)||(t+=e),t},labelColor(s){const e=s.chart.getDatasetMeta(s.datasetIndex).controller.getStyle(s.dataIndex);return{borderColor:e.borderColor,backgroundColor:e.backgroundColor,borderWidth:e.borderWidth,borderDash:e.borderDash,borderDashOffset:e.borderDashOffset,borderRadius:0}},labelTextColor(){return this.options.bodyColor},labelPointStyle(s){const e=s.chart.getDatasetMeta(s.datasetIndex).controller.getStyle(s.dataIndex);return{pointStyle:e.pointStyle,rotation:e.rotation}},afterLabel:zt,afterBody:zt,beforeFooter:zt,footer:zt,afterFooter:zt};function wt(s,t,e,a){const i=s[t].call(e,a);return typeof i>"u"?jo[t].call(e,a):i}class vn extends Ut{static positioners=ze;constructor(t){super(),this.opacity=0,this._active=[],this._eventPosition=void 0,this._size=void 0,this._cachedAnimations=void 0,this._tooltipItems=[],this.$animations=void 0,this.$context=void 0,this.chart=t.chart,this.options=t.options,this.dataPoints=void 0,this.title=void 0,this.beforeBody=void 0,this.body=void 0,this.afterBody=void 0,this.footer=void 0,this.xAlign=void 0,this.yAlign=void 0,this.x=void 0,this.y=void 0,this.height=void 0,this.width=void 0,this.caretX=void 0,this.caretY=void 0,this.labelColors=void 0,this.labelPointStyles=void 0,this.labelTextColors=void 0}initialize(t){this.options=t,this._cachedAnimations=void 0,this.$context=void 0}_resolveAnimations(){const t=this._cachedAnimations;if(t)return t;const e=this.chart,a=this.options.setContext(this.getContext()),i=a.enabled&&e.options.animation&&a.animations,n=new ho(this.chart,i);return i._cacheable&&(this._cachedAnimations=Object.freeze(n)),n}getContext(){return this.$context||(this.$context=Ih(this.chart.getContext(),this,this._tooltipItems))}getTitle(t,e){const{callbacks:a}=e,i=wt(a,"beforeTitle",this,t),n=wt(a,"title",this,t),o=wt(a,"afterTitle",this,t);let l=[];return l=Tt(l,Ft(i)),l=Tt(l,Ft(n)),l=Tt(l,Ft(o)),l}getBeforeBody(t,e){return bn(wt(e.callbacks,"beforeBody",this,t))}getBody(t,e){const{callbacks:a}=e,i=[];return W(t,n=>{const o={before:[],lines:[],after:[]},l=gn(a,n);Tt(o.before,Ft(wt(l,"beforeLabel",this,n))),Tt(o.lines,wt(l,"label",this,n)),Tt(o.after,Ft(wt(l,"afterLabel",this,n))),i.push(o)}),i}getAfterBody(t,e){return bn(wt(e.callbacks,"afterBody",this,t))}getFooter(t,e){const{callbacks:a}=e,i=wt(a,"beforeFooter",this,t),n=wt(a,"footer",this,t),o=wt(a,"afterFooter",this,t);let l=[];return l=Tt(l,Ft(i)),l=Tt(l,Ft(n)),l=Tt(l,Ft(o)),l}_createItems(t){const e=this._active,a=this.chart.data,i=[],n=[],o=[];let l=[],r,c;for(r=0,c=e.length;r<c;++r)l.push(Ah(this.chart,e[r]));return t.filter&&(l=l.filter((d,u,h)=>t.filter(d,u,h,a))),t.itemSort&&(l=l.sort((d,u)=>t.itemSort(d,u,a))),W(l,d=>{const u=gn(t.callbacks,d);i.push(wt(u,"labelColor",this,d)),n.push(wt(u,"labelPointStyle",this,d)),o.push(wt(u,"labelTextColor",this,d))}),this.labelColors=i,this.labelPointStyles=n,this.labelTextColors=o,this.dataPoints=l,l}update(t,e){const a=this.options.setContext(this.getContext()),i=this._active;let n,o=[];if(!i.length)this.opacity!==0&&(n={opacity:0});else{const l=ze[a.position].call(this,i,this._eventPosition);o=this._createItems(a),this.title=this.getTitle(o,a),this.beforeBody=this.getBeforeBody(o,a),this.body=this.getBody(o,a),this.afterBody=this.getAfterBody(o,a),this.footer=this.getFooter(o,a);const r=this._size=hn(this,a),c=Object.assign({},l,r),d=pn(this.chart,a,c),u=fn(a,c,d,this.chart);this.xAlign=d.xAlign,this.yAlign=d.yAlign,n={opacity:1,x:u.x,y:u.y,width:r.width,height:r.height,caretX:l.x,caretY:l.y}}this._tooltipItems=o,this.$context=void 0,n&&this._resolveAnimations().update(this,n),t&&a.external&&a.external.call(this,{chart:this.chart,tooltip:this,replay:e})}drawCaret(t,e,a,i){const n=this.getCaretPosition(t,a,i);e.lineTo(n.x1,n.y1),e.lineTo(n.x2,n.y2),e.lineTo(n.x3,n.y3)}getCaretPosition(t,e,a){const{xAlign:i,yAlign:n}=this,{caretSize:o,cornerRadius:l}=a,{topLeft:r,topRight:c,bottomLeft:d,bottomRight:u}=he(l),{x:h,y:p}=t,{width:b,height:f}=e;let v,x,w,_,S,k;return n==="center"?(S=p+f/2,i==="left"?(v=h,x=v-o,_=S+o,k=S-o):(v=h+b,x=v+o,_=S-o,k=S+o),w=v):(i==="left"?x=h+Math.max(r,d)+o:i==="right"?x=h+b-Math.max(c,u)-o:x=this.caretX,n==="top"?(_=p,S=_-o,v=x-o,w=x+o):(_=p+f,S=_+o,v=x+o,w=x-o),k=_),{x1:v,x2:x,x3:w,y1:_,y2:S,y3:k}}drawTitle(t,e,a){const i=this.title,n=i.length;let o,l,r;if(n){const c=we(a.rtl,this.x,this.width);for(t.x=fs(this,a.titleAlign,a),e.textAlign=c.textAlign(a.titleAlign),e.textBaseline="middle",o=lt(a.titleFont),l=a.titleSpacing,e.fillStyle=a.titleColor,e.font=o.string,r=0;r<n;++r)e.fillText(i[r],c.x(t.x),t.y+o.lineHeight/2),t.y+=o.lineHeight+l,r+1===n&&(t.y+=a.titleMarginBottom-l)}}_drawColorBox(t,e,a,i,n){const o=this.labelColors[a],l=this.labelPointStyles[a],{boxHeight:r,boxWidth:c}=n,d=lt(n.bodyFont),u=fs(this,"left",n),h=i.x(u),p=r<d.lineHeight?(d.lineHeight-r)/2:0,b=e.y+p;if(n.usePointStyle){const f={radius:Math.min(c,r)/2,pointStyle:l.pointStyle,rotation:l.rotation,borderWidth:1},v=i.leftForLtr(h,c)+c/2,x=b+r/2;t.strokeStyle=n.multiKeyBackground,t.fillStyle=n.multiKeyBackground,pa(t,f,v,x),t.strokeStyle=o.borderColor,t.fillStyle=o.backgroundColor,pa(t,f,v,x)}else{t.lineWidth=V(o.borderWidth)?Math.max(...Object.values(o.borderWidth)):o.borderWidth||1,t.strokeStyle=o.borderColor,t.setLineDash(o.borderDash||[]),t.lineDashOffset=o.borderDashOffset||0;const f=i.leftForLtr(h,c),v=i.leftForLtr(i.xPlus(h,1),c-2),x=he(o.borderRadius);Object.values(x).some(w=>w!==0)?(t.beginPath(),t.fillStyle=n.multiKeyBackground,Xe(t,{x:f,y:b,w:c,h:r,radius:x}),t.fill(),t.stroke(),t.fillStyle=o.backgroundColor,t.beginPath(),Xe(t,{x:v,y:b+1,w:c-2,h:r-2,radius:x}),t.fill()):(t.fillStyle=n.multiKeyBackground,t.fillRect(f,b,c,r),t.strokeRect(f,b,c,r),t.fillStyle=o.backgroundColor,t.fillRect(v,b+1,c-2,r-2))}t.fillStyle=this.labelTextColors[a]}drawBody(t,e,a){const{body:i}=this,{bodySpacing:n,bodyAlign:o,displayColors:l,boxHeight:r,boxWidth:c,boxPadding:d}=a,u=lt(a.bodyFont);let h=u.lineHeight,p=0;const b=we(a.rtl,this.x,this.width),f=function(M){e.fillText(M,b.x(t.x+p),t.y+h/2),t.y+=h+n},v=b.textAlign(o);let x,w,_,S,k,P,T;for(e.textAlign=o,e.textBaseline="middle",e.font=u.string,t.x=fs(this,v,a),e.fillStyle=a.bodyColor,W(this.beforeBody,f),p=l&&v!=="right"?o==="center"?c/2+d:c+2+d:0,S=0,P=i.length;S<P;++S){for(x=i[S],w=this.labelTextColors[S],e.fillStyle=w,W(x.before,f),_=x.lines,l&&_.length&&(this._drawColorBox(e,t,S,b,a),h=Math.max(u.lineHeight,r)),k=0,T=_.length;k<T;++k)f(_[k]),h=u.lineHeight;W(x.after,f)}p=0,h=u.lineHeight,W(this.afterBody,f),t.y-=n}drawFooter(t,e,a){const i=this.footer,n=i.length;let o,l;if(n){const r=we(a.rtl,this.x,this.width);for(t.x=fs(this,a.footerAlign,a),t.y+=a.footerMarginTop,e.textAlign=r.textAlign(a.footerAlign),e.textBaseline="middle",o=lt(a.footerFont),e.fillStyle=a.footerColor,e.font=o.string,l=0;l<n;++l)e.fillText(i[l],r.x(t.x),t.y+o.lineHeight/2),t.y+=o.lineHeight+a.footerSpacing}}drawBackground(t,e,a,i){const{xAlign:n,yAlign:o}=this,{x:l,y:r}=t,{width:c,height:d}=a,{topLeft:u,topRight:h,bottomLeft:p,bottomRight:b}=he(i.cornerRadius);e.fillStyle=i.backgroundColor,e.strokeStyle=i.borderColor,e.lineWidth=i.borderWidth,e.beginPath(),e.moveTo(l+u,r),o==="top"&&this.drawCaret(t,e,a,i),e.lineTo(l+c-h,r),e.quadraticCurveTo(l+c,r,l+c,r+h),o==="center"&&n==="right"&&this.drawCaret(t,e,a,i),e.lineTo(l+c,r+d-b),e.quadraticCurveTo(l+c,r+d,l+c-b,r+d),o==="bottom"&&this.drawCaret(t,e,a,i),e.lineTo(l+p,r+d),e.quadraticCurveTo(l,r+d,l,r+d-p),o==="center"&&n==="left"&&this.drawCaret(t,e,a,i),e.lineTo(l,r+u),e.quadraticCurveTo(l,r,l+u,r),e.closePath(),e.fill(),i.borderWidth>0&&e.stroke()}_updateAnimationTarget(t){const e=this.chart,a=this.$animations,i=a&&a.x,n=a&&a.y;if(i||n){const o=ze[t.position].call(this,this._active,this._eventPosition);if(!o)return;const l=this._size=hn(this,t),r=Object.assign({},o,this._size),c=pn(e,t,r),d=fn(t,r,c,e);(i._to!==d.x||n._to!==d.y)&&(this.xAlign=c.xAlign,this.yAlign=c.yAlign,this.width=l.width,this.height=l.height,this.caretX=o.x,this.caretY=o.y,this._resolveAnimations().update(this,d))}}_willRender(){return!!this.opacity}draw(t){const e=this.options.setContext(this.getContext());let a=this.opacity;if(!a)return;this._updateAnimationTarget(e);const i={width:this.width,height:this.height},n={x:this.x,y:this.y};a=Math.abs(a)<.001?0:a;const o=mt(e.padding),l=this.title.length||this.beforeBody.length||this.body.length||this.afterBody.length||this.footer.length;e.enabled&&l&&(t.save(),t.globalAlpha=a,this.drawBackground(n,t,i,e),no(t,e.textDirection),n.y+=o.top,this.drawTitle(n,t,e),this.drawBody(n,t,e),this.drawFooter(n,t,e),oo(t,e.textDirection),t.restore())}getActiveElements(){return this._active||[]}setActiveElements(t,e){const a=this._active,i=t.map(({datasetIndex:l,index:r})=>{const c=this.chart.getDatasetMeta(l);if(!c)throw new Error("Cannot find a dataset at index "+l);return{datasetIndex:l,element:c.data[r],index:r}}),n=!ks(a,i),o=this._positionChanged(i,e);(n||o)&&(this._active=i,this._eventPosition=e,this._ignoreReplayEvents=!0,this.update(!0))}handleEvent(t,e,a=!0){if(e&&this._ignoreReplayEvents)return!1;this._ignoreReplayEvents=!1;const i=this.options,n=this._active||[],o=this._getActiveElements(t,n,e,a),l=this._positionChanged(o,t),r=e||!ks(o,n)||l;return r&&(this._active=o,(i.enabled||i.external)&&(this._eventPosition={x:t.x,y:t.y},this.update(!0,e))),r}_getActiveElements(t,e,a,i){const n=this.options;if(t.type==="mouseout")return[];if(!i)return e.filter(l=>this.chart.data.datasets[l.datasetIndex]&&this.chart.getDatasetMeta(l.datasetIndex).controller.getParsed(l.index)!==void 0);const o=this.chart.getElementsAtEventForMode(t,n.mode,n,a);return n.reverse&&o.reverse(),o}_positionChanged(t,e){const{caretX:a,caretY:i,options:n}=this,o=ze[n.position].call(this,t,e);return o!==!1&&(a!==o.x||i!==o.y)}}var No={id:"tooltip",_element:vn,positioners:ze,afterInit(s,t,e){e&&(s.tooltip=new vn({chart:s,options:e}))},beforeUpdate(s,t,e){s.tooltip&&s.tooltip.initialize(e)},reset(s,t,e){s.tooltip&&s.tooltip.initialize(e)},afterDraw(s){const t=s.tooltip;if(t&&t._willRender()){const e={tooltip:t};if(s.notifyPlugins("beforeTooltipDraw",{...e,cancelable:!0})===!1)return;t.draw(s.ctx),s.notifyPlugins("afterTooltipDraw",e)}},afterEvent(s,t){if(s.tooltip){const e=t.replay;s.tooltip.handleEvent(t.event,e,t.inChartArea)&&(t.changed=!0)}},defaults:{enabled:!0,external:null,position:"average",backgroundColor:"rgba(0,0,0,0.8)",titleColor:"#fff",titleFont:{weight:"bold"},titleSpacing:2,titleMarginBottom:6,titleAlign:"left",bodyColor:"#fff",bodySpacing:2,bodyFont:{},bodyAlign:"left",footerColor:"#fff",footerSpacing:2,footerMarginTop:6,footerFont:{weight:"bold"},footerAlign:"left",padding:6,caretPadding:2,caretSize:5,cornerRadius:6,boxHeight:(s,t)=>t.bodyFont.size,boxWidth:(s,t)=>t.bodyFont.size,multiKeyBackground:"#fff",displayColors:!0,boxPadding:0,borderColor:"rgba(0,0,0,0)",borderWidth:0,animation:{duration:400,easing:"easeOutQuart"},animations:{numbers:{type:"number",properties:["x","y","width","height","caretX","caretY"]},opacity:{easing:"linear",duration:200}},callbacks:jo},defaultRoutes:{bodyFont:"font",footerFont:"font",titleFont:"font"},descriptors:{_scriptable:s=>s!=="filter"&&s!=="itemSort"&&s!=="external",_indexable:!1,callbacks:{_scriptable:!1,_indexable:!1},animation:{_fallback:!1},animations:{_fallback:"animation"}},additionalOptionScopes:["interaction"]},Rh=Object.freeze({__proto__:null,Colors:Ku,Decimation:th,Filler:Fo,Legend:Ho,SubTitle:Ph,Title:Mh,Tooltip:No});const zh=(s,t,e,a)=>(typeof t=="string"?(e=s.push(t)-1,a.unshift({index:e,label:t})):isNaN(t)&&(e=null),e);function Bh(s,t,e,a){const i=s.indexOf(t);if(i===-1)return zh(s,t,e,a);const n=s.lastIndexOf(t);return i!==n?e:i}const Fh=(s,t)=>s===null?null:ct(Math.round(s),0,t);function mn(s){const t=this.getLabels();return s>=0&&s<t.length?t[s]:s}class Wo extends ge{static id="category";static defaults={ticks:{callback:mn}};constructor(t){super(t),this._startValue=void 0,this._valueRange=0,this._addedLabels=[]}init(t){const e=this._addedLabels;if(e.length){const a=this.getLabels();for(const{index:i,label:n}of e)a[i]===n&&a.splice(i,1);this._addedLabels=[]}super.init(t)}parse(t,e){if(B(t))return null;const a=this.getLabels();return e=isFinite(e)&&a[e]===t?e:Bh(a,t,I(e,t),this._addedLabels),Fh(e,a.length-1)}determineDataLimits(){const{minDefined:t,maxDefined:e}=this.getUserBounds();let{min:a,max:i}=this.getMinMax(!0);this.options.bounds==="ticks"&&(t||(a=0),e||(i=this.getLabels().length-1)),this.min=a,this.max=i}buildTicks(){const t=this.min,e=this.max,a=this.options.offset,i=[];let n=this.getLabels();n=t===0&&e===n.length-1?n:n.slice(t,e+1),this._valueRange=Math.max(n.length-(a?0:1),1),this._startValue=this.min-(a?.5:0);for(let o=t;o<=e;o++)i.push({value:o});return i}getLabelForValue(t){return mn.call(this,t)}configure(){super.configure(),this.isHorizontal()||(this._reversePixels=!this._reversePixels)}getPixelForValue(t){return typeof t!="number"&&(t=this.parse(t)),t===null?NaN:this.getPixelForDecimal((t-this._startValue)/this._valueRange)}getPixelForTick(t){const e=this.ticks;return t<0||t>e.length-1?null:this.getPixelForValue(e[t].value)}getValueForPixel(t){return Math.round(this._startValue+this.getDecimalForPixel(t)*this._valueRange)}getBasePixel(){return this.bottom}}function Vh(s,t){const e=[],{bounds:i,step:n,min:o,max:l,precision:r,count:c,maxTicks:d,maxDigits:u,includeBounds:h}=s,p=n||1,b=d-1,{min:f,max:v}=t,x=!B(o),w=!B(l),_=!B(c),S=(v-f)/(u+1);let k=ui((v-f)/b/p)*p,P,T,M,O;if(k<1e-14&&!x&&!w)return[{value:f},{value:v}];O=Math.ceil(v/k)-Math.floor(f/k),O>b&&(k=ui(O*k/b/p)*p),B(r)||(P=Math.pow(10,r),k=Math.ceil(k*P)/P),i==="ticks"?(T=Math.floor(f/k)*k,M=Math.ceil(v/k)*k):(T=f,M=v),x&&w&&n&&Tr((l-o)/n,k/1e3)?(O=Math.round(Math.min((l-o)/k,d)),k=(l-o)/O,T=o,M=l):_?(T=x?o:T,M=w?l:M,O=c-1,k=(M-T)/O):(O=(M-T)/k,Ve(O,Math.round(O),k/1e3)?O=Math.round(O):O=Math.ceil(O));const R=Math.max(hi(k),hi(T));P=Math.pow(10,B(r)?R:r),T=Math.round(T*P)/P,M=Math.round(M*P)/P;let z=0;for(x&&(h&&T!==o?(e.push({value:o}),T<o&&z++,Ve(Math.round((T+z*k)*P)/P,o,xn(o,S,s))&&z++):T<o&&z++);z<O;++z){const F=Math.round((T+z*k)*P)/P;if(w&&F>l)break;e.push({value:F})}return w&&h&&M!==l?e.length&&Ve(e[e.length-1].value,l,xn(l,S,s))?e[e.length-1].value=l:e.push({value:l}):(!w||M===l)&&e.push({value:M}),e}function xn(s,t,{horizontal:e,minRotation:a}){const i=At(a),n=(e?Math.sin(i):Math.cos(i))||.001,o=.75*t*(""+s).length;return Math.min(t/n,o)}class Ds extends ge{constructor(t){super(t),this.start=void 0,this.end=void 0,this._startValue=void 0,this._endValue=void 0,this._valueRange=0}parse(t,e){return B(t)||(typeof t=="number"||t instanceof Number)&&!isFinite(+t)?null:+t}handleTickRangeOptions(){const{beginAtZero:t}=this.options,{minDefined:e,maxDefined:a}=this.getUserBounds();let{min:i,max:n}=this;const o=r=>i=e?i:r,l=r=>n=a?n:r;if(t){const r=Ot(i),c=Ot(n);r<0&&c<0?l(0):r>0&&c>0&&o(0)}if(i===n){let r=n===0?1:Math.abs(n*.05);l(n+r),t||o(i-r)}this.min=i,this.max=n}getTickLimit(){const t=this.options.ticks;let{maxTicksLimit:e,stepSize:a}=t,i;return a?(i=Math.ceil(this.max/a)-Math.floor(this.min/a)+1,i>1e3&&(console.warn(`scales.${this.id}.ticks.stepSize: ${a} would result generating up to ${i} ticks. Limiting to 1000.`),i=1e3)):(i=this.computeTickLimit(),e=e||11),e&&(i=Math.min(e,i)),i}computeTickLimit(){return Number.POSITIVE_INFINITY}buildTicks(){const t=this.options,e=t.ticks;let a=this.getTickLimit();a=Math.max(2,a);const i={maxTicks:a,bounds:t.bounds,min:t.min,max:t.max,precision:e.precision,step:e.stepSize,count:e.count,maxDigits:this._maxDigits(),horizontal:this.isHorizontal(),minRotation:e.minRotation||0,includeBounds:e.includeBounds!==!1},n=this._range||this,o=Vh(i,n);return t.bounds==="ticks"&&Nn(o,this,"value"),t.reverse?(o.reverse(),this.start=this.max,this.end=this.min):(this.start=this.min,this.end=this.max),o}configure(){const t=this.ticks;let e=this.min,a=this.max;if(super.configure(),this.options.offset&&t.length){const i=(a-e)/Math.max(t.length-1,1)/2;e-=i,a+=i}this._startValue=e,this._endValue=a,this._valueRange=a-e}getLabelForValue(t){return Qe(t,this.chart.options.locale,this.options.ticks.format)}}class Uo extends Ds{static id="linear";static defaults={ticks:{callback:Ls.formatters.numeric}};determineDataLimits(){const{min:t,max:e}=this.getMinMax(!0);this.min=tt(t)?t:0,this.max=tt(e)?e:1,this.handleTickRangeOptions()}computeTickLimit(){const t=this.isHorizontal(),e=t?this.width:this.height,a=At(this.options.ticks.minRotation),i=(t?Math.sin(a):Math.cos(a))||.001,n=this._resolveTickFontOptions(0);return Math.ceil(e/Math.min(40,n.lineHeight/i))}getPixelForValue(t){return t===null?NaN:this.getPixelForDecimal((t-this._startValue)/this._valueRange)}getValueForPixel(t){return this._startValue+this.getDecimalForPixel(t)*this._valueRange}}const Ke=s=>Math.floor(qt(s)),ce=(s,t)=>Math.pow(10,Ke(s)+t);function yn(s){return s/Math.pow(10,Ke(s))===1}function wn(s,t,e){const a=Math.pow(10,e),i=Math.floor(s/a);return Math.ceil(t/a)-i}function Hh(s,t){const e=t-s;let a=Ke(e);for(;wn(s,t,a)>10;)a++;for(;wn(s,t,a)<10;)a--;return Math.min(a,Ke(s))}function jh(s,{min:t,max:e}){t=_t(s.min,t);const a=[],i=Ke(t);let n=Hh(t,e),o=n<0?Math.pow(10,Math.abs(n)):1;const l=Math.pow(10,n),r=i>n?Math.pow(10,i):0,c=Math.round((t-r)*o)/o,d=Math.floor((t-r)/l/10)*l*10;let u=Math.floor((c-d)/Math.pow(10,n)),h=_t(s.min,Math.round((r+d+u*Math.pow(10,n))*o)/o);for(;h<e;)a.push({value:h,major:yn(h),significand:u}),u>=10?u=u<15?15:20:u++,u>=20&&(n++,u=2,o=n>=0?1:o),h=Math.round((r+d+u*Math.pow(10,n))*o)/o;const p=_t(s.max,h);return a.push({value:p,major:yn(p),significand:u}),a}class Nh extends ge{static id="logarithmic";static defaults={ticks:{callback:Ls.formatters.logarithmic,major:{enabled:!0}}};constructor(t){super(t),this.start=void 0,this.end=void 0,this._startValue=void 0,this._valueRange=0}parse(t,e){const a=Ds.prototype.parse.apply(this,[t,e]);if(a===0){this._zero=!0;return}return tt(a)&&a>0?a:null}determineDataLimits(){const{min:t,max:e}=this.getMinMax(!0);this.min=tt(t)?Math.max(0,t):null,this.max=tt(e)?Math.max(0,e):null,this.options.beginAtZero&&(this._zero=!0),this._zero&&this.min!==this._suggestedMin&&!tt(this._userMin)&&(this.min=t===ce(this.min,0)?ce(this.min,-1):ce(this.min,0)),this.handleTickRangeOptions()}handleTickRangeOptions(){const{minDefined:t,maxDefined:e}=this.getUserBounds();let a=this.min,i=this.max;const n=l=>a=t?a:l,o=l=>i=e?i:l;a===i&&(a<=0?(n(1),o(10)):(n(ce(a,-1)),o(ce(i,1)))),a<=0&&n(ce(i,-1)),i<=0&&o(ce(a,1)),this.min=a,this.max=i}buildTicks(){const t=this.options,e={min:this._userMin,max:this._userMax},a=jh(e,this);return t.bounds==="ticks"&&Nn(a,this,"value"),t.reverse?(a.reverse(),this.start=this.max,this.end=this.min):(this.start=this.min,this.end=this.max),a}getLabelForValue(t){return t===void 0?"0":Qe(t,this.chart.options.locale,this.options.ticks.format)}configure(){const t=this.min;super.configure(),this._startValue=qt(t),this._valueRange=qt(this.max)-qt(t)}getPixelForValue(t){return(t===void 0||t===0)&&(t=this.min),t===null||isNaN(t)?NaN:this.getPixelForDecimal(t===this.min?0:(qt(t)-this._startValue)/this._valueRange)}getValueForPixel(t){const e=this.getDecimalForPixel(t);return Math.pow(10,this._startValue+e*this._valueRange)}}function xa(s){const t=s.ticks;if(t.display&&s.display){const e=mt(t.backdropPadding);return I(t.font&&t.font.size,K.font.size)+e.height}return 0}function Wh(s,t,e){return e=q(e)?e:[e],{w:Gr(s,t.string,e),h:e.length*t.lineHeight}}function kn(s,t,e,a,i){return s===a||s===i?{start:t-e/2,end:t+e/2}:s<a||s>i?{start:t-e,end:t}:{start:t,end:t+e}}function Uh(s){const t={l:s.left+s._padding.left,r:s.right-s._padding.right,t:s.top+s._padding.top,b:s.bottom-s._padding.bottom},e=Object.assign({},t),a=[],i=[],n=s._pointLabels.length,o=s.options.pointLabels,l=o.centerPointLabels?j/n:0;for(let r=0;r<n;r++){const c=o.setContext(s.getPointLabelContext(r));i[r]=c.padding;const d=s.getPointPosition(r,s.drawingArea+i[r],l),u=lt(c.font),h=Wh(s.ctx,u,s._pointLabels[r]);a[r]=h;const p=bt(s.getIndexAngle(r)+l),b=Math.round(Aa(p)),f=kn(b,d.x,h.w,0,180),v=kn(b,d.y,h.h,90,270);$h(e,t,p,f,v)}s.setCenterPoint(t.l-e.l,e.r-t.r,t.t-e.t,e.b-t.b),s._pointLabelItems=Xh(s,a,i)}function $h(s,t,e,a,i){const n=Math.abs(Math.sin(e)),o=Math.abs(Math.cos(e));let l=0,r=0;a.start<t.l?(l=(t.l-a.start)/n,s.l=Math.min(s.l,t.l-l)):a.end>t.r&&(l=(a.end-t.r)/n,s.r=Math.max(s.r,t.r+l)),i.start<t.t?(r=(t.t-i.start)/o,s.t=Math.min(s.t,t.t-r)):i.end>t.b&&(r=(i.end-t.b)/o,s.b=Math.max(s.b,t.b+r))}function Yh(s,t,e){const a=s.drawingArea,{extra:i,additionalAngle:n,padding:o,size:l}=e,r=s.getPointPosition(t,a+i+o,n),c=Math.round(Aa(bt(r.angle+st))),d=Zh(r.y,l.h,c),u=qh(c),h=Kh(r.x,l.w,u);return{visible:!0,x:r.x,y:d,textAlign:u,left:h,top:d,right:h+l.w,bottom:d+l.h}}function Gh(s,t){if(!t)return!0;const{left:e,top:a,right:i,bottom:n}=s;return!(Wt({x:e,y:a},t)||Wt({x:e,y:n},t)||Wt({x:i,y:a},t)||Wt({x:i,y:n},t))}function Xh(s,t,e){const a=[],i=s._pointLabels.length,n=s.options,{centerPointLabels:o,display:l}=n.pointLabels,r={extra:xa(n)/2,additionalAngle:o?j/i:0};let c;for(let d=0;d<i;d++){r.padding=e[d],r.size=t[d];const u=Yh(s,d,r);a.push(u),l==="auto"&&(u.visible=Gh(u,c),u.visible&&(c=u))}return a}function qh(s){return s===0||s===180?"center":s<180?"left":"right"}function Kh(s,t,e){return e==="right"?s-=t:e==="center"&&(s-=t/2),s}function Zh(s,t,e){return e===90||e===270?s-=t/2:(e>270||e<90)&&(s-=t),s}function Qh(s,t,e){const{left:a,top:i,right:n,bottom:o}=e,{backdropColor:l}=t;if(!B(l)){const r=he(t.borderRadius),c=mt(t.backdropPadding);s.fillStyle=l;const d=a-c.left,u=i-c.top,h=n-a+c.width,p=o-i+c.height;Object.values(r).some(b=>b!==0)?(s.beginPath(),Xe(s,{x:d,y:u,w:h,h:p,radius:r}),s.fill()):s.fillRect(d,u,h,p)}}function Jh(s,t){const{ctx:e,options:{pointLabels:a}}=s;for(let i=t-1;i>=0;i--){const n=s._pointLabelItems[i];if(!n.visible)continue;const o=a.setContext(s.getPointLabelContext(i));Qh(e,o,n);const l=lt(o.font),{x:r,y:c,textAlign:d}=n;be(e,s._pointLabels[i],r,c+l.lineHeight/2,l,{color:o.color,textAlign:d,textBaseline:"middle"})}}function $o(s,t,e,a){const{ctx:i}=s;if(e)i.arc(s.xCenter,s.yCenter,t,0,X);else{let n=s.getPointPosition(0,t);i.moveTo(n.x,n.y);for(let o=1;o<a;o++)n=s.getPointPosition(o,t),i.lineTo(n.x,n.y)}}function tp(s,t,e,a,i){const n=s.ctx,o=t.circular,{color:l,lineWidth:r}=t;!o&&!a||!l||!r||e<0||(n.save(),n.strokeStyle=l,n.lineWidth=r,n.setLineDash(i.dash||[]),n.lineDashOffset=i.dashOffset,n.beginPath(),$o(s,e,o,a),n.closePath(),n.stroke(),n.restore())}function ep(s,t,e){return ee(s,{label:e,index:t,type:"pointLabel"})}class sp extends Ds{static id="radialLinear";static defaults={display:!0,animate:!0,position:"chartArea",angleLines:{display:!0,lineWidth:1,borderDash:[],borderDashOffset:0},grid:{circular:!1},startAngle:0,ticks:{showLabelBackdrop:!0,callback:Ls.formatters.numeric},pointLabels:{backdropColor:void 0,backdropPadding:2,display:!0,font:{size:10},callback(t){return t},padding:5,centerPointLabels:!1}};static defaultRoutes={"angleLines.color":"borderColor","pointLabels.color":"color","ticks.color":"color"};static descriptors={angleLines:{_fallback:"grid"}};constructor(t){super(t),this.xCenter=void 0,this.yCenter=void 0,this.drawingArea=void 0,this._pointLabels=[],this._pointLabelItems=[]}setDimensions(){const t=this._padding=mt(xa(this.options)/2),e=this.width=this.maxWidth-t.width,a=this.height=this.maxHeight-t.height;this.xCenter=Math.floor(this.left+e/2+t.left),this.yCenter=Math.floor(this.top+a/2+t.top),this.drawingArea=Math.floor(Math.min(e,a)/2)}determineDataLimits(){const{min:t,max:e}=this.getMinMax(!1);this.min=tt(t)&&!isNaN(t)?t:0,this.max=tt(e)&&!isNaN(e)?e:0,this.handleTickRangeOptions()}computeTickLimit(){return Math.ceil(this.drawingArea/xa(this.options))}generateTickLabels(t){Ds.prototype.generateTickLabels.call(this,t),this._pointLabels=this.getLabels().map((e,a)=>{const i=G(this.options.pointLabels.callback,[e,a],this);return i||i===0?i:""}).filter((e,a)=>this.chart.getDataVisibility(a))}fit(){const t=this.options;t.display&&t.pointLabels.display?Uh(this):this.setCenterPoint(0,0,0,0)}setCenterPoint(t,e,a,i){this.xCenter+=Math.floor((t-e)/2),this.yCenter+=Math.floor((a-i)/2),this.drawingArea-=Math.min(this.drawingArea/2,Math.max(t,e,a,i))}getIndexAngle(t){const e=X/(this._pointLabels.length||1),a=this.options.startAngle||0;return bt(t*e+At(a))}getDistanceFromCenterForValue(t){if(B(t))return NaN;const e=this.drawingArea/(this.max-this.min);return this.options.reverse?(this.max-t)*e:(t-this.min)*e}getValueForDistanceFromCenter(t){if(B(t))return NaN;const e=t/(this.drawingArea/(this.max-this.min));return this.options.reverse?this.max-e:this.min+e}getPointLabelContext(t){const e=this._pointLabels||[];if(t>=0&&t<e.length){const a=e[t];return ep(this.getContext(),t,a)}}getPointPosition(t,e,a=0){const i=this.getIndexAngle(t)-st+a;return{x:Math.cos(i)*e+this.xCenter,y:Math.sin(i)*e+this.yCenter,angle:i}}getPointPositionForValue(t,e){return this.getPointPosition(t,this.getDistanceFromCenterForValue(e))}getBasePosition(t){return this.getPointPositionForValue(t||0,this.getBaseValue())}getPointLabelPosition(t){const{left:e,top:a,right:i,bottom:n}=this._pointLabelItems[t];return{left:e,top:a,right:i,bottom:n}}drawBackground(){const{backgroundColor:t,grid:{circular:e}}=this.options;if(t){const a=this.ctx;a.save(),a.beginPath(),$o(this,this.getDistanceFromCenterForValue(this._endValue),e,this._pointLabels.length),a.closePath(),a.fillStyle=t,a.fill(),a.restore()}}drawGrid(){const t=this.ctx,e=this.options,{angleLines:a,grid:i,border:n}=e,o=this._pointLabels.length;let l,r,c;if(e.pointLabels.display&&Jh(this,o),i.display&&this.ticks.forEach((d,u)=>{if(u!==0||u===0&&this.min<0){r=this.getDistanceFromCenterForValue(d.value);const h=this.getContext(u),p=i.setContext(h),b=n.setContext(h);tp(this,p,r,o,b)}}),a.display){for(t.save(),l=o-1;l>=0;l--){const d=a.setContext(this.getPointLabelContext(l)),{color:u,lineWidth:h}=d;!h||!u||(t.lineWidth=h,t.strokeStyle=u,t.setLineDash(d.borderDash),t.lineDashOffset=d.borderDashOffset,r=this.getDistanceFromCenterForValue(e.reverse?this.min:this.max),c=this.getPointPosition(l,r),t.beginPath(),t.moveTo(this.xCenter,this.yCenter),t.lineTo(c.x,c.y),t.stroke())}t.restore()}}drawBorder(){}drawLabels(){const t=this.ctx,e=this.options,a=e.ticks;if(!a.display)return;const i=this.getIndexAngle(0);let n,o;t.save(),t.translate(this.xCenter,this.yCenter),t.rotate(i),t.textAlign="center",t.textBaseline="middle",this.ticks.forEach((l,r)=>{if(r===0&&this.min>=0&&!e.reverse)return;const c=a.setContext(this.getContext(r)),d=lt(c.font);if(n=this.getDistanceFromCenterForValue(this.ticks[r].value),c.showLabelBackdrop){t.font=d.string,o=t.measureText(l.label).width,t.fillStyle=c.backdropColor;const u=mt(c.backdropPadding);t.fillRect(-o/2-u.left,-n-d.size/2-u.top,o+u.width,d.size+u.height)}be(t,l.label,0,-n,d,{color:c.color,strokeColor:c.textStrokeColor,strokeWidth:c.textStrokeWidth})}),t.restore()}drawTitle(){}}const Fs={millisecond:{common:!0,size:1,steps:1e3},second:{common:!0,size:1e3,steps:60},minute:{common:!0,size:6e4,steps:60},hour:{common:!0,size:36e5,steps:24},day:{common:!0,size:864e5,steps:30},week:{common:!1,size:6048e5,steps:4},month:{common:!0,size:2628e6,steps:12},quarter:{common:!1,size:7884e6,steps:4},year:{common:!0,size:3154e7}},St=Object.keys(Fs);function Sn(s,t){return s-t}function _n(s,t){if(B(t))return null;const e=s._adapter,{parser:a,round:i,isoWeekday:n}=s._parseOpts;let o=t;return typeof a=="function"&&(o=a(o)),tt(o)||(o=typeof a=="string"?e.parse(o,a):e.parse(o)),o===null?null:(i&&(o=i==="week"&&(Se(n)||n===!0)?e.startOf(o,"isoWeek",n):e.startOf(o,i)),+o)}function Cn(s,t,e,a){const i=St.length;for(let n=St.indexOf(s);n<i-1;++n){const o=Fs[St[n]],l=o.steps?o.steps:Number.MAX_SAFE_INTEGER;if(o.common&&Math.ceil((e-t)/(l*o.size))<=a)return St[n]}return St[i-1]}function ap(s,t,e,a,i){for(let n=St.length-1;n>=St.indexOf(e);n--){const o=St[n];if(Fs[o].common&&s._adapter.diff(i,a,o)>=t-1)return o}return St[e?St.indexOf(e):0]}function ip(s){for(let t=St.indexOf(s)+1,e=St.length;t<e;++t)if(Fs[St[t]].common)return St[t]}function Mn(s,t,e){if(!e)s[t]=!0;else if(e.length){const{lo:a,hi:i}=Da(e,t),n=e[a]>=t?e[a]:e[i];s[n]=!0}}function np(s,t,e,a){const i=s._adapter,n=+i.startOf(t[0].value,a),o=t[t.length-1].value;let l,r;for(l=n;l<=o;l=+i.add(l,1,a))r=e[l],r>=0&&(t[r].major=!0);return t}function Pn(s,t,e){const a=[],i={},n=t.length;let o,l;for(o=0;o<n;++o)l=t[o],i[l]=o,a.push({value:l,major:!1});return n===0||!e?a:np(s,a,i,e)}class ya extends ge{static id="time";static defaults={bounds:"data",adapters:{},time:{parser:!1,unit:!1,round:!1,isoWeekday:!1,minUnit:"millisecond",displayFormats:{}},ticks:{source:"auto",callback:!1,major:{enabled:!1}}};constructor(t){super(t),this._cache={data:[],labels:[],all:[]},this._unit="day",this._majorUnit=void 0,this._offsets={},this._normalized=!1,this._parseOpts=void 0}init(t,e={}){const a=t.time||(t.time={}),i=this._adapter=new fd._date(t.adapters.date);i.init(e),Fe(a.displayFormats,i.formats()),this._parseOpts={parser:a.parser,round:a.round,isoWeekday:a.isoWeekday},super.init(t),this._normalized=e.normalized}parse(t,e){return t===void 0?null:_n(this,t)}beforeLayout(){super.beforeLayout(),this._cache={data:[],labels:[],all:[]}}determineDataLimits(){const t=this.options,e=this._adapter,a=t.time.unit||"day";let{min:i,max:n,minDefined:o,maxDefined:l}=this.getUserBounds();function r(c){!o&&!isNaN(c.min)&&(i=Math.min(i,c.min)),!l&&!isNaN(c.max)&&(n=Math.max(n,c.max))}(!o||!l)&&(r(this._getLabelBounds()),(t.bounds!=="ticks"||t.ticks.source!=="labels")&&r(this.getMinMax(!1))),i=tt(i)&&!isNaN(i)?i:+e.startOf(Date.now(),a),n=tt(n)&&!isNaN(n)?n:+e.endOf(Date.now(),a)+1,this.min=Math.min(i,n-1),this.max=Math.max(i+1,n)}_getLabelBounds(){const t=this.getLabelTimestamps();let e=Number.POSITIVE_INFINITY,a=Number.NEGATIVE_INFINITY;return t.length&&(e=t[0],a=t[t.length-1]),{min:e,max:a}}buildTicks(){const t=this.options,e=t.time,a=t.ticks,i=a.source==="labels"?this.getLabelTimestamps():this._generate();t.bounds==="ticks"&&i.length&&(this.min=this._userMin||i[0],this.max=this._userMax||i[i.length-1]);const n=this.min,o=this.max,l=Ir(i,n,o);return this._unit=e.unit||(a.autoSkip?Cn(e.minUnit,this.min,this.max,this._getLabelCapacity(n)):ap(this,l.length,e.minUnit,this.min,this.max)),this._majorUnit=!a.major.enabled||this._unit==="year"?void 0:ip(this._unit),this.initOffsets(i),t.reverse&&l.reverse(),Pn(this,l,this._majorUnit)}afterAutoSkip(){this.options.offsetAfterAutoskip&&this.initOffsets(this.ticks.map(t=>+t.value))}initOffsets(t=[]){let e=0,a=0,i,n;this.options.offset&&t.length&&(i=this.getDecimalForValue(t[0]),t.length===1?e=1-i:e=(this.getDecimalForValue(t[1])-i)/2,n=this.getDecimalForValue(t[t.length-1]),t.length===1?a=n:a=(n-this.getDecimalForValue(t[t.length-2]))/2);const o=t.length<3?.5:.25;e=ct(e,0,o),a=ct(a,0,o),this._offsets={start:e,end:a,factor:1/(e+1+a)}}_generate(){const t=this._adapter,e=this.min,a=this.max,i=this.options,n=i.time,o=n.unit||Cn(n.minUnit,e,a,this._getLabelCapacity(e)),l=I(i.ticks.stepSize,1),r=o==="week"?n.isoWeekday:!1,c=Se(r)||r===!0,d={};let u=e,h,p;if(c&&(u=+t.startOf(u,"isoWeek",r)),u=+t.startOf(u,c?"day":o),t.diff(a,e,o)>1e5*l)throw new Error(e+" and "+a+" are too far apart with stepSize of "+l+" "+o);const b=i.ticks.source==="data"&&this.getDataTimestamps();for(h=u,p=0;h<a;h=+t.add(h,l,o),p++)Mn(d,h,b);return(h===a||i.bounds==="ticks"||p===1)&&Mn(d,h,b),Object.keys(d).sort(Sn).map(f=>+f)}getLabelForValue(t){const e=this._adapter,a=this.options.time;return a.tooltipFormat?e.format(t,a.tooltipFormat):e.format(t,a.displayFormats.datetime)}format(t,e){const i=this.options.time.displayFormats,n=this._unit,o=e||i[n];return this._adapter.format(t,o)}_tickFormatFunction(t,e,a,i){const n=this.options,o=n.ticks.callback;if(o)return G(o,[t,e,a],this);const l=n.time.displayFormats,r=this._unit,c=this._majorUnit,d=r&&l[r],u=c&&l[c],h=a[e],p=c&&u&&h&&h.major;return this._adapter.format(t,i||(p?u:d))}generateTickLabels(t){let e,a,i;for(e=0,a=t.length;e<a;++e)i=t[e],i.label=this._tickFormatFunction(i.value,e,t)}getDecimalForValue(t){return t===null?NaN:(t-this.min)/(this.max-this.min)}getPixelForValue(t){const e=this._offsets,a=this.getDecimalForValue(t);return this.getPixelForDecimal((e.start+a)*e.factor)}getValueForPixel(t){const e=this._offsets,a=this.getDecimalForPixel(t)/e.factor-e.end;return this.min+a*(this.max-this.min)}_getLabelSize(t){const e=this.options.ticks,a=this.ctx.measureText(t).width,i=At(this.isHorizontal()?e.maxRotation:e.minRotation),n=Math.cos(i),o=Math.sin(i),l=this._resolveTickFontOptions(0).size;return{w:a*n+l*o,h:a*o+l*n}}_getLabelCapacity(t){const e=this.options.time,a=e.displayFormats,i=a[e.unit]||a.millisecond,n=this._tickFormatFunction(t,0,Pn(this,[t],this._majorUnit),i),o=this._getLabelSize(n),l=Math.floor(this.isHorizontal()?this.width/o.w:this.height/o.h)-1;return l>0?l:1}getDataTimestamps(){let t=this._cache.data||[],e,a;if(t.length)return t;const i=this.getMatchingVisibleMetas();if(this._normalized&&i.length)return this._cache.data=i[0].controller.getAllParsedValues(this);for(e=0,a=i.length;e<a;++e)t=t.concat(i[e].controller.getAllParsedValues(this));return this._cache.data=this.normalize(t)}getLabelTimestamps(){const t=this._cache.labels||[];let e,a;if(t.length)return t;const i=this.getLabels();for(e=0,a=i.length;e<a;++e)t.push(_n(this,i[e]));return this._cache.labels=this._normalized?t:this.normalize(t)}normalize(t){return $n(t.sort(Sn))}}function bs(s,t,e){let a=0,i=s.length-1,n,o,l,r;e?(t>=s[a].pos&&t<=s[i].pos&&({lo:a,hi:i}=Nt(s,"pos",t)),{pos:n,time:l}=s[a],{pos:o,time:r}=s[i]):(t>=s[a].time&&t<=s[i].time&&({lo:a,hi:i}=Nt(s,"time",t)),{time:n,pos:l}=s[a],{time:o,pos:r}=s[i]);const c=o-n;return c?l+(r-l)*(t-n)/c:l}class op extends ya{static id="timeseries";static defaults=ya.defaults;constructor(t){super(t),this._table=[],this._minPos=void 0,this._tableRange=void 0}initOffsets(){const t=this._getTimestampsForTable(),e=this._table=this.buildLookupTable(t);this._minPos=bs(e,this.min),this._tableRange=bs(e,this.max)-this._minPos,super.initOffsets(t)}buildLookupTable(t){const{min:e,max:a}=this,i=[],n=[];let o,l,r,c,d;for(o=0,l=t.length;o<l;++o)c=t[o],c>=e&&c<=a&&i.push(c);if(i.length<2)return[{time:e,pos:0},{time:a,pos:1}];for(o=0,l=i.length;o<l;++o)d=i[o+1],r=i[o-1],c=i[o],Math.round((d+r)/2)!==c&&n.push({time:c,pos:o/(l-1)});return n}_generate(){const t=this.min,e=this.max;let a=super.getDataTimestamps();return(!a.includes(t)||!a.length)&&a.splice(0,0,t),(!a.includes(e)||a.length===1)&&a.push(e),a.sort((i,n)=>i-n)}_getTimestampsForTable(){let t=this._cache.all||[];if(t.length)return t;const e=this.getDataTimestamps(),a=this.getLabelTimestamps();return e.length&&a.length?t=this.normalize(e.concat(a)):t=e.length?e:a,t=this._cache.all=t,t}getDecimalForValue(t){return(bs(this._table,t)-this._minPos)/this._tableRange}getValueForPixel(t){const e=this._offsets,a=this.getDecimalForPixel(t)/e.factor-e.end;return bs(this._table,a*this._tableRange+this._minPos,!0)}}var lp=Object.freeze({__proto__:null,CategoryScale:Wo,LinearScale:Uo,LogarithmicScale:Nh,RadialLinearScale:sp,TimeScale:ya,TimeSeriesScale:op});const rp=[pd,Wu,Rh,lp];vt.register(...rp);const ve=window.IO_LINK_API_BASE||"http://localhost:8000",cp=ve.replace(/^http/,"ws");function dp(){return`
    <div class="space-y-4">
      <h1 class="text-2xl font-bold text-base-content">IO-Link Master</h1>
      <p class="text-base-content/70">IFM IO-Link Master – Port status, supervision, and software versions</p>

      <!-- Status card + device image -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body items-center text-center">
            <img id="productImage" src="/assets/img/AL1300.png" alt="AL1300 IO-Link Master" class="max-h-48 object-contain" onerror="this.style.display='none'; document.getElementById('productImagePlaceholder')?.classList.remove('hidden');" />
            <div id="productImagePlaceholder" class="hidden text-base-content/60">AL1300 IO-Link Master</div>
          </div>
        </div>
        <div class="lg:col-span-3 card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content" id="deviceName">IO-Link Master</h2>
            <p class="text-sm text-base-content/70">Connection and data source</p>
            <style>
              .connection-glow-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
              .connection-glow-dot.glow-green { background: #22c55e; box-shadow: 0 0 10px #22c55e, 0 0 20px #22c55e; }
              .connection-glow-dot.glow-red { background: #ef4444; box-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444; }
              .connection-glow-dot.glow-checking { background: #eab308; box-shadow: 0 0 8px #eab308; }
            </style>
            <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div class="flex items-center gap-1"><span class="text-base-content/60">Connection:</span> <span id="connectionGlow" class="connection-glow-dot glow-checking" title="Status"></span><span id="connectionStatus" class="font-medium">Checking...</span></div>
              <div><span class="text-base-content/60">Data Source:</span> <span id="dataSource">-</span></div>
              <div><span class="text-base-content/60">Last Update:</span> <span id="lastUpdate">-</span></div>
              <div><span class="text-base-content/60">Poll:</span> <span id="pollInterval">-</span></div>
            </div>
            <div class="flex gap-2 mt-3">
              <button type="button" class="btn btn-primary btn-sm" id="io-link-refresh-btn">Refresh Now</button>
            </div>
            <div class="mt-3 pt-3 border-t border-base-300">
              <p class="text-xs text-base-content/60 mb-2">IO-Link Master address</p>
              <div class="flex flex-wrap items-center gap-2">
                <input type="text" id="masterIpInput" placeholder="192.168.7.4" class="input input-bordered input-sm w-36" />
                <span class="text-base-content/60 text-sm">Port</span>
                <input type="number" id="masterPortInput" placeholder="80" min="1" max="65535" class="input input-bordered input-sm w-20" />
                <button type="button" class="btn btn-primary btn-sm" id="io-link-save-config-btn">Save</button>
                <span id="configMessage" class="text-sm text-success"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Port Status Table -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Port Status</h2>
          <p class="text-sm text-base-content/70">IO-Link ports and connected devices</p>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-pin-rows">
              <thead>
                <tr>
                  <th>Port</th>
                  <th>Mode</th>
                  <th>Comm. Mode</th>
                  <th>MasterCycle</th>
                  <th>Vendor ID</th>
                  <th>Device ID</th>
                  <th>Name</th>
                  <th>Serial</th>
                  <th>PD In</th>
                  <th>PD Out</th>
                </tr>
              </thead>
              <tbody id="portTableBody">
                <tr><td colspan="10" class="text-center">Loading...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Supervision Trends (charts) -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Supervision Trends</h2>
          <p class="text-sm text-base-content/70">Current, Voltage, Temperature over time</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div><p class="text-sm font-semibold text-center">Current (mA)</p><div class="h-48"><canvas id="chartCurrent"></canvas></div></div>
            <div><p class="text-sm font-semibold text-center">Voltage (mV)</p><div class="h-48"><canvas id="chartVoltage"></canvas></div></div>
            <div><p class="text-sm font-semibold text-center">Temperature (°C)</p><div class="h-48"><canvas id="chartTemp"></canvas></div></div>
          </div>
        </div>
      </div>

      <!-- Supervision + Software -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Supervision</h2>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody id="supervisionTableBody">
                  <tr><td colspan="2" class="text-center">-</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Software Versions</h2>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody id="softwareTableBody">
                  <tr><td colspan="2" class="text-center">-</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Port Details -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-base-content">Active Port Details</h2>
          <p class="text-sm text-base-content/70">Process data and decoded device status</p>
          <div id="portDetailsContainer"><p class="text-center">Loading...</p></div>
        </div>
      </div>
    </div>
  `}function ot(s){if(s==null)return"-";const t=document.createElement("div");return t.textContent=String(s),t.innerHTML}let Ht=[],Yo=null,kt=null,ke=null,gs=0;const An=10,up=5e3;function Be(s,t){const e=document.getElementById("connectionStatus");e&&(e.textContent=s,e.className="font-medium text-error");const a=document.getElementById("connectionGlow");a&&(a.className="connection-glow-dot glow-red");const i=document.getElementById("dataSource");i&&(i.textContent="-"),Yo||(Go([]),Xo({}),qo({}))}function wa(s){if(!s||!s.success){s&&s.error&&Be("Error: "+s.error);return}Yo=s;const t=document.getElementById("connectionStatus");t&&(t.textContent="Connected",t.className="font-medium text-success");const e=document.getElementById("connectionGlow");e&&(e.className="connection-glow-dot glow-green");const a=document.getElementById("dataSource");a&&(a.textContent=s.source||"WebSocket");const i=document.getElementById("deviceName");i&&(i.textContent=s.device_name||"IO-Link Master");const n=document.getElementById("lastUpdate");n&&(n.textContent=new Date().toLocaleTimeString());const o=document.getElementById("pollInterval");o&&(o.textContent="Real-time"),Go(s.ports||[]),Xo(s.supervision||{}),qo(s.software||{}),fp();const l=document.getElementById("productImage"),r=document.getElementById("productImagePlaceholder");l&&(l.src=s.device_icon_url||"/assets/img/AL1300.png",l.classList.remove("hidden"),r&&r.classList.add("hidden"))}function Go(s){const t=document.getElementById("portTableBody");if(t){if(t.innerHTML="",!s||s.length===0){t.innerHTML='<tr><td colspan="10" class="text-center">No port data</td></tr>';return}for(const e of s){const a=(e.mode||"").toLowerCase().includes("io-link"),i=e.pdin?e.pdin.length<=8?e.pdin:e.pdin.substring(0,8)+"...":"-",n=e.pdout?e.pdout.length<=8?e.pdout:e.pdout.substring(0,8)+"...":"-",o=document.createElement("tr");a&&(o.className="bg-success/20"),o.innerHTML=`
      <td>${e.port}</td>
      <td>${ot(e.mode||"-")}</td>
      <td>${ot(e.comm_mode||"-")}</td>
      <td>${ot(e.master_cycle_time||"-")}</td>
      <td>${ot(e.vendor_id||"-")}</td>
      <td>${ot(e.device_id||"-")}</td>
      <td>${ot(e.name||"-")}</td>
      <td>${ot(e.serial||"-")}</td>
      <td><code class="text-xs">${ot(i)}</code></td>
      <td><code class="text-xs">${ot(n)}</code></td>
    `,t.appendChild(o)}hp(s)}}async function hp(s){const t=document.getElementById("portDetailsContainer");if(!t)return;const e=(s||[]).filter(i=>(i.mode||"").toLowerCase().includes("io-link"));if(e.length===0){t.innerHTML='<p class="text-center">No active IO-Link ports</p>';return}let a="";for(const i of e)try{const o=await(await fetch(`${ve}/api/io-link/port/${i.port}`,{signal:AbortSignal.timeout(1e4)})).json();o.success&&o.port?a+=pp(o.port):a+=`<div class="alert alert-warning">Port ${i.port}: No data</div>`}catch{a+=`<div class="alert alert-warning">Port ${i.port}: Error</div>`}t.innerHTML=a||'<p class="text-center">No details</p>'}function pp(s){let t='<div class="rounded-lg border border-base-300 bg-base-100 p-4 mb-3">';if(t+=`<h3 class="font-semibold text-primary">Port ${s.port} – ${ot(s.name||"Unknown")}</h3>`,t+=`<p class="text-sm opacity-80">Vendor: ${ot(s.vendor_id||"-")} | Device: ${ot(s.device_id||"-")} | Serial: ${ot(s.serial||"-")}</p>`,s.pdout&&s.pdout.raw&&(t+=`<p class="text-xs mt-2"><strong>PD Out:</strong> <code>${ot(s.pdout.raw)}</code></p>`,s.pdout.decoded&&s.pdout.decoded.color1)){const e=s.pdout.decoded;t+=`<p class="text-xs">LED: ${e.color1} / ${e.color2} | ${e.animation} | ${e.pulse_pattern}</p>`}return s.pdin&&s.pdin.raw&&(t+=`<p class="text-xs"><strong>PD In:</strong> <code>${ot(s.pdin.raw)}</code></p>`),t+="</div>",t}function Xo(s){const t=document.getElementById("supervisionTableBody");if(!t)return;t.innerHTML="";const e=Object.entries(s||{});if(e.length===0){t.innerHTML='<tr><td colspan="2" class="text-center">No supervision data</td></tr>';return}for(const[a,i]of e){const n=document.createElement("tr");n.innerHTML=`<td>${ot(a)}</td><td>${ot(i)}</td>`,t.appendChild(n)}}function qo(s){const t=document.getElementById("softwareTableBody");if(!t)return;t.innerHTML="";const e=Object.entries(s||{});if(e.length===0){t.innerHTML='<tr><td colspan="2" class="text-center">No software data</td></tr>';return}for(const[a,i]of e){const n=document.createElement("tr");n.innerHTML=`<td>${ot(a)}</td><td>${ot(i)}</td>`,t.appendChild(n)}}function fp(){fetch(`${ve}/api/io-link/supervision-history`,{signal:AbortSignal.timeout(5e3)}).then(s=>s.json()).then(s=>{const t=s.history||[];if(t.length<2)return;const e=t.map((d,u)=>u%Math.max(1,Math.floor(t.length/8))===0||u===t.length-1?new Date(d.ts*1e3).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):""),a=t.map(d=>d.current),i=t.map(d=>d.voltage),n=t.map(d=>d.temperature);Ht.forEach(d=>d.destroy()),Ht=[];const o={responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{display:!0},y:{beginAtZero:!0}}},l=document.getElementById("chartCurrent"),r=document.getElementById("chartVoltage"),c=document.getElementById("chartTemp");l&&Ht.push(new vt(l.getContext("2d"),{type:"line",data:{labels:e,datasets:[{label:"Current",data:a,borderColor:"#4caf50",fill:!0,tension:.3}]},options:o})),r&&Ht.push(new vt(r.getContext("2d"),{type:"line",data:{labels:e,datasets:[{label:"Voltage",data:i,borderColor:"#ff9800",fill:!0,tension:.3}]},options:o})),c&&Ht.push(new vt(c.getContext("2d"),{type:"line",data:{labels:e,datasets:[{label:"Temp",data:n,borderColor:"#f44336",fill:!0,tension:.3}]},options:o}))}).catch(()=>{})}function Ko(){kt&&(kt.close(),kt=null);try{const s=`${cp}/ws`;kt=new WebSocket(s),kt.onopen=()=>{gs=0;const t=document.getElementById("connectionStatus");t&&(t.textContent="Connecting...");const e=document.getElementById("connectionGlow");e&&(e.className="connection-glow-dot glow-checking")},kt.onmessage=t=>{try{const e=JSON.parse(t.data);if(e.type==="ping")return;wa(e)}catch{}},kt.onerror=()=>Be("WebSocket error",!1),kt.onclose=()=>{kt=null,gs<An?(gs++,Be(`Reconnecting (${gs}/${An})...`,!1),ke=setTimeout(Ko,up)):Be("Connection lost. Refresh the page.",!1)}}catch{Be("WebSocket failed"),setTimeout(()=>{const t=document.getElementById("pollInterval");t&&(t.textContent="5s (HTTP)");const e=()=>fetch(`${ve}/api/io-link/status`).then(a=>a.json()).then(wa).catch(()=>{});e(),setInterval(e,5e3)},2e3)}}function bp(){fetch(`${ve}/api/io-link/config`).then(s=>s.json()).then(s=>{if(s.success&&s.io_link){const t=document.getElementById("masterIpInput");t&&(t.value=s.io_link.master_ip||"");const e=document.getElementById("masterPortInput");e&&(e.value=s.io_link.port!=null?s.io_link.port:"80")}}).catch(()=>{})}function gp(){const s=document.getElementById("masterIpInput"),t=document.getElementById("masterPortInput"),e=document.getElementById("configMessage"),a=s&&s.value?s.value.trim():"";if(!a){e&&(e.textContent="Enter an IP address",e.className="text-sm text-error");return}let i=t&&t.value?parseInt(t.value,10):80;(isNaN(i)||i<1||i>65535)&&(i=80),e&&(e.textContent="Saving...",e.className="text-sm"),fetch(`${ve}/api/io-link/config`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({master_ip:a,port:i})}).then(n=>n.json()).then(n=>{e&&(e.textContent=n.success?"Saved.":n.detail||"Error",e.className=n.success?"text-sm text-success":"text-sm text-error"),setTimeout(()=>{e&&(e.textContent="")},4e3)}).catch(n=>{e&&(e.textContent="Error",e.className="text-sm text-error")})}function vp(){ke&&clearTimeout(ke),ke=null,kt&&(kt.close(),kt=null),Ht.forEach(s=>s.destroy()),Ht=[]}function mp(){Ht.forEach(e=>e.destroy()),Ht=[],ke&&clearTimeout(ke),bp(),Ko();const s=document.getElementById("io-link-refresh-btn");s&&(s.onclick=()=>{(!kt||kt.readyState!==WebSocket.OPEN)&&fetch(`${ve}/api/io-link/status`).then(e=>e.json()).then(wa).catch(()=>{})});const t=document.getElementById("io-link-save-config-btn");t&&(t.onclick=gp)}vt.register(go,bo,Rs,Wo,Uo,To,Je,Oo,Po,No,Ho,Fo);function xp(){return`
    <!-- Gauges – Various styles and options -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-base-content">Gauges</h1>
      <p class="text-base-content mt-1">Radial and linear gauges in different sizes, colours, and options.</p>
    </div>

    <!-- Radial progress – sizes -->
    <section class="card bg-base-200 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title text-base-content">Radial progress – sizes</h2>
        <p class="text-sm text-base-content">Small (3rem), default (4rem), large (6rem), XL (8rem). Value 65%.</p>
        <div class="flex flex-wrap items-end gap-8 mt-4">
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:65; --size:3rem;" role="progressbar">65%</div>
            <span class="text-xs mt-2 text-base-content">3rem</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:65; --size:4rem;" role="progressbar">65%</div>
            <span class="text-xs mt-2 text-base-content">4rem</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:65; --size:6rem;" role="progressbar">65%</div>
            <span class="text-xs mt-2 text-base-content">6rem</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:65; --size:8rem;" role="progressbar">65%</div>
            <span class="text-xs mt-2 text-base-content">8rem</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Radial progress – colours -->
    <section class="card bg-base-200 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title text-base-content">Radial progress – colours</h2>
        <p class="text-sm text-base-content">DaisyUI semantic colours: primary, secondary, accent, success, warning, error, info, neutral.</p>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 mt-4">
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:70; --size:4rem;" role="progressbar">70%</div>
            <span class="text-xs mt-2 text-base-content">primary</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-secondary" style="--value:70; --size:4rem;" role="progressbar">70%</div>
            <span class="text-xs mt-2 text-base-content">secondary</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-accent" style="--value:70; --size:4rem;" role="progressbar">70%</div>
            <span class="text-xs mt-2 text-base-content">accent</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-success" style="--value:70; --size:4rem;" role="progressbar">70%</div>
            <span class="text-xs mt-2 text-base-content">success</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-warning" style="--value:70; --size:4rem;" role="progressbar">70%</div>
            <span class="text-xs mt-2 text-base-content">warning</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-error" style="--value:70; --size:4rem;" role="progressbar">70%</div>
            <span class="text-xs mt-2 text-base-content">error</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-info" style="--value:70; --size:4rem;" role="progressbar">70%</div>
            <span class="text-xs mt-2 text-base-content">info</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-base-content" style="--value:70; --size:4rem;" role="progressbar">70%</div>
            <span class="text-xs mt-2 text-base-content">neutral</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Radial progress – thickness (via size vs stroke) -->
    <section class="card bg-base-200 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title text-base-content">Radial progress – values</h2>
        <p class="text-sm text-base-content">Different percentage values: 0, 25, 50, 75, 100.</p>
        <div class="flex flex-wrap gap-8 mt-4">
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:0; --size:4rem;" role="progressbar">0%</div>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:25; --size:4rem;" role="progressbar">25%</div>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:50; --size:4rem;" role="progressbar">50%</div>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:75; --size:4rem;" role="progressbar">75%</div>
          </div>
          <div class="flex flex-col items-center">
            <div class="radial-progress text-primary" style="--value:100; --size:4rem;" role="progressbar">100%</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Linear progress – styles -->
    <section class="card bg-base-200 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title text-base-content">Linear progress</h2>
        <p class="text-sm text-base-content">Standard, with colours and sizes. Use <code class="text-xs bg-base-300 px-1 rounded">progress</code> and <code class="text-xs bg-base-300 px-1 rounded">progress-primary</code>, etc.</p>
        <div class="space-y-4 mt-4">
          <div>
            <div class="flex justify-between text-xs text-base-content mb-1">
              <span>Default</span>
              <span>60%</span>
            </div>
            <progress class="progress w-full" value="60" max="100"></progress>
          </div>
          <div>
            <div class="flex justify-between text-xs text-base-content mb-1">
              <span>progress-primary</span>
              <span>75%</span>
            </div>
            <progress class="progress progress-primary w-full" value="75" max="100"></progress>
          </div>
          <div>
            <div class="flex justify-between text-xs text-base-content mb-1">
              <span>progress-secondary</span>
              <span>40%</span>
            </div>
            <progress class="progress progress-secondary w-full" value="40" max="100"></progress>
          </div>
          <div>
            <div class="flex justify-between text-xs text-base-content mb-1">
              <span>progress-success</span>
              <span>90%</span>
            </div>
            <progress class="progress progress-success w-full" value="90" max="100"></progress>
          </div>
          <div>
            <div class="flex justify-between text-xs text-base-content mb-1">
              <span>progress-warning</span>
              <span>55%</span>
            </div>
            <progress class="progress progress-warning w-full" value="55" max="100"></progress>
          </div>
          <div>
            <div class="flex justify-between text-xs text-base-content mb-1">
              <span>progress-error</span>
              <span>20%</span>
            </div>
            <progress class="progress progress-error w-full" value="20" max="100"></progress>
          </div>
        </div>
      </div>
    </section>

    <!-- Gauge layout options -->
    <section class="card bg-base-200 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title text-base-content">Gauge layout options</h2>
        <p class="text-sm text-base-content">With label below, label inside (value only), or in a grid. Useful for HMI dashboards.</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          <div class="flex flex-col items-center p-4 bg-base-300 rounded-lg">
            <div class="radial-progress text-primary" style="--value:82; --size:5rem;" role="progressbar">82%</div>
            <span class="text-sm font-medium mt-2 text-base-content">Fan speed</span>
            <span class="text-xs text-base-content">Target 80%</span>
          </div>
          <div class="flex flex-col items-center p-4 bg-base-300 rounded-lg">
            <div class="radial-progress text-info" style="--value:45; --size:5rem;" role="progressbar">45</div>
            <span class="text-sm font-medium mt-2 text-base-content">Temperature</span>
            <span class="text-xs text-base-content">°C</span>
          </div>
          <div class="flex flex-col items-center p-4 bg-base-300 rounded-lg">
            <div class="radial-progress text-warning" style="--value:100; --size:5rem;" role="progressbar">100</div>
            <span class="text-sm font-medium mt-2 text-base-content">Pressure</span>
            <span class="text-xs text-base-content">kPa</span>
          </div>
          <div class="flex flex-col items-center p-4 bg-base-300 rounded-lg">
            <div class="radial-progress text-success" style="--value:60; --size:5rem;" role="progressbar">60%</div>
            <span class="text-sm font-medium mt-2 text-base-content">Load</span>
            <span class="text-xs text-base-content">Normal</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Compact row -->
    <section class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-base-content">Compact row (e.g. status bar)</h2>
        <p class="text-sm text-base-content">Small radial gauges in a row with minimal labels.</p>
        <div class="flex flex-wrap gap-6 mt-4 items-center">
          <div class="radial-progress text-primary" style="--value:70; --size:3rem;" role="progressbar">70</div>
          <div class="radial-progress text-secondary" style="--value:85; --size:3rem;" role="progressbar">85</div>
          <div class="radial-progress text-accent" style="--value:40; --size:3rem;" role="progressbar">40</div>
          <div class="radial-progress text-success" style="--value:100; --size:3rem;" role="progressbar">100</div>
          <div class="radial-progress text-warning" style="--value:55; --size:3rem;" role="progressbar">55</div>
        </div>
      </div>
    </section>
  `}function yp(){return`
    <!-- Graphs - chart showcase -->
    <section class="space-y-4">
      <div class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Graph Showcase</h2>
          <p class="text-sm">
            Multiple Chart.js styles in one page: area line, stacked bars, combo (bar+line),
            horizontal bars, doughnut, and stepped response chart.
          </p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h3 class="card-title text-base">Process Trend (Area Line)</h3>
              <span class="badge badge-success badge-sm">Live-style</span>
            </div>
            <div class="h-64">
              <canvas id="home2-trend-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h3 class="card-title text-base">Energy Mix (Bar + Line)</h3>
              <span class="badge badge-info badge-sm">Dual axis</span>
            </div>
            <div class="h-64">
              <canvas id="home2-combo-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h3 class="card-title text-base">Shift Output (Stacked Bars)</h3>
              <span class="badge badge-warning badge-sm">Stacked</span>
            </div>
            <div class="h-64">
              <canvas id="home2-stacked-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h3 class="card-title text-base">Line Utilization (Horizontal Bar)</h3>
              <span class="badge badge-secondary badge-sm">indexAxis y</span>
            </div>
            <div class="h-64">
              <canvas id="home2-horizontal-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h3 class="card-title text-base">Alarm Distribution (Doughnut)</h3>
              <span class="badge badge-error badge-sm">Composition</span>
            </div>
            <div class="h-64">
              <canvas id="home2-doughnut-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <h3 class="card-title text-base">Controller Step Response</h3>
              <span class="badge badge-neutral badge-sm">Stepped</span>
            </div>
            <div class="h-64">
              <canvas id="home2-step-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>
  `}function wp(){return`
    <!-- Home Template 3 - engineering tables showcase -->
    <section class="space-y-4">
      <div class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Tables</h2>
          <p class="text-sm">Examples of common industrial tables: live sensors, maintenance logs, BOM, and active alarms.</p>
        </div>
      </div>

      <div class="card bg-base-200 shadow">
        <div class="card-body">
          <h3 class="card-title text-base">Live Sensor Readings (Zebra)</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Device</th>
                  <th>Value</th>
                  <th>Units</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>TT-101</td><td>Heat Exchanger Outlet</td><td>67.4</td><td>C</td><td><span class="badge badge-success badge-sm">Normal</span></td></tr>
                <tr><td>PT-204</td><td>Main Header</td><td>5.8</td><td>bar</td><td><span class="badge badge-success badge-sm">Normal</span></td></tr>
                <tr><td>FT-309</td><td>Recirculation Loop</td><td>12.6</td><td>L/min</td><td><span class="badge badge-warning badge-sm">Drift</span></td></tr>
                <tr><td>LT-412</td><td>Buffer Tank</td><td>78.2</td><td>%</td><td><span class="badge badge-success badge-sm">Normal</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h3 class="card-title text-base">Maintenance Work Orders (Compact)</h3>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>WO</th>
                    <th>Asset</th>
                    <th>Task</th>
                    <th>Due</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>WO-8841</td><td>P-201</td><td>Seal inspection</td><td>2026-02-14</td><td>J. Patel</td></tr>
                  <tr><td>WO-8843</td><td>M-105</td><td>Bearing vibration check</td><td>2026-02-15</td><td>S. Green</td></tr>
                  <tr><td>WO-8848</td><td>VFD-12</td><td>Fan filter clean</td><td>2026-02-17</td><td>A. Khan</td></tr>
                  <tr><td>WO-8852</td><td>HX-02</td><td>Plate pack thermal wash</td><td>2026-02-20</td><td>L. Woods</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h3 class="card-title text-base">Bill of Materials (Pinned Header)</h3>
            <div class="overflow-x-auto max-h-72">
              <table class="table table-pin-rows">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Part Number</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>PT100 RTD Sensor, Class A, 3-wire</td><td>8</td><td>RTD-PT100-A3</td></tr>
                  <tr><td>2</td><td>24VDC Contactor, 2NO/2NC</td><td>6</td><td>CTR-24DC-2X2</td></tr>
                  <tr><td>3</td><td>Shielded Instrument Cable 2x1.5mm2</td><td>120 m</td><td>CAB-INS-2X15</td></tr>
                  <tr><td>4</td><td>DIN Rail Terminal Block, Grey</td><td>40</td><td>TB-DIN-GRY</td></tr>
                  <tr><td>5</td><td>Safety Relay Module, Dual Channel</td><td>2</td><td>SRM-2CH-24V</td></tr>
                  <tr><td>6</td><td>Pressure Transmitter 0-10 bar, 4-20mA</td><td>4</td><td>PT-10BAR-420</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow">
        <div class="card-body">
          <h3 class="card-title text-base">Alarm and Event Log (With Row Highlighting)</h3>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Area</th>
                  <th>Event</th>
                  <th>Severity</th>
                  <th>Ack</th>
                </tr>
              </thead>
              <tbody>
                <tr class="bg-error/10">
                  <td>14:21:08</td>
                  <td>Compressor Skid</td>
                  <td>Discharge pressure high-high trip</td>
                  <td><span class="badge badge-error badge-sm">Critical</span></td>
                  <td>No</td>
                </tr>
                <tr class="bg-warning/10">
                  <td>14:18:42</td>
                  <td>Cooling Loop</td>
                  <td>Flow below warning threshold</td>
                  <td><span class="badge badge-warning badge-sm">Warning</span></td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>14:10:15</td>
                  <td>Boiler Feed</td>
                  <td>Operator changed setpoint from 5.5 to 5.8 bar</td>
                  <td><span class="badge badge-info badge-sm">Info</span></td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>13:58:03</td>
                  <td>MCC Room</td>
                  <td>VFD-12 returned to service</td>
                  <td><span class="badge badge-success badge-sm">Normal</span></td>
                  <td>Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h3 class="card-title text-base">Operator Shift Checklist (Dense + Pinned First Column)</h3>
            <div class="overflow-x-auto">
              <table class="table table-xs table-pin-cols">
                <thead>
                  <tr>
                    <th>Check</th>
                    <th>Line 1</th>
                    <th>Line 2</th>
                    <th>Line 3</th>
                    <th>Line 4</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><th>Guarding in place</th><td>OK</td><td>OK</td><td>OK</td><td>OK</td><td>Verified at startup</td></tr>
                  <tr><th>E-stop functional test</th><td>Pass</td><td>Pass</td><td>Pass</td><td>Pass</td><td>All channels healthy</td></tr>
                  <tr><th>Air supply (bar)</th><td>6.1</td><td>6.0</td><td>6.2</td><td>6.0</td><td>Within 5.8-6.5 bar</td></tr>
                  <tr><th>Coolant conductivity</th><td>Normal</td><td>Normal</td><td>Normal</td><td>High</td><td>Line 4 sample to lab</td></tr>
                  <tr><th>PPE compliance</th><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Supervisor signoff complete</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h3 class="card-title text-base">Calibration Matrix (Hover + Status Badges)</h3>
            <div class="overflow-x-auto">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Instrument</th>
                    <th>Range</th>
                    <th>Last Cal</th>
                    <th>Next Due</th>
                    <th>As-Found</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>PT-204</td><td>0-10 bar</td><td>2025-11-22</td><td>2026-05-22</td><td>+0.08%</td><td><span class="badge badge-success badge-sm">In Tolerance</span></td></tr>
                  <tr><td>TT-101</td><td>0-150 C</td><td>2025-08-14</td><td>2026-02-14</td><td>+0.42%</td><td><span class="badge badge-warning badge-sm">Due Soon</span></td></tr>
                  <tr><td>FT-309</td><td>0-25 L/min</td><td>2025-05-03</td><td>2025-11-03</td><td>+1.21%</td><td><span class="badge badge-error badge-sm">Overdue</span></td></tr>
                  <tr><td>LT-412</td><td>0-100%</td><td>2025-12-10</td><td>2026-06-10</td><td>-0.13%</td><td><span class="badge badge-success badge-sm">In Tolerance</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  `}function kp(){return`
    <!-- Electrical Machines – Industrial Control Interface -->

    <!-- ── Top Status Bar ──────────────────────────────────── -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 mb-4">

      <!-- System state — big, colour-coded per design philosophy -->
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">System State</div>
        <div class="stat-value text-2xl font-mono font-bold text-success">RUNNING</div>
        <div class="stat-desc">All systems nominal</div>
      </div>

      <!-- E-Stop + Comms LEDs -->
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Safety / Comms</div>
        <div class="flex flex-col gap-2 mt-1">
          <span class="badge badge-neutral badge-sm font-mono">E-STOP SAFE</span>
          <div class="flex gap-1 flex-wrap">
            <span class="badge badge-success badge-xs font-mono">POWER</span>
            <span class="badge badge-success badge-xs font-mono">COMMS</span>
            <span class="badge badge-neutral badge-xs font-mono">MOTOR IN</span>
          </div>
        </div>
      </div>

      <!-- Active mode: MANUAL=amber, PRESET=neutral, REMOTE=blue -->
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Active Mode</div>
        <div class="mt-1">
          <div class="join">
            <button class="btn join-item btn-xs btn-warning font-mono">MANUAL</button>
            <button class="btn join-item btn-xs font-mono">PRESET</button>
            <button class="btn join-item btn-xs font-mono">REMOTE</button>
          </div>
        </div>
        <div class="stat-desc mt-1">Manual control active</div>
      </div>

      <!-- Data logging -->
      <div class="stat bg-base-200 shadow-lg rounded-lg sm:col-span-2 lg:col-span-3 2xl:col-span-2">
        <div class="stat-title">Data Logging</div>
        <div class="flex items-center gap-2 mt-1">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span class="badge badge-success badge-sm font-mono">ON</span>
          <span class="font-mono text-xs truncate">run_20260212_143021.csv</span>
        </div>
        <div class="stat-desc">Elapsed: 00:14:22 · 865 rows</div>
      </div>

    </div>

    <!-- ── Control Actions — always first, always visible ───────── -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-base-200 rounded-xl shadow-xl">
      <div class="flex gap-3 flex-wrap">
        <button class="btn btn-success btn-lg font-mono">START</button>
        <button class="btn btn-error btn-lg font-mono">STOP</button>
        <button class="btn btn-error btn-outline btn-lg font-mono">E-STOP</button>
        <button class="btn btn-warning btn-lg font-mono">RESET FAULT</button>
      </div>
      <div class="flex items-center gap-4 flex-wrap">
        <label class="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" class="toggle toggle-warning toggle-sm mt-0.5" checked />
          <div>
            <div class="text-sm font-mono font-bold">Safe changes</div>
            <div class="text-xs">Slider / input changes stage until APPLY</div>
          </div>
        </label>
        <button class="btn btn-primary btn-lg font-mono">APPLY</button>
      </div>
    </div>

    <div class="card bg-base-200 shadow-xl mt-4 mb-4 border border-base-300">
      <div class="card-body">
        <h2 class="card-title text-base font-mono">3-Phase Waveform Monitor</h2>
        <p class="text-xs opacity-80">Full-width monitoring for AC output quality and phase balance.</p>
        <div class="grid gap-3 mt-2 xl:grid-cols-2">
          <div class="bg-base-300 rounded-lg p-3 min-w-0">
            <div class="text-sm font-mono mb-2">3-Phase Voltage (L-N)</div>
            <div class="h-56 md:h-64">
              <canvas id="acVoltage3PhaseChart"></canvas>
            </div>
          </div>
          <div class="bg-base-300 rounded-lg p-3 min-w-0">
            <div class="text-sm font-mono mb-2">3-Phase Current</div>
            <div class="h-56 md:h-64">
              <canvas id="acCurrent3PhaseChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-200 shadow mb-4 border border-base-300">
      <div class="card-body py-3">
        <div class="grid gap-3 xl:grid-cols-2">
          <div class="bg-base-300 rounded-lg p-3">
            <h2 class="card-title text-sm font-mono mb-1">Current Objective</h2>
            <p class="text-sm">Bring motor to <span class="font-mono font-bold">1500 rpm</span> at <span class="font-mono font-bold">50 Hz</span> while keeping torque under <span class="font-mono font-bold">4.0 N-m</span>.</p>
          </div>
          <div class="bg-base-300 rounded-lg p-3">
            <h2 class="card-title text-sm font-mono mb-1">Do This Next</h2>
            <ul class="text-xs space-y-1">
              <li>1. Set Load and PSU limits.</li>
              <li>2. Press APPLY.</li>
              <li>3. Watch RPM, torque, and 3-phase waveforms below.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Main Body: 3 equal columns ─────────────────────────── -->
    <div class="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3 mb-2">
      <div class="badge badge-outline py-3 w-full justify-center font-mono">Machine Load</div>
      <div class="badge badge-outline py-3 w-full justify-center font-mono">DC Power Setup</div>
      <div class="badge badge-outline py-3 w-full justify-center font-mono">AC + Feedback</div>
    </div>
    <div class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">

      <!-- ── Column 1: Load / Dynamometer ──────────────────────── -->
      <div class="space-y-4 min-w-0">

        <!-- RPM and Torque -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm font-mono">RPM / Torque</h2>
            <div class="flex items-center justify-around py-2">
              <div class="flex flex-col items-center gap-1">
                <div class="radial-progress text-base-content font-bold"
                  style="--value:51; --size:7rem; --thickness:10px;" role="progressbar">
                  <div class="text-center leading-tight">
                    <div class="text-xl font-bold font-mono">1530</div>
                    <div class="text-xs">rpm</div>
                  </div>
                </div>
                <span class="text-xs">0 – 3000 rpm</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <div class="radial-progress text-base-content font-bold"
                  style="--value:34; --size:5rem; --thickness:8px;" role="progressbar">
                  <div class="text-center leading-tight">
                    <div class="text-base font-bold font-mono">3.4</div>
                    <div class="text-xs">N·m</div>
                  </div>
                </div>
                <span class="text-xs">0 – 10 N·m</span>
              </div>
            </div>
            <!-- RPM sparkline -->
            <div class="h-16 mt-1">
              <canvas id="rpmSparkline"></canvas>
            </div>
          </div>
        </div>

        <!-- Load control -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm font-mono">Load Control</h2>
            <div class="form-control min-w-0">
              <label class="label gap-2">
                <span class="label-text font-bold">Load</span>
                <span class="label-text-alt font-mono">60%</span>
              </label>
              <input type="range" min="0" max="100" value="60" class="range range-sm w-full" step="1" />
              <div class="grid w-full grid-cols-5 text-[10px] sm:text-xs px-1 mt-1">
                <span class="text-left">0%</span>
                <span class="text-center invisible sm:visible">25%</span>
                <span class="text-center">50%</span>
                <span class="text-center invisible sm:visible">75%</span>
                <span class="text-right">100%</span>
              </div>
            </div>
            <div class="flex items-center gap-1 mt-3 flex-wrap">
              <span class="text-xs font-mono mr-1">Step:</span>
              <button class="btn btn-outline btn-xs font-mono">−5%</button>
              <button class="btn btn-outline btn-xs font-mono">−1%</button>
              <button class="btn btn-outline btn-xs font-mono">+1%</button>
              <button class="btn btn-outline btn-xs font-mono">+5%</button>
            </div>
            <div class="grid grid-cols-2 gap-3 mt-3">
              <div class="form-control">
                <label class="label py-0"><span class="label-text text-xs">Load limit (%)</span></label>
                <input type="number" class="input input-bordered input-sm font-mono" min="0" max="100" value="90" />
              </div>
              <div class="form-control">
                <label class="label py-0"><span class="label-text text-xs">Ramp rate (%/s)</span></label>
                <input type="number" class="input input-bordered input-sm font-mono" min="0" max="50" value="5" />
              </div>
            </div>
          </div>
        </div>

        <!-- Load electrical -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm font-mono">Load Electrical</h2>
            <div class="grid grid-cols-3 gap-2 mt-2">
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-2xl font-mono font-bold">4.2</div>
                <div class="text-xs">A (jack A)</div>
              </div>
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-2xl font-mono font-bold">4.1</div>
                <div class="text-xs">A (jack B)</div>
              </div>
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-2xl font-mono font-bold">48.5</div>
                <div class="text-xs">V</div>
              </div>
            </div>
            <div class="form-control mt-3">
              <label class="label py-0"><span class="label-text text-xs">Measurement range</span></label>
              <select class="select select-bordered select-sm font-mono">
                <option>0 – 5 A</option>
                <option>0 – 10 A</option>
                <option>0 – 20 A</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Column 2: DC PSU 1, DC PSU 2, DC Routing ──────────── -->
      <div class="space-y-4 min-w-0">

        <!-- DC PSU 1 -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <h2 class="card-title text-sm font-mono">DC PSU 1</h2>
              <label class="flex items-center gap-2 cursor-pointer">
                <span class="text-xs font-mono">Output</span>
                <input type="checkbox" class="toggle toggle-success toggle-sm" checked />
                <span class="text-xs font-mono text-success font-bold">ON</span>
              </label>
            </div>
            <div class="form-control min-w-0">
              <label class="label py-0 gap-2">
                <span class="label-text text-xs font-bold">Voltage set (V)</span>
                <span class="label-text-alt font-mono text-xs">24.0 V</span>
              </label>
              <input type="range" min="0" max="60" value="24" class="range range-sm w-full" step="0.5" />
            </div>
            <div class="form-control mt-2 min-w-0">
              <label class="label py-0 gap-2">
                <span class="label-text text-xs font-bold">Current limit (A)</span>
                <span class="label-text-alt font-mono text-xs">5.0 A</span>
              </label>
              <input type="range" min="0" max="10" value="5" class="range range-sm w-full" step="0.1" />
            </div>
            <div class="grid grid-cols-3 gap-2 mt-3">
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-xl font-mono font-bold">23.8</div>
                <div class="text-xs">V</div>
              </div>
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-xl font-mono font-bold">2.3</div>
                <div class="text-xs">A</div>
              </div>
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-xl font-mono font-bold">54.7</div>
                <div class="text-xs">W</div>
              </div>
            </div>
            <!-- Protection indicators: active mode = amber, tripped = red, idle = ghost -->
            <div class="flex gap-1 mt-3 flex-wrap">
              <span class="badge badge-ghost badge-sm font-mono">CV</span>
              <span class="badge badge-warning badge-sm font-mono">CC</span>
              <span class="badge badge-ghost badge-sm font-mono">OVP</span>
              <span class="badge badge-ghost badge-sm font-mono">OCP</span>
            </div>
          </div>
        </div>

        <!-- DC PSU 2 — identical layout to PSU 1 -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <h2 class="card-title text-sm font-mono">DC PSU 2</h2>
              <label class="flex items-center gap-2 cursor-pointer">
                <span class="text-xs font-mono">Output</span>
                <input type="checkbox" class="toggle toggle-success toggle-sm" />
                <span class="text-xs font-mono">OFF</span>
              </label>
            </div>
            <div class="form-control min-w-0">
              <label class="label py-0 gap-2">
                <span class="label-text text-xs font-bold">Voltage set (V)</span>
                <span class="label-text-alt font-mono text-xs">12.0 V</span>
              </label>
              <input type="range" min="0" max="60" value="12" class="range range-sm w-full" step="0.5" />
            </div>
            <div class="form-control mt-2 min-w-0">
              <label class="label py-0 gap-2">
                <span class="label-text text-xs font-bold">Current limit (A)</span>
                <span class="label-text-alt font-mono text-xs">3.0 A</span>
              </label>
              <input type="range" min="0" max="10" value="3" class="range range-sm w-full" step="0.1" />
            </div>
            <div class="grid grid-cols-3 gap-2 mt-3">
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-xl font-mono font-bold">0.0</div>
                <div class="text-xs">V</div>
              </div>
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-xl font-mono font-bold">0.0</div>
                <div class="text-xs">A</div>
              </div>
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-xl font-mono font-bold">0.0</div>
                <div class="text-xs">W</div>
              </div>
            </div>
            <div class="flex gap-1 mt-3 flex-wrap">
              <span class="badge badge-ghost badge-sm font-mono">CV</span>
              <span class="badge badge-ghost badge-sm font-mono">CC</span>
              <span class="badge badge-ghost badge-sm font-mono">OVP</span>
              <span class="badge badge-ghost badge-sm font-mono">OCP</span>
            </div>
          </div>
        </div>

        <!-- DC output routing -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm font-mono">DC Output Routing</h2>
            <div class="grid grid-cols-2 gap-3 mt-1">
              <div class="form-control">
                <label class="label py-0"><span class="label-text text-xs">DC Output 1</span></label>
                <select class="select select-bordered select-sm font-mono">
                  <option>PSU 1</option>
                  <option>PSU 2</option>
                  <option>Off</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label py-0"><span class="label-text text-xs">DC Output 2</span></label>
                <select class="select select-bordered select-sm font-mono">
                  <option>PSU 2</option>
                  <option>PSU 1</option>
                  <option>Off</option>
                </select>
              </div>
            </div>
            <label class="flex items-start gap-2 cursor-pointer mt-3">
              <input type="checkbox" class="checkbox checkbox-sm mt-0.5" checked />
              <span class="text-xs">Interlock — prevent both outputs routing from the same PSU</span>
            </label>
          </div>
        </div>

      </div>

      <!-- ── Column 3: AC PSU + Brushless + Capacitor Bank ──────── -->
      <div class="space-y-4 min-w-0">

        <!-- AC PSU -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <h2 class="card-title text-sm font-mono">AC PSU</h2>
              <label class="flex items-center gap-2 cursor-pointer">
                <span class="text-xs font-mono">Output</span>
                <input type="checkbox" class="toggle toggle-success toggle-sm" checked />
                <span class="text-xs font-mono text-success font-bold">ON</span>
              </label>
            </div>
            <!-- Phase mode -->
            <div class="join w-full mb-3">
              <button class="btn join-item btn-sm flex-1 btn-active font-mono">1-Phase</button>
              <button class="btn join-item btn-sm flex-1 font-mono">3-Phase</button>
            </div>
            <div class="form-control min-w-0">
              <label class="label py-0 gap-2">
                <span class="label-text text-xs font-bold">Frequency (Hz)</span>
                <span class="label-text-alt font-mono text-xs">50.0 Hz</span>
              </label>
              <input type="range" min="0" max="100" value="50" class="range range-sm w-full" step="0.5" />
              <div class="grid w-full grid-cols-5 text-[10px] sm:text-xs px-1 mt-1">
                <span class="text-left">0</span>
                <span class="text-center invisible sm:visible">25</span>
                <span class="text-center">50</span>
                <span class="text-center invisible sm:visible">75</span>
                <span class="text-right">100 Hz</span>
              </div>
            </div>
            <div class="form-control mt-2 min-w-0">
              <label class="label py-0 gap-2">
                <span class="label-text text-xs font-bold">Voltage set (V)</span>
                <span class="label-text-alt font-mono text-xs">230 V</span>
              </label>
              <input type="range" min="0" max="240" value="230" class="range range-sm w-full" step="1" />
            </div>
            <div class="grid grid-cols-3 gap-2 mt-3">
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-xl font-mono font-bold">228</div>
                <div class="text-xs">Vac</div>
              </div>
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-xl font-mono font-bold">1.8</div>
                <div class="text-xs">Iac (A)</div>
              </div>
              <div class="text-center bg-base-300 rounded p-2">
                <div class="text-xl font-mono font-bold">50.0</div>
                <div class="text-xs">Hz</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 mt-3">
              <div class="form-control">
                <label class="label py-0"><span class="label-text text-xs">Soft-start (s)</span></label>
                <input type="number" class="input input-bordered input-sm font-mono" min="0" max="30" value="2" />
              </div>
              <div class="form-control">
                <label class="label py-0"><span class="label-text text-xs">Freq ramp (Hz/s)</span></label>
                <input type="number" class="input input-bordered input-sm font-mono" min="0" max="50" value="5" />
              </div>
            </div>
          </div>
        </div>

        <!-- Brushless feedback -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm font-mono">Brushless Feedback</h2>
            <div class="grid grid-cols-2 gap-2 mt-1">
              <div class="text-center bg-base-300 rounded p-3">
                <div class="text-2xl font-mono font-bold">1528</div>
                <div class="text-xs mt-1">Speed feedback (rpm)</div>
              </div>
              <div class="text-center bg-base-300 rounded p-3">
                <div class="text-2xl font-mono font-bold">48.2</div>
                <div class="text-xs mt-1">DC bus (V)</div>
              </div>
            </div>
            <div class="space-y-2 mt-3">
              <div class="flex items-center justify-between text-xs">
                <span>Commutation</span>
                <span class="badge badge-success badge-sm font-mono">LOCK</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span>Hall sensors</span>
                <span class="badge badge-success badge-sm font-mono">OK</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span>Encoder</span>
                <span class="badge badge-neutral badge-sm font-mono">N/A</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Capacitor bank -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm font-mono">Capacitor Bank</h2>
            <div class="grid grid-cols-2 gap-2 mt-1">
              <div class="text-center bg-base-300 rounded p-3">
                <div class="text-2xl font-mono font-bold">47.8</div>
                <div class="text-xs mt-1">Bank voltage (V)</div>
              </div>
              <div class="flex flex-col items-center justify-center gap-1">
                <span class="badge badge-neutral font-mono">IDLE</span>
                <span class="text-xs">Charge state</span>
              </div>
            </div>
            <!-- Discharge = destructive but reversible → outlined red -->
            <button class="btn btn-error btn-outline btn-sm w-full mt-3 font-mono">DISCHARGE</button>
          </div>
        </div>

      </div>
    </div>

  `}function Sp(){return`
    <!-- Wind Tunnel – Open Circuit Sub-Sonic, Bench-Top Training System -->

    <!-- System Title (structural: neutral only) -->
    <div class="mb-4 p-3 bg-base-200 rounded-lg border-l-4 border-base-300">
      <h1 class="text-xl font-bold text-base-content">Open Circuit Sub-Sonic Wind Tunnel</h1>
      <p class="text-sm text-base-content mt-1">125 mm transparent test section · 9.2:1 contraction · Computer controlled fan · LED flow visualisation</p>
    </div>

    <!-- Top Status Bar: normal data = grey; colour only for state (running = green) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Tunnel Status</div>
        <div class="stat-value text-2xl flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          <span class="text-success font-bold">ACTIVE</span>
        </div>
        <div class="stat-desc text-base-content">Bench-top · Teaching mode</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Test Section Speed</div>
        <div class="stat-value text-3xl text-base-content">28.4 m/s</div>
        <div class="stat-desc text-base-content">from setpoint · max 35 m/s</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Contraction Ratio</div>
        <div class="stat-value text-3xl text-base-content">9.2:1</div>
        <div class="stat-desc text-base-content">Honeycomb · uniform flow</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Fan Power</div>
        <div class="stat-value text-3xl text-base-content">81%</div>
        <div class="stat-desc text-base-content">variable speed</div>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="grid gap-4 lg:grid-cols-3">
      
      <!-- Left: Main Charts and Visualization -->
      <div class="lg:col-span-2 space-y-4">
        
        <!-- Air Speed Chart (normal operation: no decorative colour) -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <h2 class="card-title text-base-content">
                <svg class="w-5 h-5 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Test Section Air Speed
              </h2>
              <div class="badge badge-ghost gap-2 text-base-content">
                DATA ACQUISITION
              </div>
            </div>
            <p class="text-xs text-base-content mb-2">125 mm transparent test section · range 0–35+ m/s</p>
            <div class="h-64">
              <canvas id="airSpeedChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Pressure Distribution Chart -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Pressure Distribution</h2>
            <div class="h-48">
              <canvas id="pressureChart2"></canvas>
            </div>
          </div>
        </div>

        <!-- Flow Path (structural: neutral; OK = grey; running = green only on active section) -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Flow Path</h2>
            <p class="text-xs text-base-content mb-2">Contraction nozzle (9.2:1 honeycomb) → 125 mm test section → variable speed fan</p>
            <div class="grid grid-cols-5 gap-2 mt-4">
              <div class="flex flex-col items-center">
                <div class="w-16 h-16 bg-base-300 rounded-lg flex items-center justify-center text-base-content font-bold text-xs shadow">
                  INLET
                </div>
                <div class="badge badge-ghost badge-sm mt-2 text-base-content">OK</div>
                <div class="text-xs mt-1 text-base-content">9.2:1 honeycomb</div>
              </div>
              <svg class="w-8 h-16 text-base-content self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
              <div class="flex flex-col items-center">
                <div class="w-16 h-16 bg-base-300 rounded-lg flex items-center justify-center text-base-content font-bold text-xs shadow border-2 border-success">
                  125 mm
                </div>
                <div class="badge badge-success badge-sm mt-2">ACTIVE</div>
                <div class="text-xs mt-1 text-base-content">28.4 m/s</div>
              </div>
              <svg class="w-8 h-16 text-base-content self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
              <div class="flex flex-col items-center">
                <div class="w-16 h-16 bg-base-300 rounded-lg flex items-center justify-center text-base-content font-bold text-xs shadow">
                  FAN
                </div>
                <div class="badge badge-ghost badge-sm mt-2 text-base-content">OK</div>
                <div class="text-xs mt-1 text-base-content">81% · finger guard</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Controls and Gauges -->
      <div class="space-y-4">
        
        <!-- Main Control Panel (structural: neutral; action colours per philosophy) -->
        <div class="card bg-base-200 shadow-xl border border-base-300">
          <div class="card-body">
            <h2 class="card-title text-base-content">
              <svg class="w-5 h-5 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
              </svg>
              Tunnel Controls
            </h2>

            <!-- Start/Stop (green = RUN, red = STOP per action colours) -->
            <div class="flex gap-2 mb-4">
              <button class="btn btn-success flex-1 btn-lg">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                </svg>
                START
              </button>
              <button class="btn btn-error flex-1 btn-lg">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"/>
                </svg>
                STOP
              </button>
            </div>

            <!-- Test Mode Selector (neutral: no colour for structure) -->
            <div class="form-control mb-3">
              <label class="label">
                <span class="label-text font-bold text-base-content">Test Mode</span>
              </label>
              <div class="join w-full">
                <button class="btn join-item flex-1 btn-sm btn-active">CONST</button>
                <button class="btn join-item flex-1 btn-sm">RAMP</button>
                <button class="btn join-item flex-1 btn-sm">SINE</button>
              </div>
            </div>

            <!-- Air Speed Setpoint (values = grey) -->
            <div class="form-control mb-3">
              <label class="label">
                <span class="label-text font-bold text-base-content">Target Air Speed</span>
                <span class="label-text-alt text-base-content">28.0 m/s</span>
              </label>
              <input type="range" min="0" max="35" value="28" class="range range-lg" step="0.5" />
              <div class="flex w-full justify-between text-xs px-2 mt-1 text-base-content">
                <span>0 m/s</span>
                <span>|</span>
                <span>17.5 m/s</span>
                <span>|</span>
                <span>35+ m/s</span>
              </div>
            </div>

            <!-- Fan Power (value = grey) -->
            <div class="form-control mb-3">
              <label class="label">
                <span class="label-text font-bold text-base-content">Fan Power</span>
                <span class="label-text-alt text-base-content">81%</span>
              </label>
              <input type="range" min="0" max="100" value="81" class="range range-lg" step="1" />
            </div>

            <!-- Toggle Switches (settings: neutral) -->
            <div class="space-y-2">
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-bold text-base-content">LED Flow Visualisation</span>
                  <input type="checkbox" class="toggle toggle-md" checked />
                </label>
              </div>
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-bold text-base-content">Data Acquisition</span>
                  <input type="checkbox" class="toggle toggle-md" checked />
                </label>
              </div>
              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text font-bold text-base-content">Safety Interlock</span>
                  <input type="checkbox" class="toggle toggle-md" checked />
                </label>
              </div>
            </div>

            <!-- Emergency Stop (outlined red per philosophy) -->
            <button class="btn btn-outline btn-error w-full mt-4 btn-lg">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              EMERGENCY STOP
            </button>
          </div>
        </div>

        <!-- Gauges (normal readings = no colour) -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm text-base-content">System Gauges</h2>
            <div class="grid grid-cols-2 gap-4 mt-2">
              <div class="flex flex-col items-center">
                <div class="radial-progress text-base-content" style="--value:81; --size:4rem;" role="progressbar">81%</div>
                <div class="text-xs mt-2 text-center text-base-content">Fan Power</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="radial-progress text-base-content" style="--value:81; --size:4rem;" role="progressbar">81%</div>
                <div class="text-xs mt-2 text-center text-base-content">Speed vs max 35 m/s</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="radial-progress text-base-content" style="--value:100; --size:4rem;" role="progressbar">100%</div>
                <div class="text-xs mt-2 text-center text-base-content">Flow uniformity</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="radial-progress text-base-content" style="--value:100; --size:4rem;" role="progressbar">100%</div>
                <div class="text-xs mt-2 text-center text-base-content">LED visualisation</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alarms (info = blue; nominal = grey, not success) -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm text-base-content">System Alarms</h2>
            <div class="space-y-2 mt-2">
              <div class="alert alert-info py-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                </svg>
                <span class="text-xs">Aerodynamics teaching run in progress</span>
              </div>
              <div class="bg-base-300 rounded-lg px-4 py-2">
                <span class="text-xs text-base-content">125 mm test section · honeycomb uniform flow OK</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Experiments & Progress (no opacity; hierarchy by size) -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm text-base-content">Experiments & Progress</h2>
            <div class="text-xs text-base-content mb-2">14+ experiments · 2 force component unit · 3D print (M3) compatible</div>
            <div class="mt-2">
              <div class="flex justify-between text-xs mb-1 text-base-content">
                <span>Current run</span>
                <span>65%</span>
              </div>
              <progress class="progress w-full" value="65" max="100"></progress>
              <div class="text-xs mt-2 text-base-content">Teaching mode · Touch screen interface</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}function _p(){return`
    <!-- Process Control Temperature – PID Controller Tuning System -->

    <!-- Top Status Bar: normal data = grey; colour only for state (running = green, AUTO = green) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Controller Status</div>
        <div class="stat-value text-2xl flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          <span class="text-success font-bold">ACTIVE</span>
        </div>
        <div class="stat-desc text-base-content">PID Mode: <span class="text-success font-medium">AUTO</span></div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Setpoint</div>
        <div class="stat-value text-3xl text-base-content">50.0°C</div>
        <div class="stat-desc text-base-content">Target value</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Process Value</div>
        <div class="stat-value text-3xl text-base-content">49.8°C</div>
        <div class="stat-desc text-base-content">0.2°C error</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Output</div>
        <div class="stat-value text-3xl text-base-content">62%</div>
        <div class="stat-desc text-base-content">Control signal</div>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="grid gap-4 lg:grid-cols-3">
      
      <!-- Left: Response Charts -->
      <div class="lg:col-span-2 space-y-4">
        
        <!-- Step Response Chart (structural: neutral; RUNNING = green) -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <h2 class="card-title text-base-content">
                <svg class="w-5 h-5 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Step Response Analysis
              </h2>
              <div class="badge badge-success gap-2">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                RUNNING
              </div>
            </div>
            <div class="h-80">
              <canvas id="stepResponseChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Performance Metrics (normal readings = no colour) -->
        <div class="grid gap-4 md:grid-cols-3">
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-sm text-base-content">Rise Time</h2>
              <div class="stat-value text-2xl text-base-content">2.4s</div>
              <div class="stat-desc text-xs text-base-content">Target: &lt; 3.0s</div>
              <progress class="progress w-full mt-2" value="80" max="100"></progress>
            </div>
          </div>

          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-sm text-base-content">Overshoot</h2>
              <div class="stat-value text-2xl text-base-content">4.2%</div>
              <div class="stat-desc text-xs text-base-content">Target: &lt; 5.0%</div>
              <progress class="progress w-full mt-2" value="84" max="100"></progress>
            </div>
          </div>

          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-sm text-base-content">Settling Time</h2>
              <div class="stat-value text-2xl text-base-content">8.5s</div>
              <div class="stat-desc text-xs text-base-content">Target: &lt; 10.0s</div>
              <progress class="progress w-full mt-2" value="85" max="100"></progress>
            </div>
          </div>
        </div>

        <!-- Test Functions centered under response metrics -->
        <div class="mx-auto w-full max-w-md">
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-sm text-base-content">Test Functions</h2>
              <div class="space-y-2">
                <button class="btn btn-primary btn-sm w-full">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                  </svg>
                  Step Test
                </button>
                <button class="btn btn-outline btn-sm w-full">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                  </svg>
                  Ramp Test
                </button>
                <button class="btn btn-outline btn-sm w-full">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                  </svg>
                  Sine Wave Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: PID Parameters and Controls -->
      <div class="space-y-4">
        
        <!-- PID Parameters (structural: neutral; values = grey; Apply = primary) -->
        <div class="card bg-base-200 shadow-xl border border-base-300">
          <div class="card-body">
            <h2 class="card-title text-base-content">
              <svg class="w-5 h-5 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
              </svg>
              PID Parameters
            </h2>

            <!-- Proportional Gain -->
            <div class="form-control mb-3">
              <label class="label">
                <span class="label-text font-bold text-base-content">Proportional (Kp)</span>
                <span class="label-text-alt text-base-content">2.5</span>
              </label>
              <input type="range" min="0" max="10" value="2.5" class="range range-lg" step="0.1" />
              <div class="flex w-full justify-between text-xs px-2 mt-1 text-base-content">
                <span>0.0</span>
                <span>|</span>
                <span>5.0</span>
                <span>|</span>
                <span>10.0</span>
              </div>
              <input type="number" class="input input-bordered input-sm mt-2" value="2.5" step="0.1" min="0" max="10" />
            </div>

            <!-- Integral Gain -->
            <div class="form-control mb-3">
              <label class="label">
                <span class="label-text font-bold text-base-content">Integral (Ki)</span>
                <span class="label-text-alt text-base-content">0.8</span>
              </label>
              <input type="range" min="0" max="5" value="0.8" class="range range-lg" step="0.1" />
              <div class="flex w-full justify-between text-xs px-2 mt-1 text-base-content">
                <span>0.0</span>
                <span>|</span>
                <span>2.5</span>
                <span>|</span>
                <span>5.0</span>
              </div>
              <input type="number" class="input input-bordered input-sm mt-2" value="0.8" step="0.1" min="0" max="5" />
            </div>

            <!-- Derivative Gain -->
            <div class="form-control mb-3">
              <label class="label">
                <span class="label-text font-bold text-base-content">Derivative (Kd)</span>
                <span class="label-text-alt text-base-content">0.3</span>
              </label>
              <input type="range" min="0" max="2" value="0.3" class="range range-lg" step="0.05" />
              <div class="flex w-full justify-between text-xs px-2 mt-1 text-base-content">
                <span>0.0</span>
                <span>|</span>
                <span>1.0</span>
                <span>|</span>
                <span>2.0</span>
              </div>
              <input type="number" class="input input-bordered input-sm mt-2" value="0.3" step="0.05" min="0" max="2" />
            </div>

            <div class="divider"></div>

            <!-- Setpoint Control -->
            <div class="form-control mb-3">
              <label class="label">
                <span class="label-text font-bold text-base-content">Setpoint</span>
                <span class="label-text-alt text-base-content">50.0°C</span>
              </label>
              <input type="range" min="0" max="100" value="50" class="range range-lg" step="0.5" />
              <input type="number" class="input input-bordered input-sm mt-2" value="50.0" step="0.5" min="0" max="100" />
            </div>

            <!-- Action Buttons (Apply = primary, Reset = outline) -->
            <div class="flex gap-2">
              <button class="btn btn-primary flex-1 btn-sm">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                </svg>
                Apply
              </button>
              <button class="btn btn-outline flex-1 btn-sm">Reset</button>
            </div>
          </div>
        </div>

        <!-- Tuning Presets (neutral: outline only) -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm text-base-content">Tuning Presets</h2>
            <div class="space-y-2">
              <button class="btn btn-outline btn-sm w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
                </svg>
                Aggressive
              </button>
              <button class="btn btn-outline btn-sm w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                Balanced
              </button>
              <button class="btn btn-outline btn-sm w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"/>
                </svg>
                Conservative
              </button>
            </div>
          </div>
        </div>

        <!-- Performance (normal readings = no colour) -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm text-base-content">Performance</h2>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-xs mb-1 text-base-content">
                  <span>Stability</span>
                  <span>92%</span>
                </div>
                <progress class="progress w-full" value="92" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1 text-base-content">
                  <span>Response Speed</span>
                  <span>78%</span>
                </div>
                <progress class="progress w-full" value="78" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1 text-base-content">
                  <span>Steady State Error</span>
                  <span>0.4%</span>
                </div>
                <progress class="progress w-full" value="96" max="100"></progress>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration (Save/Load = ghost/outline, muted) -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm text-base-content">Configuration</h2>
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm flex-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                </svg>
                Save
              </button>
              <button class="btn btn-outline btn-sm flex-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
                </svg>
                Load
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}function Cp(){return`
    <!-- HMI Dashboard 4 – Matrix Fundamental Fluids -->

    <!-- Top Status Bar -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Recording Status</div>
        <div class="stat-value text-2xl flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          RECORDING
        </div>
        <div class="stat-desc">142 data points</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Active Worksheet</div>
        <div class="stat-value text-xl">WS6</div>
        <div class="stat-desc">Bernoulli's Principle</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">USB Sensors</div>
        <div class="stat-value text-3xl">2 / 2</div>
        <div class="stat-desc">Connected</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Flow Rate</div>
        <div class="stat-value text-3xl">26.4 L/min</div>
        <div class="stat-desc">Pressure diff: 41.4 kPa</div>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="grid gap-4 lg:grid-cols-3">

      <!-- Left: Actuators + Charts + Worksheets (priority order) -->
      <div class="lg:col-span-2 space-y-4">

        <!-- Pump Speed Control — ACTUATORS FIRST -->
        <div class="card bg-base-200 shadow-xl border-2 border-primary">
          <div class="card-body">
            <h2 class="card-title text-primary text-sm font-mono tracking-widest uppercase">Pump Speed Control</h2>
            <div class="flex justify-around items-start gap-8 py-4">

              <!-- Pump 1 -->
              <div class="flex flex-col items-center gap-3">
                <div class="text-sm font-bold font-mono tracking-wider">PUMP 1</div>
                <div class="text-3xl font-mono font-bold" id="pump1-val">60%</div>
                <div id="pump1-slider" style="height:220px;"></div>
                <div class="flex gap-1 mt-1">
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump1',0)">0</button>
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump1',25)">25</button>
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump1',50)">50</button>
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump1',75)">75</button>
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump1',100)">100</button>
                </div>
              </div>

              <div class="divider divider-horizontal"></div>

              <!-- Pump 2 -->
              <div class="flex flex-col items-center gap-3">
                <div class="text-sm font-bold font-mono tracking-wider">PUMP 2</div>
                <div class="text-3xl font-mono font-bold" id="pump2-val">45%</div>
                <div id="pump2-slider" style="height:220px;"></div>
                <div class="flex gap-1 mt-1">
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump2',0)">0</button>
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump2',25)">25</button>
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump2',50)">50</button>
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump2',75)">75</button>
                  <button class="btn btn-outline btn-xs font-mono" onclick="setFluidPump('pump2',100)">100</button>
                </div>
              </div>

            </div>
          </div>
        </div>


        <!-- Bernoulli Pressure Profile Chart -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <h2 class="card-title">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Pressure Profile — Venturi Tube (WS6)
              </h2>
              <div class="badge badge-primary gap-2">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                LIVE
              </div>
            </div>
            <div class="h-64">
              <canvas id="bernoulliChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Flow Rate Over Time -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              Flow Rate (Real-time)
            </h2>
            <div class="h-44">
              <canvas id="flowTimeChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Flow vs Pressure -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
              </svg>
              Flow vs Differential Pressure
            </h2>
            <div class="h-52">
              <canvas id="flowPressureChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Worksheet Selector — LOWEST PRIORITY, bottom of left column -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Experiments — Matrix Fundamental Fluids</h2>
            <div class="grid grid-cols-3 gap-2 mt-1">

              <div class="card bg-base-300 cursor-pointer hover:bg-base-100 border border-base-content/10 transition-colors">
                <div class="card-body p-3">
                  <div class="flex justify-between items-start"><span class="text-xs font-bold">WS1</span><span class="badge badge-neutral badge-xs">MANUAL</span></div>
                  <div class="text-xs font-semibold mt-1 leading-tight">Viscosity Matters</div>
                </div>
              </div>

              <div class="card bg-base-300 cursor-pointer hover:bg-base-100 border border-base-content/10 transition-colors">
                <div class="card-body p-3">
                  <div class="flex justify-between items-start"><span class="text-xs font-bold">WS2</span><span class="badge badge-neutral badge-xs">MANUAL</span></div>
                  <div class="text-xs font-semibold mt-1 leading-tight">Calibrating Pressure Gauge</div>
                </div>
              </div>

              <div class="card bg-base-300 cursor-pointer hover:bg-base-100 border border-base-content/10 transition-colors">
                <div class="card-body p-3">
                  <div class="flex justify-between items-start"><span class="text-xs font-bold">WS3</span><span class="badge badge-ghost badge-xs">USB</span></div>
                  <div class="text-xs font-semibold mt-1 leading-tight">Liquid Manometers</div>
                </div>
              </div>

              <div class="card bg-base-300 cursor-pointer hover:bg-base-100 border border-base-content/10 transition-colors">
                <div class="card-body p-3">
                  <div class="flex justify-between items-start"><span class="text-xs font-bold">WS4</span><span class="badge badge-ghost badge-xs">USB</span></div>
                  <div class="text-xs font-semibold mt-1 leading-tight">Inclined Manometers</div>
                </div>
              </div>

              <div class="card bg-base-300 cursor-pointer hover:bg-base-100 border border-base-content/10 transition-colors">
                <div class="card-body p-3">
                  <div class="flex justify-between items-start"><span class="text-xs font-bold">WS5</span><span class="badge badge-neutral badge-xs">MANUAL</span></div>
                  <div class="text-xs font-semibold mt-1 leading-tight">Centre of Pressure</div>
                </div>
              </div>

              <!-- WS6 ACTIVE -->
              <div class="card bg-primary/10 cursor-pointer border-2 border-primary transition-colors">
                <div class="card-body p-3">
                  <div class="flex justify-between items-start"><span class="text-xs font-bold text-primary">WS6</span><span class="badge badge-ghost badge-xs">USB</span></div>
                  <div class="text-xs font-bold mt-1 leading-tight text-primary">Bernoulli's Principle</div>
                </div>
              </div>

              <div class="card bg-base-300 cursor-pointer hover:bg-base-100 border border-base-content/10 transition-colors">
                <div class="card-body p-3">
                  <div class="flex justify-between items-start"><span class="text-xs font-bold">WS7</span><span class="badge badge-ghost badge-xs">USB</span></div>
                  <div class="text-xs font-semibold mt-1 leading-tight">Minor Losses in Bends</div>
                </div>
              </div>

              <div class="card bg-base-300 cursor-pointer hover:bg-base-100 border border-base-content/10 transition-colors">
                <div class="card-body p-3">
                  <div class="flex justify-between items-start"><span class="text-xs font-bold">WS8</span><span class="badge badge-ghost badge-xs">USB</span></div>
                  <div class="text-xs font-semibold mt-1 leading-tight">Centrifugal Pump</div>
                </div>
              </div>

              <div class="card bg-base-300 cursor-pointer hover:bg-base-100 border border-base-content/10 transition-colors">
                <div class="card-body p-3">
                  <div class="flex justify-between items-start"><span class="text-xs font-bold">WS9</span><span class="badge badge-ghost badge-xs">USB</span></div>
                  <div class="text-xs font-semibold mt-1 leading-tight">Pumps in Series / Parallel</div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      <!-- Right: Sensors + Live Data + USB Status + Recording (priority order) -->
      <div class="space-y-4">

        <!-- Pressure Gauges — SENSORS FIRST -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Pressure Gauges (0 – 1000 psi)</h2>
            <div class="flex justify-around items-center py-3">

              <div class="flex flex-col items-center gap-2">
                <div class="radial-progress text-base-content font-bold"
                  style="--value: 65; --size: 5.5rem; --thickness: 8px;" role="progressbar">
                  <div class="text-center leading-tight">
                    <div class="text-sm font-bold">650</div>
                    <div class="text-xs">psi</div>
                  </div>
                </div>
                <span class="text-xs font-bold">Gauge 1</span>
              </div>

              <div class="flex flex-col items-center gap-2">
                <div class="radial-progress text-base-content font-bold"
                  style="--value: 42; --size: 5.5rem; --thickness: 8px;" role="progressbar">
                  <div class="text-center leading-tight">
                    <div class="text-sm font-bold">420</div>
                    <div class="text-xs">psi</div>
                  </div>
                </div>
                <span class="text-xs font-bold">Gauge 2</span>
              </div>

            </div>
          </div>
        </div>

        <!-- Live Sensor Readings -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Live Readings — Venturi Tappings</h2>
            <div class="space-y-2 mt-1">
              <div class="flex justify-between items-center text-sm">
                <span class="font-mono">P1 Inlet</span>
                <span class="font-mono font-bold">118.2 kPa</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="font-mono">P2 Converge</span>
                <span class="font-mono font-bold">105.4 kPa</span>
              </div>
              <div class="flex justify-between items-center text-sm border-l-2 border-base-content/30 pl-2">
                <span class="font-mono">P3 Throat ↓ min</span>
                <span class="font-mono font-bold">76.8 kPa</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="font-mono">P4 Diverge</span>
                <span class="font-mono font-bold">93.1 kPa</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="font-mono">P5 Outlet</span>
                <span class="font-mono font-bold">108.6 kPa</span>
              </div>
              <div class="divider my-1"></div>
              <div class="flex justify-between items-center text-sm">
                <span class="font-mono">Flow Rate</span>
                <span class="font-mono font-bold">26.4 L/min</span>
              </div>
            </div>
          </div>
        </div>

        <!-- USB Sensor Connection -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">USB Sensors</h2>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">Pressure Sensor</span>
                <span class="badge badge-neutral badge-sm">Connected</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">Flow Sensor</span>
                <span class="badge badge-neutral badge-sm">Connected</span>
              </div>
              <div class="flex items-center justify-between text-xs mt-1">
                <span>Sample rate</span>
                <span>10 Hz</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Recording — lower priority -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Data Recording</h2>

            <div class="flex gap-2">
              <button class="btn btn-success flex-1 btn-lg">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                </svg>
                RECORD
              </button>
              <button class="btn btn-error flex-1 btn-lg">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"/>
                </svg>
                STOP
              </button>
            </div>

            <div class="form-control mt-3">
              <label class="label pb-1">
                <span class="label-text font-bold text-xs">Data Entry Mode</span>
              </label>
              <div class="join w-full">
                <button class="btn join-item flex-1 btn-sm btn-active btn-success">USB AUTO</button>
                <button class="btn join-item flex-1 btn-sm btn-outline">MANUAL</button>
              </div>
            </div>

            <div class="mt-3 text-xs flex justify-between">
              <span>Run duration</span><span>00:02:22</span>
            </div>
            <div class="text-xs flex justify-between">
              <span>Data points</span><span>142</span>
            </div>
          </div>
        </div>

        <!-- Export / Print — lowest priority -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm">Run Data</h2>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-sm flex-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                </svg>
                Export
              </button>
              <button class="btn btn-ghost btn-sm flex-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"/>
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Bottom: Venturi Tube Schematic -->
    <div class="card bg-base-200 shadow-xl mt-4">
      <div class="card-body">
        <h2 class="card-title text-sm">Venturi Tube — Pressure Tapping Positions (WS6: Bernoulli's Principle)</h2>
        <div class="flex items-end justify-center gap-1 py-4 px-2">

          <!-- Flow direction label -->
          <div class="flex flex-col items-center mr-3">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
            <span class="text-xs mt-1">Flow</span>
          </div>

          <!-- P1 Inlet (tallest - widest section) -->
          <div class="flex flex-col items-center">
            <div class="text-xs font-mono font-bold mb-1">P1</div>
            <div class="w-14 h-16 bg-base-300 border-2 border-base-content/20 rounded flex items-center justify-center">
              <span class="text-xs font-mono text-center leading-tight">118.2<br/>kPa</span>
            </div>
            <div class="text-xs mt-1">Inlet</div>
          </div>

          <!-- Converging taper -->
          <div class="flex items-end mb-1">
            <div class="w-4 h-12 bg-base-300/50 border-t-2 border-b-2 border-base-content/10" style="clip-path: polygon(0 0, 100% 15%, 100% 85%, 0 100%)"></div>
          </div>

          <!-- P2 Converging -->
          <div class="flex flex-col items-center">
            <div class="text-xs font-mono font-bold mb-1">P2</div>
            <div class="w-12 h-12 bg-base-300 border-2 border-base-content/20 rounded flex items-center justify-center">
              <span class="text-xs font-mono text-center leading-tight">105.4<br/>kPa</span>
            </div>
            <div class="text-xs mt-1">Converge</div>
          </div>

          <!-- Throat taper -->
          <div class="flex items-end mb-1">
            <div class="w-3 h-8 bg-base-300/50 border-t-2 border-b-2 border-base-content/10" style="clip-path: polygon(0 0, 100% 20%, 100% 80%, 0 100%)"></div>
          </div>

          <!-- P3 Throat (shortest - narrowest section) -->
          <div class="flex flex-col items-center">
            <div class="text-xs font-mono font-bold mb-1">P3</div>
            <div class="w-10 h-8 bg-base-300 border-2 border-base-content/20 rounded flex items-center justify-center">
              <span class="text-xs font-mono text-center leading-tight">76.8<br/>kPa</span>
            </div>
            <div class="text-xs mt-1">Throat</div>
          </div>

          <!-- Diverging taper -->
          <div class="flex items-end mb-1">
            <div class="w-3 h-8 bg-base-300/50 border-t-2 border-b-2 border-base-content/10" style="clip-path: polygon(0 20%, 100% 0, 100% 100%, 0 80%)"></div>
          </div>

          <!-- P4 Diverging -->
          <div class="flex flex-col items-center">
            <div class="text-xs font-mono font-bold mb-1">P4</div>
            <div class="w-12 h-12 bg-base-300 border-2 border-base-content/20 rounded flex items-center justify-center">
              <span class="text-xs font-mono text-center leading-tight">93.1<br/>kPa</span>
            </div>
            <div class="text-xs mt-1">Diverge</div>
          </div>

          <!-- Expanding taper -->
          <div class="flex items-end mb-1">
            <div class="w-4 h-12 bg-base-300/50 border-t-2 border-b-2 border-base-content/10" style="clip-path: polygon(0 15%, 100% 0, 100% 100%, 0 85%)"></div>
          </div>

          <!-- P5 Outlet (tallest again) -->
          <div class="flex flex-col items-center">
            <div class="text-xs font-mono font-bold mb-1">P5</div>
            <div class="w-14 h-16 bg-base-300 border-2 border-base-content/20 rounded flex items-center justify-center">
              <span class="text-xs font-mono text-center leading-tight">108.6<br/>kPa</span>
            </div>
            <div class="text-xs mt-1">Outlet</div>
          </div>

        </div>
        <p class="text-xs text-center">Pressure drops at the throat (P3) as velocity increases — Bernoulli's principle. Note partial pressure recovery in diverging section due to friction losses.</p>
      </div>
    </div>
  `}function Mp(){return`
    <!-- Admin Panel 1 – Sensor & Actuator Calibration (production / pre-ship) -->
    
    <div class="mb-4 p-3 bg-base-200 rounded-lg border-l-4 border-base-300">
      <h1 class="text-xl font-bold text-base-content">Sensor & Actuator Calibration</h1>
      <p class="text-sm text-base-content mt-1">Pre-ship setup for production engineers. Calibrate sensors and actuators before shipping to customers.</p>
    </div>

    <!-- Top stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Product ID</div>
        <div class="stat-value text-2xl text-base-content font-mono">MTX-7842</div>
        <div class="stat-desc text-base-content">Current unit</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Calibration</div>
        <div class="stat-value text-2xl">
          <span class="text-warning font-bold">In progress</span>
        </div>
        <div class="stat-desc text-base-content">4 of 8 channels done</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Sensors</div>
        <div class="stat-value text-2xl text-base-content">5</div>
        <div class="stat-desc text-base-content">3 calibrated, 2 pending</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Actuators</div>
        <div class="stat-value text-2xl text-base-content">3</div>
        <div class="stat-desc text-base-content">1 calibrated, 2 pending</div>
      </div>
    </div>

    <section class="grid gap-4 lg:grid-cols-3">
      <!-- Main: channels list -->
      <div class="lg:col-span-2 space-y-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Calibration channels</h2>
            <p class="text-sm text-base-content">Select a channel to set zero, span, and limits. Apply to save calibration to the unit.</p>
            <div class="flex flex-wrap gap-2 mb-4">
              <select class="select select-bordered select-sm">
                <option>All channels</option>
                <option>Sensors only</option>
                <option>Actuators only</option>
              </select>
              <select class="select select-bordered select-sm">
                <option>All status</option>
                <option>Pending</option>
                <option>Calibrated</option>
                <option>Failed</option>
              </select>
              <input class="input input-bordered input-sm w-40" placeholder="Search channel..." />
            </div>
            <div class="overflow-x-auto">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th class="text-base-content">Channel</th>
                    <th class="text-base-content">Type</th>
                    <th class="text-base-content">Current</th>
                    <th class="text-base-content">Setpoint / Range</th>
                    <th class="text-base-content">Status</th>
                    <th class="text-base-content">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-mono text-sm">PT-01</td>
                    <td><span class="badge badge-ghost">Sensor</span></td>
                    <td class="text-base-content">101.32 kPa</td>
                    <td class="text-base-content">0–200 kPa</td>
                    <td><span class="badge badge-success">Calibrated</span></td>
                    <td><button class="btn btn-xs btn-outline">Re-cal</button></td>
                  </tr>
                  <tr>
                    <td class="font-mono text-sm">PT-02</td>
                    <td><span class="badge badge-ghost">Sensor</span></td>
                    <td class="text-base-content">0.02 kPa</td>
                    <td class="text-base-content">0–50 kPa</td>
                    <td><span class="badge badge-success">Calibrated</span></td>
                    <td><button class="btn btn-xs btn-outline">Re-cal</button></td>
                  </tr>
                  <tr class="bg-base-300/50">
                    <td class="font-mono text-sm font-bold">TC-01</td>
                    <td><span class="badge badge-ghost">Sensor</span></td>
                    <td class="text-base-content">23.4 °C</td>
                    <td class="text-base-content">-10–120 °C</td>
                    <td><span class="badge badge-warning">Pending</span></td>
                    <td><button class="btn btn-xs btn-primary">Calibrate</button></td>
                  </tr>
                  <tr>
                    <td class="font-mono text-sm">FL-01</td>
                    <td><span class="badge badge-ghost">Sensor</span></td>
                    <td class="text-base-content">0.00 L/min</td>
                    <td class="text-base-content">0–100 L/min</td>
                    <td><span class="badge badge-warning">Pending</span></td>
                    <td><button class="btn btn-xs btn-primary">Calibrate</button></td>
                  </tr>
                  <tr>
                    <td class="font-mono text-sm">LVL-01</td>
                    <td><span class="badge badge-ghost">Sensor</span></td>
                    <td class="text-base-content">0 mm</td>
                    <td class="text-base-content">0–500 mm</td>
                    <td><span class="badge badge-success">Calibrated</span></td>
                    <td><button class="btn btn-xs btn-outline">Re-cal</button></td>
                  </tr>
                  <tr>
                    <td class="font-mono text-sm">VLV-01</td>
                    <td><span class="badge badge-ghost">Actuator</span></td>
                    <td class="text-base-content">0%</td>
                    <td class="text-base-content">0–100%</td>
                    <td><span class="badge badge-success">Calibrated</span></td>
                    <td><button class="btn btn-xs btn-outline">Re-cal</button></td>
                  </tr>
                  <tr>
                    <td class="font-mono text-sm">VLV-02</td>
                    <td><span class="badge badge-ghost">Actuator</span></td>
                    <td class="text-base-content">—</td>
                    <td class="text-base-content">0–100%</td>
                    <td><span class="badge badge-warning">Pending</span></td>
                    <td><button class="btn btn-xs btn-primary">Calibrate</button></td>
                  </tr>
                  <tr>
                    <td class="font-mono text-sm">MTR-01</td>
                    <td><span class="badge badge-ghost">Actuator</span></td>
                    <td class="text-base-content">0 rpm</td>
                    <td class="text-base-content">0–3000 rpm</td>
                    <td><span class="badge badge-warning">Pending</span></td>
                    <td><button class="btn btn-xs btn-primary">Calibrate</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Calibration workflow</h2>
            <ul class="steps steps-vertical text-base-content text-sm">
              <li class="step step-primary">Select product (MTX-7842)</li>
              <li class="step step-primary">Calibrate sensors (zero / span)</li>
              <li class="step step-primary">Calibrate actuators (stroke / range)</li>
              <li class="step">Verify all channels</li>
              <li class="step">Sign off &amp; export certificate</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Sidebar: selected channel calibration -->
      <div class="space-y-4">
        <div class="card bg-base-200 shadow-xl border border-base-300">
          <div class="card-body">
            <h2 class="card-title text-base-content">Selected channel: TC-01</h2>
            <p class="text-xs text-base-content">Temperature sensor · -10–120 °C</p>
            <div class="divider my-2"></div>
            <div class="form-control">
              <label class="label"><span class="label-text text-base-content">Zero (current raw)</span></label>
              <input type="number" class="input input-bordered input-sm" value="0.0" step="0.1" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text text-base-content">Span reference (°C)</span></label>
              <input type="number" class="input input-bordered input-sm" value="100.0" step="0.1" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text text-base-content">Min limit (°C)</span></label>
              <input type="number" class="input input-bordered input-sm" value="-10" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text text-base-content">Max limit (°C)</span></label>
              <input type="number" class="input input-bordered input-sm" value="120" />
            </div>
            <div class="flex gap-2 mt-4">
              <button class="btn btn-primary btn-sm flex-1">Apply calibration</button>
              <button class="btn btn-outline btn-sm flex-1">Zero now</button>
            </div>
            <button class="btn btn-outline btn-sm w-full mt-2">Span (apply reference)</button>
          </div>
        </div>

        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm text-base-content">Product actions</h2>
            <div class="space-y-2">
              <button class="btn btn-primary btn-sm w-full">Save calibration to unit</button>
              <button class="btn btn-outline btn-sm w-full">Load from unit</button>
              <button class="btn btn-ghost btn-sm w-full">Export calibration certificate</button>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-sm text-base-content">Status</h2>
            <div class="space-y-2 text-sm text-base-content">
              <div class="flex justify-between"><span>Last saved</span><span>—</span></div>
              <div class="flex justify-between"><span>Calibration due</span><span>—</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `}function Pp(){return`
    <!-- Debugging – USB, network, datalog, events, console -->
    
    <div class="mb-4 p-3 bg-base-200 rounded-lg border-l-4 border-base-300">
      <h1 class="text-xl font-bold text-base-content">Debugging</h1>
      <p class="text-sm text-base-content mt-1">USB debugging, network config, MAC addresses, CSV datalog, recent events, and browser console output.</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Left column -->
      <div class="space-y-4">
        <!-- USB Debugging -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">USB debugging</h2>
            <p class="text-sm text-base-content">Connect and debug over USB. Enable developer mode on the device first.</p>
            <div class="form-control">
              <label class="label cursor-pointer">
                <span class="label-text text-base-content">Enable USB debugging</span>
                <input type="checkbox" class="toggle toggle-md" />
              </label>
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text text-base-content">USB port</span></label>
              <select class="select select-bordered select-sm">
                <option>Auto-detect</option>
                <option>COM3</option>
                <option>COM4</option>
                <option>/dev/ttyUSB0</option>
              </select>
            </div>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-primary btn-sm">Connect</button>
              <button class="btn btn-outline btn-sm">Refresh ports</button>
            </div>
            <p class="text-xs text-base-content mt-2">Status: Not connected</p>
          </div>
        </div>

        <!-- IP address config -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">IP address config</h2>
            <p class="text-sm text-base-content">Configure network for the app or connected device.</p>
            <div class="form-control">
              <label class="label"><span class="label-text text-base-content">IP address</span></label>
              <input type="text" class="input input-bordered input-sm font-mono" placeholder="192.168.1.100" value="192.168.1.100" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text text-base-content">Subnet mask</span></label>
              <input type="text" class="input input-bordered input-sm font-mono" placeholder="255.255.255.0" value="255.255.255.0" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text text-base-content">Gateway</span></label>
              <input type="text" class="input input-bordered input-sm font-mono" placeholder="192.168.1.1" value="192.168.1.1" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text text-base-content">DNS</span></label>
              <input type="text" class="input input-bordered input-sm font-mono" placeholder="8.8.8.8" value="8.8.8.8" />
            </div>
            <button class="btn btn-primary btn-sm mt-2">Apply network</button>
          </div>
        </div>

        <!-- MAC addresses -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">MAC addresses</h2>
            <p class="text-sm text-base-content">Network interfaces and hardware addresses.</p>
            <div class="overflow-x-auto">
              <table class="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th class="text-base-content">Interface</th>
                    <th class="text-base-content font-mono">MAC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td class="text-base-content">Ethernet</td><td class="font-mono text-sm">00:1A:2B:3C:4D:5E</td></tr>
                  <tr><td class="text-base-content">Wi‑Fi</td><td class="font-mono text-sm">00:1A:2B:3C:4D:5F</td></tr>
                  <tr><td class="text-base-content">USB Ethernet</td><td class="font-mono text-sm">02:00:00:00:00:01</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div class="space-y-4">
        <!-- App CSV datalog -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">App CSV datalog</h2>
            <p class="text-sm text-base-content">Path, interval, and export for application data logging.</p>
            <div class="form-control">
              <label class="label"><span class="label-text text-base-content">Log path</span></label>
              <input type="text" class="input input-bordered input-sm font-mono" placeholder="C:\\Data\\logs" value="C:\\Data\\logs\\datalog.csv" />
            </div>
            <div class="form-control mt-2">
              <label class="label"><span class="label-text text-base-content">Sample interval (s)</span></label>
              <input type="number" class="input input-bordered input-sm w-24" value="1" min="0.1" step="0.1" />
            </div>
            <div class="form-control mt-2">
              <label class="label cursor-pointer">
                <span class="label-text text-base-content">Logging enabled</span>
                <input type="checkbox" class="toggle toggle-md" checked />
              </label>
            </div>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-primary btn-sm">Save settings</button>
              <button class="btn btn-outline btn-sm">Export CSV now</button>
            </div>
          </div>
        </div>

        <!-- Recent events in app -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Recent events in app</h2>
            <p class="text-sm text-base-content">Last events from the application.</p>
            <div class="overflow-x-auto max-h-48">
              <table class="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th class="text-base-content">Time</th>
                    <th class="text-base-content">Source</th>
                    <th class="text-base-content">Message</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td class="text-xs text-base-content">14:32:01</td><td class="text-base-content">App</td><td class="text-base-content">Page loaded: Debugging</td></tr>
                  <tr><td class="text-xs text-base-content">14:31:58</td><td class="text-base-content">Router</td><td class="text-base-content">Navigate to admin-2</td></tr>
                  <tr><td class="text-xs text-base-content">14:31:55</td><td class="text-base-content">Auth</td><td class="text-base-content">Admin access granted</td></tr>
                  <tr><td class="text-xs text-base-content">14:31:50</td><td class="text-base-content">Connection</td><td class="text-base-content">Status: Connected</td></tr>
                  <tr><td class="text-xs text-base-content">14:30:12</td><td class="text-base-content">Theme</td><td class="text-base-content">Theme set to light</td></tr>
                </tbody>
              </table>
            </div>
            <button class="btn btn-ghost btn-sm mt-2">Clear events</button>
          </div>
        </div>

        <!-- Console log from browser -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-base-content">Console log (browser)</h2>
            <p class="text-sm text-base-content">Recent console output. Open DevTools (F12) for live logs.</p>
            <pre class="bg-base-300 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-48 text-base-content whitespace-pre-wrap">[14:32:01] INFO  Matrix Template UI loaded
[14:32:01] INFO  Theme: light
[14:31:58] INFO  Navigation: admin-2
[14:31:55] INFO  Admin session started
[14:31:50] INFO  WebSocket connected
[14:30:00] DEBUG Chart.js registered
[14:29:58] INFO  Vite dev server connected</pre>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-outline btn-sm">Copy to clipboard</button>
              <button class="btn btn-ghost btn-sm">Clear</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}function Ap(){return`
    <!-- Bootloader – PBC hardware firmware management -->
    
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-base-content">Bootloader</h1>
      <p class="text-sm text-base-content">Firmware management for PBC hardware. Flash, verify, and configure boot behaviour.</p>
    </div>

    <!-- Top Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Connection</div>
        <div class="stat-value text-xl text-base-content"><span class="badge badge-ghost badge-lg">Connected</span></div>
        <div class="stat-desc text-base-content">USB @ 115200 baud</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Bootloader</div>
        <div class="stat-value text-xl text-base-content">v2.1.0</div>
        <div class="stat-desc text-base-content">STM32 DFU</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Firmware</div>
        <div class="stat-value text-xl text-base-content">v1.4.2</div>
        <div class="stat-desc text-base-content">Application</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title text-base-content">Flash</div>
        <div class="stat-value text-xl text-base-content">128 KB</div>
        <div class="stat-desc text-base-content">64 KB used</div>
      </div>
    </div>

    <section class="grid gap-4 lg:grid-cols-3">
      <!-- Left: Firmware & Boot Operations -->
      <div class="lg:col-span-2 space-y-4">
        
        <!-- Firmware Upload -->
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h2 class="card-title text-base-content">Firmware upload</h2>
            <p class="text-sm text-base-content">Select a .bin or .hex file to flash to the PBC. Supports DFU and UART bootloaders.</p>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-bold text-base-content">Firmware file</span>
              </label>
              <div class="flex gap-2">
                <input type="text" class="input input-bordered flex-1 text-base-content" placeholder="No file selected" value="" />
                <button class="btn btn-outline btn-sm">Browse</button>
              </div>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text font-bold text-base-content">Target address</span>
                <span class="label-text-alt text-base-content">0x08000000 (default)</span>
              </label>
              <input type="text" class="input input-bordered font-mono text-base-content" value="0x08000000" />
            </div>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-primary">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
                </svg>
                Flash firmware
              </button>
              <button class="btn btn-outline btn-sm">Erase flash</button>
              <button class="btn btn-outline btn-sm">Verify</button>
            </div>
            <div class="mt-2">
              <div class="flex justify-between text-xs text-base-content mb-1">
                <span>Progress</span>
                <span>0%</span>
              </div>
              <progress class="progress progress-primary w-full" value="0" max="100"></progress>
            </div>
          </div>
        </div>

        <!-- Boot configuration -->
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h2 class="card-title text-base-content">Boot configuration</h2>
            <div class="collapse collapse-arrow bg-base-100 mt-2">
              <input type="checkbox" checked />
              <div class="collapse-title text-md font-medium text-base-content">
                Boot mode & source
              </div>
              <div class="collapse-content">
                <div class="space-y-3">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-bold text-base-content">Boot mode</span>
                    </label>
                    <select class="select select-bordered">
                      <option>Normal (application)</option>
                      <option>Recovery</option>
                      <option>Safe mode</option>
                      <option>DFU / Bootloader</option>
                    </select>
                  </div>
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-bold text-base-content">Boot source</span>
                    </label>
                    <select class="select select-bordered">
                      <option>Internal flash</option>
                      <option>External SPI flash</option>
                      <option>SD card</option>
                    </select>
                  </div>
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text font-bold text-base-content">Autoboot timeout (sec)</span>
                      <span class="label-text-alt text-base-content">0 = immediate</span>
                    </label>
                    <input type="number" class="input input-bordered" value="0" min="0" max="30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Connection & programming -->
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h2 class="card-title text-base-content">Connection & programming</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold text-base-content">Port</span>
                </label>
                <select class="select select-bordered">
                  <option>COM3 (STM32 Virtual COM)</option>
                  <option>COM4</option>
                  <option>/dev/ttyUSB0</option>
                  <option>/dev/ttyACM0</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold text-base-content">Baud rate</span>
                </label>
                <select class="select select-bordered">
                  <option>9600</option>
                  <option>19200</option>
                  <option>38400</option>
                  <option selected>115200</option>
                  <option>230400</option>
                  <option>460800</option>
                  <option>921600</option>
                </select>
              </div>
            </div>
            <div class="flex gap-2 mt-4">
              <button class="btn btn-outline btn-sm">Scan ports</button>
              <button class="btn btn-outline btn-sm">Connect</button>
              <button class="btn btn-outline btn-sm">Enter bootloader</button>
              <button class="btn btn-outline btn-sm">Reset device</button>
            </div>
          </div>
        </div>

        <!-- Memory layout -->
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h2 class="card-title text-base-content">Memory layout</h2>
            <div class="overflow-x-auto">
              <table class="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th class="text-base-content">Region</th>
                    <th class="text-base-content">Start</th>
                    <th class="text-base-content">Size</th>
                    <th class="text-base-content">Used</th>
                    <th class="text-base-content">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td class="text-base-content">Bootloader</td><td class="font-mono text-base-content">0x08000000</td><td class="text-base-content">24 KB</td><td class="text-base-content">—</td><td class="badge badge-ghost">Protected</td></tr>
                  <tr><td class="text-base-content">Application</td><td class="font-mono text-base-content">0x08006000</td><td class="text-base-content">104 KB</td><td class="text-base-content">64 KB</td><td class="badge badge-ghost">Active</td></tr>
                  <tr><td class="text-base-content">Config</td><td class="font-mono text-base-content">0x0801F800</td><td class="text-base-content">2 KB</td><td class="text-base-content">512 B</td><td class="badge badge-ghost">—</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Device info & boot log -->
      <div class="space-y-4">
        <!-- Device info -->
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h2 class="card-title text-base-content">Device info</h2>
            <div class="stats stats-vertical shadow bg-base-100 text-base-content">
              <div class="stat py-2">
                <div class="stat-title text-xs">MCU</div>
                <div class="stat-value text-sm font-mono">STM32F407VG</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Board rev</div>
                <div class="stat-value text-sm">PBC-001 Rev 2.1</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Unique ID</div>
                <div class="stat-value text-xs font-mono break-all">0x12345678</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Boot log -->
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h2 class="card-title text-base-content">Boot log</h2>
            <p class="text-sm text-base-content">Bootloader commands and responses.</p>
            <pre class="bg-base-300 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-48 text-base-content whitespace-pre-wrap">[14:45:02] Connected to COM3 @ 115200
[14:45:02] Bootloader v2.1.0 detected
[14:45:03] Chip: STM32F407VG, 128 KB flash
[14:45:05] Application v1.4.2 @ 0x08006000
[14:45:05] Ready for commands</pre>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-outline btn-sm">Clear</button>
              <button class="btn btn-ghost btn-sm">Copy</button>
            </div>
          </div>
        </div>

        <!-- Factory reset & recovery -->
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <h2 class="card-title text-base-content">Factory & recovery</h2>
            <div class="space-y-2">
              <button class="btn btn-outline btn-sm w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                Restore factory firmware
              </button>
              <button class="btn btn-outline btn-sm w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                Erase config partition
              </button>
              <button class="btn btn-outline btn-sm w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                </svg>
                Read bootloader version
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `}function Dp(){return`
    <!-- Control Template 1 – Enhanced Control System -->
    
    <!-- Top Status Bar -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-lg rounded-lg">
        <div class="stat-title text-primary-content opacity-80">System Status</div>
        <div class="stat-value text-2xl flex items-center gap-2">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          RUNNING
        </div>
        <div class="stat-desc text-primary-content opacity-70">Mode: Auto</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Elapsed Time</div>
        <div class="stat-value text-3xl text-info">00:10:45</div>
        <div class="stat-desc">hh:mm:ss</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Process Value</div>
        <div class="stat-value text-3xl text-success">42.3°C</div>
        <div class="stat-desc">Target: 42.0°C</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Control Output</div>
        <div class="stat-value text-3xl text-warning">65%</div>
        <div class="stat-desc">PID active</div>
      </div>
    </div>

    <section class="grid gap-4 lg:grid-cols-3">
      <!-- Main Control Area -->
      <div class="lg:col-span-2 space-y-4">
        
        <!-- Primary Control Panel -->
        <div class="card bg-gradient-to-br from-base-200 to-base-300 shadow-xl border-2 border-primary">
          <div class="card-body">
            <h2 class="card-title text-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
              </svg>
              Main Control Panel
            </h2>
            
            <!-- Control Buttons -->
            <div class="grid grid-cols-2 gap-3 mb-4">
              <button class="btn btn-success btn-lg">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                </svg>
                START
              </button>
              <button class="btn btn-error btn-lg">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"/>
                </svg>
                STOP
              </button>
              <button class="btn btn-warning btn-lg">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"/>
                </svg>
                PAUSE
              </button>
              <button class="btn btn-outline btn-lg">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                RESET
              </button>
            </div>

            <div class="divider"></div>

            <!-- Operation Mode -->
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text font-bold">Operation Mode</span>
              </label>
              <div class="join w-full">
                <button class="btn join-item flex-1 btn-active btn-primary">AUTO</button>
                <button class="btn join-item flex-1">MANUAL</button>
                <button class="btn join-item flex-1">TEST</button>
                <button class="btn join-item flex-1">MAINT</button>
              </div>
            </div>

            <!-- Setpoint Control -->
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text font-bold">Temperature Setpoint</span>
                <span class="label-text-alt badge badge-lg badge-warning">42.0°C</span>
              </label>
              <input type="range" min="20" max="60" value="42" class="range range-warning range-lg" step="0.5" />
              <div class="flex w-full justify-between text-xs px-2 mt-1">
                <span>20°C</span>
                <span>|</span>
                <span>40°C</span>
                <span>|</span>
                <span>60°C</span>
              </div>
              <input type="number" class="input input-bordered input-sm mt-2" value="42.0" step="0.5" min="20" max="60" />
            </div>

            <!-- Speed Control -->
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text font-bold">Fan Speed</span>
                <span class="label-text-alt badge badge-lg badge-accent">75%</span>
              </label>
              <input type="range" min="0" max="100" value="75" class="range range-accent range-lg" step="5" />
            </div>

            <!-- Feature Toggles -->
            <div class="space-y-2 mb-4">
              <label class="label cursor-pointer">
                <span class="label-text font-bold">Enable PID Control</span>
                <input type="checkbox" class="toggle toggle-primary" checked />
              </label>
              <label class="label cursor-pointer">
                <span class="label-text font-bold">Data Logging</span>
                <input type="checkbox" class="toggle toggle-success" checked />
              </label>
              <label class="label cursor-pointer">
                <span class="label-text font-bold">Alarm Enabled</span>
                <input type="checkbox" class="toggle toggle-warning" checked />
              </label>
              <label class="label cursor-pointer">
                <span class="label-text font-bold">Remote Control</span>
                <input type="checkbox" class="toggle toggle-info" />
              </label>
            </div>

            <!-- Emergency Stop -->
            <button class="btn btn-outline btn-error w-full btn-lg">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              EMERGENCY STOP
            </button>
          </div>
        </div>

        <!-- Progress and Status -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Process Progress</h2>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>40%</span>
                </div>
                <progress class="progress progress-primary w-full" value="40" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Heating Phase</span>
                  <span>65%</span>
                </div>
                <progress class="progress progress-warning w-full" value="65" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Stabilization</span>
                  <span>25%</span>
                </div>
                <progress class="progress progress-info w-full" value="25" max="100"></progress>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        <div class="space-y-2">
          <div class="alert alert-success">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
            </svg>
            <span>System operating normally. All parameters within limits.</span>
          </div>
          <div class="alert alert-info">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
            </svg>
            <span>Process will complete in approximately 15 minutes.</span>
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="space-y-4">
        
        <!-- Status Cards -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">System Status</h2>
            <div class="space-y-3">
              <div class="stat bg-base-100 rounded-box shadow">
                <div class="stat-title">Current State</div>
                <div class="stat-value text-lg text-success">Running</div>
                <div class="stat-desc">00:10:45 elapsed</div>
              </div>
              <div class="stat bg-base-100 rounded-box shadow">
                <div class="stat-title">Setpoint</div>
                <div class="stat-value text-lg text-primary">42.0°C</div>
                <div class="stat-desc">Target temperature</div>
              </div>
              <div class="stat bg-base-100 rounded-box shadow">
                <div class="stat-title">Process Value</div>
                <div class="stat-value text-lg text-info">42.3°C</div>
                <div class="stat-desc">↗︎ 0.3°C from setpoint</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Gauges -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Performance Metrics</h2>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col items-center">
                <div class="radial-progress text-primary" style="--value:65; --size:4rem;" role="progressbar">65%</div>
                <div class="text-xs mt-2 text-center">Control Output</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="radial-progress text-success" style="--value:95; --size:4rem;" role="progressbar">95%</div>
                <div class="text-xs mt-2 text-center">Efficiency</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="radial-progress text-warning" style="--value:78; --size:4rem;" role="progressbar">78%</div>
                <div class="text-xs mt-2 text-center">Stability</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="radial-progress text-info" style="--value:88; --size:4rem;" role="progressbar">88%</div>
                <div class="text-xs mt-2 text-center">Quality</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Quick Actions</h2>
            <div class="space-y-2">
              <button class="btn btn-sm btn-outline w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                </svg>
                View Alarms
              </button>
              <button class="btn btn-sm btn-outline w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/>
                </svg>
                Configure
              </button>
              <button class="btn btn-sm btn-outline w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 004 9.528V4z"/>
                  <path fill-rule="evenodd" d="M8 10a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 108 10zm-2 4a2 2 0 100-4 2 2 0 000 4z"/>
                </svg>
                Export Data
              </button>
              <button class="btn btn-sm btn-outline w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                Reset Process
              </button>
            </div>
          </div>
        </div>

        <!-- System Health Rating -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">System Health</h2>
            <div class="rating rating-lg">
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" />
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" />
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" />
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" checked />
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" />
            </div>
            <p class="text-xs opacity-70 mt-2">4.0 out of 5 - Excellent</p>
          </div>
        </div>
      </div>
    </section>
  `}function Tp(){return`
    <!-- I/O Template 1 – Enhanced I/O Monitoring & Control -->
    
    <!-- Top Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Total I/O Points</div>
        <div class="stat-value text-2xl text-primary">48</div>
        <div class="stat-desc">24 inputs, 24 outputs</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Active Inputs</div>
        <div class="stat-value text-2xl text-success">18</div>
        <div class="stat-desc">75% active</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Active Outputs</div>
        <div class="stat-value text-2xl text-info">12</div>
        <div class="stat-desc">50% active</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">I/O Health</div>
        <div class="stat-value text-2xl text-warning">98%</div>
        <div class="stat-desc">1 fault detected</div>
      </div>
    </div>

    <section class="grid gap-4 lg:grid-cols-3">
      <!-- Left: Digital Inputs -->
      <div class="space-y-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title">Digital Inputs</h2>
              <div class="badge badge-success gap-2">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                LIVE
              </div>
            </div>
            
            <!-- Filter Controls -->
            <div class="flex gap-2 mb-4">
              <select class="select select-bordered select-sm flex-1">
                <option>All Groups</option>
                <option>Group A</option>
                <option>Group B</option>
                <option>Group C</option>
              </select>
              <button class="btn btn-sm btn-outline">Filter</button>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-zebra table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>State</th>
                    <th>Group</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-bold">DI1</td>
                    <td>
                      <span class="badge badge-success gap-2">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        High
                      </span>
                    </td>
                    <td><span class="badge badge-primary">A</span></td>
                    <td>
                      <div class="rating rating-sm">
                        <input type="radio" name="di1" class="mask mask-star-2 bg-green-400" checked />
                        <input type="radio" name="di1" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di1" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di1" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di1" class="mask mask-star-2 bg-green-400" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-bold">DI2</td>
                    <td><span class="badge badge-error">Low</span></td>
                    <td><span class="badge badge-primary">A</span></td>
                    <td>
                      <div class="rating rating-sm">
                        <input type="radio" name="di2" class="mask mask-star-2 bg-red-400" />
                        <input type="radio" name="di2" class="mask mask-star-2 bg-red-400" checked />
                        <input type="radio" name="di2" class="mask mask-star-2 bg-red-400" />
                        <input type="radio" name="di2" class="mask mask-star-2 bg-red-400" />
                        <input type="radio" name="di2" class="mask mask-star-2 bg-red-400" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-bold">DI3</td>
                    <td>
                      <span class="badge badge-success gap-2">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        High
                      </span>
                    </td>
                    <td><span class="badge badge-secondary">B</span></td>
                    <td>
                      <div class="rating rating-sm">
                        <input type="radio" name="di3" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di3" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di3" class="mask mask-star-2 bg-green-400" checked />
                        <input type="radio" name="di3" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di3" class="mask mask-star-2 bg-green-400" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-bold">DI4</td>
                    <td><span class="badge badge-warning">Fault</span></td>
                    <td><span class="badge badge-secondary">B</span></td>
                    <td>
                      <div class="rating rating-sm">
                        <input type="radio" name="di4" class="mask mask-star-2 bg-yellow-400" />
                        <input type="radio" name="di4" class="mask mask-star-2 bg-yellow-400" />
                        <input type="radio" name="di4" class="mask mask-star-2 bg-yellow-400" />
                        <input type="radio" name="di4" class="mask mask-star-2 bg-yellow-400" checked />
                        <input type="radio" name="di4" class="mask mask-star-2 bg-yellow-400" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-bold">DI5</td>
                    <td>
                      <span class="badge badge-success gap-2">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        High
                      </span>
                    </td>
                    <td><span class="badge badge-accent">C</span></td>
                    <td>
                      <div class="rating rating-sm">
                        <input type="radio" name="di5" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di5" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di5" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di5" class="mask mask-star-2 bg-green-400" />
                        <input type="radio" name="di5" class="mask mask-star-2 bg-green-400" checked />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Input Statistics -->
            <div class="divider"></div>
            <div class="stats stats-vertical shadow bg-base-100">
              <div class="stat py-2">
                <div class="stat-title text-xs">Active</div>
                <div class="stat-value text-lg text-success">18</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Inactive</div>
                <div class="stat-value text-lg text-error">6</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analog Inputs -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Analog Inputs</h2>
            <div class="space-y-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">AI1 - Temperature</span>
                  <span class="label-text-alt badge badge-lg badge-warning">23.5°C</span>
                </label>
                <progress class="progress progress-warning w-full" value="75" max="100"></progress>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">AI2 - Pressure</span>
                  <span class="label-text-alt badge badge-lg badge-info">101.3 kPa</span>
                </label>
                <progress class="progress progress-info w-full" value="85" max="100"></progress>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">AI3 - Flow Rate</span>
                  <span class="label-text-alt badge badge-lg badge-accent">45.2 L/min</span>
                </label>
                <progress class="progress progress-accent w-full" value="60" max="100"></progress>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Digital Outputs -->
      <div class="space-y-4">
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title">Digital Outputs</h2>
              <div class="flex gap-2">
                <button class="btn btn-xs btn-success">All On</button>
                <button class="btn btn-xs btn-error">All Off</button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-zebra table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>State</th>
                    <th>Control</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-bold">DO1 - Pump</td>
                    <td>
                      <span class="badge badge-success gap-2">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        On
                      </span>
                    </td>
                    <td>
                      <input type="checkbox" class="toggle toggle-success toggle-lg" checked />
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <input type="radio" name="do1-priority" class="radio radio-primary radio-xs" />
                        <input type="radio" name="do1-priority" class="radio radio-secondary radio-xs" checked />
                        <input type="radio" name="do1-priority" class="radio radio-accent radio-xs" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-bold">DO2 - Valve</td>
                    <td><span class="badge badge-error">Off</span></td>
                    <td>
                      <input type="checkbox" class="toggle toggle-error toggle-lg" />
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <input type="radio" name="do2-priority" class="radio radio-primary radio-xs" checked />
                        <input type="radio" name="do2-priority" class="radio radio-secondary radio-xs" />
                        <input type="radio" name="do2-priority" class="radio radio-accent radio-xs" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-bold">DO3 - Heater</td>
                    <td>
                      <span class="badge badge-warning gap-2">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
                        </span>
                        Warming
                      </span>
                    </td>
                    <td>
                      <input type="checkbox" class="toggle toggle-warning toggle-lg" checked />
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <input type="radio" name="do3-priority" class="radio radio-primary radio-xs" />
                        <input type="radio" name="do3-priority" class="radio radio-secondary radio-xs" />
                        <input type="radio" name="do3-priority" class="radio radio-accent radio-xs" checked />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-bold">DO4 - Fan</td>
                    <td>
                      <span class="badge badge-success gap-2">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        On
                      </span>
                    </td>
                    <td>
                      <input type="checkbox" class="toggle toggle-info toggle-lg" checked />
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <input type="radio" name="do4-priority" class="radio radio-primary radio-xs" />
                        <input type="radio" name="do4-priority" class="radio radio-secondary radio-xs" checked />
                        <input type="radio" name="do4-priority" class="radio radio-accent radio-xs" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td class="font-bold">DO5 - Alarm</td>
                    <td><span class="badge badge-error">Off</span></td>
                    <td>
                      <input type="checkbox" class="toggle toggle-error toggle-lg" />
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <input type="radio" name="do5-priority" class="radio radio-primary radio-xs" checked />
                        <input type="radio" name="do5-priority" class="radio radio-secondary radio-xs" />
                        <input type="radio" name="do5-priority" class="radio radio-accent radio-xs" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Output Statistics -->
            <div class="divider"></div>
            <div class="stats stats-vertical shadow bg-base-100">
              <div class="stat py-2">
                <div class="stat-title text-xs">Active</div>
                <div class="stat-value text-lg text-success">12</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Inactive</div>
                <div class="stat-value text-lg text-error">12</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Analog Outputs -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Analog Outputs</h2>
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">AO1 - Speed Control</span>
                  <span class="label-text-alt badge badge-lg badge-primary">75%</span>
                </label>
                <input type="range" min="0" max="100" value="75" class="range range-primary" step="1" />
                <input type="number" class="input input-bordered input-sm mt-2" value="75" min="0" max="100" />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">AO2 - Position</span>
                  <span class="label-text-alt badge badge-lg badge-secondary">45%</span>
                </label>
                <input type="range" min="0" max="100" value="45" class="range range-secondary" step="1" />
                <input type="number" class="input input-bordered input-sm mt-2" value="45" min="0" max="100" />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">AO3 - Power</span>
                  <span class="label-text-alt badge badge-lg badge-accent">88%</span>
                </label>
                <input type="range" min="0" max="100" value="88" class="range range-accent" step="1" />
                <input type="number" class="input input-bordered input-sm mt-2" value="88" min="0" max="100" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: I/O Status & Actions -->
      <div class="space-y-4">
        
        <!-- I/O Health Status -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">I/O Health Status</h2>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Overall Health</span>
                  <span>98%</span>
                </div>
                <progress class="progress progress-success w-full" value="98" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Input Reliability</span>
                  <span>99%</span>
                </div>
                <progress class="progress progress-info w-full" value="99" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Output Reliability</span>
                  <span>97%</span>
                </div>
                <progress class="progress progress-warning w-full" value="97" max="100"></progress>
              </div>
            </div>
          </div>
        </div>

        <!-- I/O Gauges -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">I/O Utilization</h2>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col items-center">
                <div class="radial-progress text-primary" style="--value:75; --size:4rem;" role="progressbar">75%</div>
                <div class="text-xs mt-2 text-center">Inputs</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="radial-progress text-secondary" style="--value:50; --size:4rem;" role="progressbar">50%</div>
                <div class="text-xs mt-2 text-center">Outputs</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="radial-progress text-accent" style="--value:88; --size:4rem;" role="progressbar">88%</div>
                <div class="text-xs mt-2 text-center">Analog</div>
              </div>
              <div class="flex flex-col items-center">
                <div class="radial-progress text-warning" style="--value:62; --size:4rem;" role="progressbar">62%</div>
                <div class="text-xs mt-2 text-center">Digital</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Quick Actions</h2>
            <div class="space-y-2">
              <button class="btn btn-sm btn-primary w-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                Refresh All
              </button>
              <button class="btn btn-sm btn-success w-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                </svg>
                Test All I/O
              </button>
              <button class="btn btn-sm btn-warning w-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
                </svg>
                Search I/O
              </button>
              <button class="btn btn-sm btn-outline w-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                </svg>
                Export Config
              </button>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">I/O Alerts</h2>
            <div class="space-y-2">
              <div class="alert alert-success">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                <span class="text-xs">All critical I/O points operational</span>
              </div>
              <div class="alert alert-warning">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/>
                </svg>
                <span class="text-xs">DI4 showing intermittent fault</span>
              </div>
            </div>
          </div>
        </div>

        <!-- I/O Groups -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">I/O Groups</h2>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">Group A</span>
                <span class="badge badge-primary">8 points</span>
              </div>
              <progress class="progress progress-primary w-full" value="87" max="100"></progress>
              
              <div class="flex items-center justify-between mt-3">
                <span class="text-sm">Group B</span>
                <span class="badge badge-secondary">12 points</span>
              </div>
              <progress class="progress progress-secondary w-full" value="75" max="100"></progress>
              
              <div class="flex items-center justify-between mt-3">
                <span class="text-sm">Group C</span>
                <span class="badge badge-accent">6 points</span>
              </div>
              <progress class="progress progress-accent w-full" value="100" max="100"></progress>
            </div>
          </div>
        </div>
      </div>
    </section>
  `}function Lp(){return`
    <!-- Faults Template 1 – Enhanced Fault Monitoring & Management -->
    
    <!-- Top Status Bar -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-gradient-to-br from-error to-error-focus text-error-content shadow-lg rounded-lg">
        <div class="stat-title text-error-content opacity-80">Critical Faults</div>
        <div class="stat-value text-3xl">1</div>
        <div class="stat-desc text-error-content opacity-70">Requires immediate action</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Warnings</div>
        <div class="stat-value text-3xl text-warning">3</div>
        <div class="stat-desc">Monitor closely</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Infos</div>
        <div class="stat-value text-3xl text-info">8</div>
        <div class="stat-desc">Informational only</div>
      </div>

      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">System Health</div>
        <div class="stat-value text-3xl text-success">92%</div>
        <div class="stat-desc">Overall status</div>
      </div>
    </div>

    <section class="grid gap-4 lg:grid-cols-3">
      <!-- Left: Status & Filters -->
      <div class="space-y-4">
        
        <!-- Status Overview -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Fault Status</h2>
            <div class="stats stats-vertical shadow bg-base-100">
              <div class="stat py-2">
                <div class="stat-title text-xs">Active Faults</div>
                <div class="stat-value text-2xl text-error">1</div>
                <div class="stat-desc text-xs">Critical</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Warnings</div>
                <div class="stat-value text-2xl text-warning">3</div>
                <div class="stat-desc text-xs">Non-critical</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Infos</div>
                <div class="stat-value text-2xl text-info">8</div>
                <div class="stat-desc text-xs">Normal</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Resolved (24h)</div>
                <div class="stat-value text-2xl text-success">24</div>
                <div class="stat-desc text-xs">Today</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Filters</h2>
            <div class="space-y-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Severity</span>
                </label>
                <select class="select select-bordered select-sm">
                  <option>All</option>
                  <option>Critical</option>
                  <option>Warning</option>
                  <option>Info</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Source</span>
                </label>
                <select class="select select-bordered select-sm">
                  <option>All Sources</option>
                  <option>Device A</option>
                  <option>Device B</option>
                  <option>Device C</option>
                  <option>System</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Time Range</span>
                </label>
                <select class="select select-bordered select-sm">
                  <option>Last Hour</option>
                  <option>Last 24 Hours</option>
                  <option selected>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Status</span>
                </label>
                <div class="space-y-1">
                  <label class="label cursor-pointer">
                    <span class="label-text text-xs">Active Only</span>
                    <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" checked />
                  </label>
                  <label class="label cursor-pointer">
                    <span class="label-text text-xs">Acknowledged</span>
                    <input type="checkbox" class="checkbox checkbox-sm checkbox-secondary" />
                  </label>
                  <label class="label cursor-pointer">
                    <span class="label-text text-xs">Resolved</span>
                    <input type="checkbox" class="checkbox checkbox-sm checkbox-accent" />
                  </label>
                </div>
              </div>
              <button class="btn btn-primary btn-sm w-full">Apply Filters</button>
              <button class="btn btn-outline btn-sm w-full">Reset</button>
            </div>
          </div>
        </div>

        <!-- System Health -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">System Health</h2>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span>Overall Health</span>
                  <span>92%</span>
                </div>
                <progress class="progress progress-success w-full" value="92" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span>Reliability</span>
                  <span>95%</span>
                </div>
                <progress class="progress progress-info w-full" value="95" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span>Availability</span>
                  <span>98%</span>
                </div>
                <progress class="progress progress-warning w-full" value="98" max="100"></progress>
              </div>
            </div>
          </div>
        </div>

        <!-- Health Rating -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Health Rating</h2>
            <div class="rating rating-lg">
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" />
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" />
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" />
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" checked />
              <input type="radio" name="health-rating" class="mask mask-star-2 bg-green-400" />
            </div>
            <p class="text-xs opacity-70 mt-2">4.0 out of 5 - Good</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Quick Actions</h2>
            <div class="space-y-2">
              <button class="btn btn-sm btn-success w-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
                Acknowledge All
              </button>
              <button class="btn btn-sm btn-warning w-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                Clear Resolved
              </button>
              <button class="btn btn-sm btn-info w-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                </svg>
                Export Logs
              </button>
              <button class="btn btn-sm btn-outline w-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Fault List -->
      <div class="card bg-base-200 shadow-xl lg:col-span-2">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Fault Log</h2>
            <div class="flex gap-2">
              <input class="input input-bordered input-sm" placeholder="Search faults..." />
              <button class="btn btn-sm btn-outline">Search</button>
            </div>
          </div>

          <!-- Active Alerts -->
          <div class="space-y-2 mb-4">
            <div class="alert alert-error">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
              </svg>
              <div class="flex-1">
                <h3 class="font-bold">CRITICAL: Device B Communication Lost</h3>
                <div class="text-xs">Time: 12:10:23 | Source: Device B | ID: FAULT-2024-001</div>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-xs btn-success">Acknowledge</button>
                <button class="btn btn-xs btn-outline">Details</button>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-zebra table-hover">
              <thead>
                <tr>
                  <th>
                    <label>
                      <input type="checkbox" class="checkbox checkbox-sm" />
                    </label>
                  </th>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>
                    <label>
                      <input type="checkbox" class="checkbox checkbox-sm" />
                    </label>
                  </th>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-bold">12:10:23</span>
                      <span class="text-xs opacity-70">2024-01-15</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-error gap-2">
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                      </span>
                      Critical
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar placeholder">
                        <div class="bg-error text-error-content rounded-full w-6">
                          <span class="text-xs">B</span>
                        </div>
                      </div>
                      <span class="font-bold">Device B</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-medium">Communication lost. No response for 30 seconds.</span>
                      <span class="text-xs opacity-70">Fault ID: FAULT-2024-001</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-warning">Active</span>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-success">Ack</button>
                      <button class="btn btn-xs btn-info">View</button>
                      <button class="btn btn-xs btn-error">Clear</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    <label>
                      <input type="checkbox" class="checkbox checkbox-sm" />
                    </label>
                  </th>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-bold">12:05:15</span>
                      <span class="text-xs opacity-70">2024-01-15</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-warning">Warning</span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar placeholder">
                        <div class="bg-warning text-warning-content rounded-full w-6">
                          <span class="text-xs">C</span>
                        </div>
                      </div>
                      <span class="font-bold">Device C</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-medium">High temperature detected. Approaching limit.</span>
                      <span class="text-xs opacity-70">Fault ID: FAULT-2024-002</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-success">Acknowledged</span>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-info">View</button>
                      <button class="btn btn-xs btn-error">Clear</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    <label>
                      <input type="checkbox" class="checkbox checkbox-sm" />
                    </label>
                  </th>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-bold">12:03:42</span>
                      <span class="text-xs opacity-70">2024-01-15</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-warning">Warning</span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar placeholder">
                        <div class="bg-warning text-warning-content rounded-full w-6">
                          <span class="text-xs">A</span>
                        </div>
                      </div>
                      <span class="font-bold">Device A</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-medium">Pressure reading outside normal range.</span>
                      <span class="text-xs opacity-70">Fault ID: FAULT-2024-003</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-warning">Active</span>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-success">Ack</button>
                      <button class="btn btn-xs btn-info">View</button>
                      <button class="btn btn-xs btn-error">Clear</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    <label>
                      <input type="checkbox" class="checkbox checkbox-sm" />
                    </label>
                  </th>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-bold">12:00:00</span>
                      <span class="text-xs opacity-70">2024-01-15</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-info">Info</span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar placeholder">
                        <div class="bg-info text-info-content rounded-full w-6">
                          <span class="text-xs">S</span>
                        </div>
                      </div>
                      <span class="font-bold">System</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-medium">System startup complete. All modules initialized.</span>
                      <span class="text-xs opacity-70">Fault ID: INFO-2024-001</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-success">Resolved</span>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-info">View</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>
                    <label>
                      <input type="checkbox" class="checkbox checkbox-sm" />
                    </label>
                  </th>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-bold">11:58:12</span>
                      <span class="text-xs opacity-70">2024-01-15</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-info">Info</span>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="avatar placeholder">
                        <div class="bg-info text-info-content rounded-full w-6">
                          <span class="text-xs">S</span>
                        </div>
                      </div>
                      <span class="font-bold">System</span>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-medium">Configuration updated successfully.</span>
                      <span class="text-xs opacity-70">Fault ID: INFO-2024-002</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-success">Resolved</span>
                  </td>
                  <td>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-info">View</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex justify-center mt-4">
            <div class="join">
              <button class="join-item btn btn-sm">«</button>
              <button class="join-item btn btn-sm btn-active">1</button>
              <button class="join-item btn btn-sm">2</button>
              <button class="join-item btn btn-sm">3</button>
              <button class="join-item btn btn-sm">4</button>
              <button class="join-item btn btn-sm">»</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `}function Op(){return`
    <!-- Tasks Template 1 – Enhanced Worksheet & Task Management -->
    
    <!-- Top Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Total Tasks</div>
        <div class="stat-value text-2xl text-primary">12</div>
        <div class="stat-desc">3 completed, 9 pending</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Progress</div>
        <div class="stat-value text-2xl text-success">25%</div>
        <div class="stat-desc">3 of 12 completed</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Active Worksheets</div>
        <div class="stat-value text-2xl text-info">2</div>
        <div class="stat-desc">In progress</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Completion Rate</div>
        <div class="stat-value text-2xl text-warning">87%</div>
        <div class="stat-desc">Last 30 days</div>
      </div>
    </div>

    <section class="grid gap-4 lg:grid-cols-3">
      <!-- Left: Task List -->
      <div class="lg:col-span-2 space-y-4">
        
        <!-- Worksheet Selection -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title">Active Worksheets</h2>
              <div class="flex gap-2">
                <select class="select select-bordered select-sm">
                  <option selected>Basic Procedure</option>
                  <option>Advanced Test</option>
                  <option>Maintenance Checklist</option>
                  <option>Calibration Procedure</option>
                </select>
                <button class="btn btn-sm btn-primary">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                  </svg>
                  New
                </button>
              </div>
            </div>

            <!-- Overall Progress -->
            <div class="mb-4">
              <div class="flex justify-between text-sm mb-1">
                <span class="font-bold">Overall Progress</span>
                <span>25% (3/12)</span>
              </div>
              <progress class="progress progress-primary w-full" value="25" max="100"></progress>
            </div>

            <!-- Task List with Enhanced Components -->
            <div class="space-y-3">
              <!-- Task 1 - Completed -->
              <div class="card bg-base-100 shadow">
                <div class="card-body p-4">
                  <div class="flex items-start gap-3">
                    <input type="checkbox" class="checkbox checkbox-primary checkbox-lg mt-1" checked />
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-sm">Step 1 – Power on system</h3>
                        <span class="badge badge-success gap-2">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                          Completed
                        </span>
                      </div>
                      <p class="text-xs opacity-70 mb-2">Verify all indicators are in a safe state before proceeding.</p>
                      <div class="flex items-center gap-2">
                        <span class="text-xs opacity-60">Completed: 12:00:15</span>
                        <div class="rating rating-xs">
                          <input type="radio" name="task1-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task1-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task1-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task1-rating" class="mask mask-star-2 bg-green-400" checked />
                          <input type="radio" name="task1-rating" class="mask mask-star-2 bg-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Task 2 - Completed -->
              <div class="card bg-base-100 shadow">
                <div class="card-body p-4">
                  <div class="flex items-start gap-3">
                    <input type="checkbox" class="checkbox checkbox-primary checkbox-lg mt-1" checked />
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-sm">Step 2 – Connect device</h3>
                        <span class="badge badge-success gap-2">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                          Completed
                        </span>
                      </div>
                      <p class="text-xs opacity-70 mb-2">Check that the device appears in the Devices table with correct status.</p>
                      <div class="flex items-center gap-2">
                        <span class="text-xs opacity-60">Completed: 12:05:32</span>
                        <div class="rating rating-xs">
                          <input type="radio" name="task2-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task2-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task2-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task2-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task2-rating" class="mask mask-star-2 bg-green-400" checked />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Task 3 - Completed -->
              <div class="card bg-base-100 shadow">
                <div class="card-body p-4">
                  <div class="flex items-start gap-3">
                    <input type="checkbox" class="checkbox checkbox-primary checkbox-lg mt-1" checked />
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-sm">Step 3 – Run test</h3>
                        <span class="badge badge-success gap-2">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                          </svg>
                          Completed
                        </span>
                      </div>
                      <p class="text-xs opacity-70 mb-2">Record results in the fields to the right. Verify all readings are within acceptable range.</p>
                      <div class="flex items-center gap-2">
                        <span class="text-xs opacity-60">Completed: 12:10:48</span>
                        <div class="rating rating-xs">
                          <input type="radio" name="task3-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task3-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task3-rating" class="mask mask-star-2 bg-green-400" checked />
                          <input type="radio" name="task3-rating" class="mask mask-star-2 bg-green-400" />
                          <input type="radio" name="task3-rating" class="mask mask-star-2 bg-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Task 4 - Active -->
              <div class="card bg-gradient-to-br from-base-100 to-primary/10 shadow-lg border-2 border-primary">
                <div class="card-body p-4">
                  <div class="flex items-start gap-3">
                    <input type="checkbox" class="checkbox checkbox-primary checkbox-lg mt-1" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-sm">Step 4 – Verify readings</h3>
                        <span class="badge badge-primary gap-2">
                          <span class="relative flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                          Active
                        </span>
                      </div>
                      <p class="text-xs opacity-70 mb-2">Compare measured values with expected values. Document any discrepancies.</p>
                      <div class="flex items-center gap-2 mt-2">
                        <span class="text-xs opacity-60">Started: 12:12:00</span>
                        <div class="badge badge-warning">In Progress</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Task 5 - Pending -->
              <div class="card bg-base-100 shadow">
                <div class="card-body p-4">
                  <div class="flex items-start gap-3">
                    <input type="checkbox" class="checkbox checkbox-lg mt-1" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-sm">Step 5 – Calibration check</h3>
                        <span class="badge badge-ghost">Pending</span>
                      </div>
                      <p class="text-xs opacity-70 mb-2">Perform calibration verification using standard reference values.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Task 6 - Pending -->
              <div class="card bg-base-100 shadow">
                <div class="card-body p-4">
                  <div class="flex items-start gap-3">
                    <input type="checkbox" class="checkbox checkbox-lg mt-1" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <h3 class="font-bold text-sm">Step 6 – Safety inspection</h3>
                        <span class="badge badge-ghost">Pending</span>
                      </div>
                      <p class="text-xs opacity-70 mb-2">Verify all safety interlocks and emergency stops are functional.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Task Actions -->
            <div class="divider"></div>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-success">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
                Mark All Complete
              </button>
              <button class="btn btn-sm btn-outline">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                Reset
              </button>
              <button class="btn btn-sm btn-outline">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>

        <!-- Task Timeline -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Task Timeline</h2>
            <ul class="timeline timeline-vertical timeline-compact">
              <li>
                <div class="timeline-middle">
                  <div class="badge badge-success"></div>
                </div>
                <div class="timeline-end timeline-box">Step 1 completed</div>
                <div class="timeline-start text-xs opacity-60">12:00:15</div>
              </li>
              <li>
                <hr/>
                <div class="timeline-middle">
                  <div class="badge badge-success"></div>
                </div>
                <div class="timeline-end timeline-box">Step 2 completed</div>
                <div class="timeline-start text-xs opacity-60">12:05:32</div>
              </li>
              <li>
                <hr/>
                <div class="timeline-middle">
                  <div class="badge badge-success"></div>
                </div>
                <div class="timeline-end timeline-box">Step 3 completed</div>
                <div class="timeline-start text-xs opacity-60">12:10:48</div>
              </li>
              <li>
                <hr/>
                <div class="timeline-middle">
                  <div class="badge badge-primary"></div>
                </div>
                <div class="timeline-end timeline-box">Step 4 in progress</div>
                <div class="timeline-start text-xs opacity-60">12:12:00</div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Right: Results & Data Entry -->
      <div class="space-y-4">
        
        <!-- Results Entry -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Test Results</h2>
            <div class="space-y-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Voltage (V)</span>
                  <span class="label-text-alt badge badge-lg badge-primary">24.5</span>
                </label>
                <input type="number" class="input input-bordered" placeholder="0.0" value="24.5" step="0.1" />
                <div class="flex items-center gap-2 mt-1">
                  <input type="range" min="0" max="50" value="24" class="range range-primary range-sm flex-1" step="0.1" />
                  <span class="text-xs opacity-70">0-50V</span>
                </div>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Current (A)</span>
                  <span class="label-text-alt badge badge-lg badge-secondary">2.3</span>
                </label>
                <input type="number" class="input input-bordered" placeholder="0.0" value="2.3" step="0.1" />
                <div class="flex items-center gap-2 mt-1">
                  <input type="range" min="0" max="10" value="2" class="range range-secondary range-sm flex-1" step="0.1" />
                  <span class="text-xs opacity-70">0-10A</span>
                </div>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Power (W)</span>
                  <span class="label-text-alt badge badge-lg badge-accent">56.4</span>
                </label>
                <input type="number" class="input input-bordered" placeholder="0.0" value="56.4" step="0.1" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Temperature (°C)</span>
                  <span class="label-text-alt badge badge-lg badge-warning">23.5</span>
                </label>
                <input type="number" class="input input-bordered" placeholder="0.0" value="23.5" step="0.1" />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Test Status</span>
                </label>
                <select class="select select-bordered">
                  <option>Pass</option>
                  <option>Fail</option>
                  <option>Warning</option>
                  <option>Pending Review</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Comments & Notes</span>
                </label>
                <textarea class="textarea textarea-bordered" rows="4" placeholder="Enter detailed notes about the test results, observations, and any issues encountered...">All readings within acceptable range. System operating normally.</textarea>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-bold">Quality Rating</span>
                </label>
                <div class="rating rating-lg">
                  <input type="radio" name="quality-rating" class="mask mask-star-2 bg-orange-400" />
                  <input type="radio" name="quality-rating" class="mask mask-star-2 bg-orange-400" />
                  <input type="radio" name="quality-rating" class="mask mask-star-2 bg-orange-400" />
                  <input type="radio" name="quality-rating" class="mask mask-star-2 bg-orange-400" checked />
                  <input type="radio" name="quality-rating" class="mask mask-star-2 bg-orange-400" />
                </div>
                <p class="text-xs opacity-70 mt-1">4.0 out of 5 - Good</p>
              </div>

              <div class="card-actions justify-end mt-4">
                <button class="btn btn-outline btn-sm">Cancel</button>
                <button class="btn btn-primary btn-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                  </svg>
                  Save Worksheet
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Worksheet Stats -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Worksheet Statistics</h2>
            <div class="stats stats-vertical shadow bg-base-100">
              <div class="stat py-2">
                <div class="stat-title text-xs">Completed</div>
                <div class="stat-value text-lg text-success">3</div>
                <div class="stat-desc text-xs">25%</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">In Progress</div>
                <div class="stat-value text-lg text-primary">1</div>
                <div class="stat-desc text-xs">8%</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Pending</div>
                <div class="stat-value text-lg text-warning">8</div>
                <div class="stat-desc text-xs">67%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Indicators -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Progress Metrics</h2>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span>Overall Progress</span>
                  <span>25%</span>
                </div>
                <progress class="progress progress-primary w-full" value="25" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span>Data Quality</span>
                  <span>95%</span>
                </div>
                <progress class="progress progress-success w-full" value="95" max="100"></progress>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span>Time Efficiency</span>
                  <span>78%</span>
                </div>
                <progress class="progress progress-info w-full" value="78" max="100"></progress>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Worksheet Alerts</h2>
            <div class="space-y-2">
              <div class="alert alert-info">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                </svg>
                <span class="text-xs">Step 4 is currently in progress</span>
              </div>
              <div class="alert alert-success">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                <span class="text-xs">All completed steps passed quality check</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card bg-base-200 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Quick Actions</h2>
            <div class="space-y-2">
              <button class="btn btn-sm btn-outline w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                </svg>
                Save Progress
              </button>
              <button class="btn btn-sm btn-outline w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
                </svg>
                Export Results
              </button>
              <button class="btn btn-sm btn-outline w-full justify-start">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"/>
                </svg>
                Print Worksheet
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `}function Ep(){return`
    <!-- Component Gallery - broad DaisyUI component coverage -->
    <section class="space-y-4">
      <div class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Component Library (DaisyUI Index)</h2>
          <p class="text-sm">
            This gallery includes examples for all component names shown on DaisyUI components docs.
            Some V5 names are aliases of older V4 classes (for example: Accordion/Collapse, Dock/btm-nav, Pagination/Join).
          </p>
          <p class="text-xs text-base-content/70">
            Pick a tab to browse a focused category.
          </p>
          <div class="tabs tabs-boxed bg-base-100 flex flex-wrap gap-1">
            <button class="tab tab-active" data-lib-tab="nav-layout">Navigation and Layout</button>
            <button class="tab" data-lib-tab="actions-entry">Actions and Data Entry</button>
            <button class="tab" data-lib-tab="feedback-states">Feedback and States</button>
            <button class="tab" data-lib-tab="containers-display">Containers and Display</button>
            <button class="tab" data-lib-tab="overlays-interaction">Overlays and Interaction</button>
            <button class="tab" data-lib-tab="typography-utility">Typography and Utility</button>
            <button class="tab" data-lib-tab="vertical-sliders">Vertical Sliders</button>
          </div>
        </div>
      </div>

      <div id="lib-nav-layout" data-lib-section="nav-layout" class="card bg-base-200 shadow">
        <div class="card-body gap-4">
          <h2 class="card-title">Navigation and Layout</h2>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Navbar</h3>
          <div class="navbar bg-base-100 rounded-box">
            <div class="flex-1">
              <a class="btn btn-ghost text-lg">Navbar</a>
            </div>
            <div class="flex-none">
              <ul class="menu menu-horizontal px-1">
                <li><a>Overview</a></li>
                <li><a>Reports</a></li>
                <li><a>Settings</a></li>
              </ul>
            </div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Breadcrumbs</h3>
          <div class="breadcrumbs text-sm">
            <ul>
              <li><a>Home</a></li>
              <li><a>Components</a></li>
              <li>Gallery</li>
            </ul>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Tabs</h3>
          <div class="tabs tabs-boxed bg-base-100 w-fit">
            <a class="tab tab-active">Tab</a>
            <a class="tab">Tab</a>
            <a class="tab">Tab</a>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Steps</h3>
          <ul class="steps w-full">
            <li class="step step-primary">Start</li>
            <li class="step step-primary">Configure</li>
            <li class="step">Validate</li>
            <li class="step">Deploy</li>
          </ul>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Drawer</h3>
          <div class="drawer lg:drawer-open border border-base-300 rounded-box">
            <input id="gallery-drawer" type="checkbox" class="drawer-toggle" />
            <div class="drawer-content p-3">
              <label for="gallery-drawer" class="btn btn-sm drawer-button lg:hidden">Open drawer</label>
              <p class="text-sm">Drawer content area</p>
            </div>
            <div class="drawer-side">
              <label for="gallery-drawer" class="drawer-overlay"></label>
              <ul class="menu p-4 w-52 min-h-full bg-base-100">
                <li><a class="active">Menu</a></li>
                <li><a>List</a></li>
                <li><a>Links</a></li>
              </ul>
            </div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Dock (Bottom Nav)</h3>
          <div class="btm-nav relative rounded-box">
            <button class="active"><span class="btm-nav-label">Dock</span></button>
            <button><span class="btm-nav-label">Item</span></button>
            <button><span class="btm-nav-label">Item</span></button>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Hero</h3>
          <div class="hero bg-base-100 rounded-box py-8">
            <div class="hero-content text-center">
              <div class="max-w-md">
                <h3 class="text-2xl font-bold">Hero</h3>
                <p class="py-2 text-sm">Large highlight section for important content.</p>
                <button class="btn btn-primary btn-sm">Action</button>
              </div>
            </div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Footer</h3>
          <div class="footer bg-base-100 p-4 rounded-box text-sm">
            <aside>
              <p>Footer component sample</p>
            </aside>
            <nav>
              <a class="link link-hover">Docs</a>
              <a class="link link-hover">Status</a>
            </nav>
          </div>
        </div>
      </div>

      <div id="lib-actions-entry" data-lib-section="actions-entry" class="card bg-base-200 shadow hidden">
        <div class="card-body gap-4">
          <h2 class="card-title">Actions and Data Entry</h2>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Buttons and Button Group</h3>
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-primary">Button</button>
            <button class="btn btn-secondary">Button</button>
            <button class="btn btn-outline">Button</button>
            <button class="btn btn-ghost">Button</button>
            <div class="join">
              <button class="btn join-item">Button Group</button>
              <button class="btn join-item">Button Group</button>
            </div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Input + Label + Validator</h3>
          <div class="form-control">
            <label class="label"><span class="label-text">Input + Label + Validator</span></label>
            <input class="input input-bordered validator" required placeholder="Type here" minlength="3" />
            <label class="label"><span class="label-text-alt">Minimum 3 characters</span></label>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Select, File Input, Textarea, Date Input</h3>
          <div class="grid gap-3 md:grid-cols-2">
            <select class="select select-bordered w-full">
              <option disabled selected>Select component</option>
              <option>Select</option>
              <option>Option</option>
            </select>
            <input type="file" class="file-input file-input-bordered w-full" />
            <textarea class="textarea textarea-bordered" placeholder="Textarea"></textarea>
            <input type="date" class="input input-bordered" />
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Checkbox, Toggle, Radio, Rating</h3>
          <div class="grid gap-3 md:grid-cols-2">
            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" class="checkbox" checked />
              <span class="label-text">Checkbox</span>
            </label>
            <label class="label cursor-pointer justify-start gap-3">
              <input type="checkbox" class="toggle toggle-primary" checked />
              <span class="label-text">Toggle</span>
            </label>
            <label class="label cursor-pointer justify-start gap-3">
              <input type="radio" name="gallery-radio" class="radio radio-primary" checked />
              <span class="label-text">Radio</span>
            </label>
            <div class="rating">
              <input type="radio" name="gallery-rating" class="mask mask-star-2 bg-orange-400" />
              <input type="radio" name="gallery-rating" class="mask mask-star-2 bg-orange-400" checked />
              <input type="radio" name="gallery-rating" class="mask mask-star-2 bg-orange-400" />
            </div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Range, Progress, Radial Progress</h3>
          <div class="space-y-3">
            <input type="range" min="0" max="100" value="40" class="range range-primary" />
            <progress class="progress progress-primary w-full" value="32" max="100"></progress>
            <div class="radial-progress text-primary" style="--value:70;" role="progressbar">70%</div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Pagination (Join)</h3>
          <div class="join">
            <button class="btn join-item">Pagination</button>
            <button class="btn join-item btn-active">2</button>
            <button class="btn join-item">3</button>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Calendar</h3>
          <div class="w-full max-w-md">
            <div class="calendar border border-base-300 rounded-box p-2 text-xs">
              <p class="font-semibold mb-1">Calendar</p>
              <p>Fallback sample (use date picker/calendar integration as needed).</p>
            </div>
          </div>
        </div>
      </div>

      <div id="lib-feedback-states" data-lib-section="feedback-states" class="card bg-base-200 shadow hidden">
        <div class="card-body gap-4">
          <h2 class="card-title">Feedback and States</h2>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Alert</h3>
          <div class="alert alert-success"><span>Alert: operation succeeded.</span></div>
          <div class="alert alert-warning"><span>Alert: review required.</span></div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Badge, Loading, Status</h3>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="badge badge-primary">Badge</span>
            <span class="badge badge-secondary">Badge</span>
            <span class="badge badge-outline">Badge</span>
            <span class="loading loading-spinner loading-md"></span>
            <span class="status status-success"></span><span class="text-sm">Status</span>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Skeleton</h3>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-2/3"></div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Tooltip</h3>
          <div class="tooltip" data-tip="Tooltip text">
            <button class="btn btn-sm">Tooltip</button>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Swap</h3>
          <div class="swap">
            <input type="checkbox" />
            <div class="swap-on badge badge-success">Swap ON</div>
            <div class="swap-off badge">Swap OFF</div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Toast</h3>
          <div class="toast toast-end static">
            <div class="alert alert-info"><span>Toast</span></div>
          </div>
        </div>
      </div>

      <div id="lib-containers-display" data-lib-section="containers-display" class="card bg-base-200 shadow hidden">
        <div class="card-body gap-4">
          <h2 class="card-title">Containers and Display</h2>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Card and Stats</h3>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h3 class="card-title">Card</h3>
                <p class="text-sm">Core content container.</p>
                <div class="card-actions justify-end">
                  <button class="btn btn-primary btn-sm">Action</button>
                </div>
              </div>
            </div>

            <div class="stats shadow bg-base-100">
              <div class="stat">
                <div class="stat-title">Stat</div>
                <div class="stat-value text-primary">89%</div>
                <div class="stat-desc">Availability</div>
              </div>
            </div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Indicator</h3>
          <div class="indicator">
            <span class="indicator-item badge badge-secondary">New</span>
            <button class="btn">Indicator</button>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Stack</h3>
          <div class="stack">
            <div class="bg-primary text-primary-content grid w-24 h-24 place-content-center rounded-box">1</div>
            <div class="bg-accent text-accent-content grid w-24 h-24 place-content-center rounded-box">2</div>
            <div class="bg-secondary text-secondary-content grid w-24 h-24 place-content-center rounded-box">3</div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Divider</h3>
          <div class="divider">Divider</div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Table</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr><th>Table</th><th>Value</th></tr>
              </thead>
              <tbody>
                <tr><td>Row A</td><td>42</td></tr>
                <tr><td>Row B</td><td>17</td></tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">List</h3>
          <div class="list bg-base-100 rounded-box border border-base-300">
            <li class="list-row">List item 1</li>
            <li class="list-row">List item 2</li>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Carousel</h3>
          <div class="overflow-x-auto whitespace-nowrap rounded-box border border-base-300 p-2">
            <div class="carousel w-80">
              <div id="c1" class="carousel-item w-full"><div class="w-full h-24 bg-primary/20 flex items-center justify-center">Carousel 1</div></div>
              <div id="c2" class="carousel-item w-full"><div class="w-full h-24 bg-secondary/20 flex items-center justify-center">Carousel 2</div></div>
              <div id="c3" class="carousel-item w-full"><div class="w-full h-24 bg-accent/20 flex items-center justify-center">Carousel 3</div></div>
            </div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Chat</h3>
          <div class="chat chat-start">
            <div class="chat-bubble">Chat component message</div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Timeline</h3>
          <div class="timeline timeline-vertical">
            <li>
              <div class="timeline-start">Start</div>
              <div class="timeline-middle">-</div>
              <div class="timeline-end timeline-box">Timeline event</div>
            </li>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Mockup Window</h3>
          <div class="mockup-window border bg-base-300">
            <div class="bg-base-200 p-4">Mockup Window</div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Mockup Browser</h3>
          <div class="mockup-browser border border-base-300">
            <div class="mockup-browser-toolbar"><div class="input">https://matrix.local</div></div>
            <div class="p-4 bg-base-200">Mockup Browser</div>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Mockup Code</h3>
          <div class="mockup-code w-full">
            <pre data-prefix="$"><code>npm run dev</code></pre>
            <pre data-prefix=">"><code>ready</code></pre>
          </div>

          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Mockup Phone + Artboard</h3>
          <div class="mockup-phone border-primary">
            <div class="camera"></div>
            <div class="display">
              <div class="artboard artboard-demo phone-1">Artboard + Phone</div>
            </div>
          </div>
        </div>
      </div>

      <div id="lib-overlays-interaction" data-lib-section="overlays-interaction" class="card bg-base-200 shadow hidden">
        <div class="card-body gap-4">
          <h2 class="card-title">Overlays and Interaction</h2>

          <div class="space-y-2">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Dropdown</h3>
            <div class="dropdown">
              <label tabindex="0" class="btn m-1">Dropdown</label>
              <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li><a>Item 1</a></li>
                <li><a>Item 2</a></li>
              </ul>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Modal</h3>
            <button class="btn btn-sm" onclick="document.getElementById('gallery-modal').showModal()">Open Modal</button>
            <dialog id="gallery-modal" class="modal">
              <div class="modal-box">
                <h3 class="font-bold text-lg">Modal</h3>
                <p class="py-2">DaisyUI modal example.</p>
                <div class="modal-action">
                  <form method="dialog"><button class="btn">Close</button></form>
                </div>
              </div>
            </dialog>
          </div>

          <div class="space-y-2">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Accordion / Collapse</h3>
            <div class="collapse collapse-arrow bg-base-100">
              <input type="checkbox" />
              <div class="collapse-title font-medium">Accordion / Collapse</div>
              <div class="collapse-content"><p class="text-sm">Expandable content</p></div>
            </div>
          </div>

          <div class="space-y-2">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Before / After</h3>
            <div id="before-after-demo" class="relative aspect-[16/9] max-w-sm rounded-box overflow-hidden border border-base-300 bg-base-100">
              <div class="absolute inset-0 bg-primary/30 grid place-content-center font-semibold">Before</div>
              <div id="before-after-after-layer" class="absolute inset-0 bg-success/30 grid place-content-center font-semibold">After</div>
              <div id="before-after-divider" class="absolute inset-y-0 w-0.5 bg-base-content/70 pointer-events-none"></div>
              <div class="absolute bottom-2 left-2 right-2 z-10 bg-base-100/80 backdrop-blur rounded px-2 py-1">
                <input id="before-after-range" type="range" min="0" max="100" value="50" class="range range-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="lib-typography-utility" data-lib-section="typography-utility" class="card bg-base-200 shadow hidden">
        <div class="card-body gap-4">
          <h2 class="card-title">Typography and Utility Components</h2>
          <p class="text-sm space-x-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-base-content/70 mr-1">Kbd + Link</span>
            Press <kbd class="kbd kbd-sm">Ctrl</kbd> + <kbd class="kbd kbd-sm">K</kbd> to open search.
            <a class="link link-primary">Link</a>
          </p>
          <div class="flex flex-wrap gap-2">
            <div class="space-y-1">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Avatar</h3>
              <div class="avatar">
                <div class="w-12 rounded-full">
                  <img alt="Avatar" src="https://picsum.photos/80" />
                </div>
              </div>
            </div>
            <div class="space-y-1">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Mask</h3>
              <div class="mask mask-hexagon bg-primary text-primary-content w-12 h-12 grid place-content-center">M</div>
            </div>
            <div class="space-y-1">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Glass</h3>
              <div class="glass rounded-box p-3 text-sm">Glass</div>
            </div>
            <div class="space-y-1">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Countdown</h3>
              <div class="countdown font-mono text-2xl">
                <span style="--value:1;"></span>:
                <span style="--value:2;"></span>:
                <span style="--value:3;"></span>
              </div>
            </div>
            <div class="space-y-1">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Filter / Join</h3>
              <div class="join">
                <input class="join-item btn" type="radio" name="filter-sample" aria-label="All" checked />
                <input class="join-item btn" type="radio" name="filter-sample" aria-label="Open" />
                <input class="join-item btn" type="radio" name="filter-sample" aria-label="Closed" />
              </div>
            </div>
            <div class="space-y-1">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Theme Controller</h3>
              <label class="label cursor-pointer gap-2">
                <span class="label-text">Toggle dark theme</span>
                <input type="checkbox" value="dark" class="toggle theme-controller" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- noUiSlider vertical range examples -->
      <div id="lib-vertical-sliders" data-lib-section="vertical-sliders" class="card bg-base-200 shadow hidden">
        <div class="card-body">
          <h2 class="card-title">Vertical Sliders (noUiSlider)</h2>
          <p class="text-sm mb-4">Five noUiSlider presets for process setpoint style controls.</p>
          <h3 class="text-xs font-semibold uppercase tracking-wide text-base-content/70">Slider Presets</h3>
          <div class="flex justify-around items-start gap-8 py-4 overflow-x-auto">
            <div class="flex flex-col items-center gap-2 shrink-0">
              <div id="gallery-slider-1" style="height:200px;"></div>
              <div class="badge badge-neutral font-mono text-sm" id="gal1-val">60%</div>
              <div class="text-xs font-mono font-bold text-center mt-1">Minimal</div>
            </div>
            <div class="flex flex-col items-center gap-2 shrink-0">
              <div id="gallery-slider-2" style="height:200px;"></div>
              <div class="badge badge-neutral font-mono text-sm" id="gal2-val">60%</div>
              <div class="text-xs font-mono font-bold text-center mt-1">Fill bar</div>
            </div>
            <div class="flex flex-col items-center gap-2 shrink-0">
              <div id="gallery-slider-3" style="height:200px;"></div>
              <div class="badge badge-neutral font-mono text-sm" id="gal3-val">60%</div>
              <div class="text-xs font-mono font-bold text-center mt-1">Pips + Fill</div>
            </div>
            <div class="flex flex-col items-center gap-2 shrink-0">
              <div id="gallery-slider-4" style="height:200px;"></div>
              <div class="badge badge-neutral font-mono text-sm" id="gal4-val">50%</div>
              <div class="text-xs font-mono font-bold text-center mt-1">Stepped</div>
            </div>
            <div class="flex flex-col items-center gap-2 shrink-0">
              <div id="gallery-slider-5" style="height:200px;"></div>
              <div class="badge badge-neutral font-mono text-sm" id="gal5-val">60%</div>
              <div class="text-xs font-mono font-bold text-center mt-1">Tooltip</div>
            </div>
          </div>
          <div class="text-xs mt-2 font-mono bg-base-300 p-3 rounded">
            Usage: create a target div then call <code>noUiSlider.create(el, config)</code>. See <code>initializeComponentGallerySliders()</code>.
          </div>
        </div>
      </div>
    </section>
  `}function Ip(){return`
    <!-- Settings Page - engineering control software -->
    <section class="space-y-4">
      <div class="card bg-base-200 shadow">
        <div class="card-body">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="card-title">Engineering Control Software Settings</h2>
            <div class="join">
              <button class="btn btn-sm join-item btn-primary">Save all</button>
              <button class="btn btn-sm join-item btn-outline">Validate</button>
              <button class="btn btn-sm join-item btn-ghost">Export config</button>
            </div>
          </div>
          <div class="alert alert-info mt-2">
            <span>Changes are staged locally until applied to PLC runtime.</span>
          </div>
          <div class="tabs tabs-boxed mt-2">
            <a class="tab tab-active">Runtime</a>
            <a class="tab">Safety</a>
            <a class="tab">Network</a>
            <a class="tab">I/O</a>
            <a class="tab">Logging</a>
          </div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-3">
        <div class="space-y-4 xl:col-span-2">
          <div class="card bg-base-200 shadow">
            <div class="card-body">
              <h3 class="card-title text-base">Runtime and Loop Configuration</h3>
              <div class="grid gap-3 md:grid-cols-2">
                <div class="form-control">
                  <label class="label"><span class="label-text">Control mode</span></label>
                  <select class="select select-bordered select-sm">
                    <option>AUTO</option>
                    <option>MANUAL</option>
                    <option>CASCADING</option>
                  </select>
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">Scan period (ms)</span></label>
                  <input type="number" class="input input-bordered input-sm validator" min="10" max="1000" value="100" required />
                  <label class="label"><span class="label-text-alt">10-1000 ms</span></label>
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">Primary loop</span></label>
                  <select class="select select-bordered select-sm">
                    <option>Temperature PID</option>
                    <option>Flow PID</option>
                    <option>Pressure PID</option>
                  </select>
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">Controller profile</span></label>
                  <div class="join">
                    <input class="join-item btn btn-sm" type="radio" name="profile" aria-label="Balanced" checked />
                    <input class="join-item btn btn-sm" type="radio" name="profile" aria-label="Fast" />
                    <input class="join-item btn btn-sm" type="radio" name="profile" aria-label="Robust" />
                  </div>
                </div>
              </div>

              <div class="divider">Output Limits</div>
              <div class="grid gap-3 md:grid-cols-2">
                <div>
                  <div class="flex justify-between text-xs mb-1"><span>Heater clamp (%)</span><span>80%</span></div>
                  <input type="range" class="range range-primary range-sm" min="0" max="100" value="80" />
                </div>
                <div>
                  <div class="flex justify-between text-xs mb-1"><span>Pump speed limit (%)</span><span>65%</span></div>
                  <input type="range" class="range range-secondary range-sm" min="0" max="100" value="65" />
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <span class="badge badge-success">Runtime healthy</span>
                <span class="badge badge-warning">1 pending change</span>
                <span class="badge badge-outline">Simulation disabled</span>
              </div>
            </div>
          </div>

          <div class="card bg-base-200 shadow">
            <div class="card-body">
              <h3 class="card-title text-base">Safety Interlocks and Trips</h3>
              <div class="grid gap-3 md:grid-cols-2">
                <label class="label cursor-pointer justify-start gap-3">
                  <input type="checkbox" class="toggle toggle-success" checked />
                  <span class="label-text">Enable emergency stop chain</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input type="checkbox" class="toggle toggle-warning" checked />
                  <span class="label-text">Require reset after trip</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input type="checkbox" class="checkbox checkbox-error" checked />
                  <span class="label-text">Hard stop on over-current</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input type="checkbox" class="checkbox checkbox-info" />
                  <span class="label-text">Auto-restart after brownout</span>
                </label>
              </div>

              <div class="collapse collapse-arrow bg-base-100 mt-2">
                <input type="checkbox" checked />
                <div class="collapse-title text-sm font-bold">Trip Thresholds</div>
                <div class="collapse-content">
                  <div class="grid gap-3 md:grid-cols-3">
                    <input class="input input-bordered input-sm" value="8.0 A max current" />
                    <input class="input input-bordered input-sm" value="260 V max bus" />
                    <input class="input input-bordered input-sm" value="75 C max coil temp" />
                  </div>
                </div>
              </div>

              <div class="alert alert-warning mt-3">
                <span>Changing safety thresholds requires supervisor signoff.</span>
              </div>
            </div>
          </div>

          <div class="card bg-base-200 shadow">
            <div class="card-body">
              <h3 class="card-title text-base">I/O Mapping and Calibration</h3>
              <div class="overflow-x-auto">
                <table class="table table-sm table-zebra">
                  <thead>
                    <tr>
                      <th>Signal</th>
                      <th>Source</th>
                      <th>Scaling</th>
                      <th>Filter</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>AI1 Temp</td><td>PT100 #1</td><td>0-100 C</td><td>250 ms</td><td><span class="badge badge-success badge-sm">OK</span></td></tr>
                    <tr><td>AI2 Press</td><td>4-20mA PT</td><td>0-10 bar</td><td>100 ms</td><td><span class="badge badge-success badge-sm">OK</span></td></tr>
                    <tr><td>DI4 E-Stop</td><td>Safety Relay</td><td>Boolean</td><td>N/A</td><td><span class="badge badge-warning badge-sm">Needs test</span></td></tr>
                    <tr><td>AO1 Heater</td><td>SCR Driver</td><td>0-100%</td><td>50 ms</td><td><span class="badge badge-success badge-sm">OK</span></td></tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-2 flex gap-2">
                <button class="btn btn-sm btn-outline">Auto-detect modules</button>
                <button class="btn btn-sm btn-ghost">Open calibration wizard</button>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="card bg-base-200 shadow">
            <div class="card-body">
              <h3 class="card-title text-base">Connection and Security</h3>
              <div class="form-control">
                <label class="label"><span class="label-text">Runtime endpoint</span></label>
                <input class="input input-bordered input-sm" value="opc.tcp://10.1.20.44:4840" />
              </div>
              <div class="form-control mt-2">
                <label class="label"><span class="label-text">Protocol</span></label>
                <select class="select select-bordered select-sm">
                  <option>OPC UA</option>
                  <option>Modbus TCP</option>
                  <option>EtherNet/IP</option>
                </select>
              </div>
              <div class="form-control mt-2">
                <label class="label"><span class="label-text">Credential profile</span></label>
                <input type="password" class="input input-bordered input-sm" value="********" />
              </div>
              <div class="mt-3">
                <button class="btn btn-sm btn-outline w-full">Test connection</button>
              </div>
              <div class="mt-3">
                <progress class="progress progress-success w-full" value="87" max="100"></progress>
                <p class="text-xs mt-1">Heartbeat reliability: 87%</p>
              </div>
            </div>
          </div>

          <div class="card bg-base-200 shadow">
            <div class="card-body">
              <h3 class="card-title text-base">Data Logging and Retention</h3>
              <label class="label cursor-pointer justify-start gap-3">
                <input type="checkbox" class="toggle toggle-primary" checked />
                <span class="label-text">Enable historian logging</span>
              </label>
              <div class="form-control mt-2">
                <label class="label"><span class="label-text">Sample interval</span></label>
                <select class="select select-bordered select-sm">
                  <option>100 ms</option>
                  <option>250 ms</option>
                  <option selected>500 ms</option>
                  <option>1 s</option>
                </select>
              </div>
              <div class="form-control mt-2">
                <label class="label"><span class="label-text">Retention policy</span></label>
                <textarea class="textarea textarea-bordered textarea-sm" rows="3">Keep high-resolution logs for 30 days; roll up to 5-minute averages after that.</textarea>
              </div>
              <input type="file" class="file-input file-input-bordered file-input-sm w-full mt-2" />
            </div>
          </div>

          <div class="card bg-base-200 shadow">
            <div class="card-body">
              <h3 class="card-title text-base">Deployment Readiness</h3>
              <ul class="steps steps-vertical w-full">
                <li class="step step-primary">Validate settings</li>
                <li class="step step-primary">Run simulation</li>
                <li class="step">Apply to runtime</li>
                <li class="step">Monitor startup</li>
              </ul>
              <div class="timeline timeline-vertical mt-3">
                <li>
                  <div class="timeline-start text-xs">10:14</div>
                  <div class="timeline-middle">-</div>
                  <div class="timeline-end timeline-box text-xs">Config imported from baseline</div>
                </li>
                <li>
                  <div class="timeline-start text-xs">10:22</div>
                  <div class="timeline-middle">-</div>
                  <div class="timeline-end timeline-box text-xs">Safety checks passed</div>
                </li>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `}function Rp(){return`
    <!-- About / Help Page – Comprehensive Information -->
    
    <!-- Application Information Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="stat bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-lg rounded-lg">
        <div class="stat-title text-primary-content opacity-80">Version</div>
        <div class="stat-value text-2xl">1.2.6</div>
        <div class="stat-desc text-primary-content opacity-70">Current Release</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Last Updated</div>
        <div class="stat-value text-2xl text-info">16/09/2025</div>
        <div class="stat-desc">Recent update</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Build</div>
        <div class="stat-value text-2xl text-success">Production</div>
        <div class="stat-desc">Release Build</div>
      </div>
      <div class="stat bg-base-200 shadow-lg rounded-lg">
        <div class="stat-title">Status</div>
        <div class="stat-value text-2xl text-warning">Active</div>
        <div class="stat-desc">In Development</div>
      </div>
    </div>

    <section class="space-y-4">
      
      <!-- Product Information - IM0004 -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
            </svg>
            Product Information - IM0004
          </h2>
          
          <div class="divider"></div>

          <!-- Product Overview -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" checked />
            <div class="collapse-title text-lg font-bold">
              Product Overview
            </div>
            <div class="collapse-content">
              <div class="space-y-3">
                <div class="stats stats-horizontal shadow bg-base-200">
                  <div class="stat">
                    <div class="stat-title">Model</div>
                    <div class="stat-value text-lg text-primary">IM0004</div>
                    <div class="stat-desc">Industrial Maintenance</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Product Range</div>
                    <div class="stat-value text-lg text-secondary">Industrial</div>
                    <div class="stat-desc">Maintenance</div>
                  </div>
                  <div class="stat">
                    <div class="stat-title">Power Supply</div>
                    <div class="stat-value text-lg text-accent">24V DC</div>
                    <div class="stat-desc">Safe Operation</div>
                  </div>
                </div>
                <div class="alert alert-info">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                  </svg>
                  <div>
                    <h3 class="font-bold">Industrial Maintenance Closed Loop PID Control System</h3>
                    <div class="text-xs mt-1">Curriculum Codes: CP0539 & CP6773</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Core Components -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" />
            <div class="collapse-title text-lg font-bold">
              Core Components
            </div>
            <div class="collapse-content">
              <div class="grid gap-2 md:grid-cols-2">
                <div class="flex items-center gap-2">
                  <span class="badge badge-primary">PLC</span>
                  <span class="text-sm">Siemens S7-1200 PLC</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-secondary">HMI</span>
                  <span class="text-sm">Unified Basic HMI</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-accent">Sensor</span>
                  <span class="text-sm">Turbine Flow Sensor</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-warning">Valve</span>
                  <span class="text-sm">Proportional Control Valve</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-info">Sensor</span>
                  <span class="text-sm">IFM Temperature Sensor</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-success">Switch</span>
                  <span class="text-sm">Float Switches</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-error">Sensor</span>
                  <span class="text-sm">Proximity Sensor</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-primary">Pump</span>
                  <span class="text-sm">Immersion Pump</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Educational Focus -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" />
            <div class="collapse-title text-lg font-bold">
              Educational Focus
            </div>
            <div class="collapse-content">
              <div class="alert alert-success">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
                <div>
                  <h3 class="font-bold">Designed for Engineering Education</h3>
                  <div class="text-sm mt-1">
                    <p>Target Audience: 16-18 year old engineering students and apprentices in further education</p>
                    <p class="mt-2">Aligned with UK T-Level & BTEC qualifications in:</p>
                    <ul class="list-disc list-inside mt-1">
                      <li>Maintenance</li>
                      <li>Installation & Repair</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Hands-on Training -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" />
            <div class="collapse-title text-lg font-bold">
              Hands-on Training
            </div>
            <div class="collapse-content">
              <div class="stat bg-base-200 rounded-box shadow">
                <div class="stat-title">Guided Worksheets</div>
                <div class="stat-value text-3xl text-primary">13+</div>
                <div class="stat-desc">Comprehensive training materials</div>
              </div>
              <div class="mt-3 space-y-2">
                <div class="flex items-center gap-2">
                  <span class="badge badge-primary">Theory</span>
                  <span class="text-sm">Closed-loop control theory</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-secondary">Diagnostics</span>
                  <span class="text-sm">Component diagnostics</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-accent">Faults</span>
                  <span class="text-sm">Fault scenarios</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-warning">Troubleshooting</span>
                  <span class="text-sm">Real-world troubleshooting simulations</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Fault Simulation -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" />
            <div class="collapse-title text-lg font-bold">
              Fault Simulation
            </div>
            <div class="collapse-content">
              <div class="grid gap-2">
                <div class="alert alert-warning">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"/>
                  </svg>
                  <div>
                    <h3 class="font-bold">Built-in Fault Simulation</h3>
                    <p class="text-sm">Software-based faults and hardware fault simulation via removable wiring</p>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <input type="checkbox" class="checkbox checkbox-error checkbox-sm" checked disabled />
                    <span class="text-sm">Emergency stops</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <input type="checkbox" class="checkbox checkbox-warning checkbox-sm" checked disabled />
                    <span class="text-sm">PID setpoint issues</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <input type="checkbox" class="checkbox checkbox-info checkbox-sm" checked disabled />
                    <span class="text-sm">Temperature errors</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <input type="checkbox" class="checkbox checkbox-accent checkbox-sm" checked disabled />
                    <span class="text-sm">Safety interlocks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Safety & Standards -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" />
            <div class="collapse-title text-lg font-bold">
              Safety & Standards
            </div>
            <div class="collapse-content">
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <span class="badge badge-success badge-lg">CE/UL</span>
                  <span class="text-sm font-bold">Compliant Components</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-primary badge-lg">24V DC</span>
                  <span class="text-sm font-bold">Safe Operation Voltage</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-info badge-lg">Standards</span>
                  <span class="text-sm font-bold">Educational Equipment Compliance</span>
                </div>
                <div class="alert alert-success">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                  </svg>
                  <span class="text-sm">Comprehensive safety measures implemented throughout the system</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Technical Specifications -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Technical Specifications
          </h2>

          <div class="divider"></div>

          <!-- Physical Dimensions -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" checked />
            <div class="collapse-title text-lg font-bold">
              Physical Dimensions
            </div>
            <div class="collapse-content">
              <div class="stats stats-horizontal shadow bg-base-200">
                <div class="stat">
                  <div class="stat-title">Length</div>
                  <div class="stat-value text-lg text-primary">52cm</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Width</div>
                  <div class="stat-value text-lg text-secondary">43.5cm</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Height</div>
                  <div class="stat-value text-lg text-accent">46.1cm</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Power & Control -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" />
            <div class="collapse-title text-lg font-bold">
              Power & Control
            </div>
            <div class="collapse-content">
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Specification</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-bold">Power Supply</td>
                      <td>24V DC</td>
                      <td><span class="badge badge-success">Standard</span></td>
                    </tr>
                    <tr>
                      <td class="font-bold">Digital Inputs</td>
                      <td>14 Inputs</td>
                      <td><span class="badge badge-primary">Available</span></td>
                    </tr>
                    <tr>
                      <td class="font-bold">Digital Outputs</td>
                      <td>10 Outputs</td>
                      <td><span class="badge badge-primary">Available</span></td>
                    </tr>
                    <tr>
                      <td class="font-bold">Analog Inputs</td>
                      <td>2 Inputs (0-10V)</td>
                      <td><span class="badge badge-info">Available</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- HMI Interface -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" />
            <div class="collapse-title text-lg font-bold">
              HMI Interface
            </div>
            <div class="collapse-content">
              <div class="card bg-base-200 shadow">
                <div class="card-body">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-bold">Siemens Unified Basic Panel</h3>
                      <p class="text-sm opacity-70">Model: MTP700</p>
                    </div>
                    <span class="badge badge-lg badge-primary">7" Touchscreen</span>
                  </div>
                  <div class="divider"></div>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <span class="badge badge-success">Display</span>
                      <span class="text-sm">7" Capacitive Touchscreen</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="badge badge-info">Features</span>
                      <span class="text-sm">Real-time monitoring & diagnostics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- System Capacity -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" />
            <div class="collapse-title text-lg font-bold">
              System Capacity
            </div>
            <div class="collapse-content">
              <div class="stats stats-horizontal shadow bg-base-200">
                <div class="stat">
                  <div class="stat-title">Tank Capacity</div>
                  <div class="stat-value text-lg text-primary">3.5-4.5L</div>
                  <div class="stat-desc">Litres</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Fluid Type</div>
                  <div class="stat-value text-lg text-info">Water</div>
                  <div class="stat-desc">Clean only</div>
                </div>
                <div class="stat">
                  <div class="stat-title">Operation</div>
                  <div class="stat-value text-lg text-success">Closed-loop</div>
                  <div class="stat-desc">Circuit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- About Matrix TSL -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            About Matrix Technology Solutions Ltd
          </h2>

          <div class="divider"></div>

          <div class="alert alert-info">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
            </svg>
            <div>
              <h3 class="font-bold">Global Provider of Engineering Education Solutions</h3>
              <p class="text-sm mt-1">We develop, create and manufacture innovative hardware and software designed to support the teaching of multiple engineering disciplines.</p>
            </div>
          </div>

          <!-- Vision & Mission -->
          <div class="grid gap-4 md:grid-cols-2 mt-4">
            <div class="card bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-lg">
              <div class="card-body">
                <h3 class="card-title text-primary-content">Our Vision</h3>
                <p class="text-sm text-primary-content opacity-90">
                  Inspiring the next generation of engineers through practical, hands-on learning that transforms classroom theory and prepares young people for the careers of tomorrow.
                </p>
              </div>
            </div>

            <div class="card bg-gradient-to-br from-secondary to-secondary-focus text-secondary-content shadow-lg">
              <div class="card-body">
                <h3 class="card-title text-secondary-content">Our Mission</h3>
                <p class="text-sm text-secondary-content opacity-90">
                  Transform engineering teaching by developing innovative, hands-on solutions that make complex concepts accessible, engaging, and applicable to real-world scenarios with proven results.
                </p>
              </div>
            </div>
          </div>

          <!-- Who We Are -->
          <div class="collapse collapse-arrow bg-base-100 mt-4">
            <input type="checkbox" />
            <div class="collapse-title text-lg font-bold">
              Who Are We?
            </div>
            <div class="collapse-content">
              <p class="text-sm">
                We are committed to empowering educators with the resources and support they need to inspire the next generation of engineers and technicians. Through practical hardware, intuitive software, and comprehensive learning materials, we help bridge the gap between theory and practice — ensuring that learners at every level develop the skills and confidence they need to succeed in modern engineering and technology industries.
              </p>
            </div>
          </div>

          <!-- Our Solutions -->
          <div class="collapse collapse-arrow bg-base-100 mt-2">
            <input type="checkbox" checked />
            <div class="collapse-title text-lg font-bold">
              Our Solutions
            </div>
            <div class="collapse-content">
              <div class="grid gap-2 md:grid-cols-2">
                <div class="flex items-center gap-2">
                  <span class="badge badge-primary badge-lg">Training</span>
                  <span class="text-sm">Hands-on Engineering Education Training</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-secondary badge-lg">Development</span>
                  <span class="text-sm">Innovative Hardware and Software Development</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-accent badge-lg">Support</span>
                  <span class="text-sm">Multiple Engineering Disciplines Support</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-warning badge-lg">Skills</span>
                  <span class="text-sm">Practical Skills Development</span>
                </div>
                <div class="flex items-center gap-2 md:col-span-2">
                  <span class="badge badge-info badge-lg">Industry</span>
                  <span class="text-sm">Industry-Relevant Training Solutions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- About Halifax -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            About Halifax
          </h2>

          <div class="divider"></div>

          <div class="alert alert-success">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
            </svg>
            <div>
              <h3 class="font-bold">Historic Market Town in West Yorkshire</h3>
              <p class="text-sm mt-1">Halifax is known for its rich industrial heritage and vibrant community. Located in the heart of Yorkshire, Halifax has been a center of commerce and industry for centuries.</p>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2 mt-4">
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h3 class="card-title text-sm">Location & Heritage</h3>
                <p class="text-xs">
                  Halifax is situated in the Calder Valley, surrounded by the beautiful Pennine hills. The town has a proud history of textile manufacturing, engineering, and innovation, making it an ideal location for educational technology companies like Matrix TSL.
                </p>
              </div>
            </div>

            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h3 class="card-title text-sm">Modern Halifax</h3>
                <p class="text-xs">
                  Today, Halifax continues to be a thriving town with a mix of traditional industries and modern businesses. It serves as an important regional center for education, commerce, and culture in West Yorkshire.
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <h3 class="font-bold mb-2">Key Features</h3>
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-primary">Historic Market Town</span>
              <span class="badge badge-secondary">Industrial Heritage</span>
              <span class="badge badge-accent">Educational Excellence</span>
              <span class="badge badge-info">Transportation Hub</span>
              <span class="badge badge-success">Cultural Center</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Contact Information
          </h2>

          <div class="divider"></div>

          <div class="grid gap-4 md:grid-cols-2">
            <!-- Contact Details -->
            <div class="space-y-3">
              <div class="stat bg-base-100 rounded-box shadow">
                <div class="stat-title">Website</div>
                <div class="stat-value text-lg">
                  <a href="https://www.matrixtsl.com" class="link link-primary">www.matrixtsl.com</a>
                </div>
              </div>

              <div class="stat bg-base-100 rounded-box shadow">
                <div class="stat-title">Email</div>
                <div class="stat-value text-lg">
                  <a href="mailto:info@matrixtsl.com" class="link link-secondary">info@matrixtsl.com</a>
                </div>
              </div>

              <div class="stat bg-base-100 rounded-box shadow">
                <div class="stat-title">Phone</div>
                <div class="stat-value text-lg text-info">+44 (0) 1422 252380</div>
                <div class="stat-desc">01422 252380</div>
              </div>

              <div class="stat bg-base-100 rounded-box shadow">
                <div class="stat-title">Address</div>
                <div class="stat-value text-sm text-accent">33 Gibbet St</div>
                <div class="stat-desc">Halifax HX1 5BA, England</div>
              </div>

              <div class="stat bg-base-100 rounded-box shadow">
                <div class="stat-title">Location</div>
                <div class="stat-value text-sm text-warning">Halifax</div>
                <div class="stat-desc">West Yorkshire, England</div>
              </div>
            </div>

            <!-- Contact Actions -->
            <div class="space-y-4">
              <div class="card bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-lg">
                <div class="card-body">
                  <h3 class="card-title text-primary-content">Ready to Get Started?</h3>
                  <p class="text-sm text-primary-content opacity-90">
                    Our sales team is here to help you find the perfect training solution for your needs.
                  </p>
                  <div class="card-actions justify-end mt-4">
                    <button class="btn btn-sm bg-primary-content text-primary">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      Email Us Now
                    </button>
                  </div>
                </div>
              </div>

              <div class="card bg-base-100 shadow">
                <div class="card-body">
                  <h3 class="card-title text-sm">Quick Contact</h3>
                  <div class="space-y-2">
                    <button class="btn btn-sm btn-primary w-full">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      Send Email
                    </button>
                    <button class="btn btn-sm btn-secondary w-full">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                      </svg>
                      Call Us
                    </button>
                    <button class="btn btn-sm btn-accent w-full">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
                      </svg>
                      Visit Website
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Help & Documentation -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            Help & Documentation
          </h2>
          <div class="divider"></div>
          <ul class="menu bg-base-100 rounded-box">
            <li>
              <a>
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
                </svg>
                Architecture overview in <code class="text-xs">docs/MATRIX-UI-Architecture.md</code>
              </a>
            </li>
            <li>
              <a>
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                </svg>
                Theming and design system in <code class="text-xs">docs/MATRIX-UI-Design-and-Theming.md</code>
              </a>
            </li>
            <li>
              <a>
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"/>
                </svg>
                Pages & templates todo in <code class="text-xs">docs/Matrix-Template-UI-Pages-Todo.md</code>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  `}function zp(s){return`
    <div class="card bg-base-200 shadow">
      <div class="card-body">
        <h2 class="card-title">${s}</h2>
        <p>This template is planned but not fully implemented yet.</p>
        <p class="text-sm opacity-70">You can extend this section later with more detailed UI.</p>
      </div>
    </div>
  `}const Bp={"hmi-dashboard-1":kp,"hmi-dashboard-2":Sp,"hmi-dashboard-3":_p,"hmi-dashboard-4":Cp,"home-1":xp,"home-2":yp,"home-3":wp,"admin-1":Mp,"admin-2":Pp,"admin-3":Ap,"control-1":Dp,"io-1":Tp,"faults-1":Lp,"tasks-1":Op,components:Ep,settings:Ip,about:Rp,"io-link-master":dp},Fp=document.querySelector("#app");Fp.innerHTML=`
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="navbar bg-base-200 px-4">
      <!-- Left: Menu Toggle + Matrix Logo -->
      <div class="flex-none flex items-center gap-2">
        <button id="sidebar-toggle" class="btn btn-ghost btn-sm btn-square">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <img src="/IM-Smart-Sensors/matrix.png" alt="Matrix Logo" class="h-8 w-auto" />
      </div>
      <!-- Center: Title -->
      <div class="flex-1 flex justify-center">
        <span class="text-xl font-bold">IO-Link Master</span>
      </div>
      <!-- Right: Theme -->
      <div class="flex-none flex items-center gap-4">
        <div class="form-control">
          <label class="label cursor-pointer gap-2">
            <span class="label-text">Theme</span>
            <select id="theme-select" class="select select-bordered select-sm">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </div>
    </header>

    <!-- Connection Status Bar -->
    <div id="connection-status-bar" class="bg-base-300 border-b-2 border-base-content/10 px-4 py-2 min-h-[40px] flex items-center justify-center shadow-sm">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">Connection Status:</span>
        <div id="connection-status" class="flex items-center gap-2">
          <span id="connection-indicator" class="flex h-3 w-3 rounded-full bg-success animate-pulse"></span>
          <span id="connection-text" class="text-sm font-semibold text-success">Connected</span>
        </div>
        <span class="text-xs text-base-content/60 ml-2">•</span>
        <span id="connection-time" class="text-xs text-base-content/60">Last connected: Just now</span>
      </div>
    </div>

    <!-- Body with sidebar + main content -->
    <div class="flex flex-1 bg-base-100 relative">
      <!-- Mobile backdrop overlay -->
      <div id="sidebar-backdrop" class="fixed inset-0 bg-black/50 z-40 hidden transition-opacity duration-300 md:hidden"></div>
      
      <!-- Sidebar -->
      <aside id="sidebar" class="fixed md:static inset-y-0 left-0 z-50 w-72 border-r border-base-300 bg-base-200 transition-all duration-300 ease-in-out transform -translate-x-full md:translate-x-0 md:block flex flex-col overflow-hidden">
        <!-- Close button for mobile -->
        <div class="flex justify-end p-4 md:hidden border-b border-base-300 flex-shrink-0">
          <button id="sidebar-close" class="btn btn-ghost btn-sm btn-square">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Scrollable menu container -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <ul class="menu p-4 gap-1" id="sidebar-menu">
          <li class="menu-title">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              Dashboard
            </span>
          </li>
          <li><a href="#" data-page="io-link-master">IO-Link Master</a></li>
          <!-- Commented out: other template pages (uncomment to restore)
          <li><a href="#" data-page="hmi-dashboard-1">Electrical Machines</a></li>
          <li><a href="#" data-page="hmi-dashboard-2">Wind Tunnel</a></li>
          <li><a href="#" data-page="hmi-dashboard-3">Process Control Temperature</a></li>
          <li><a href="#" data-page="hmi-dashboard-4">Fluid Mechanics</a></li>
          <li class="menu-title mt-4">Examples</li>
          <li><a href="#" data-page="home-1">Gauges</a></li>
          <li><a href="#" data-page="home-2">Graphs</a></li>
          <li><a href="#" data-page="home-3">Tables</a></li>
          <li class="menu-title mt-4">Admin Panels</li>
          <li><a href="#" data-page="admin-1">Calibration</a></li>
          <li><a href="#" data-page="admin-2">Debugging</a></li>
          <li><a href="#" data-page="admin-3">Bootloader</a></li>
          <li class="menu-title mt-4">Control & I/O</li>
          <li><a href="#" data-page="control-1">Control</a></li>
          <li><a href="#" data-page="io-1">I/O / Signals</a></li>
          <li><a href="#" data-page="faults-1">Faults / Status</a></li>
          <li><a href="#" data-page="tasks-1">Tasks / Worksheets</a></li>
          <li class="menu-title mt-4">Other</li>
          <li><a href="#" data-page="components">Component Library</a></li>
          <li><a href="#" data-page="settings">Settings</a></li>
          <li><a href="#" data-page="about">About / Help</a></li>
          -->
          </ul>
        </div>
      </aside>

      <!-- Main content -->
      <main id="main-content" class="flex-1 p-4 space-y-4">
        <!-- Content will be inserted here based on selected page -->
      </main>
    </div>

    <!-- Footer -->
    <footer class="footer footer-center p-4 bg-base-200 text-base-content">
      <aside>
        <p>Matrix TSL ${new Date().getFullYear()}</p>
      </aside>
    </footer>

    <!-- Modal using native <dialog> + DaisyUI styles -->
    <dialog id="deviceResetModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Reset device?</h3>
        <p class="py-2 text-sm">
          This is just a demo modal. In a real app, this would send a reset command to the selected device.
        </p>
        <div class="modal-action">
          <form method="dialog" class="flex gap-2">
            <button class="btn btn-outline btn-sm">Cancel</button>
            <button class="btn btn-error btn-sm">Confirm reset</button>
          </form>
        </div>
      </div>
    </dialog>

    <!-- Admin Password Modal -->
    <dialog id="adminPasswordModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Admin Access</h3>
        <p class="py-2 text-sm">Please enter the password to access the Admin Panel.</p>
        <div class="form-control mt-4">
          <input type="password" id="admin-password-input" class="input input-bordered" placeholder="Enter password" />
          <label class="label" id="admin-password-error" style="display: none;">
            <span class="label-text-alt text-error">Incorrect password. Please try again.</span>
          </label>
        </div>
        <div class="modal-action">
          <form method="dialog" class="flex gap-2">
            <button type="button" class="btn btn-outline btn-sm" id="admin-password-cancel">Cancel</button>
            <button type="button" class="btn btn-primary btn-sm" id="admin-password-submit">Submit</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
`;let Mt=[];function Ha(s){vp(),Mt.forEach(i=>i.destroy()),Mt=[];const t=document.getElementById("main-content"),e=Bp[s];if(!e){t.innerHTML=zp("Page not found");return}t.innerHTML=e();const a=document.getElementById("sidebar-menu");a&&a.querySelectorAll("a[data-page]").forEach(i=>{i.classList.toggle("active",i.getAttribute("data-page")===s)}),s==="home-2"?Vp():s==="hmi-dashboard-1"?Hp():s==="hmi-dashboard-2"?jp():s==="hmi-dashboard-3"?Np():s==="hmi-dashboard-4"?Yp():s==="components"?Up():s==="io-link-master"&&mp()}function Vp(){setTimeout(()=>{function s(t,e){const a=document.getElementById(t);if(!a)return;const i=new vt(a.getContext("2d"),e);Mt.push(i)}s("home2-trend-chart",{type:"line",data:{labels:["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00"],datasets:[{label:"Temperature (C)",data:[24.1,24.6,25.2,26.1,26.8,26.4,25.9,25.3],borderColor:"rgb(59, 130, 246)",backgroundColor:"rgba(59, 130, 246, 0.16)",tension:.35,fill:!0,pointRadius:3},{label:"Setpoint",data:[25,25,25,25,25,25,25,25],borderColor:"rgb(251, 191, 36)",borderDash:[6,4],fill:!1,pointRadius:0}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{position:"top"}},scales:{y:{beginAtZero:!1}}}}),s("home2-combo-chart",{type:"bar",data:{labels:["Mon","Tue","Wed","Thu","Fri","Sat"],datasets:[{type:"bar",label:"kWh",data:[340,360,395,410,420,300],backgroundColor:"rgba(14, 165, 233, 0.35)",borderColor:"rgb(14, 165, 233)",borderWidth:1,yAxisID:"y"},{type:"line",label:"Cost ($)",data:[49,52,58,60,63,45],borderColor:"rgb(244, 63, 94)",backgroundColor:"rgba(244, 63, 94, 0.2)",tension:.3,yAxisID:"y1"}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"top"}},scales:{y:{type:"linear",position:"left",title:{display:!0,text:"kWh"}},y1:{type:"linear",position:"right",grid:{drawOnChartArea:!1},title:{display:!0,text:"$"}}}}}),s("home2-stacked-chart",{type:"bar",data:{labels:["Line A","Line B","Line C","Line D"],datasets:[{label:"Good",data:[120,98,115,108],backgroundColor:"rgba(34, 197, 94, 0.65)"},{label:"Rework",data:[15,19,12,14],backgroundColor:"rgba(250, 204, 21, 0.7)"},{label:"Scrap",data:[5,8,6,7],backgroundColor:"rgba(239, 68, 68, 0.7)"}]},options:{responsive:!0,maintainAspectRatio:!1,scales:{x:{stacked:!0},y:{stacked:!0,beginAtZero:!0}}}}),s("home2-horizontal-chart",{type:"bar",data:{labels:["Pack","Mix","Heat","Dose","Inspect"],datasets:[{label:"Utilization %",data:[91,77,84,69,88],backgroundColor:["rgba(59, 130, 246, 0.7)","rgba(20, 184, 166, 0.7)","rgba(168, 85, 247, 0.7)","rgba(245, 158, 11, 0.7)","rgba(34, 197, 94, 0.7)"],borderColor:"rgba(15, 23, 42, 0.25)",borderWidth:1}]},options:{indexAxis:"y",responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{min:0,max:100}}}}),s("home2-doughnut-chart",{type:"doughnut",data:{labels:["High","Medium","Low","Info"],datasets:[{data:[6,14,21,38],backgroundColor:["rgba(239, 68, 68, 0.85)","rgba(249, 115, 22, 0.8)","rgba(234, 179, 8, 0.8)","rgba(59, 130, 246, 0.8)"],borderColor:"rgba(15, 23, 42, 0.25)",borderWidth:1,hoverOffset:8}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:"58%",plugins:{legend:{position:"bottom"}}}}),s("home2-step-chart",{type:"line",data:{labels:["0s","1s","2s","3s","4s","5s","6s","7s","8s","9s","10s"],datasets:[{label:"Setpoint",data:[40,40,40,55,55,55,55,55,55,55,55],borderColor:"rgb(99, 102, 241)",stepped:!0,pointRadius:0},{label:"Process Value",data:[39,39.5,40,44,49,54,57,56,55.5,55.2,55],borderColor:"rgb(16, 185, 129)",backgroundColor:"rgba(16, 185, 129, 0.15)",fill:!0,tension:.25,pointRadius:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"top"}},scales:{y:{beginAtZero:!1}}}})},10)}function Hp(){setTimeout(()=>{const s=document.getElementById("rpmSparkline");if(s){const n=s.getContext("2d"),o=new vt(n,{type:"line",data:{labels:Array.from({length:20},(l,r)=>r),datasets:[{data:[1200,1260,1320,1370,1410,1440,1465,1488,1500,1510,1516,1521,1525,1527,1529,1530,1530,1530,1530,1530],borderColor:"rgb(148, 163, 184)",backgroundColor:"rgba(148, 163, 184, 0.1)",fill:!0,tension:.4,pointRadius:0,borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{enabled:!1}},scales:{x:{display:!1},y:{display:!1,min:0,max:3e3}}}});Mt.push(o)}const t={responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top",labels:{boxWidth:10}}},scales:{x:{display:!1},y:{beginAtZero:!1}},elements:{point:{radius:0}}},e=Array.from({length:48},(n,o)=>o),a=document.getElementById("acVoltage3PhaseChart");if(a){const n=new vt(a.getContext("2d"),{type:"line",data:{labels:e,datasets:[{label:"L1",data:e.map(o=>230+8*Math.sin(o/48*2*Math.PI)),borderColor:"rgb(59, 130, 246)",tension:.25},{label:"L2",data:e.map(o=>230+8*Math.sin(o/48*2*Math.PI-2*Math.PI/3)),borderColor:"rgb(16, 185, 129)",tension:.25},{label:"L3",data:e.map(o=>230+8*Math.sin(o/48*2*Math.PI+2*Math.PI/3)),borderColor:"rgb(249, 115, 22)",tension:.25}]},options:{...t,scales:{...t.scales,y:{min:215,max:245,title:{display:!0,text:"V"}}}}});Mt.push(n)}const i=document.getElementById("acCurrent3PhaseChart");if(i){const n=new vt(i.getContext("2d"),{type:"line",data:{labels:e,datasets:[{label:"L1",data:e.map(o=>1.8+.25*Math.sin(o/48*2*Math.PI)),borderColor:"rgb(59, 130, 246)",tension:.25},{label:"L2",data:e.map(o=>1.7+.25*Math.sin(o/48*2*Math.PI-2*Math.PI/3)),borderColor:"rgb(16, 185, 129)",tension:.25},{label:"L3",data:e.map(o=>1.9+.25*Math.sin(o/48*2*Math.PI+2*Math.PI/3)),borderColor:"rgb(249, 115, 22)",tension:.25}]},options:{...t,scales:{...t.scales,y:{min:1.2,max:2.4,title:{display:!0,text:"A"}}}}});Mt.push(n)}},10)}function jp(){setTimeout(()=>{const s=document.getElementById("airSpeedChart");if(s){const e=s.getContext("2d"),a=new vt(e,{type:"line",data:{labels:["00:00","00:10","00:20","00:30","00:40","00:50","01:00"],datasets:[{label:"Air Speed (m/s)",data:[26.5,27.2,27.8,28.2,28.4,28.4,28.4],borderColor:"rgb(59, 130, 246)",backgroundColor:"rgba(59, 130, 246, 0.1)",fill:!0,tension:.4,pointRadius:4,pointHoverRadius:6},{label:"Setpoint (m/s)",data:[28,28,28,28,28,28,28],borderColor:"rgb(251, 146, 60)",backgroundColor:"rgba(251, 146, 60, 0.1)",borderDash:[5,5],fill:!1,tension:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top"},tooltip:{mode:"index",intersect:!1}},scales:{y:{beginAtZero:!0,min:0,max:35,title:{display:!0,text:"Air Speed (m/s) · 125 mm test section"}},x:{title:{display:!0,text:"Time"}}}}});Mt.push(a)}const t=document.getElementById("pressureChart2");if(t){const e=t.getContext("2d"),a=new vt(e,{type:"bar",data:{labels:["Inlet","Test 1","Test 2","Test 3","Diffuser"],datasets:[{label:"Static Pressure (kPa)",data:[101.3,100.8,100.5,100.2,100.9],backgroundColor:["rgba(59, 130, 246, 0.8)","rgba(139, 92, 246, 0.8)","rgba(236, 72, 153, 0.8)","rgba(34, 197, 94, 0.8)","rgba(251, 146, 60, 0.8)"],borderColor:["rgb(59, 130, 246)","rgb(139, 92, 246)","rgb(236, 72, 153)","rgb(34, 197, 94)","rgb(251, 146, 60)"],borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{beginAtZero:!1,min:99,max:102,title:{display:!0,text:"Pressure (kPa)"}}}}});Mt.push(a)}},10)}function Np(){setTimeout(()=>{const s=document.getElementById("stepResponseChart");if(s){const t=s.getContext("2d"),e=new vt(t,{type:"line",data:{labels:["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"],datasets:[{label:"Process Value (°C)",data:[25,25,25,30,38,44,48,50.5,51.2,50.8,50.2,50,49.9,50,50,50],borderColor:"rgb(59, 130, 246)",backgroundColor:"rgba(59, 130, 246, 0.1)",fill:!0,tension:.4,pointRadius:3,pointHoverRadius:5},{label:"Setpoint (°C)",data:[25,25,25,50,50,50,50,50,50,50,50,50,50,50,50,50],borderColor:"rgb(251, 146, 60)",backgroundColor:"rgba(251, 146, 60, 0.1)",borderDash:[5,5],fill:!1,tension:0,pointRadius:0},{label:"Control Output (%)",data:[50,50,50,80,75,70,65,62,60,61,62,62,62,62,62,62],borderColor:"rgb(34, 197, 94)",backgroundColor:"rgba(34, 197, 94, 0.1)",fill:!1,tension:.3,pointRadius:2,yAxisID:"y1"}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top"},tooltip:{mode:"index",intersect:!1}},scales:{y:{type:"linear",display:!0,position:"left",min:0,max:60,title:{display:!0,text:"Temperature (°C)"}},y1:{type:"linear",display:!0,position:"right",min:0,max:100,title:{display:!0,text:"Control Output (%)"},grid:{drawOnChartArea:!1}},x:{title:{display:!0,text:"Time (seconds)"}}}}});Mt.push(e)}},10)}function Wp(){const s={orientation:"vertical",direction:"rtl",range:{min:0,max:100},format:{to:e=>Math.round(e),from:e=>parseInt(e)}};function t(e,a,i){const n=document.getElementById(e);!n||n.noUiSlider||(zn.create(n,a),n.noUiSlider.on("update",o=>{const l=document.getElementById(i);l&&(l.textContent=o[0]+"%")}))}t("gallery-slider-1",{...s,start:60},"gal1-val"),t("gallery-slider-2",{...s,start:60,connect:"lower"},"gal2-val"),t("gallery-slider-3",{...s,start:60,connect:"lower",pips:{mode:"values",values:[0,25,50,75,100],density:5}},"gal3-val"),t("gallery-slider-4",{...s,start:50,step:25,connect:"lower",pips:{mode:"steps",density:100}},"gal4-val"),t("gallery-slider-5",{...s,start:60,connect:"lower",tooltips:{to:e=>Math.round(e)+"%"}},"gal5-val")}function Up(){const s=Array.from(document.querySelectorAll("[data-lib-tab]")),t=Array.from(document.querySelectorAll("[data-lib-section]"));if(!s.length||!t.length)return;function e(i){s.forEach(n=>{n.classList.toggle("tab-active",n.getAttribute("data-lib-tab")===i)}),t.forEach(n=>{const o=n.getAttribute("data-lib-section")===i;n.classList.toggle("hidden",!o)}),i==="vertical-sliders"?Wp():i==="overlays-interaction"&&$p()}s.forEach(i=>{i.addEventListener("click",()=>{e(i.getAttribute("data-lib-tab"))})});const a=s.find(i=>i.classList.contains("tab-active"))||s[0];e(a.getAttribute("data-lib-tab"))}function $p(){const s=document.getElementById("before-after-range"),t=document.getElementById("before-after-after-layer"),e=document.getElementById("before-after-divider");if(!s||!t||!e||s.dataset.initialized==="true")return;const a=()=>{const i=Math.max(0,Math.min(100,Number(s.value)||50));t.style.clipPath=`inset(0 0 0 ${i}%)`,e.style.left=`${i}%`};s.addEventListener("input",a),s.dataset.initialized="true",a()}function Yp(){const s={orientation:"vertical",direction:"rtl",range:{min:0,max:100},format:{to:e=>Math.round(e),from:e=>parseInt(e)}};function t(e,a,i){const n=document.getElementById(e);!n||n.noUiSlider||(zn.create(n,a),i&&n.noUiSlider.on("update",i))}t("pump1-slider",{...s,start:60,connect:"lower",pips:{mode:"values",values:[0,25,50,75,100],density:5}},e=>{const a=document.getElementById("pump1-val");a&&(a.textContent=e[0]+"%")}),t("pump2-slider",{...s,start:45,connect:"lower",pips:{mode:"values",values:[0,25,50,75,100],density:5}},e=>{const a=document.getElementById("pump2-val");a&&(a.textContent=e[0]+"%")}),window.setFluidPump=function(e,a){const i=document.getElementById(e+"-slider");i&&i.noUiSlider&&i.noUiSlider.set(a)},setTimeout(()=>{const e=document.getElementById("bernoulliChart");if(e){const n=e.getContext("2d"),o=new vt(n,{type:"bar",data:{labels:["P1 Inlet","P2 Converge","P3 Throat","P4 Diverge","P5 Outlet"],datasets:[{label:"Measured (kPa)",data:[118.2,105.4,76.8,93.1,108.6],backgroundColor:"rgba(148, 163, 184, 0.7)",borderColor:"rgb(148, 163, 184)",borderWidth:2},{label:"Theoretical (kPa)",data:[118.2,104.8,75.2,91.8,107.4],backgroundColor:"rgba(251, 146, 60, 0.15)",borderColor:"rgb(251, 146, 60)",borderWidth:2,type:"line",tension:.4,pointRadius:4,fill:!1}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!0,position:"top"}},scales:{y:{min:60,max:130,title:{display:!0,text:"Pressure (kPa)"}},x:{title:{display:!0,text:"Tapping Position"}}}}});Mt.push(o)}const a=document.getElementById("flowTimeChart");if(a){const n=a.getContext("2d"),o=new vt(n,{type:"line",data:{labels:["0","5","10","15","20","25","30","35","40","45","50","55","60","65","70"],datasets:[{label:"Flow Rate (L/min)",data:[0,10.2,18.6,22.9,24.8,25.8,26.2,26.4,26.3,26.4,26.5,26.4,26.4,26.3,26.4],borderColor:"rgb(59, 130, 246)",backgroundColor:"rgba(59, 130, 246, 0.08)",fill:!0,tension:.4,pointRadius:2,pointHoverRadius:4}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{min:0,max:35,title:{display:!0,text:"L/min"}},x:{title:{display:!0,text:"Time (seconds)"}}}}});Mt.push(o)}const i=document.getElementById("flowPressureChart");if(i){const n=i.getContext("2d"),o=new vt(n,{type:"line",data:{datasets:[{label:"Measured (kPa)",data:[{x:5,y:1.8},{x:10,y:5.9},{x:15,y:11.2},{x:20,y:18.8},{x:25,y:28.6},{x:26.4,y:31.8},{x:30,y:38.2},{x:35,y:50.4}],borderColor:"rgb(148, 163, 184)",backgroundColor:"rgba(148, 163, 184, 0.8)",pointRadius:5,pointHoverRadius:7,showLine:!0,tension:.3},{label:"Theoretical — Darcy-Weisbach (kPa)",data:[{x:0,y:0},{x:5,y:1.5},{x:10,y:5.9},{x:15,y:13.3},{x:20,y:23.7},{x:25,y:37.1},{x:30,y:53.4},{x:35,y:72.7}],borderColor:"rgb(251, 146, 60)",backgroundColor:"transparent",borderDash:[5,5],pointRadius:0,showLine:!0,tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"nearest",intersect:!1},plugins:{legend:{display:!0,position:"top"}},scales:{x:{type:"linear",min:0,max:40,title:{display:!0,text:"Flow Rate (L/min)"}},y:{min:0,max:80,title:{display:!0,text:"Differential Pressure (kPa)"}}}}});Mt.push(o)}},10)}const Dn=document.getElementById("sidebar-menu");Dn.addEventListener("click",s=>{const t=s.target.closest("a[data-page]");if(!t)return;s.preventDefault();const e=t.getAttribute("data-page");Dn.querySelectorAll("a[data-page]").forEach(a=>{a.classList.toggle("active",a===t)}),Ha(e)});setTimeout(()=>{const s=document.getElementById("admin-button"),t=document.getElementById("adminPasswordModal"),e=document.getElementById("admin-password-input"),a=document.getElementById("admin-password-submit"),i=document.getElementById("admin-password-cancel"),n=document.getElementById("admin-password-error"),o="matrix123";s&&t&&(s.addEventListener("click",()=>{t.showModal(),e.value="",n.style.display="none",e.focus()}),a&&a.addEventListener("click",()=>{if(e.value===o){t.close();const r=s.getAttribute("data-page"),c=document.getElementById("sidebar-menu");c&&c.querySelectorAll("a[data-page]").forEach(d=>{d.classList.toggle("active",d.getAttribute("data-page")===r)}),Ha(r)}else n.style.display="block",e.value="",e.focus()}),e&&e.addEventListener("keypress",l=>{l.key==="Enter"&&a.click()}),i&&i.addEventListener("click",()=>{t.close(),e.value="",n.style.display="none"}))},0);const ka=document.documentElement,Ne=document.getElementById("theme-select"),vs=localStorage.getItem("matrix-theme");vs==="light"||vs==="dark"?(ka.setAttribute("data-theme",vs),Ne.value=vs):(ka.setAttribute("data-theme","dark"),Ne&&(Ne.value="dark"));Ne.addEventListener("change",()=>{const s=Ne.value;ka.setAttribute("data-theme",s),localStorage.setItem("matrix-theme",s)});setTimeout(()=>{const s=document.getElementById("sidebar"),t=document.getElementById("sidebar-toggle"),e=document.getElementById("sidebar-backdrop"),a=document.getElementById("sidebar-close");if(!s||!t)return;localStorage.getItem("matrix-sidebar-collapsed")==="true"&&window.innerWidth>=768&&(s.classList.add("w-0","overflow-hidden"),s.classList.remove("w-72"));function o(){window.innerWidth<768?!s.classList.contains("-translate-x-full")?(s.classList.add("-translate-x-full"),e&&e.classList.add("hidden"),document.body.style.overflow=""):(s.classList.remove("-translate-x-full"),e&&e.classList.remove("hidden"),document.body.style.overflow="hidden"):s.classList.contains("w-0")?(s.classList.remove("w-0","overflow-hidden"),s.classList.add("w-72"),localStorage.setItem("matrix-sidebar-collapsed","false")):(s.classList.remove("w-72"),s.classList.add("w-0","overflow-hidden"),localStorage.setItem("matrix-sidebar-collapsed","true"))}t.addEventListener("click",o),a&&a.addEventListener("click",()=>{window.innerWidth<768&&o()}),e&&e.addEventListener("click",()=>{window.innerWidth<768&&!s.classList.contains("-translate-x-full")&&o()});const l=document.getElementById("sidebar-menu");if(l&&l.addEventListener("click",c=>{c.target.closest("a[data-page]")&&window.innerWidth<768&&setTimeout(()=>{s.classList.contains("-translate-x-full")||o()},100)}),s){const c=s.querySelector(".overflow-y-auto");c&&(c.addEventListener("wheel",d=>{const{scrollTop:u,scrollHeight:h,clientHeight:p}=c,b=u===0,f=u+p>=h-1;(!b&&d.deltaY<0||!f&&d.deltaY>0)&&d.stopPropagation()},{passive:!1}),c.addEventListener("touchmove",d=>{d.stopPropagation()},{passive:!1}))}let r;window.addEventListener("resize",()=>{clearTimeout(r),r=setTimeout(()=>{window.innerWidth<768?(s.classList.add("-translate-x-full"),e&&e.classList.add("hidden"),document.body.style.overflow=""):(s.classList.remove("-translate-x-full"),e&&e.classList.add("hidden"),localStorage.getItem("matrix-sidebar-collapsed")==="true"?(s.classList.add("w-0","overflow-hidden"),s.classList.remove("w-72")):(s.classList.remove("w-0","overflow-hidden"),s.classList.add("w-72")))},250)})},0);setTimeout(()=>{const s=document.getElementById("connection-indicator"),t=document.getElementById("connection-text"),e=document.getElementById("connection-time");if(!s||!t||!e)return;function a(n){if(n){s.classList.remove("bg-error"),s.classList.add("bg-success"),t.textContent="Connected",t.classList.remove("text-error"),t.classList.add("text-success");const l=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"});e.textContent=`Last connected: ${l}`}else{s.classList.remove("bg-success"),s.classList.add("bg-error"),t.textContent="Disconnected",t.classList.remove("text-success"),t.classList.add("text-error");const l=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"});e.textContent=`Last disconnected: ${l}`}}a(!0),window.updateConnectionStatus=a},0);Ha("io-link-master");
