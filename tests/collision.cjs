const {build}=require('esbuild');
const {chromium}=require('@playwright/test');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 // Bundle a deterministic contact fixture into a temporary test page only.
 const source=await fs.readFile('src/app.js','utf8');
 const fixture=`start(1,'level');for(const e of [...entities])removeEntity(e,false);makePrey(true,{kind:'cap',radius:.65,preyStage:0},{x:-.5,z:2.13});requestAnimationFrame(animate);`;
 const result=await build({stdin:{contents:source.replace("start(1,'level');requestAnimationFrame(animate);",fixture),resolveDir:path.resolve('src'),loader:'js'},bundle:true,write:false,format:'iife'});
 const html=(await fs.readFile('public/index.html','utf8')).replace(/<script>[\s\S]*?<\/script>/,()=>`<script>${result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>`);
 const target=path.resolve('test-results/collision-fixture.html');await fs.writeFile(target,html);
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(target).href);await page.waitForFunction(()=>window.slimeGame?.snapshot().frame>2);
  await page.keyboard.down('w');await page.waitForTimeout(450);await page.keyboard.up('w');
  const s=await page.evaluate(()=>window.slimeGame.snapshot());assert.ok(s.contacts>0,'Movement makes physical contact with an oversized object');assert.equal(s.eaten,0,'Oversized object cannot be swallowed');assert.equal(s.hp,3,'Ordinary object contact causes no damage');assert.ok(Number.isFinite(s.position.x));assert.deepEqual(errors,[]);
  await page.screenshot({path:'test-results/collision.png'});console.log('PASS: actual movement collides with and pushes oversized prey without swallowing or damage.');
   // Rebuild the same production source with a real authored static collider as target.
   const staticFixture=`start(1,'level');for(const e of [...entities])removeEntity(e,false);const c=world.colliders.find(c=>c.hx>.5&&c.hz>.5&&c.maxY>1);playerPos.set(c.x+c.hx+displayRadius()+.08,c.z);velocity.set(0,0);const before=playerPos.x;for(let i=0;i<20;i++){velocity.set(-2,0);playerPos.x-=.08;resolveScenery();}if(playerPos.x<c.x+c.hx+displayRadius()*.94-.001)throw new Error('Static scenery penetration');const snack=makePrey(true,{kind:'dust',radius:.2,preyStage:0},{x:playerPos.x,z:playerPos.y});eat(snack);if(swallows.length!==1)throw new Error('Missing swallow effect');updateSwallows(.15);updatePlayer(.05);if(!(swallows[0].mesh.scale.x<.2&&player.userData.eatPulse>0))throw new Error('Missing swallow deformation');requestAnimationFrame(animate);`;
   const staticResult=await build({stdin:{contents:source.replace("start(1,'level');requestAnimationFrame(animate);",staticFixture),resolveDir:path.resolve('src'),loader:'js'},bundle:true,write:false,format:'iife'});
   await fs.writeFile(target,html.replace(/<script>[\s\S]*?<\/script>/,()=>`<script>${staticResult.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>`));
   await page.reload();await page.waitForFunction(()=>window.slimeGame?.snapshot().frame>2);assert.deepEqual(errors,[]);const verified=await page.evaluate(()=>window.slimeGame.snapshot());assert.ok(verified.sceneryContacts>0);assert.ok(verified.eaten>0);console.log('PASS: actual authored static geometry blocks movement; swallowing shrinks and attracts prey and animates slime.');
 }finally{await browser.close();await fs.unlink(target);}
})().catch(e=>{console.error(e);process.exit(1);});