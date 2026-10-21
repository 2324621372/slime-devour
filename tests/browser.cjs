const {chromium}=require('@playwright/test');
const {pathToFileURL}=require('url');
const path=require('path');
const fs=require('fs');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files']});
const errors=[];const requests=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await context.route('http://**/*',r=>r.abort());await context.route('https://**/*',r=>r.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto(process.env.GAME_URL||pathToFileURL(path.resolve('public/index.html')).href);
 await page.waitForFunction(()=>window.slimeGame?.snapshot().frame>1,{timeout:60000});
 const get=()=>page.evaluate(()=>window.slimeGame.snapshot());
 let a=await get();assert.equal(a.level,1);assert.equal(a.paused,false);assert.ok(a.entities>=24);assert.equal(await page.locator('#panel').isVisible(),false);assert.ok(a.drawCalls<400,`Draw calls: ${a.drawCalls}`);
 assert.ok(a.visualRadius<.5,'Starts physically small');assert.equal(a.stage,0);assert.equal(new Set(a.prey.map(e=>e.stage)).size,6,'All six scales already exist');assert.ok(a.prey.every(e=>e.scale===e.radius));
 const initialSizes=new Map(a.prey.map(e=>[e.id,e.scale]));
 const initialCamera=a.camera;
 await page.screenshot({path:'test-results/mobile-start.png'});
 // Real browser touch events, not clicks or a debug movement API.
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:610}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:232,y:584}]});await page.waitForTimeout(600);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 let b=await get();assert.ok(Math.hypot(b.position.x-a.position.x,b.position.z-a.position.z)>.4,'Touch drag moves player');
 await page.waitForTimeout(400);b=await get();assert.ok(Math.hypot(b.camera.target.x-initialCamera.target.x,b.camera.target.z-initialCamera.target.z)>.3,'Camera follows movement');assert.ok(Math.abs(b.camera.playerNDC[0])<.12&&Math.abs(b.camera.playerNDC[1])<.12,'Player stays near screen centre');
 await page.locator('#pause').tap();a=await get();assert.equal(a.paused,true);await page.waitForTimeout(250);b=await get();assert.equal(a.elapsed,b.elapsed);await page.locator('#resume').tap();assert.equal((await get()).paused,false);
 // Navigate to nearby prey through keyboard direction vectors used on desktop.
 const keyDirections=[['d',.867,-.498],['a',-.867,.498],['s',.498,.867],['w',-.498,-.867]];
 for(let i=0;i<75;i++){
  const s=await get();if(s.eaten>=8||s.ended)break;
  const prey=s.prey.filter(e=>e.radius<=s.radius*.95).sort((x,y)=>Math.hypot(x.x-s.position.x,x.z-s.position.z)-Math.hypot(y.x-s.position.x,y.z-s.position.z))[0];
  if(!prey)break;
  const dx=prey.x-s.position.x,dz=prey.z-s.position.z;
  const [key]=keyDirections.map(k=>[k[0],k[1]*dx+k[2]*dz]).sort((x,y)=>y[1]-x[1])[0];
  await page.keyboard.down(key);await page.waitForTimeout(110);await page.keyboard.up(key);
 }
 b=await get();assert.ok(b.eaten>0,'Actual movement results in swallowing prey');assert.ok(b.radius>.45);assert.ok(b.score>0);await page.waitForTimeout(800);b=await get();assert.ok(b.camera.distance>initialCamera.distance,'Camera pulls back after real growth');
 for(const e of b.prey)if(initialSizes.has(e.id))assert.equal(e.scale,initialSizes.get(e.id),'Existing prey never resizes');
 assert.ok(b.spawnChecks.length>0);assert.ok(b.spawnChecks.every(e=>e.offscreen),'Replacements spawn completely outside camera');
 await page.locator('#mode').tap();assert.equal((await get()).mode,'endless');assert.equal((await get()).radius,.3);await page.locator('#restart').tap();assert.equal((await get()).eaten,0);
 await page.locator('#sound').tap();assert.equal((await get()).saved.muted,false);
 await page.reload();await page.waitForFunction(()=>window.slimeGame?.snapshot().frame>1);assert.equal((await get()).saved.muted,false);
 // Unlock progress through storage only to inspect all scene families and late mechanics.
 await page.evaluate(()=>{const k='slime-devour-v1',v=JSON.parse(localStorage.getItem(k));v.unlocked=12;localStorage.setItem(k,JSON.stringify(v));});
 await page.reload();await page.waitForFunction(()=>window.slimeGame?.snapshot().frame>1);
 for(const id of [2,7,9,10,11,12]){
  await page.locator('#levelName').tap();await page.locator('#choose-'+id).tap();await page.waitForTimeout(180);assert.equal((await get()).level,id);assert.equal((await get()).paused,false);
  if(id===2||id===10)await page.screenshot({path:`test-results/mobile-level-${id}.png`});
 }
 await page.setViewportSize({width:844,height:390});assert.equal(await page.locator('#rotate').isVisible(),true);a=await get();await page.waitForTimeout(200);assert.equal((await get()).elapsed,a.elapsed);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#rotate').isVisible(),false);
 // Persistent background pause prevents a hidden tab from killing the player.
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await get()).paused,true);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 console.log('PASS: offline single HTML, immediate play, real touch movement, swallowing/growth/scoring, pause, restart, endless, settings persistence, six late levels, rotation, zero external requests/page errors.');
 console.log('Initial draw calls:',a.drawCalls);
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});