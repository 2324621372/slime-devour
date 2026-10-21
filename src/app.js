import * as THREE from 'three';
import {createWorld} from './world.js';
import levels from './levels.json';
import {canEat,grow,multiplier,scoreFor,objective,starsFor,STAGES,stageFor,visibleRadius,cameraDistance} from './rules.js';
import {jelly,spikeBall,bee,material} from './models.js';
import {preyModel,preyKind,PREY_NAMES,animateInsects} from './prey.js';
import {resolveContact,anchored} from './physics.js';
import {CATALOG,MAP_EDGE,catalogItem} from './population.js';
import {createFloor} from './floor.js';
import {addDistricts} from './districts.js';

const $=id=>document.getElementById(id),clamp=THREE.MathUtils.clamp;
const SAVE_KEY='slime-devour-v1';
let save={highScore:0,endlessBest:0,maxCombo:0,unlocked:1,stars:{},muted:true,quality:'auto'};
try{save={...save,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')};save.unlocked=clamp(Number(save.unlocked)||1,1,12);}catch{}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{}}
let renderer,world,scene,camera,dynamic,player,ring,boss,entities=[],effects=[],hazards=[],swallows=[];
let level=levels[0],mode='level',state,paused=false,ended=false,theme=-1,frame=0,last=0,hudClock=0,spawnClock=0,toastTimer,stage=0,cityWaveAt=0,qualityLow=false;
let audio,master;const input={x:0,y:0,active:false,id:null,startX:0,startY:0},keys=new Set();
const playerPos=new THREE.Vector2(0,3),velocity=new THREE.Vector2(),camTarget=new THREE.Vector3();
let nextEntityId=0,spawnSequence=0;const spawnChecks=[];const pooled=[];let dpr=1,frameCost=0,samples=0;
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2300);}
function unlockAudio(){if(save.muted)return;try{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.07;master.connect(audio.destination);}audio.resume();}catch{}}
function sound(kind=0){if(!audio||save.muted||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type=kind===2?'triangle':'sine';o.frequency.setValueAtTime(kind===1?150:kind===2?650:280+(state?.combo||0)*23,audio.currentTime);o.frequency.exponentialRampToValueAtTime(kind===1?50:800,audio.currentTime+.12);g.gain.setValueAtTime(.8,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.connect(g);g.connect(master);o.start();o.stop(audio.currentTime+.2);}
function bind(id,fn){const b=$(id);b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();unlockAudio();if(!b.disabled)fn();},{passive:false});b.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;e.preventDefault();e.stopPropagation();unlockAudio();if(!b.disabled)fn();});b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}});}
function resetInput(){input.active=false;input.x=input.y=0;input.id=null;keys.clear();velocity.set(0,0);$('knob').style.transform='translate(0,0)';$('joystick').hidden=true;}
function touchStart(e){if(input.active||e.target.closest('button,#panel')||ended||paused)return;const t=e.changedTouches[0];input.active=true;input.id=t.identifier;setInputOrigin(t.clientX,t.clientY);unlockAudio();e.preventDefault();}
function touchMove(e){if(!input.active)return;const t=[...e.touches].find(t=>t.identifier===input.id);if(t){setDrag(t.clientX,t.clientY);e.preventDefault();}}
function setInputOrigin(x,y){const rect=$('game').getBoundingClientRect(),stick=$('joystick');input.startX=x;input.startY=y;stick.style.left=`${x-rect.left}px`;stick.style.top=`${y-rect.top}px`;stick.hidden=false;setDrag(x,y);}
function setDrag(x,y){const dx=x-input.startX,dy=y-input.startY,dist=Math.hypot(dx,dy),length=Math.min(1,dist/48);input.x=dist>5?dx/Math.max(1,dist)*length:0;input.y=dist>5?dy/Math.max(1,dist)*length:0;$('knob').style.transform=`translate(${input.x*38}px,${input.y*38}px)`;}
const game=$('game');game.addEventListener('touchstart',touchStart,{passive:false});game.addEventListener('touchmove',touchMove,{passive:false});for(const name of ['touchend','touchcancel'])game.addEventListener(name,e=>{if([...e.changedTouches].some(t=>t.identifier===input.id))resetInput();},{passive:false});
game.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.target.closest('button,#panel')||paused||ended)return;input.active=true;input.id=e.pointerId;setInputOrigin(e.clientX,e.clientY);game.setPointerCapture(e.pointerId);unlockAudio();});game.addEventListener('pointermove',e=>{if(input.active&&e.pointerType!=='touch')setDrag(e.clientX,e.clientY);});game.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')resetInput();});game.addEventListener('pointercancel',resetInput);
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'){togglePause();return;}keys.add(e.key.toLowerCase());unlockAudio();});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{if(state&&!ended&&!paused)showPause();resetInput();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state&&!ended&&!paused)showPause();});

