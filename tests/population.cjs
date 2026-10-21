const {build}=require('esbuild');
const {chromium}=require('@playwright/test');
const fs=require('node:fs/promises');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
(async()=>{
 const source=await fs.readFile('src/app.js','utf8');
 const fixture=`start(1,'level');
 window.populationCheck=()=>{
  const remote=CATALOG.map(c=>({kind:c.kind,count:entities.filter(e=>e.kind===c.kind&&Math.hypot(e.x,e.z)>300).length}));
  playerPos.set(780,-780);updatePlayer(0);
  const initial=entities.filter(e=>!e.threat).length;
  for(let i=0;i<240;i++)replenishPrey();
  const food=entities.filter(e=>!e.threat&&canEat(state.radius,e.radius)&&Math.hypot(e.x-playerPos.x,e.z-playerPos.y)<cameraDistance(state.radius)*3);
  return {remote,initial,count:entities.filter(e=>!e.threat).length,food:food.length,checks:[...spawnChecks],stages:[...new Set(entities.filter(e=>!e.threat).map(e=>e.preyStage))],fixed:entities.filter(e=>!e.threat).every(e=>e.mesh.scale.x===e.radius)};
 };requestAnimationFrame(animate);`;
 const bundle=await build({stdin:{contents:source.replace("start(1,'level');requestAnimationFrame(animate);",fixture),resolveDir:path.resolve('src'),loader:'js'},bundle:true,write:false,format:'iife'});
 const html=(await fs.readFile('public/index.html','utf8')).replace(/<script>[\s\S]*?<\/script>/,()=>`<script>${bundle.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script>`);
 const file=path.resolve('test-results/population-fixture.html');await fs.writeFile(file,html);
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(file).href);await page.waitForFunction(()=>window.populationCheck);
  const result=await page.evaluate(()=>window.populationCheck());
  assert.ok(result.remote.every(c=>c.count>0),JSON.stringify(result.remote));
  assert.ok(result.food>=30,`Remote edible food: ${result.food}`);
  assert.equal(result.count,370);assert.equal(result.stages.length,6);assert.ok(result.fixed);
  assert.equal(result.checks.length,100);assert.ok(result.checks.every(c=>c.offscreen));assert.deepEqual(errors,[]);
  console.log('PASS: all 12 food types pre-exist beyond 300 units; remote exploration replenishes edible food at population cap; fixed sizes, six tiers and offscreen spawning preserved.',result.food,'nearby edible objects');
 }finally{await browser.close();await fs.unlink(file);}
})().catch(e=>{console.error(e);process.exit(1)});