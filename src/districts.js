import * as THREE from 'three';
import {detailedBox} from './geometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Permanent scenery is generated once per map, independently of player growth.
export function addDistricts(scene,colliders,theme,edge){
 let seed=731+theme*97;
 const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
 const palettes=[
  [0x99b6a4,0xe2dec3,0x617e7b,0x8cbda4,0x6a9979,0xa6dfcd],
  [0xd6a9bf,0xffe3bc,0x877892,0xe7b6ce,0xb99bc9,0xb8e6e2],
  [0x545165,0xa99b86,0x353b50,0x75657e,0x665375,0xffb679]
 ];
 const [wall,trim,metal,accent,leaves,light]=palettes[theme];
 const names=theme===0?['研究站','储液塔','长椅','货箱','花圃','树木','庭院灯','供电柜','围栏','导览牌','管道架','水池']:theme===1?['甜品亭','糖浆罐','休息椅','原料箱','糖花坛','糖果树','街灯','冷藏柜','护栏','菜单牌','输料架','糖浆喷泉']:['遗迹殿堂','熔炉','石凳','石匣','晶簇坛','石柱群','符文灯','能量炉','石栏','石碑','导能架','祭坛'];
 const templates=[];
 for(let type=0;type<12;type++){
  const pieces=[];
  function part(geometry,color,x,y,z,rx=0,ry=0,rz=0){const matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1));const raw=geometry.index?geometry.toNonIndexed():geometry;raw.applyMatrix4(matrix);const colors=new Float32Array(raw.attributes.position.count*3),c=new THREE.Color(color);for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}raw.setAttribute('color',new THREE.BufferAttribute(colors,3));pieces.push(raw);if(raw!==geometry)geometry.dispose();}
  const box=(x,y,z,w,h,d,c)=>part(detailedBox(w,h,d),c,x,y,z);
  const cyl=(x,y,z,r,h,c)=>part(new THREE.CylinderGeometry(r,r,h,24),c,x,y,z);
  const ball=(x,y,z,r,c)=>part(new THREE.IcosahedronGeometry(r,2),c,x,y,z);
  let hx=1,hz=1;
  switch(type){
   case 0:
    hx=2.5;hz=2;box(0,1.6,0,5,3.2,4,wall);box(0,3.35,0,5.4,.3,4.4,trim);box(0,3.65,0,4.5,.3,3.5,accent);
    box(0,1,.1+hz,.85,2,.12,metal);box(0,.13,2.4,1.7,.26,.8,trim);
    for(const x of [-1.7,1.7]){box(x,1.8,2.04,.9,.95,.1,light);box(x,1.8,2.12,.045,1,.08,metal);box(x,1.8,2.12,.95,.045,.08,metal);}
    for(const z of [-1,1])box(2.53,1.8,z,.1,.9,.9,light);
    cyl(-1.5,4,-.9,.23,1.1,metal);box(1.25,3.8,-.7,1,.6,.8,metal);break;
   case 1:
    hx=hz=1.15;cyl(0,.2,0,1.15,.4,metal);cyl(0,1.8,0,.95,3,accent);for(const y of [.55,2.9,3.35])cyl(0,y,0,1.05,.15,trim);
    for(const x of [-.7,.7]){cyl(x,1.7,.73,.045,3,metal);}for(let y=.5;y<3;y+=.4)box(0,y,.8,1.4,.05,.06,metal);box(.65,1.5,.85,.55,.5,.12,metal);box(.65,1.5,.93,.4,.25,.05,light);break;
   case 2:
    hx=1.6;hz=.6;for(const z of [-.35,0,.35])box(0,.75,z,3.2,.13,.22,trim);box(0,1.3,-.5,3.2,.8,.12,wall);for(const x of [-1.2,1.2]){box(x,.35,0,.14,.7,.9,metal);box(x,.97,0,.13,.12,1.2,metal);}break;
   case 3:
    hx=hz=.85;box(0,.8,0,1.7,1.6,1.7,wall);for(const x of [-.7,.7])for(const z of [-.7,.7])box(x,.8,z,.14,1.7,.14,metal);for(const y of [.2,1.4]){box(0,y,.87,1.6,.12,.07,trim);box(.87,y,0,.07,.12,1.6,trim);}box(0,.9,.88,.6,.4,.03,trim);break;
   case 4:
    hx=1.5;hz=1;box(0,.3,0,3,.6,2,wall);box(0,.62,0,2.7,.12,1.7,metal);for(let i=0;i<5;i++){const x=-1+i*.5;cyl(x,.9,0,.035,.7,leaves);ball(x,1.25,(i%2)*.25,.3,i%2?accent:light);}break;
   case 5:
    hx=hz=.35;cyl(0,1.5,0,.3,3,metal);for(let i=0;i<5;i++){const a=i*2.4;ball(Math.cos(a)*.65,3.4+(i%2)*.6,Math.sin(a)*.65,.95,leaves);}break;
   case 6:
    hx=hz=.4;cyl(0,.15,0,.4,.3,metal);cyl(0,1.8,0,.08,3.5,metal);box(0,3.5,0,1,.15,1,trim);box(0,3.13,0,.55,.6,.55,light);for(const x of [-.3,.3])for(const z of [-.3,.3])box(x,3.1,z,.045,.7,.045,metal);box(0,2.75,0,.8,.12,.8,metal);break;
   case 7:
    hx=1;hz=.65;box(0,1.15,0,2,2.3,1.3,wall);box(0,2.4,0,2.2,.2,1.5,trim);for(let i=0;i<6;i++)box(-.6+i*.24,.8,.67,.12,.6,.04,metal);box(0,1.8,.7,1.3,.45,.12,metal);for(const x of [-.4,0,.4])ball(x,1.8,.79,.08,x?light:accent);break;
   case 8:
    hx=2;hz=.15;for(const x of [-1.9,0,1.9]){box(x,.8,0,.16,1.6,.25,metal);ball(x,1.65,0,.15,trim);}for(const y of [.4,1.25])box(0,y,0,4,.14,.16,wall);break;
   case 9:
    hx=.6;hz=.18;for(const x of [-.45,.45])box(x,1,0,.1,2,.12,metal);box(0,1.9,0,1.5,1.1,.2,wall);box(0,1.9,.12,1.25,.8,.045,metal);for(let i=0;i<3;i++)box(0,2.12-i*.22,.15,.85-i*.1,.07,.035,trim);break;
   case 10:
    hx=2;hz=.7;for(const x of [-1.8,1.8]){box(x,1,0,.13,2,1.3,metal);}for(const z of [-.4,0,.4])part(new THREE.CylinderGeometry(.13,.13,4,24),accent,0,1.75,z,0,0,Math.PI/2);for(const x of [-1,1])box(x,1.8,0,.12,.45,1.35,trim);break;
   case 11:
    hx=hz=1.8;cyl(0,.18,0,1.8,.35,metal);cyl(0,.4,0,1.55,.25,trim);cyl(0,.55,0,1.3,.05,accent);cyl(0,1,0,.24,1.1,wall);cyl(0,1.55,0,.8,.16,trim);ball(0,1.85,0,.3,light);break;
  }
  // Model-specific fittings are baked into the shared instance template.
  if(type===0){for(const x of [-1.7,1.7]){box(x,1.27,2.15,1.12,.09,.24,trim);box(x,2.34,2.1,1.05,.07,.13,trim);}box(.3,1,2.18,.08,.08,.05,trim);for(let i=0;i<5;i++)box(.88+i*.16,3.85,-.28,.06,.07,.04,trim);}
  if(type===1){for(const y of [.55,2.9])for(let i=0;i<12;i++){const a=i*Math.PI/6;ball(Math.cos(a)*1.055,y,Math.sin(a)*1.055,.045,metal);}cyl(0,3.5,0,.32,.14,metal);}
  if(type===2){for(const x of [-1.2,1.2])for(const z of [-.35,0,.35])ball(x,.825,z,.034,metal);for(const y of [1.08,1.34,1.6])box(0,y,-.575,3.05,.025,.025,trim);}
  if(type===3){for(let i=0;i<5;i++){box(-.55+i*.275,.8,.864,.025,1.35,.018,accent);box(.864,.8,-.55+i*.275,.018,1.35,.025,accent);}for(const x of [-.7,.7])for(const y of [.2,1.4])ball(x,y,.915,.045,metal);}
  if(type===4){for(const x of [-1.43,1.43])box(x,.37,0,.08,.28,1.85,trim);for(let i=0;i<5;i++){const x=-1+i*.5;ball(x-.12,1.02,0,.11,leaves);ball(x+.12,1.1,.05,.1,leaves);}}
  if(type===5){for(let i=0;i<4;i++){const a=i*Math.PI/2;part(new THREE.CylinderGeometry(.055,.1,.8,10),metal,Math.cos(a)*.4,2.25,Math.sin(a)*.4,Math.sin(a)*.6,0,-Math.cos(a)*.6);}}
  if(type===6){for(const x of [-.24,.24])for(const z of [-.24,.24])ball(x,.32,z,.045,trim);cyl(0,2.65,0,.18,.1,trim);cyl(0,3.65,0,.1,.2,metal);}
  if(type===7){box(0,1.17,.67,.025,2.05,.025,metal);for(const x of [-.12,.12])box(x,1.25,.71,.045,.26,.05,trim);for(const x of [-.85,.85])for(const y of [.3,2.1])ball(x,y,.68,.045,metal);}
  if(type===8){for(const x of [-1.4,-.95,-.5,.5,.95,1.4])box(x,.83,0,.055,.72,.065,metal);}
  if(type===9){for(const x of [-.6,.6])for(const y of [1.5,2.3])ball(x,y,.155,.04,trim);box(0,1.15,0,.85,.08,.34,trim);}
  if(type===10){for(const x of [-1,1])for(const z of [-.4,0,.4]){part(new THREE.TorusGeometry(.17,.035,8,24),metal,x,1.75,z,0,Math.PI/2,0);}for(const x of [-1.8,1.8])box(x,.1,0,.45,.16,1.45,trim);}
  if(type===11){for(let i=0;i<12;i++){const a=i*Math.PI/6;ball(Math.cos(a)*1.6,.38,Math.sin(a)*1.6,.06,accent);}cyl(0,1.26,0,.29,.09,trim);}
  const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());templates.push({geometry,hx,hz});
 }
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65});
 const batches=new Map(),counts=new Array(12).fill(0),dummy=new THREE.Object3D();
 function place(type,x,z,scale){
  const {hx,hz}=templates[type],turn=random()>.5;
  const collider={x,z,hx:(turn?hz:hx)*scale,hz:(turn?hx:hz)*scale,r:0,invMass:0};
  // Open plazas reserve room for fixed-size edible buildings and their approach.
  if([-650,0,650].some(cx=>[-650,0,650].some(cz=>(cx||cz)&&Math.hypot(x-cx,z-cz)<145+Math.max(collider.hx,collider.hz))))return;
  if(Math.abs(x)+collider.hx>edge||Math.abs(z)+collider.hz>edge)return;
  if(colliders.some(c=>Math.abs(x-c.x)<collider.hx+c.hx+1&&Math.abs(z-c.z)<collider.hz+c.hz+1))return;
  colliders.push(collider);counts[type]++;
  const key=`${Math.floor(x/144)},${Math.floor(z/144)},${type}`;
  if(!batches.has(key))batches.set(key,{type,transforms:[]});
  dummy.position.set(x,0,z);dummy.rotation.set(0,turn?Math.PI/2:0,0);dummy.scale.setScalar(scale);dummy.updateMatrix();batches.get(key).transforms.push(dummy.matrix.clone());
 }
 // Dense garden outskirts, then larger themed compounds separated by broad lanes.
 for(let x=-84;x<=84;x+=12)for(let z=-84;z<=84;z+=12){if(Math.abs(x)<17&&Math.abs(z)<18)continue;if(Math.abs(x)%36===0||Math.abs(z)%36===0)continue;place(Math.floor(random()*12),x+(random()-.5)*3,z+(random()-.5)*3,.7+random()*.7);}
 for(let x=-edge+32;x<edge;x+=64)for(let z=-edge+32;z<edge;z+=64){if(Math.abs(x)<90&&Math.abs(z)<90)continue;const scale=1.2+random()*1.8;place(0,x-12,z-10,scale);for(let i=0;i<3;i++)place(1+Math.floor(random()*11),x-18+i*18,z+12+(random()-.5)*8,1+random()*1.8);}
 for(const {type,transforms} of batches.values()){
  const mesh=new THREE.InstancedMesh(templates[type].geometry,material,transforms.length);transforms.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 }
 return {count:counts.reduce((a,b)=>a+b,0),types:names.map((name,i)=>({name,count:counts[i]}))};
}