function applyQuality(){qualityLow=save.quality==='low'||(save.quality==='auto'&&(matchMedia('(pointer:coarse)').matches||navigator.hardwareConcurrency<5));renderer.shadowMap.enabled=!qualityLow;scene?.traverse(o=>{if(o.isLight&&o.shadow)o.castShadow=!qualityLow;});dpr=Math.min(devicePixelRatio||1,qualityLow?1:1.5);renderer.setPixelRatio(dpr);renderer.shadowMap.needsUpdate=true;$('quality').textContent=save.quality==='auto'?'自动':qualityLow?'流畅':'精美';resize();}
function resize(){if(!renderer||!camera)return;const w=game.clientWidth,h=game.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();resetInput();}
window.addEventListener('resize',resize);
function disposeWorld(){if(!scene)return;const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.isMesh){gs.add(o.geometry);if(!o.parent?.userData?.dynamic)ms.add(o.material);}});gs.forEach(g=>g.dispose());ms.forEach(m=>{if(m&&!Array.isArray(m))m.dispose();});}
function loadWorld(nextTheme){
 if(theme===nextTheme)return;
 // Runtime models share geometry/materials and must not be disposed with scenery.
 if(dynamic)scene.remove(dynamic);
 disposeWorld();world=createWorld(nextTheme);scene=world.scene;camera=world.camera;theme=nextTheme;
 scene.fog.near=1800;scene.fog.far=3200;camera.far=5000;camera.near=.05;camera.updateProjectionMatrix();
 scene.add(createFloor(MAP_EDGE,world.palette));
 world.districts=addDistricts(scene,world.colliders,theme,MAP_EDGE);
 dynamic=new THREE.Group();dynamic.userData.dynamic=true;scene.add(dynamic);
 camera.position.set(15.5,23,26);camera.lookAt(0,0,-1);resize();
 scene.traverse(o=>{if(o.isLight&&o.shadow)o.castShadow=!qualityLow;});
}
function displayRadius(){return visibleRadius(state.radius);}
function outsideView(x,z,r=1){camera.updateMatrixWorld();const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));return !frustum.intersectsSphere(new THREE.Sphere(new THREE.Vector3(x,r*.7,z),r*2));}
function entityPosition(r=.5,offscreen=true){for(let i=0;i<180;i++){const angle=Math.random()*Math.PI*2,range=offscreen?cameraDistance(state.radius)*(.9+Math.random()*2)+r*3:5+Math.random()*30;const x=playerPos.x+Math.cos(angle)*range,z=playerPos.y+Math.sin(angle)*range;if(Math.abs(x)+r>MAP_EDGE||Math.abs(z)+r>MAP_EDGE||blocked(x,z,r))continue;if(offscreen&&!outsideView(x,z,r))continue;if(entities.some(e=>Math.hypot(x-e.x,z-e.z)<r*1.6+(e.visual||e.radius)*1.6))continue;return {x,z};}return null;}
function blocked(x,z,r=.4){return world.colliders.some(c=>Math.abs(x-c.x)<c.hx+r&&Math.abs(z-c.z)<c.hz+r);}
function makePrey(initial=false,descriptor=null,pos=null){
 if(entities.filter(e=>!e.threat).length>=370)return;
 const item=descriptor||catalogItem(spawnSequence++,Math.floor(spawnSequence/12));
 const {radius,kind,preyStage}=item;pos=pos||entityPosition(radius,!initial);if(!pos)return;
 const pooledIndex=pooled.findIndex(m=>m.userData.kind===kind),mesh=pooledIndex<0?preyModel(kind):pooled.splice(pooledIndex,1)[0];dynamic.add(mesh);mesh.rotation.set(0,0,0);
 const e={id:++nextEntityId,mesh,radius,kind,preyStage,x:pos.x,z:pos.z,phase:Math.random()*6.28,threat:false,vx:0,vz:0,age:0};entities.push(e);placeEntity(e);
 if(!initial){spawnChecks.push({id:e.id,offscreen:outsideView(e.x,e.z,e.radius),radius:e.radius});if(spawnChecks.length>100)spawnChecks.shift();}return e;
}
function populate(){
 spawnSequence=0;spawnChecks.length=0;
 // Keep an unobstructed trail of edible objects within the starting travel lane.
 for(let i=0;i<18;i++){
  const x=(i%3-1)*.65,z=3+Math.floor(i/3)*.55,radius=i%2?.2:.26;
  if(Math.hypot(x,z-3)>1&&!blocked(x,z,radius))makePrey(true,{kind:i%2?'dust':'sugar',radius,preyStage:0},{x,z});
 }
 // Large landmarks are placed first, then the smaller objects fill clear space.
 for(let tier=5;tier>=0;tier--)for(let i=0;i<36;i++){
  const item=catalogItem(tier*2+i%2,Math.floor(i/2));let pos=null;
  for(let attempt=0;attempt<220;attempt++){
   const angle=i*2.399+attempt*.61,inner=[2,4,11,30,90,250][tier],range=inner+Math.random()*[48,65,100,180,370,640][tier];const x=Math.cos(angle)*range,z=3+Math.sin(angle)*range,r=item.radius;
   if(Math.abs(x)+r>MAP_EDGE||Math.abs(z)+r>MAP_EDGE||Math.hypot(x,z-3)<r*2+2||blocked(x,z,r)||entities.some(e=>Math.hypot(x-e.x,z-e.z)<r*1.3+e.radius*1.3))continue;pos={x,z};break;
  }
  if(pos)makePrey(true,item,pos);
 }
 // A visible assortment exists around the starting lanes, including oversized props.
 for(const [kind,radius,preyStage,x,z] of [['cap',1.1,1,2,7],['bug',1.05,1,-2,9],['cup',3.1,2,8,11],['fruit',3.2,2,-9,13],['chair',8.1,3,20,22],['pet',8.3,3,-22,22],['car',20.5,4,52,45],['streetlamp',21,4,-48,55],['building',50.5,5,145,110],['tower',54,5,-155,125]]){
  if(!blocked(x,z,radius)&&!entities.some(e=>Math.hypot(x-e.x,z-e.z)<radius*1.2+e.radius*1.2))makePrey(true,{kind,radius,preyStage},{x,z});
 }
 for(let i=0;i<65;i++){const item=catalogItem(i%2,Math.floor(i/2)),pos=entityPosition(item.radius,false);if(pos)makePrey(true,item,pos);}
}
function makeThreat(){if(level.id===1&&mode==='level')return;const pos=entityPosition(1,true);if(!pos)return;let kind=level.id===5?'bee':level.id===6?'ball':'spike';const mesh=kind==='bee'?bee():kind==='ball'?jelly(0xeb849f):spikeBall();dynamic.add(mesh);const e={mesh,radius:1.2,x:pos.x,z:pos.z,phase:Math.random()*6.28,threat:true,kind,age:0,vx:0,vz:0};entities.push(e);placeEntity(e);}
function placeEntity(e){e.visual=e.radius;e.mesh.position.set(e.x,.12,e.z);e.mesh.scale.setScalar(e.radius);}
function contactBody(e){const f=e.mesh.userData.footprint||{r:1},scale=e.radius;return {x:e.x+(f.ox||0)*scale,z:e.z+(f.oz||0)*scale,r:(f.r||Math.hypot(f.hx,f.hz))*scale,hx:f.hx?f.hx*scale:undefined,hz:f.hz?f.hz*scale:undefined,vx:e.pushX||0,vz:e.pushZ||0,invMass:anchored(e.kind)?0:1/Math.max(.08,e.radius**3)};}
function applyBody(e,b){const f=e.mesh.userData.footprint||{};e.x=clamp(b.x-(f.ox||0)*e.radius,-MAP_EDGE+e.radius,MAP_EDGE-e.radius);e.z=clamp(b.z-(f.oz||0)*e.radius,-MAP_EDGE+e.radius,MAP_EDGE-e.radius);e.pushX=b.vx;e.pushZ=b.vz;}
function collideEntities(dt){
 const solid=entities.filter(e=>!e.threat);
 for(const e of solid){
  if(e.kind==='bug'){
   e.heading??=e.phase;e.walkTime=(e.walkTime||0)+dt;
   e.heading+=Math.sin(e.walkTime*.8+e.phase)*dt*.65;
   const speed=.65*Math.sqrt(e.radius),dx=Math.sin(e.heading)*speed*dt,dz=Math.cos(e.heading)*speed*dt;
   if(blocked(e.x+dx,e.z+dz,e.radius)||Math.abs(e.x+dx)>MAP_EDGE-e.radius||Math.abs(e.z+dz)>MAP_EDGE-e.radius)e.heading+=Math.PI*.65;
   else{e.x+=dx;e.z+=dz;}
  }
  const b=contactBody(e);if(!anchored(e.kind)){b.x+=b.vx*dt;b.z+=b.vz*dt;b.vx*=Math.exp(-dt*6);b.vz*=Math.exp(-dt*6);applyBody(e,b);}}
 for(let pass=0;pass<3;pass++){
  for(let i=0;i<solid.length;i++)for(let j=i+1;j<solid.length;j++){const a=solid[i],b=solid[j];if(Math.abs(a.x-b.x)>a.radius*2+b.radius*2||Math.abs(a.z-b.z)>a.radius*2+b.radius*2)continue;const ab=contactBody(a),bb=contactBody(b);if(resolveContact(ab,bb,0)){applyBody(a,ab);applyBody(b,bb);if(a.kind==='bug')a.heading=Math.atan2(-ab.x+bb.x,-ab.z+bb.z)+Math.PI;if(b.kind==='bug')b.heading=Math.atan2(bb.x-ab.x,bb.z-ab.z);}}
  for(const e of solid){const body=contactBody(e),p={x:playerPos.x,z:playerPos.y,r:displayRadius()*.94,vx:velocity.x,vz:velocity.y,invMass:1/Math.max(.08,state.radius**3)};const hit=resolveContact(p,body,0);if(!hit)continue;
   if(canEat(state.radius,e.radius)){eat(e);solid.splice(solid.indexOf(e),1);continue;}
   playerPos.set(p.x,p.z);velocity.set(p.vx,p.vz);applyBody(e,body);state.contacts++;player.userData.bounce=.12;
  }
  resolveScenery();
 }
 for(const e of solid)placeEntity(e);
}
function resolveScenery(){
 const p={x:playerPos.x,z:playerPos.y,r:displayRadius()*.94,vx:velocity.x,vz:velocity.y,invMass:1};
 for(const c of world.colliders){if(Math.abs(p.x-c.x)>c.hx+p.r||Math.abs(p.z-c.z)>c.hz+p.r)continue;if(resolveContact(p,c,0))state.sceneryContacts++;}
 playerPos.set(clamp(p.x,-MAP_EDGE+displayRadius(),MAP_EDGE-displayRadius()),clamp(p.z,-MAP_EDGE+displayRadius(),MAP_EDGE-displayRadius()));velocity.set(p.vx,p.vz);
}
function clearDynamic(){
 pooled.forEach(o=>dynamic.add(o));
 const uniqueGeometries=new Set(),uniqueMaterials=new Set();
 dynamic.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry;if(!geometry.userData.shared)uniqueGeometries.add(geometry);if(o.material?.isMeshBasicMaterial)uniqueMaterials.add(o.material);});
 dynamic.clear();uniqueGeometries.forEach(g=>g.dispose());uniqueMaterials.forEach(m=>m.dispose());entities=[];effects=[];hazards=[];swallows=[];pooled.length=0;boss=null;
}
function start(id=1,newMode=mode){
 resetInput();mode=newMode;level=levels[clamp(id,1,12)-1];ended=false;paused=false;stage=0;cityWaveAt=0;spawnClock=0;hudClock=0;
 state={radius:mode==='endless'?.3:level.radius,score:0,contacts:0,sceneryContacts:0,combo:0,maxCombo:0,eaten:0,elapsed:0,lastEat:-10,hits:0,hp:3,invincible:0,bossHP:[4,10,12].includes(level.id)?(level.id===10?3:2):0,bossTotal:level.id===10?3:2,peakRadius:level.radius};
 stage=stageFor(state.radius);
 const nextTheme=mode==='endless'?0:([2,6,8,11].includes(level.id)?1:[4,10,12].includes(level.id)?2:0);
 if(dynamic)clearDynamic();loadWorld(nextTheme);playerPos.set(0,3);velocity.set(0,0);
 player=jelly(world.palette.main);player.rotation.y=.5;dynamic.add(player);
 ring=new THREE.Mesh(new THREE.TorusGeometry(1.28,.018,5,48),new THREE.MeshBasicMaterial({color:0xc5ffe1,transparent:true,opacity:.8}));ring.rotation.x=-Math.PI/2;dynamic.add(ring);
 updatePlayer(0);populate();
 for(let i=0;i<level.initialThreats;i++)makeThreat();
 if(mode==='level'&&[4,10,12].includes(level.id))spawnBoss();
 if(level.id===7&&mode==='level')for(const x of [-3,3]){const beam=new THREE.Mesh(new THREE.BoxGeometry(.08,1.6,7),new THREE.MeshBasicMaterial({color:0xff6479,transparent:true,opacity:.65}));beam.position.set(x,.8,0);dynamic.add(beam);hazards.push({mesh:beam,x});}
 $('panel').hidden=true;$('loading').hidden=true;$('mode').textContent=mode==='endless'?'无尽 / 关卡':'关卡 / 无尽';$('sound').textContent=save.muted?'音效关':'音效开';$('bossbar').hidden=!boss;
 toast(mode==='endless'?'无尽成长 · 连击越高，得分越多':`${String(level.id).padStart(2,'0')} ${level.name} · ${level.id===1?'吞噬灰尘与糖粒':'躲开红色威胁'}`);camTarget.set(playerPos.x,displayRadius()*.45,playerPos.y);updateHUD();updatePlayer(0);renderer.render(scene,camera);
}
function spawnBoss(){if(boss){dynamic.remove(boss.mesh,boss.ring);boss.ring.geometry.dispose();boss.ring.material.dispose();}const m=jelly(level.id===4?0xe9b773:level.id===12?0x9d7de0:0xf28a62,true);dynamic.add(m);boss={mesh:m,x:1,z:-5,hp:state.bossHP,total:state.bossTotal,phase:0,cycle:0,vx:0,vz:0,hitCooldown:0,waveDone:false,split:false};const warning=new THREE.Mesh(new THREE.TorusGeometry(2.8,.045,5,64),new THREE.MeshBasicMaterial({color:0xffa27a,transparent:true,opacity:.8}));warning.rotation.x=-Math.PI/2;dynamic.add(warning);boss.ring=warning;}
function removeEntity(e,pool=true){dynamic.remove(e.mesh);entities.splice(entities.indexOf(e),1);if(pool&&!e.threat&&pooled.length<30)pooled.push(e.mesh);}
function burst(x,z,color=0xc4ffdf,count=10){for(let i=0;i<count;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.05,0),new THREE.MeshBasicMaterial({color,transparent:true}));m.position.set(x,.5,z);dynamic.add(m);effects.push({m,life:.6,max:.6,vx:(Math.random()-.5)*3,vy:1+Math.random()*2,vz:(Math.random()-.5)*3});}}
function floater(points,perfect,x,z){const v=new THREE.Vector3(x,1.4,z).project(camera);const el=document.createElement('div');el.className='floating';el.style.left=`${(v.x*.5+.5)*100}%`;el.style.top=`${(-v.y*.5+.5)*100}%`;el.textContent=`+ ${points}`;if(perfect){const s=document.createElement('small');s.textContent='PERFECT';el.append(s);}$('floaters').append(el);setTimeout(()=>el.remove(),900);}
function beginSwallow(e){
 const index=entities.indexOf(e);if(index<0)return;entities.splice(index,1);
 swallows.push({mesh:e.mesh,start:e.mesh.position.clone(),radius:e.radius,life:.42});player.userData.eatPulse=1;
}
function updateSwallows(dt){for(const e of [...swallows]){e.life-=dt;const t=clamp(1-e.life/.42,0,1),ease=t*t*(3-2*t);e.mesh.position.lerpVectors(e.start,new THREE.Vector3(playerPos.x,displayRadius()*.55,playerPos.y),ease);e.mesh.position.y+=Math.sin(t*Math.PI)*e.radius*.6;e.mesh.scale.setScalar(e.radius*(1-ease));e.mesh.rotation.y+=dt*8;if(e.life<=0){dynamic.remove(e.mesh);if(pooled.length<40)pooled.push(e.mesh);swallows.splice(swallows.indexOf(e),1);}}}
function eat(e){
 const old=state.radius;state.combo=state.elapsed-state.lastEat<=1.2?state.combo+1:1;state.lastEat=state.elapsed;state.eaten++;state.maxCombo=Math.max(state.maxCombo,state.combo);
 const {points,perfect}=scoreFor(old,e.radius,state.combo,stage,level.id===1?18:22);state.score+=points;state.radius=grow(old,e.radius,level.absorb);state.peakRadius=Math.max(state.peakRadius,state.radius);
 floater(points,perfect,e.x,e.z);burst(e.x,e.z,perfect?0xffdb8e:0xc6ffe1,qualityLow?5:10);sound();if(perfect&&navigator.vibrate)navigator.vibrate(12);
 beginSwallow(e);player.userData.bounce=.25;
 if(state.combo%10===0)toast(`${state.combo} 连击！倍率 ×${multiplier(state.combo).toFixed(2)}`);
 const next=stageFor(state.radius);if(next>stage){stage=next;toast(`进入【${STAGES[stage].name}】阶段 · ${STAGES[stage].description}`);state.score+=500*(stage+1);for(let i=0;i<2;i++)makeThreat();}
}
function damage(){if(state.invincible>0||ended)return;state.hp--;state.hits++;state.invincible=1.8;state.combo=0;sound(1);burst(playerPos.x,playerPos.y,0xff9eac,12);if(navigator.vibrate)navigator.vibrate(40);toast(level.id===7?'触碰激光，无伤挑战失败':'受击！远离红色威胁');if(state.hp<=0||level.id===7)finish(false);}
function finish(won){
 if(ended)return;ended=true;resetInput();if(won&&state.hits===0)state.score=Math.floor(state.score*1.5);
 const stars=won&&mode==='level'?starsFor(level,state):0;const record=state.score>(mode==='endless'?save.endlessBest:save.highScore);
 save.highScore=Math.max(save.highScore,state.score);if(mode==='endless')save.endlessBest=Math.max(save.endlessBest,state.score);save.maxCombo=Math.max(save.maxCombo,state.maxCombo);
 if(won&&mode==='level'){save.stars[level.id]=Math.max(save.stars[level.id]||0,stars);save.unlocked=Math.max(save.unlocked,Math.min(12,level.id+1));}persist();sound(won?2:1);
 $('panel').hidden=false;$('levelGrid').hidden=true;$('panelTitle').textContent=won?'吞噬完成！':'这次差一点！';$('panelText').textContent=record?'新纪录！再吞一口，下次还能更高。':won?(level.id===12?'十二关完成！无尽螺旋已开启。':'继续挑战下一关，或重刷三星。'):'只吞比你小的，躲开红色威胁，保持连续吞噬。';$('panelStats').textContent=`${won?'★'.repeat(stars)+'☆'.repeat(3-stars)+'　':''}${state.score.toLocaleString()} 分 · 最高 ${state.maxCombo} 连击 · 体型 ${state.peakRadius.toFixed(2)}`;
 $('resume').hidden=true;$('retry').hidden=false;$('next').hidden=!won||mode==='endless';$('next').textContent=level.id===12?'无尽螺旋':'下一关';updateHUD();
}
function showPause(){paused=true;resetInput();$('panel').hidden=false;$('panelTitle').textContent='稍作休息';$('panelText').textContent='继续吞噬，保持连击，挑战更高纪录。';$('panelStats').textContent=`本局 ${state.score} 分 · 最高 ${state.maxCombo} 连击`;$('resume').hidden=false;$('retry').hidden=false;$('next').hidden=true;$('levelGrid').hidden=true;}
function togglePause(){if(ended)return;if(paused){paused=false;$('panel').hidden=true;resetInput();}else showPause();}
function chooseLevel(){if(ended)return;showPause();$('panelTitle').textContent='关卡挑战';$('panelText').textContent='完成当前关卡解锁下一关；每关可反复挑战三星。';$('levelGrid').hidden=false;$('levelGrid').replaceChildren();for(const l of levels){const b=document.createElement('button');b.id=`choose-${l.id}`;b.textContent=`${l.id} ${l.name} ${'★'.repeat(save.stars[l.id]||0)}`;b.disabled=l.id>save.unlocked;$('levelGrid').append(b);bind(b.id,()=>start(l.id,'level'));}}
bind('pause',togglePause);bind('resume',togglePause);bind('restart',()=>start(level.id));bind('retry',()=>start(level.id));bind('next',()=>start(level.id===12?1:level.id+1,level.id===12?'endless':'level'));bind('mode',()=>start(1,mode==='level'?'endless':'level'));bind('levelName',chooseLevel);bind('sound',()=>{save.muted=!save.muted;persist();unlockAudio();$('sound').textContent=save.muted?'音效关':'音效开';sound(2);});bind('quality',()=>{save.quality=save.quality==='auto'?'low':save.quality==='low'?'high':'auto';persist();applyQuality();toast(`画质：${$('quality').textContent}`);});

