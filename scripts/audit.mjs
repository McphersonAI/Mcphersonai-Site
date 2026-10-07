import { readFile, readdir } from 'node:fs/promises';
import { join, resolve, extname, relative } from 'node:path';
import vm from 'node:vm';
import { canonicalRoutes, historicalRoutes, legacyRoutes, primaryLinks, footerLinks, fileForRoute } from './site-contract.mjs';
const root = resolve('dist');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
async function walk(path) {
  const results = [];
  for (const entry of await readdir(path, {withFileTypes:true})) {
    const file = join(path,entry.name);
    if (entry.isDirectory()) results.push(...await walk(file)); else results.push(file);
  }
  return results;
}
const files = await walk(root);
const htmlFiles = files.filter(f => f.endsWith('.html'));
const pages = new Map(await Promise.all(htmlFiles.map(async f => [relative(root,f), await readFile(f,'utf8')])));
const match = (html, regex) => html.match(regex)?.[1] || '';
const links = html => [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(m => [m[1],m[2].replace(/<[^>]+>/g,'').trim()]);
const canonicalSet = new Set();
const titles = new Set();
for (const [file,html] of pages) {
  const prefix = `${file}: `;
  check(/<html lang="en">/.test(html), prefix+'document language');
  check(/name="viewport"/.test(html), prefix+'viewport');
  check((html.match(/<h1(?:\s|>)/g)||[]).length===1,prefix+'one H1 required');
  check(html.includes('class="skip-link"') && html.includes('id="main"'),prefix+'keyboard skip target');
  check(html.includes('data-nav-toggle') && html.includes('aria-controls="primary-nav"'),prefix+'mobile menu semantics');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  check(new Set(ids).size===ids.length,prefix+'duplicate IDs');
  check(!/<p>\s*(?:<pre|<div|<p|<ul|<h[1-6])/i.test(html),prefix+'invalid block inside paragraph');
  for (const attribute of ['aria-labelledby','aria-describedby']) for (const [,value] of html.matchAll(new RegExp(attribute+'="([^"]+)"','g'))) {
    for (const id of value.split(/\s+/)) check(ids.includes(id),prefix+`missing ${attribute} target ${id}`);
  }
  const nav=match(html,/<nav id="primary-nav"[\s\S]*?>([\s\S]*?)<\/nav>/);
  const footer=match(html,/<nav class="launch-footer"[\s\S]*?>([\s\S]*?)<\/nav>/);
  check(JSON.stringify(links(nav))===JSON.stringify(primaryLinks),prefix+'primary navigation/founding CTA contract');
  check(JSON.stringify(links(footer))===JSON.stringify(footerLinks),prefix+'footer contract');
  check(!links(nav).some(([href,label])=>href==='/proof'||label==='Proof'),prefix+'competing Proof navigation');
  const noindex=html.includes('content="noindex, follow"');
  const canonical=match(html,/<link rel="canonical" href="([^"]+)"/);
  const title=match(html,/<title>([^<]+)<\/title>/);
  check(Boolean(title),prefix+'title missing');
  check(/<meta name="description" content="[^"]+"/.test(html),prefix+'description missing');
  for(const key of ['og:title','og:description','og:url','og:image','og:image:alt']) check(html.includes(`property="${key}"`),prefix+key+' missing');
  check(html.includes('name="twitter:card"'),prefix+'social card');
  if(!noindex){
    check(!titles.has(title),prefix+'duplicate title'); titles.add(title);
    check(!canonicalSet.has(canonical),prefix+'duplicate canonical'); canonicalSet.add(canonical);
    check(canonical.startsWith('https://mcphersonai.com/')&&!canonical.endsWith('.html'),prefix+'invalid canonical');
  }
  for (const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|sms:|data:)/i.test(href)) continue;
    const url=new URL(href,'https://mcphersonai.com/'+file);
    const pathname=decodeURIComponent(url.pathname);
    const target=pathname==='/'?'index.html':pathname.slice(1);
    const candidate=[target,target+'.html',target+'/index.html'].find(x=>files.includes(join(root,x)));
    check(Boolean(candidate),prefix+'missing internal asset/link '+href);
    if(candidate&&url.hash&&candidate.endsWith('.html')){
      const targetHtml=pages.get(candidate);
      check(targetHtml.includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'),prefix+'missing fragment '+href);
    }
  }
  for(const [,id] of html.matchAll(/<label\b[^>]*for="([^"]+)"/g)) check(ids.includes(id),prefix+'missing input '+id);
  for(const [value] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) check(/rel="[^\"]*noopener/.test(value||''),prefix+'unsafe new-tab link');
}
for(const route of [...canonicalRoutes,...historicalRoutes]) {
  const html=pages.get(fileForRoute(route));
  check(Boolean(html),route+': missing page');
  check(html?.includes(`rel="canonical" href="https://mcphersonai.com${route}"`),route+': canonical mismatch');
  if(historicalRoutes.includes(route)) check(html?.includes('noindex, follow')&&/historical/i.test(html),route+': history label/indexing');
}
const sitemap=await readFile(join(root,'sitemap.xml'),'utf8');
const locations=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
check(JSON.stringify([...locations].sort())===JSON.stringify([...canonicalSet].sort()),'sitemap differs from indexable canonicals');
check(new Set(locations).size===locations.length,'duplicate sitemap routes');
const redirects=await readFile(join(root,'_redirects'),'utf8');
const rules=redirects.split('\n').filter(x=>x.trim()&&!x.startsWith('#')).map(x=>x.trim().split(/\s+/));
check(new Set(rules.map(x=>x[0])).size===rules.length,'duplicate redirect source');
for(const [from,to,status] of rules){
  check(status==='301',`non-permanent compatibility redirect ${from}`);
  check(from!==to&&!rules.some(r=>r[0]===to),`redirect chain/cycle ${from}`);
}
for(const [from,to] of legacyRoutes) {
  for(const suffix of ['','/','.html']) check(rules.some(r=>r[0]===from+suffix&&r[1]===to),`missing compatibility redirect ${from+suffix}`);
  const stub=pages.get(fileForRoute(from));
  check(stub?.includes(`http-equiv="refresh" content="0; url=${to}"`),from+': missing static redirect fallback');
  check(stub?.includes(`href="${to}"`),from+': missing no-JS fallback');
}
const publicText=(await Promise.all(files.filter(f=>['.html','.js','.css','.txt','.xml'].includes(extname(f))).map(f=>readFile(f,'utf8')))).join('\n');
for (const [label,pattern] of [
 ['private local path',/\/Users\//],
 ['private Drive URL',/(?:docs|drive)\.google\.com/i], ['private key',/BEGIN [A-Z ]*PRIVATE KEY/],
 ['cloud token',/\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,})\b/],
 ['private IPv4',/\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/],
 ['stale current version',/\bv?0\.6\.\d+\b|\bv?0\.7\.[23]\b|\b0\.1\.[68]\b/],
 ['obsolete licensing warning',/no declared software license/i],
 ['future placeholder',/coming soon|public roadmap/i],['legacy beta CTA',/Request Private Beta Access|Install the Free Plugin/],
 ['unearned universal claim',/universally safe|universally verified|zero latency|zero technical impact|independently audited|production-ready/]
]) {
  // A negated zero-impact statement is required; only positive claims are banned.
  if(label==='unearned universal claim'){
    check(!/universally safe|universally verified|independently audited|production-ready/.test(publicText),label);
  }else check(!pattern.test(publicText),label+' in public output');
}
// This exact HTTPS origin is the documented public beta endpoint. Other tailnet hosts remain private.
const endpointRedacted = publicText.replace(/https:\/\/governance-plane-observa\.tailb473db\.ts\.net(?=[\s<"'`]|$)/g, 'PUBLIC_HOSTED_ORIGIN');
check(!/[a-z0-9.-]+\.ts\.net/i.test(endpointRedacted),'unapproved network host in public output');
for(const forbidden of ['.git','project-docs','node_modules','scripts','.env','package.json']) check(!files.some(f=>relative(root,f).split('/').includes(forbidden)),'internal file in dist: '+forbidden);
const home=pages.get('index.html'), evidence=pages.get('evidence.html'), founding=pages.get('founding.html'), getting=pages.get('getting-started.html');
for(const text of ['Your agent can do almost anything.','The workflow you sell to clients shouldn’t.','Built on Observa.','AUTHORIZED != COMPLETED != VERIFIED']) check(home.includes(text),'home copy boundary: '+text);
check(!/\bp(?:50|95|99)\b|\d+\s*ms\b/.test(home),'benchmark metrics on homepage');
for(const id of ['methodology','releases','identities','limitations']) check(evidence.includes('id="'+id+'"'),'Evidence missing '+id);
for(const text of ['Standard v0.1','SELF-RUN','CONTROLLED SYNTHETIC','FIXTURE CONFORMANCE','PASS, HOLD or FAIL','timer','excluded','non','SHA-256']) check(evidence.includes(text),'Evidence methodology missing '+text);
check(!/id="(?:runtime-overhead|durability|data-boundary|governance-correctness|verification-conformance|non-interference|scale-load)"/.test(evidence),'empty result family on Evidence');
for(const page of ['index.html','founding.html','how-it-works.html','observa.html','trust.html','getting-started.html','docs.html']) {
  const html=pages.get(page); for(const posture of ['SHADOW ONLY','AUTHORITY NONE','ENFORCEMENT OFF']) check(html.includes(posture),page+': missing '+posture);
}
for(const text of ['qualification has no fee','paid subscription','per live client deployment','criteria','choose']) check(founding.toLowerCase().includes(text.toLowerCase()),'commercial condition missing: '+text);
for(const name of ['name','email','company','role','workflow','action','runtime','record','deployments','customers','repeat','failure','success','staging','authorization','evidence','acknowledged']) check(founding.includes('name="'+name+'"'),'Founding field missing '+name);
check(founding.includes('type="submit" disabled')&&founding.includes('<noscript>'),'form must not submit personal data without JS');
for(const command of ['observa pair --base-url','observa pair --api-url','observa request-access --api-url','observa request-status','observa inspect-workflow --file ./workflow.json','observa hosted-health','observa n8n-setup','observa diagnose','observa-local-node@0.1.7']) check(getting.includes(command),'Getting Started command missing '+command);
check(!/pair --base-url[^\n<]*(?:--replace-existing|--api-url)/.test(getting),'mixed pairing flags');
const releaseSource=await readFile(join(root,'release-status.js'),'utf8');
const sandbox={window:{}}; vm.runInNewContext(releaseSource,sandbox); const release=sandbox.window.MCPHERSON_RELEASE_STATUS;
check(release.openClawVersion==='0.7.4'&&release.localNodeVersion==='0.1.7','release versions');
for(const key of ['openClawSha256','localNodeSha256','openClawCommit']) check(evidence.includes(release[key]),'Evidence differs from release identity '+key);
const site=await readFile(join(root,'site.js'),'utf8');
check(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie/.test(site),'unapproved form network/storage behavior');
check(site.includes('event.preventDefault()')&&site.includes('encodeURIComponent(body)')&&site.includes('output.value = prepared'),'form data must stay plain text and URL-encoded');
const css=await readFile(join(root,'styles.css'),'utf8');
for(const text of [':focus-visible','prefers-reduced-motion','@media (max-width: 760px)']) check(css.includes(text),'accessibility CSS missing '+text);
const headers=await readFile(join(root,'_headers'),'utf8');
for(const text of ["default-src 'self'","script-src 'self'","form-action 'self'","frame-ancestors 'none'",'X-Content-Type-Options: nosniff','X-Frame-Options: DENY','Referrer-Policy: strict-origin-when-cross-origin','Permissions-Policy:']) check(headers.includes(text),'header missing '+text);
check(!/script-src[^;\n]*unsafe-inline/.test(headers),'unsafe script policy');
check((await readFile(join(root,'robots.txt'),'utf8')).includes('Sitemap: https://mcphersonai.com/sitemap.xml'),'robots sitemap');
check(pages.get('404.html').includes('<h1>Page not found.</h1>')&&pages.get('404.html').includes('noindex, follow'),'custom 404');
for(const f of files.filter(f=>/\.(pdf|png|jpg|ico)$/.test(f))) {
  const bytes=await readFile(f); check(bytes.length>50,'empty asset '+relative(root,f));
  if(f.endsWith('.pdf')) check(bytes.subarray(0,5).toString()==='%PDF-','invalid PDF '+relative(root,f));
  if(f.endsWith('.png')) check(bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a','invalid PNG '+relative(root,f));
}
if(errors.length){ console.error(`Static audit failed (${errors.length}):\n`+errors.map(x=>'- '+x).join('\n')); process.exit(1); }
console.log(`Static audit passed: ${htmlFiles.length} pages; navigation, footer, metadata, links/fragments, redirects, claim boundaries, release identities, application privacy, headers and assets.`);
