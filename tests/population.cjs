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
  const visits=[];
  for(const [baseX,baseZ,radius,aspect] of [[100,-90,.45,390/844],[180,-180,.45,390/844],[780,-780,.45,390/844],[600,-600,4,844/390],[500,-500,12,390/844]]){
   let x=baseX,z=baseZ;
   // Teleport only to accessible ground, never into an existing building.
   for(let i=0;i<1000;i++){x=baseX+(Math.random()-.5)*250;z=baseZ+(Math.random()-.5)*250;if(!blocked(x,z,radius)&&!entities.some(e=>Math.hypot(x-e.x,z-e.z)<e.radius*1.6+cameraDistance(radius)*1.5))break;}
   state.radius=radius;playerPos.set(x,z);velocity.set(0,0);camera.aspect=aspect;camera.updateProjectionMatrix();updatePlayer(0);
   const before=new Set(entities.map(e=>e.id));spawnChecks.length=0;
   for(let i=0;i<12;i++)replenishPrey();
   const area=supplyArea();
   const food=entities.filter(e=>!e.threat&&canEat(state.radius,e.radius)&&area.outside(e.x,e.z,e.radius)&&Math.hypot(e.x-x,e.z-z)<=area.boundary(Math.atan2(e.z-z,e.x-x),e.radius)+area.band);
   const fresh=entities.filter(e=>!before.has(e.id));const checks=[...spawnChecks];
   const ids=new Set(entities.map(e=>e.id));for(let i=0;i<4;i++)replenishPrey();
   visits.push({x,radius,food:food.length,fresh:fresh.length,checks,stable:entities.every(e=>ids.has(e.id)),count:entities.filter(e=>!e.threat).length});
  }
  return {remote,visits,fixed:entities.filter(e=>!e.threat).every(e=>e.mesh.scale.x===e.radius)};
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
   for(const visit of result.visits){
    assert.ok(visit.food>=64,JSON.stringify(visit));assert.ok(visit.fresh>0);assert.ok(visit.count<=370);assert.ok(visit.stable,'Sufficient food stops spawning');
    assert.ok(visit.checks.length>0);assert.ok(visit.checks.every(c=>c.offscreen&&c.edible&&c.gap>0&&c.gap<c.band),'New food stays within narrow offscreen band');
   }
   assert.ok(result.fixed);assert.deepEqual(errors,[]);
   console.log('PASS: supply band follows five positions, sizes and camera aspects; >=64 edible objects just offscreen; fixed sizes, population cap and idle stop.',result.visits.map(({checks,...v})=>v));
 }finally{await browser.close();await fs.unlink(file);}
})().catch(e=>{console.error(e);process.exit(1)});