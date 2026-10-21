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
 }finally{await browser.close();await fs.unlink(target);}
})().catch(e=>{console.error(e);process.exit(1);});