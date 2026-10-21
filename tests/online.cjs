const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  const response=await page.goto('https://2324621372.github.io/slime-devour/',{waitUntil:'load',timeout:60000});
  assert.equal(response.status(),200);await page.waitForFunction(()=>window.slimeGame?.snapshot().frame>2,null,{timeout:60000});
  const s=await page.evaluate(()=>window.slimeGame.snapshot());assert.equal(s.level,1);assert.equal(s.mode,'level');assert.equal(s.paused,false);assert.equal(await page.locator('#panel').isVisible(),false);
  assert.equal(new Set(s.prey.map(e=>e.stage)).size,6);assert.ok(s.prey.every(e=>e.scale===e.radius));assert.ok(Array.isArray(s.spawnChecks));
  assert.equal(s.mapEdge,1000);assert.ok(s.sceneryColliders>100);assert.ok(s.animation.gait>0);assert.ok(s.prey.some(e=>e.stage===1&&Math.hypot(e.x,e.z-3)<15));
  await page.locator('#mode').tap();assert.equal(await page.evaluate(()=>window.slimeGame.snapshot().mode),'endless');
  await page.screenshot({path:'test-results/live-mobile.png'});
  assert.deepEqual(errors,[]);assert.equal(requests.filter(u=>!u.endsWith('/slime-devour/')).length,0);
  console.log('PASS: live GitHub Pages HTTP 200, WebGL starts immediately on mobile viewport, touch mode switch works, no script errors or external asset requests.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});