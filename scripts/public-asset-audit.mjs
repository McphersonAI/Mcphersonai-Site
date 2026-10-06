import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative, join, extname } from 'node:path';
import { createHash } from 'node:crypto';
const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173';
const root=resolve('dist');
const types={'.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.svg':'image/svg+xml','.css':'text/css','.js':'javascript','.txt':'text/plain','.xml':'application/xml'};
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const errors=[];
const assets=(await walk(root)).filter(f=>types[extname(f)]);
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const file of assets){
  const path='/'+relative(root,file);
  const response=await fetch(baseUrl+path,{redirect:'manual'});
  if(response.status!==200) errors.push(`${path}: HTTP ${response.status}`);
  if(!(response.headers.get('content-type')||'').includes(types[extname(file)])) errors.push(`${path}: incorrect MIME type`);
  const served=Buffer.from(await response.arrayBuffer());
  const built=await readFile(file), source=await readFile(resolve('.'+path));
  if(!served.length||hash(served)!==hash(built)||hash(built)!==hash(source)) errors.push(`${path}: source/build/served byte mismatch`);
}
if(errors.length){console.error('Public-asset audit failed:\n'+errors.join('\n'));process.exit(1);}
console.log(`Public-asset audit passed: ${assets.length} assets returned 200, correct MIME types and identical source/build/served SHA-256 digests.`);
