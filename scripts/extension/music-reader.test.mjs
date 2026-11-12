import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../extension/music-reader.js',import.meta.url),'utf8');
function fixture(fetcher,origin='https://music.lptffhome.site/video/fixture') {
 let connect,receive,disconnect,disconnected=false;const messages=[];
 const port={name:'homeops-original-v1',sender:{frameId:0,url:origin},postMessage:m=>messages.push(m),disconnect:()=>{disconnected=true},onDisconnect:{addListener(fn){disconnect=fn}},onMessage:{addListener(fn){receive=fn}}};
 vm.runInNewContext(source,{chrome:{runtime:{onConnect:{addListener(fn){connect=fn}}}},URL,fetch:fetcher,Number,Map,AbortController,setTimeout,clearTimeout,Uint8Array,String,btoa,Error});connect(port);
 return {messages,send:m=>receive(m),disconnect:()=>disconnect(),get disconnected(){return disconnected}};
}
async function result(f){for(let n=0;n<30;n++){const m=f.messages.find(x=>x.id===1);if(m)return m;await new Promise(setImmediate)}assert.fail('bounded reader did not settle')}
const object={url:'https://download.pds.quark.cn/private-test-capability',bytes:100,etag:'"version"'};
test('only the first-party top-level player can connect',()=>{
 const f=fixture(()=>assert.fail('network must not run'),'https://other.example/');assert.equal(f.disconnected,true);
});
test('extension reads only the requested pinned range and returns bytes without a URL',async()=>{
 let calls=0;const f=fixture(async(url,options)=>{calls++;assert.equal(url,object.url);assert.equal(options.credentials,'omit');assert.equal(options.headers.Range,'bytes=10-13');return new Response(new Uint8Array([1,2,3,4]),{status:206,headers:{'Content-Length':'4','Content-Range':'bytes 10-13/100',ETag:'"version"'}})});
 f.send({action:'open',source:object});f.send({action:'read',id:1,first:10,last:13});const m=await result(f);assert.equal(m.ok,true);assert.deepEqual([...Buffer.from(m.body,'base64')],[1,2,3,4]);assert.equal('url' in m,false);assert.equal(calls,1);f.send({action:'close'});
});
test('unapproved URLs, changed versions, whole-file replies and excessive ranges fail closed',async()=>{
 const denied=fixture(()=>assert.fail('network must not run'));denied.send({action:'open',source:{...object,url:'https://example.com/private'}});assert.equal(denied.messages[0].ok,false);
 for(const [status,tag] of [[200,'"version"'],[206,'"changed"']]){
  const f=fixture(async()=>new Response(new Uint8Array(4),{status,headers:{'Content-Length':'4','Content-Range':'bytes 10-13/100',ETag:tag}}));f.send({action:'open',source:object});f.send({action:'read',id:1,first:10,last:13});assert.equal((await result(f)).ok,false);f.send({action:'close'});
 }
 const large=fixture(()=>assert.fail('network must not run'));large.send({action:'open',source:{...object,bytes:9999999}});large.send({action:'read',id:1,first:0,last:4194304});assert.equal((await result(large)).ok,false);large.send({action:'close'});
});

test('lookalike hosts, credentials, fragments, insecure URLs and weak versions cannot open a source',()=>{
 for(const url of [
  'http://download.pds.quark.cn/file',
  'https://download.pds.quark.cn.evil.example/file',
  'https://user:password@download.pds.quark.cn/file',
  'https://download.pds.quark.cn:8443/file',
  'https://download.pds.quark.cn/file#fragment',
 ]){
  const f=fixture(()=>assert.fail('network must not run'));
  f.send({action:'open',source:{...object,url}});
  assert.equal(f.messages[0].ok,false);
 }
 for(const etag of ['W/"version"','unquoted','"bad\r\nversion"']){
  const f=fixture(()=>assert.fail('network must not run'));
  f.send({action:'open',source:{...object,etag}});
  assert.equal(f.messages[0].ok,false);
 }
});

