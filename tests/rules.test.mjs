import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canEat,grow,multiplier,scoreFor,objective,starsFor,stageFor,visibleRadius,cameraDistance,STAGES} from '../src/rules.js';
import {preyModel} from '../src/prey.js';
import {resolveContact,anchored} from '../src/physics.js';
const levels=JSON.parse(await readFile(new URL('../src/levels.json',import.meta.url)));
const state=()=>({radius:.45,eaten:0,elapsed:0,maxCombo:0,hits:0,score:0,bossHP:2,bossTotal:2});
test('contacts separate bodies and transfer momentum without adding energy',()=>{
 const a={x:0,z:0,r:1,vx:3,vz:0,invMass:1},b={x:1.5,z:0,r:1,vx:0,vz:0,invMass:1};
 assert.ok(resolveContact(a,b));assert.ok(Math.abs(b.x-a.x-2)<1e-8);assert.ok(b.vx>0);assert.ok(a.vx*a.vx+b.vx*b.vx<=9);
 assert.equal(resolveContact(a,b),false);
});
test('anchored objects stop player; coincident bodies stay finite; glancing contact preserves tangent velocity',()=>{
 const a={x:0,z:0,r:.5,vx:2,vz:1,invMass:1},b={x:.7,z:0,r:.5,vx:0,vz:0,invMass:0};
 resolveContact(a,b);assert.equal(b.x,.7);assert.ok(a.vx<=0);assert.equal(a.vz,1);
 const c={x:0,z:0,r:1},d={x:0,z:0,r:1};resolveContact(c,d);assert.equal(Math.abs(c.x-d.x),2);
 assert.equal(anchored('tower'),true);assert.equal(anchored('car'),false);
});
test('edibility boundary and volume conservation',()=>{assert.equal(canEat(1,.95),true);assert.equal(canEat(1,.951),false);assert.ok(Math.abs(grow(1,.5,.85)**3-(1+.125*.85))<1e-10);});
test('combo cap, dangerous and perfect prey reward',()=>{assert.equal(multiplier(50),5);assert.equal(multiplier(500),5);assert.ok(scoreFor(1,.94,8).points>scoreFor(1,.6,8).points);assert.equal(scoreFor(1,.94,8).perfect,true);});
test('all twelve main goals are reachable and initially incomplete',()=>{assert.equal(levels.length,12);for(const level of levels){assert.equal(objective(level,state()).done,false,level.name);const s={...state(),radius:10,eaten:100,elapsed:120,maxCombo:30,bossHP:0};assert.equal(objective(level,s).done,true,level.name);}});
test('survival, ice survival and elite requirements cannot be skipped',()=>{assert.equal(objective(levels[2],{...state(),eaten:40,elapsed:59}).done,false);assert.equal(objective(levels[8],{...state(),radius:7,elapsed:89}).done,false);assert.equal(objective(levels[11],{...state(),radius:10,eaten:100,elapsed:125,bossHP:1}).done,false);});
test('stars require score plus the level-specific third condition',()=>{const l=levels[0],s={...state(),eaten:20,score:1000,elapsed:45};assert.equal(starsFor(l,s),3);assert.equal(starsFor(l,{...s,elapsed:60}),2);assert.equal(starsFor(l,{...s,score:100}),1);assert.equal(starsFor(l,{...s,eaten:19}),0);});
test('adaptive prey can reach every size goal in a practical number of eats',()=>{for(const l of levels.filter(l=>[2,6,9,12].includes(l.id))){let r=l.radius,n=0;const target=l.id===12?8:Number(l.target);while(r<target&&n<100){r=grow(r,r*.82,l.absorb);n++;}assert.ok(n<65,`${l.name}: ${n} eats`);}});
test('six growth tiers use exact boundaries and continuous camera scaling',()=>{
 for(const [i,r] of [.3,1,3,8,20,50].entries()){
  assert.equal(stageFor(r),i);if(i)assert.equal(stageFor(r-.00001),i-1);
  assert.ok(Math.abs(cameraDistance(r)-cameraDistance(r-.00001))<.001);
 }
 let last=0,distance=0;for(const r of [.3,.45,1,3,8,20,50,100]){assert.ok(visibleRadius(r)>last);assert.ok(cameraDistance(r)>distance);last=visibleRadius(r);distance=cameraDistance(r);}
 assert.ok(visibleRadius(.3)<.3);assert.ok(visibleRadius(50)>2.8);
});
test('every growth tier has two valid distinct detailed prey models with shared geometry',()=>{
 for(const stage of STAGES)for(const kind of stage.prey){const model=preyModel(kind);assert.ok(model.geometry.attributes.position.count>100,kind);for(const n of model.geometry.attributes.position.array)assert.ok(Number.isFinite(n),kind);assert.equal(preyModel(kind).geometry,model.geometry);assert.ok(model.geometry.attributes.color);}
});