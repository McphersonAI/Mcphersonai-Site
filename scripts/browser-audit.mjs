import { mkdir, writeFile } from 'node:fs/promises';
import { canonicalRoutes, historicalRoutes, legacyRoutes, primaryLinks, footerLinks } from './site-contract.mjs';
const args=Object.fromEntries(process.argv.slice(2).flatMap((v,i,a)=>v.startsWith('--')?[[v.slice(2),a[i+1]]]:[]));
const base=args['base-url']||'http://127.0.0.1:4173';
const debug='http://127.0.0.1:'+(args['debug-port']||9223);
const screenshots=args.screenshots;
if(screenshots) await mkdir(screenshots,{recursive:true});
const routes=[...canonicalRoutes,...historicalRoutes,'/this-route-does-not-exist'];
const widths=[320,390,768,1440];
const errors=[];
let inspections=0, navigationClicks=0;
const target=await (await fetch(debug+'/json/new?about:blank',{method:'PUT'})).json();
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((ok,no)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',no,{once:true});});
let nextId=1, activeRoute='', requestCount=0;
const pending=new Map();
socket.addEventListener('message',event=>{
 const m=JSON.parse(event.data);
 if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.no(new Error(m.error.message)):p.ok(m.result);}return;}
 if(m.method==='Runtime.exceptionThrown') errors.push(`${activeRoute}: JS exception ${m.params.exceptionDetails.text}`);
 if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error') errors.push(`${activeRoute}: console error`);
 if(m.method==='Network.requestWillBeSent') requestCount++;
 if(m.method==='Network.loadingFailed'&&m.params.errorText!=='net::ERR_ABORTED') errors.push(`${activeRoute}: resource load ${m.params.errorText}`);
 if(m.method==='Network.responseReceived'&&m.params.response.status>=400&&!m.params.response.url.endsWith('/this-route-does-not-exist')) errors.push(`${activeRoute}: HTTP ${m.params.response.status} ${m.params.response.url}`);
});
function send(method,params={}){return new Promise((ok,no)=>{const id=nextId++;const timer=setTimeout(()=>{pending.delete(id);no(new Error('CDP timeout: '+method));},20000);pending.set(id,{ok,no,timer});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;}
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
async function ready(path){
 for(let i=0;i<80;i++){
  try{if(await evaluate(`document.readyState==='complete' && location.pathname===${JSON.stringify(path)}`)) {await evaluate('document.fonts.ready');await pause(35);return;}}catch{}
  await pause(50);
 }
 throw new Error('Navigation did not settle: '+path);
}
async function navigate(route){activeRoute=route;await send('Page.navigate',{url:base+route});await ready(new URL(base+route).pathname);}
const check=(yes,message)=>{if(!yes)errors.push(activeRoute+': '+message);};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
try{
 for(const width of widths){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
  for(const route of routes){
   await navigate(route); inspections++;
   const state=await evaluate(`(()=>{
     const links=selector=>[...document.querySelectorAll(selector+' a')].map(a=>[a.getAttribute('href'),a.textContent.trim()]);
     const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
     return {overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('h1').length,
       primary:links('#primary-nav'),footer:links('.launch-footer'),
       emptyLinks:[...document.querySelectorAll('a')].filter(a=>!a.textContent.trim()&&!a.getAttribute('aria-label')&&!a.querySelector('img[alt]')).length,
       brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,
       controls:[...document.querySelectorAll('input,select,textarea')].filter(e=>visible(e)&&!e.labels?.length&&!e.getAttribute('aria-label')).length,
       menu:document.querySelector('[data-nav-toggle]')&&getComputedStyle(document.querySelector('[data-nav-toggle]')).display!=='none',
       navVisible:visible(document.querySelector('#primary-nav')),
       badCtas:[...document.querySelectorAll('.btn,.nav-cta')].filter(e=>visible(e)&&e.getBoundingClientRect().width>innerWidth).length,
       horizontal:[...document.querySelectorAll('pre,.card,figure,fieldset')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).length,
       focusStyle:getComputedStyle(document.querySelector('.skip-link')).outlineStyle
     };
   })()`);
   check(!state.overflow,`${width}px horizontal overflow`);
   check(state.h1===1,`${width}px H1 count`);
   check(JSON.stringify(state.primary)===JSON.stringify(primaryLinks),'rendered primary navigation');
   check(JSON.stringify(state.footer)===JSON.stringify(footerLinks),'rendered footer');
   check(!state.emptyLinks&&!state.brokenImages&&!state.controls&&!state.badCtas&&!state.horizontal,`${width}px labels/images/CTA layout ${JSON.stringify(state)}`);
   const contrast = await evaluate(`(()=>{
     const rgb=s=>(s.match(/[\\d.]+/g)||[]).map(Number);
     const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
     const failures=[];
     for(const el of document.querySelectorAll('p,h1,h2,h3,a,label,legend,figcaption,dt,dd,button,li')){
       if(!el.getClientRects().length||!el.textContent.trim()||getComputedStyle(el).visibility==='hidden')continue;
       const style=getComputedStyle(el); let bg=[255,255,255];
       for(let node=el;node;node=node.parentElement){const c=rgb(getComputedStyle(node).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}}
       const fg=rgb(style.color),f=luminance(fg),b=luminance(bg),ratio=(Math.max(f,b)+.05)/(Math.min(f,b)+.05);
       const large=parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&parseInt(style.fontWeight)>=700);
       if(ratio<(large?3:4.5)-.02)failures.push(el.tagName+': '+el.textContent.trim().slice(0,45)+' '+ratio.toFixed(2));
     }
     return failures;
   })()`);
   check(!contrast.length,`${width}px contrast: ${contrast.join('; ')}`);
   if(state.menu){
    check(!state.navVisible,'mobile navigation initially hidden');
    await evaluate(`document.querySelector('[data-nav-toggle]').focus()`);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    check(await evaluate(`document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded')==='true'&&document.querySelector('#primary-nav').getClientRects().length>0`),'keyboard menu open');
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    check(await evaluate(`document.querySelector('[data-nav-toggle]').getAttribute('aria-expanded')==='false'&&document.activeElement.matches('[data-nav-toggle]')`),'Escape closes menu and restores focus');
   }
   // Actual tab/Enter operation verifies that the skip link transfers focus.
   await evaluate(`document.activeElement.blur(); window.scrollTo(0,0); document.querySelector('.skip-link').focus()`);
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
   await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
   check(await evaluate(`document.activeElement.id==='main'`),'skip link focus transfer');
   if(screenshots&&[390,1440].includes(width)){
    await evaluate('document.activeElement.blur(); window.scrollTo(0,0)');
    await pause(50);
    const metrics=await send('Page.getLayoutMetrics');
    const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.ceil(metrics.cssContentSize.height),scale:1}});
    await writeFile(`${screenshots}/${route==='/'?'home':route.slice(1).replaceAll('/','-')}-${width}.png`,Buffer.from(image.data,'base64'));
   }
  }
  console.log(`Browser layout/keyboard checks: ${width}px, ${routes.length} pages.`);
 }
 // Follow all header navigation links from every primary launch page.
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 for(const route of canonicalRoutes.slice(0,12)){
  for(const [destination] of primaryLinks){
   await navigate(route);
   await evaluate(`document.querySelector('#primary-nav a[href="${destination}"]').click()`);
   await ready(destination);navigationClicks++;
  }
 }
 // Old routes preserve query strings and lead to the intended final page.
 for(const [from,to] of legacyRoutes){
  activeRoute=from;
  await send('Page.navigate',{url:base+from+'?ref=browser-audit'});await ready(to);
  check(await evaluate(`location.search==='?ref=browser-audit'`),'legacy query lost');
 }
 activeRoute='legacy contact campaign';
 await send('Page.navigate',{url:base+'/contact?utm_campaign=governance-v6-shadow-beta&ref=compat#governance-setup'});await ready('/getting-started');
 check(await evaluate(`location.hash==='#access'&&location.search.includes('ref=compat')`),'legacy campaign technical destination');
 // Form: invalid data stays local, valid data produces a reviewable message, edits invalidate it.
 await navigate('/founding');
 await evaluate(`document.querySelector('form').requestSubmit()`);
 check(await evaluate(`document.querySelector('[data-prepared-panel]').hidden`),'invalid application prepared');
 await evaluate(`(()=>{for(const el of document.querySelectorAll('fieldset input,fieldset textarea,fieldset select')){
  el.value=el.type==='email'?'builder@example.com':el.type==='number'?'2':el.tagName==='SELECT'?'Yes — synthetic or staging':'Synthetic audit <script>example</script> & text';
 }document.querySelector('[name=acknowledged]').checked=true;})()`);
 const requestsBefore=requestCount;
 await evaluate(`document.querySelector('form').requestSubmit()`);
 const form=await evaluate(`(()=>{const a=document.querySelector('[data-mailto]');return {prepared:!document.querySelector('[data-prepared-panel]').hidden,text:document.querySelector('[data-prepared]').value,href:a.href,status:document.querySelector('[data-form-status]').textContent,script:!!document.querySelector('example')}})()`);
 check(form.prepared&&form.text.includes('<script>example</script>')&&!form.script,'application plain-text handling');
 check(new URL(form.href).searchParams.get('body').includes('builder@example.com'),'application encoding');
 check(form.status.includes('not sent'),'truthful prepare status');
 check(requestCount===requestsBefore,'application sent a network request');
 // Force clipboard rejection; selection/manual fallback must remain available.
 await evaluate(`Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('audit'))}});document.execCommand=()=>false;document.querySelector('[data-copy]').click()`);
 await pause(30);
 check(await evaluate(`document.querySelector('[data-copy-status]').textContent.includes('copy it manually')`),'clipboard fallback');
 await evaluate(`document.querySelector('[name=workflow]').value='Revised';document.querySelector('[name=workflow]').dispatchEvent(new Event('input',{bubbles:true}))`);
 check(await evaluate(`document.querySelector('[data-prepared-panel]').hidden`),'stale prepared application remains available');
 // No-JS is a working read-only website; the form never transmits by fallback.
 await send('Emulation.setScriptExecutionDisabled',{value:true});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 for(const route of canonicalRoutes.slice(0,12)){
  await navigate(route);
  check(await evaluate(`document.querySelector('#primary-nav').getClientRects().length>0&&document.documentElement.scrollWidth<=innerWidth+1`),'no-JS navigation/layout');
  if(route==='/founding')check(await evaluate(`document.querySelector('[data-prepare]').disabled`),'no-JS form can submit');
 }
 await send('Emulation.setScriptExecutionDisabled',{value:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await navigate('/');
 check(await evaluate(`getComputedStyle(document.documentElement).scrollBehavior==='auto'`),'reduced motion');
} finally {socket.close();await fetch(debug+'/json/close/'+target.id);}
if(errors.length){console.error(`Browser audit failed (${errors.length}):\n`+errors.map(x=>'- '+x).join('\n'));process.exit(1);}
console.log(`Browser audit passed: ${inspections} page/viewport inspections, ${navigationClicks} actual primary-navigation clicks, ${legacyRoutes.length} legacy redirects, campaign routing, application validation/encoding/no-send/edit/copy fallback, no-JS and reduced motion.`);