test('invalid bounds and unsafe sizes are rejected before any network access',()=>{
 for(const bytes of [0,-1,1.5,Number.MAX_SAFE_INTEGER,128*1024**3+1]){
  const f=fixture(()=>assert.fail('network must not run'));
  f.send({action:'open',source:{...object,bytes}});
  assert.equal(f.messages[0].ok,false);
 }
 for(const [first,last] of [[-1,3],[4,3],[0,100],[0.5,3],[0,Infinity]]){
  const f=fixture(()=>assert.fail('network must not run'));
  f.send({action:'open',source:object});
  f.send({action:'read',id:1,first,last});
  assert.equal(f.messages.find(message=>message.id===1).ok,false);
  f.send({action:'close'});
 }
});

test('wrong offsets, wrong totals and whole-file replies cancel the response body immediately',async()=>{
 for(const [status,range] of [[200,'bytes 10-13/100'],[206,'bytes 0-3/100'],[206,'bytes 10-13/101']]){
  let cancelled=false;
  const f=fixture(async()=>new Response(new ReadableStream({cancel(){cancelled=true}}),{
   status,headers:{'Content-Length':'4','Content-Range':range,ETag:object.etag},
  }));
  f.send({action:'open',source:object});
  f.send({action:'read',id:1,first:10,last:13});
  assert.equal((await result(f)).ok,false);
  assert.equal(cancelled,true);
  f.send({action:'close'});
 }
});

test('a truncated or overflowing body never returns successful bytes',async()=>{
 for(const length of [3,5]){
  const f=fixture(async()=>new Response(new Uint8Array(length),{
   status:206,headers:{'Content-Length':'4','Content-Range':'bytes 10-13/100',ETag:object.etag},
  }));
  f.send({action:'open',source:object});
  f.send({action:'read',id:1,first:10,last:13});
  assert.equal((await result(f)).ok,false);
  f.send({action:'close'});
 }
});

function pendingFixture(){
 const requests=[];
 const f=fixture((url,options)=>new Promise((resolve,reject)=>{
  requests.push({url,signal:options.signal});
  options.signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});
 }));
 f.send({action:'open',source:object});
 return {f,requests};
}

test('eight active reads are allowed and a ninth never reaches the network',async()=>{
 const {f,requests}=pendingFixture();
 for(let id=1;id<=9;id++)f.send({action:'read',id,first:id,last:id});
 assert.equal(requests.length,8);
 assert.equal(f.messages.find(message=>message.id===9).ok,false);
 f.send({action:'close'});
 await new Promise(setImmediate);
 assert.ok(requests.every(request=>request.signal.aborted));
});

test('cancelling one read leaves another running, while disconnect aborts all remaining reads',async()=>{
 const {f,requests}=pendingFixture();
 f.send({action:'read',id:1,first:10,last:13});
 f.send({action:'read',id:2,first:20,last:23});
 f.send({action:'cancel',id:1});
 assert.equal(requests[0].signal.aborted,true);
 assert.equal(requests[1].signal.aborted,false);
 assert.equal((await result(f)).ok,false);
 f.disconnect();
 assert.equal(requests[1].signal.aborted,true);
 await new Promise(setImmediate);
});

test('a connection remains pinned to its original capability after a second open message',async()=>{
 let fetched;
 const f=fixture(async url=>{
  fetched=url;
  return new Response(new Uint8Array(4),{status:206,headers:{
   'Content-Length':'4','Content-Range':'bytes 10-13/100',ETag:object.etag,
  }});
 });
 f.send({action:'open',source:object});
 f.send({action:'open',source:{...object,url:'https://other.pds.quark.cn/another-file'}});
 f.send({action:'read',id:1,first:10,last:13});
 assert.equal((await result(f)).ok,true);
 assert.equal(fetched,object.url);
 f.send({action:'close'});
});
