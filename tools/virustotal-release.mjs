import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {createReadStream,createWriteStream} from 'node:fs';

const repo=process.env.GITHUB_REPOSITORY;
const githubToken=process.env.GH_TOKEN;
const vtKey=process.env.VT_API_KEY;
const tag=process.env.RELEASE_TAG||'';
const BEGIN='<!-- penny-virustotal:start -->',END='<!-- penny-virustotal:end -->';
if(!/^[\w.-]+\/[\w.-]+$/.test(repo||''))throw Error('GITHUB_REPOSITORY is required.');
if(!githubToken)throw Error('GH_TOKEN is required.');

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let nextVtRequest=0;
async function github(endpoint,options={}){
 const response=await fetch(`https://api.github.com/repos/${repo}${endpoint}`,{...options,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:`Bearer ${githubToken}`,...options.headers},signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error(`GitHub API HTTP ${response.status}`);
 return response.json();
}
async function vt(endpoint,options={}){
 for(let attempt=0;attempt<4;attempt++){
  await sleep(Math.max(0,nextVtRequest-Date.now()));nextVtRequest=Date.now()+16000;
  const url=/^https?:/.test(endpoint)?endpoint:`https://www.virustotal.com/api/v3${endpoint}`;
  const parsed=new URL(url);
  if(parsed.protocol==='http:')parsed.protocol='https:';
  if(parsed.protocol!=='https:'||!(parsed.hostname==='virustotal.com'||parsed.hostname.endsWith('.virustotal.com')))throw Error('Unexpected VirusTotal upload host.');
  const response=await fetch(parsed.href,{...options,headers:{'x-apikey':vtKey,...options.headers},redirect:'error',signal:AbortSignal.timeout(options.body?900000:60000)});
  if(response.status===404)return null;
  if(response.status===429||response.status>=500){await sleep(60000*(attempt+1));continue;}
  if(!response.ok)throw Error(`VirusTotal API HTTP ${response.status}`);
  return response.json();
 }
 throw Error('VirusTotal rate limit or service is unavailable. Next scheduled run will retry.');
}
function stateFrom(body){
 try{const match=body.match(/<!-- penny-vt-state:([A-Za-z0-9+/=]+) -->/);if(!match)return [];const value=JSON.parse(Buffer.from(match[1],'base64').toString());return Array.isArray(value)?value:[];}catch{return [];}
}
function counts(stats){const out={};for(const key of ['malicious','suspicious','harmless','undetected']){const value=stats?.[key];if(!Number.isInteger(value)||value<0||value>10000)return null;out[key]=value;}return out;}
function complete(record,attributes){
 const stats=counts(attributes?.last_analysis_stats||attributes?.stats);
 if(!stats||!Object.values(stats).some(n=>n>0))return false;
 record.stats=stats;record.analysisDate=attributes.last_analysis_date||attributes.date||null;record.status='completed';return true;
}
async function download(asset,file){
 const response=await fetch(asset.browser_download_url,{signal:AbortSignal.timeout(900000)});
 if(!response.ok||!response.body)throw Error(`Installer download HTTP ${response.status}`);
 await pipeline(Readable.fromWeb(response.body),createWriteStream(file));
 const info=await fs.stat(file);if(info.size!==asset.size)throw Error('Installer size mismatch.');
 const hash=crypto.createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);
 const sha256=hash.digest('hex');
 if(asset.digest?.startsWith('sha256:')&&asset.digest!==`sha256:${sha256}`)throw Error('GitHub installer digest mismatch.');
 return sha256;
}
async function inspect(asset,old,directory){
 const unchanged=old?.assetId===asset.id&&old.size===asset.size&&old.assetUpdatedAt===asset.updated_at&&asset.digest===`sha256:${old.sha256}`&&/^[a-f0-9]{64}$/.test(old.sha256||'');
 const record={name:asset.name,assetId:asset.id,size:asset.size,assetUpdatedAt:asset.updated_at,status:'pending'};
 let file;
 if(unchanged){record.sha256=old.sha256;record.analysisId=old.analysisId||null;}
 else{file=path.join(directory,String(asset.id)+'.exe');record.sha256=await download(asset,file);}
 record.url=`https://www.virustotal.com/gui/file/${record.sha256}/detection`;
 const existing=await vt(`/files/${record.sha256}`);
 if(existing&&complete(record,existing.data?.attributes))return record;
 if(!record.analysisId){
  if(asset.size>650*1024*1024){record.status='too-large';return record;}
  if(!file){file=path.join(directory,String(asset.id)+'.exe');if(await download(asset,file)!==record.sha256)throw Error('Installer content changed.');}
  let upload='/files';if(asset.size>32*1024*1024){const result=await vt('/files/upload_url');upload=result?.data;if(typeof upload!=='string')throw Error('Upload URL was not provided.');}
  const form=new FormData();form.set('file',new Blob([await fs.readFile(file)]),asset.name);
  const result=await vt(upload,{method:'POST',body:form});record.analysisId=result?.data?.id;
  if(typeof record.analysisId!=='string')throw Error('Analysis ID was not provided.');
 }
 for(let i=0;i<6;i++){
  const result=await vt(`/analyses/${encodeURIComponent(record.analysisId)}`);
  const attributes=result?.data?.attributes;
  if(attributes?.status==='completed'){const fileReport=await vt(`/files/${record.sha256}`);if(fileReport&&complete(record,fileReport.data?.attributes))return record;}
  record.status=attributes?.status==='in-progress'?'in-progress':'queued';
  if(i<5)await sleep(30000);
 }
 return record;
}
function markdown(records){
 const lines=[BEGIN,'### VirusTotal 검사 결과','', '| 설치 파일 | 검사 상태 | 악성 · 의심 탐지 | 검사 시각 (UTC) | 결과 |','|---|---|---|---|---|'];
 for(const record of records){
  const name=record.name.replaceAll('|','\\|').replaceAll('`','');
  const finished=record.status==='completed';
  const verdict=finished?(record.stats.malicious||record.stats.suspicious?'탐지 있음 · 결과 확인':'검사 완료'):{queued:'검사 대기',pending:'검사 준비', 'in-progress':'검사 중','too-large':'업로드 용량 초과',error:'확인 실패 · 재시도 예정'}[record.status]||'검사 중';
  const n=finished?`악성 ${record.stats.malicious} · 의심 ${record.stats.suspicious} · 판정 ${Object.values(record.stats).reduce((a,b)=>a+b,0)}개`:'—';
  const date=finished&&Number.isFinite(record.analysisDate)?new Date(record.analysisDate*1000).toISOString().replace('T',' ').replace('.000Z',' UTC'):'—';
  lines.push(`| \`${name}\` | ${verdict} | ${n} | ${date} | ${record.url?`[보고서 보기](${record.url})`:'—'} |`);
 }
 lines.push('','<details><summary>검사 대상 파일의 SHA-256</summary>','');
 for(const record of records)if(record.sha256)lines.push(`- \`${record.name.replaceAll('`','')}\`: \`${record.sha256}\``);
 lines.push('','</details>','','탐지 0건은 안전을 보증하지 않습니다. 검사 대기·실패는 탐지 0건으로 표시하지 않습니다. 결과는 위 해시의 파일에 해당합니다.','',`<!-- penny-vt-state:${Buffer.from(JSON.stringify(records)).toString('base64')} -->`,END);
 return lines.join('\n');
}
async function main(){
 const release=await github(tag?`/releases/tags/${encodeURIComponent(tag)}`:'/releases/latest');
 if(release.draft||release.prerelease)throw Error('Only published stable releases are scanned.');
 const assets=(await github(`/releases/${release.id}/assets?per_page=100`)).filter(a=>/^Penny-Chart-(?:Setup|Private-Test)-.*\.exe$/i.test(a.name));
 if(!assets.length){console.log('No Penny Chart EXE release assets found.');return;}
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'penny-vt-')),previous=stateFrom(release.body||''),records=[];
 try{
  for(const asset of assets){let record;try{record=await inspect(asset,previous.find(r=>r.assetId===asset.id),directory);}catch(error){console.error(`${asset.name}: ${error.message}`);record={name:asset.name,assetId:asset.id,size:asset.size,assetUpdatedAt:asset.updated_at,status:'error'};}records.push(record);}
  const current=await github(`/releases/${release.id}`),block=markdown(records),body=current.body||'';
  const first=body.indexOf(BEGIN),last=body.indexOf(END,first);
  const updated=first>=0&&last>=first?body.slice(0,first)+block+body.slice(last+END.length):body.trimEnd()+'\n\n'+block;
  if(updated!==body)await github(`/releases/${release.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({body:updated})});
  if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,block+'\n');
  if(records.some(r=>r.status==='error'||r.status==='too-large'))process.exitCode=1;
 }finally{await fs.rm(directory,{recursive:true,force:true});}
}

if(!vtKey){console.log('VirusTotal scan is not enabled: add the VT_API_KEY Actions secret.');process.exitCode=1;}else await main();
