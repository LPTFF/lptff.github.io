import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../../extension/music-reader.js',import.meta.url),'utf8');
function fixture(fetcher,origin='https://music.lptffhome.site/video/fixture') {
 let connect,receive,disconnected=false;const messages=[];
 const port={name:'homeops-original-v1',sender:{frameId:0,url:origin},postMessage:m=>messages.push(m),disconnect:()=>{disconnected=true},onDisconnect:{addListener(){}},onMessage:{addListener(fn){receive=fn}}};
 vm.runInNewContext(source,{chrome:{runtime:{onConnect:{addListener(fn){connect=fn}}}},URL,fetch:fetcher,Number,Map,AbortController,setTimeout,clearTimeout,Uint8Array,String,btoa,Error});connect(port);
 return {messages,send:m=>receive(m),get disconnected(){return disconnected}};
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