function updatePlayer(dt){
 const r=displayRadius(),speed=velocity.length(),moving=clamp(speed/Math.max(2.5,r),0,1),u=player.userData;
 u.gait=(u.gait||0)+dt*(5+moving*9);u.bounce=Math.max(0,(u.bounce||0)-dt);u.eatPulse=Math.max(0,(u.eatPulse||0)-dt*2.4);
 const stride=Math.sin(u.gait),hop=Math.max(0,stride)*moving*.12,eat=Math.sin((u.eatPulse||0)*Math.PI),wobble=Math.sin(state.elapsed*3)*.018+stride*moving*.095+eat*.14;
 player.position.set(playerPos.x,.13+hop*r,playerPos.y);player.scale.set(r*(1+wobble*.65),r*(1-wobble),r*(1+wobble*.65));
 player.rotation.x=THREE.MathUtils.damp(player.rotation.x,moving*.13,8,dt);player.rotation.z=THREE.MathUtils.damp(player.rotation.z,Math.sin(u.gait*.5)*moving*.06,8,dt);
 if(u.mouth){u.mouth.scale.set(1+eat*1.5,1+eat*3,1);u.mouth.position.y=.57-eat*.04;}
 player.visible=state.invincible<=0||Math.floor(state.invincible*12)%2===0;ring.position.set(playerPos.x,.22,playerPos.y);ring.scale.setScalar(r);
 if(speed>.1){const target=Math.atan2(velocity.x,velocity.y);player.rotation.y+=Math.atan2(Math.sin(target-player.rotation.y),Math.cos(target-player.rotation.y))*Math.min(1,dt*10);}
 const follow=dt===0?1:1-Math.exp(-dt*7);camTarget.lerp(new THREE.Vector3(playerPos.x,r*.45,playerPos.y),follow);const distance=cameraDistance(state.radius),offset=new THREE.Vector3(.434,.644,.756).normalize().multiplyScalar(distance);const cameraFollow=dt===0?1:1-Math.exp(-dt*4);camera.position.lerp(offset.add(camTarget),cameraFollow);camera.lookAt(camTarget);}

