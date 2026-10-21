const {build}=require('esbuild');
const {chromium}=require('@playwright/test');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const source=await fs.readFile('src/app.js','utf8');
 const fixture="start(1,'level');playerPos.set(62,62);state.radius=2;updatePlayer(0);requestAnimationFrame(animate);";
 const bundle=await build({stdin:{contents:source.replace("start(1,'level');requestAnimationFrame(animate);",fixture),resolveDir:path.resolve('src'),loader:'js'},bundle:true,write:false,format:'iife'});
 const html=(await fs.readFile('public/index.html','utf8')).replace(/<script>[\s\S]*?<\/script>/,()=>`<script>${bundle.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>`);
 const file=path.resolve('test-results/district-fixture.html');await fs.writeFile(file,html);
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(file).href);await page.waitForFunction(()=>window.slimeGame?.snapshot().frame>2);
  const s=await page.evaluate(()=>window.slimeGame.snapshot());assert.ok(s.districts.count>2000);assert.equal(s.districts.types.length,12);assert.ok(s.districts.types.every(t=>t.count>0));assert.equal(new Set(s.prey.map(e=>e.stage)).size,6);assert.ok(s.drawCalls<400);assert.deepEqual(errors,[]);
  await page.screenshot({path:'test-results/district-outskirts.png'});console.log('PASS: permanent outskirts scenery, 12 populated types, six edible tiers, no script errors. Props:',s.districts.count,'draw calls:',s.drawCalls);
 }finally{await browser.close();await fs.unlink(file);}
})().catch(e=>{console.error(e);process.exit(1)});