function updateBoss(dt){if(!boss||boss.hp<=0)return;const b=boss;b.phase+=dt;b.hitCooldown=Math.max(0,b.hitCooldown-dt);const cycle=b.phase%9;const vulnerable=cycle>=6.5;const warning=cycle>=3.6&&cycle<4.6;const charging=cycle>=4.6&&cycle<6.5;
 if(cycle<.1){b.vx=0;b.vz=0;b.waveDone=false;}
 const dx=playerPos.x-b.x,dz=playerPos.y-b.z,dist=Math.hypot(dx,dz)||1;
 if(warning){b.vx=dx/dist*4;b.vz=dz/dist*4;}
 if(charging){b.x=clamp(b.x+b.vx*dt,-8,8);b.z=clamp(b.z+b.vz*dt,-9,9);}
 if(cycle<3.6){b.x+=dx/dist*dt*.28;b.z+=dz/dist*dt*.28;}
 b.mesh.position.set(b.x,.2,b.z);b.mesh.scale.setScalar(1.65+(b.total-b.hp)*.1);b.mesh.rotation.y=Math.atan2(dx,dz);b.mesh.userData.body.material=material(vulnerable?0xf6d28c:warning?0xff6579:level.id===12?0xa789df:0xee9567);
 b.ring.position.set(b.x,.24,b.z);b.ring.scale.setScalar(warning?1+(cycle-3.6)*.6:1);b.ring.material.color.setHex(vulnerable?0x9dffd7:0xff9877);b.ring.visible=!vulnerable;
 $('bosslabel').textContent=vulnerable?'虚弱！靠近碰撞反击':warning?'蓄力冲刺！快躲开':`${level.id===4?'面包屑王':level.id===12?'虚空吞噬者':'熔岩领主'} · 先躲攻击，再反击`;$('bossfill').style.width=`${b.hp/b.total*100}%`;
 if(dist<displayRadius()+1.5){if(vulnerable&&b.hitCooldown<=0){b.hp--;state.bossHP=b.hp;b.hitCooldown=2.6;state.score+=level.id===10?2600:1000;sound(2);burst(b.x,b.z,0xffd28c,18);toast('反击命中！');if(b.hp<=0){dynamic.remove(b.mesh);dynamic.remove(b.ring);$('bossbar').hidden=true;if(level.id===12)for(let i=0;i<8;i++)makePrey();}else if(level.id===10&&!b.split){b.split=true;for(let i=0;i<2;i++)makeThreat();}}else if(!vulnerable)damage();}
 if(level.id===10&&cycle>2&&!b.waveDone){b.waveDone=true;const m=new THREE.Mesh(new THREE.TorusGeometry(.3,.045,5,64),new THREE.MeshBasicMaterial({color:0xffa06e,transparent:true}));m.rotation.x=-Math.PI/2;m.position.set(b.x,.3,b.z);dynamic.add(m);effects.push({m,life:2.4,max:2.4,wave:true,x:b.x,z:b.z});}
 if(level.id===12&&cycle<3.6&&dist<6){playerPos.x+=dx/dist*dt*.25;playerPos.y+=dz/dist*dt*.25;}
}
function update(dt){
 animateInsects(state.elapsed);
 state.elapsed+=dt;state.invincible=Math.max(0,state.invincible-dt);if(state.elapsed-state.lastEat>1.2)state.combo=0;
 let ix=input.x,iy=input.y;ix+=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);iy+=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);const il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il;}
 const speed=(level.id===8?5.8:4.8)*level.speed*(1+Math.sqrt(state.radius)*.09);const targetX=(ix*.867+iy*.498)*speed,targetZ=(-ix*.498+iy*.867)*speed;
 const inertia=level.id===9?2.8:level.id===11?3.8:14;velocity.x=THREE.MathUtils.lerp(velocity.x,targetX,Math.min(1,dt*inertia));velocity.y=THREE.MathUtils.lerp(velocity.y,targetZ,Math.min(1,dt*inertia));
 if(level.id===3){velocity.x+=Math.sin(Math.floor(state.elapsed/8)*Math.PI/2)*dt*1.8;velocity.y+=Math.cos(state.elapsed*.3)*dt*.7;}
 const travel=Math.max(.025,displayRadius()*.4),steps=Math.min(64,Math.max(1,Math.ceil(velocity.length()*dt/travel)));
 for(let step=0;step<steps;step++){playerPos.x+=velocity.x*dt/steps;playerPos.y+=velocity.y*dt/steps;collideEntities(dt/steps);}
 const pr=displayRadius();
 for(const e of [...entities]){
  e.age+=dt;const dx=playerPos.x-e.x,dz=playerPos.y-e.z,dist=Math.hypot(dx,dz)||.001;
  if(e.threat){if(e.kind==='bee'){e.x+=dx/dist*dt*1.25;e.z+=dz/dist*dt*1.25;}else if(level.id===2){/* Fixed obstacles teach safe routes. */}else if(e.kind==='ball'){e.x+=Math.cos(e.phase)*dt*2.5;e.z+=Math.sin(e.phase)*dt*2.5;if(Math.abs(e.x)>8.5||Math.abs(e.z)>10)e.phase+=Math.PI;}else {e.x+=Math.cos(e.phase+state.elapsed*.45)*dt*.7;e.z+=Math.sin(e.phase+state.elapsed*.45)*dt*.7;}}
  placeEntity(e);e.mesh.position.y=e.threat?.13+Math.sin(e.phase+state.elapsed*3)*.035:.12;e.mesh.rotation.y=e.kind==='bug'?(e.heading??e.phase):0;if(e.kind==='bug'){e.mesh.position.y+=Math.sin(state.elapsed*13+e.phase)*e.radius*.018;e.mesh.rotation.z=Math.sin(state.elapsed*13+e.phase)*.025;}
  const edible=!e.threat&&canEat(state.radius,e.radius);e.mesh.userData.body?.material?.emissive.setHex(edible?0x092119:0x000000);
  if(e.threat&&dist<pr*.94+e.visual*.8)damage();
 }
 spawnClock+=dt;if(spawnClock>=Math.max(.45,level.spawnInterval*(mode==='endless'?Math.max(.35,1-stage*.1):1))){spawnClock=0;for(let i=0;i<3;i++)makePrey();if(entities.filter(e=>e.threat).length<(mode==='endless'?Math.min(8,2+stage):Math.min(level.maxThreats,level.initialThreats)))makeThreat();}
 for(const h of hazards){const active=state.elapsed%6>3;h.mesh.visible=active;if(active&&Math.abs(playerPos.x-h.x)<pr*.65+.1&&Math.abs(playerPos.y)<3.5)damage();}
 if(level.id===10&&Math.abs(playerPos.x)>7.8&&mode==='level')damage();
 if(mode==='endless'&&stage===5&&state.elapsed>=cityWaveAt&&(!boss||boss.hp<=0)){state.bossHP=3;state.bossTotal=3;spawnBoss();$('bossbar').hidden=false;cityWaveAt=state.elapsed+35;}
 updateBoss(dt);
 for(const e of [...effects]){e.life-=dt;if(e.wave){const radius=.3+(e.max-e.life)*3;e.m.scale.setScalar(radius/.3);e.m.material.opacity=e.life/e.max;if(Math.abs(Math.hypot(playerPos.x-e.x,playerPos.y-e.z)-radius)<pr*.5)damage();}else{e.m.position.x+=e.vx*dt;e.m.position.y+=e.vy*dt;e.m.position.z+=e.vz*dt;e.vy-=5*dt;e.m.material.opacity=Math.max(0,e.life/e.max);}if(e.life<=0){dynamic.remove(e.m);e.m.geometry.dispose();e.m.material.dispose();effects.splice(effects.indexOf(e),1);}}
 updateSwallows(dt);updatePlayer(dt);
 if(mode==='level'){if(objective(level,state).done)finish(true);else if(level.limit&&state.elapsed>=level.limit)finish(false);}
 hudClock+=dt;if(hudClock>.1){hudClock=0;updateHUD();}
}
function updateHUD(){if(!state)return;$('score').textContent=state.score.toLocaleString();$('best').textContent=(mode==='endless'?save.endlessBest:save.highScore).toLocaleString();$('combo').textContent=`${state.combo} 连击`;$('multiplier').textContent=`×${multiplier(state.combo).toFixed(2)}`;$('maxCombo').textContent=`${state.maxCombo} COMBO`;$('size').textContent=`${STAGES[stage].name} ${state.radius.toFixed(2)}`;$('health').textContent='♥ '.repeat(Math.max(0,state.hp));const seconds=Math.floor(mode==='level'&&level.limit?Math.max(0,level.limit-state.elapsed):state.elapsed);$('timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;$('levelName').textContent=mode==='endless'?`∞ 无尽 · ${STAGES[stage].name} ▾`:`${String(level.id).padStart(2,'0')} ${level.name} ▾`;$('stars').textContent=mode==='endless'?`阶段 ${stage+1}`:'★'.repeat(save.stars[level.id]||0)+'☆'.repeat(3-(save.stars[level.id]||0));const o=mode==='endless'?{value:state.radius,target:STAGES[stage+1]?.min||state.radius*1.5,label:`下一阶段 ${STAGES[stage+1]?.name||'无限成长'} · 最高分 ${save.endlessBest}`}:objective(level,state);$('goal').textContent=o.label+(mode==='level'&&[1,2,5,6,7,8,9,11].includes(level.id)?`　${o.value.toFixed(Number.isInteger(o.target)?0:2)} / ${o.target}`:'');$('progress').style.width=`${clamp(o.value/o.target,0,1)*100}%`;$('hint').textContent=state.elapsed<6?`拖动移动 · ${STAGES[stage].name} · 吞比你小的物件`:boss&&boss.hp?'躲开蓄力冲刺 · 虚弱时靠近反击':level.id===9?'冰面有惯性 · 提前转弯':state.combo>2?'继续吞噬！1.2 秒内续上连击':`${STAGES[stage].description} · 可吞上限 ${(state.radius*.95).toFixed(2)}`;}
function animate(t){requestAnimationFrame(animate);if(!renderer||!state)return;const startTime=performance.now();const dt=Math.min(.05,(t-last)/1000||.016);last=t;const rotated=matchMedia('(orientation:landscape) and (hover:none)').matches;if(!paused&&!ended&&!document.hidden&&!rotated)update(dt);if(!document.hidden){renderer.render(scene,camera);frame++;}frameCost+=performance.now()-startTime;samples++;if(samples===120){if(save.quality==='auto'&&!qualityLow&&frameCost/samples>25){save.quality='low';applyQuality();toast('已切换流畅画质');}samples=0;frameCost=0;}}
try{
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('world').append(renderer.domElement);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();showPause();toast('图形上下文暂时中断，请刷新恢复');});
 loadWorld(0);applyQuality();start(1,'level');requestAnimationFrame(animate);
 // Read-only diagnostics help verify offline and mobile builds without altering play.
 Object.defineProperty(window,'slimeGame',{value:{snapshot:()=>({...state,mode,level:level.id,paused,ended,entities:entities.length,frame,drawCalls:renderer.info.render.calls,qualityLow,stage,stageName:STAGES[stage].name,visualRadius:displayRadius(),camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,distance:camera.position.distanceTo(camTarget),target:{x:camTarget.x,y:camTarget.y,z:camTarget.z},playerNDC:player.position.clone().add(new THREE.Vector3(0,displayRadius()*.45,0)).project(camera).toArray()},position:{x:playerPos.x,z:playerPos.y},animation:{gait:player.userData.gait,eatPulse:player.userData.eatPulse,swallows:swallows.length,scale:player.scale.toArray(),height:player.position.y},mapEdge:MAP_EDGE,districts:world.districts,sceneryColliders:world.colliders.length,spawnChecks:[...spawnChecks],prey:entities.filter(e=>!e.threat).map(e=>({id:e.id,scale:e.mesh.scale.x,heading:e.heading,gait:e.walkTime||0,x:e.x,z:e.z,radius:e.radius,kind:e.kind,name:PREY_NAMES[e.kind],stage:e.preyStage,edible:canEat(state.radius,e.radius)})),saved:JSON.parse(JSON.stringify(save))})}});
}catch(error){console.error(error);$('loading').hidden=true;$('error').hidden=false;$('error').textContent='无法启动 3D 画面。请使用支持 WebGL 2 的新版 Chrome、Edge 或 Safari，并开启浏览器硬件加速。';}