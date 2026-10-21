import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export function createWorld(theme=0) {


const palettes=[{bg:0xb8d7ca,ground:0x8eb796,path:0xd2d5b5,main:0x33ddb0,light:0xffe5b5},{bg:0xd5baca,ground:0xc89cbb,path:0xf1d6bd,main:0x54d3ed,light:0xffe2c4},{bg:0x171c30,ground:0x343349,path:0x565365,main:0x43e8bc,light:0xffb08c}];
const p=palettes[theme];let seed=52;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
const scene=new THREE.Scene();scene.background=new THREE.Color(p.bg);scene.fog=new THREE.Fog(p.bg,30,65);
const camera=new THREE.PerspectiveCamera(38,9/16,.1,100);camera.position.set(15.5,23,26);camera.lookAt(0,0,-1);

scene.add(new THREE.HemisphereLight(theme===2?0x9ebcff:0xf4ffff,theme===2?0x282036:0x647765,2));
const sun=new THREE.DirectionalLight(p.light,theme===2?3:4);sun.position.set(-7,18,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:60});sun.shadow.normalBias=.025;scene.add(sun);
const rim=new THREE.DirectionalLight(0x96e9ff,1.6);rim.position.set(10,8,-10);scene.add(rim);
function mat(c,metal=0,rough=.55){return new THREE.MeshStandardMaterial({color:c,metalness:metal,roughness:rough});}
function mesh(geo,m,x,y,z,parent=scene){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cube(x,y,z,w,h,d,c,parent=scene){const o=mesh(new THREE.BoxGeometry(w,h,d),mat(c),x,y,z,parent);return o;}
function ball(x,y,z,r,c,parent=scene,squash=1){const o=mesh(new THREE.SphereGeometry(r,12,8),mat(c),x,y,z,parent);o.scale.y=squash;return o;}
function cyl(x,y,z,r,h,c,parent=scene,r2=r){return mesh(new THREE.CylinderGeometry(r2,r,h,12),mat(c,.15,.4),x,y,z,parent);}
function tube(points,r,c,parent=scene){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),16,r,6,false),mat(c,.25,.32),0,0,0,parent);}
function torus(x,y,z,r,t,c,parent=scene){const o=mesh(new THREE.TorusGeometry(r,t,6,24),mat(c,.15,.3),x,y,z,parent);o.rotation.x=-Math.PI/2;return o;}
function glow(c){return new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:2,roughness:.3});}
function crystal(x,z,h,c){const o=mesh(new THREE.CylinderGeometry(0,.25,h,5),mat(c,.25,.18),x,h/2,z);o.rotation.z=.2;mesh(new THREE.ConeGeometry(.25,.4,5),glow(c),x,h+.12,z);}
function slime(x,z,r,c,boss=false){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const material=new THREE.MeshPhysicalMaterial({color:c,roughness:.13,metalness:.02,clearcoat:1,clearcoatRoughness:.08,transmission:0,thickness:r*1.4,ior:1.36});
 const body=mesh(new THREE.SphereGeometry(r,24,16),material,0,r*.62,0,g);body.scale.set(1,.79,.91);
 const core=ball(0,r*.65,.15,r*.48,c,g,.8);core.material=glow(c);
 for(let i=0;i<7;i++){const a=rand()*6.28;ball(Math.cos(a)*r*.62,r*(.35+rand()*.7),Math.sin(a)*r*.5,r*.055,0xdbfff0,g);}
 const face=new THREE.Group();g.add(face);face.rotation.y=.48;
 for(const xx of [-.33,.33]){ball(xx*r,r*.75,r*.78,r*.105,0x153d46,face,1.25);ball(xx*r-r*.025,r*.8,r*.868,r*.029,0xffffff,face);const cheek=ball(xx*r*1.55,r*.55,r*.72,r*.12,0xf49eac,face,.4);cheek.scale.z=.25;}
 tube([[-r*.12,r*.53,r*.9],[0,r*.47,r*.94],[r*.12,r*.53,r*.9]],r*.021,0x164452,face);
 for(let i=0;i<3;i++){const drop=ball(-r*.55+i*r*.51,r*.15,r*.43,r*.34,c,g,.37);drop.material=material;}
 if(boss){for(let i=0;i<9;i++){const a=i/9*Math.PI*2;const o=mesh(new THREE.ConeGeometry(r*.17,r*.62,5),mat(0x4b3548,.3),Math.cos(a)*r*.85,r*(.8+rand()*.35),Math.sin(a)*r*.8,g);o.rotation.z=-Math.cos(a)*.6;}torus(0,r*1.42,0,r*.39,.08,0xffca6b,g);for(let i=0;i<5;i++)mesh(new THREE.ConeGeometry(.13,.45,4),mat(0xffd37b,.6,.2),Math.cos(i*6.28/5)*r*.39,r*1.65,Math.sin(i*6.28/5)*r*.39,g);}
 return g;
}
// Broad playable terrain with layered stone foundations and individual paving.
cube(0,-.6,0,23,1.1,27,theme===2?0x292937:0x718e83);cube(0,-.08,0,22.6,.25,26.6,p.ground);
for(let x=-11;x<12;x+=1.15)for(let z=-13;z<14;z+=1.15){const path=Math.abs(x)<2.5||Math.abs(z+2)<1.3;const c=new THREE.Color(path?p.path:p.ground);c.multiplyScalar(.89+rand()*.2);const tile=cube(x,.04+rand()*.03,z,1.13,.12,1.13,c);if(!path&&rand()<.3)tile.rotation.y=(rand()-.5)*.1;}
function grass(x,z){for(let k=0;k<4;k++){const o=mesh(new THREE.ConeGeometry(.06,.3+rand()*.25,3),mat(theme===2?0x70607f:0x5d9271),x+(rand()-.5)*.4,.22,z+(rand()-.5)*.4);o.rotation.z=(rand()-.5)*.5;}}
function mushroom(x,z,r=1){cyl(x,r*.35,z,r*.13,r*.7,0xf0e3c9);const cap=ball(x,r*.72,z,r*.5,theme===0?0xcb8e98:0xf8a4b5,scene,.45);for(let i=0;i<5;i++)ball(x+(rand()-.5)*r*.6,r*.8,z+(rand()-.5)*r*.5,r*.055,0xfff5dc);}
function tree(x,z,h){cyl(x,h*.36,z,.17,h*.72,0x8b7761);for(let j=0;j<5;j++){const a=j*2.4;ball(x+Math.cos(a)*.55,h*.7+rand()*.7,z+Math.sin(a)*.4,.8,theme===0?[0x6d9e82,0x85b494,0xa3c6a0][j%3]:[0xf3b3ca,0xd39ec9,0xe9cbcb][j%3],scene,.85);}for(let j=0;j<7;j++)ball(x+(rand()-.5)*1.4,h*.7+rand(),z+(rand()-.5)*1.2,.08,theme===0?0xf2e6b4:0xffeecc);}
function tank(x,z){cyl(x,.3,z,1.02,.45,0x537c79);cyl(x,2,z,.87,3,0xadd9cd);const glass=mesh(new THREE.CylinderGeometry(.82,.82,2.8,32),new THREE.MeshPhysicalMaterial({color:0xa1ffdc,transparent:true,opacity:.28,roughness:.1,metalness:.2,side:THREE.DoubleSide}),x,2,z);cyl(x,3.55,z,1,.3,0xe2e1c9);torus(x,.65,z,.85,.09,0xb9ffe5);torus(x,3.35,z,.86,.07,0xcaffef);slime(x,z,.5,0x58dbaa).position.y=1.05;for(let j=0;j<3;j++){const a=j*6.28/3;cyl(x+Math.cos(a)*.86,2,z+Math.sin(a)*.86,.06,2.8,0x587f7d);}cube(x,2.3,z+.9,.6,.45,.13,0x37555d);cube(x,2.33,z+.98,.43,.23,.03,0x8af5d7);tube([[x,3.6,z],[x,4,z],[x+1.5,4,z],[x+1.5,.4,z]],.12,0x7eac9c);}
function machine(x,z){cube(x,1.1,z,2.4,2.2,1.8,0xc099b1);cube(x,2.32,z,2.65,.3,2,0xf5e2ca);cyl(x,3,z,.7,1.1,0xf3c3ca);torus(x,3.6,z,.7,.1,0xfff0cc);cube(x,1.3,z+1,.95,.65,.17,0x6d718e);cube(x,1.32,z+1.1,.7,.4,.04,0x96e7e4);for(let i=0;i<3;i++)ball(x+.7,1.4-i*.3,z+.99,.09,[0x8be1b5,0xffd784,0xef8b9e][i]);tube([[x,2.6,z],[x+1.7,2.6,z],[x+1.7,1,z]],.16,0xf3d9af);}
function sweet(x,z,n){if(n%4===0){const o=torus(x,.28,z,.36,.16,[0xf3b0c3,0xb5d3e9,0xefcd98][n%3]);for(let k=0;k<7;k++){const a=k*.9;cube(x+Math.cos(a)*.33,.43,z+Math.sin(a)*.33,.04,.04,.11,0xfff4bf);}}else if(n%4===1){cyl(x,.3,z,.3,.6,0xc28c69);ball(x,.72,z,.4,0xffd1db,scene,.7);ball(x,1,z,.08,0xe96b8d);}else if(n%4===2){cube(x,.25,z,.45,.5,.45,0x9cd8cd);cube(x,.52,z,.48,.06,.48,0xeaf2c9);}else{ball(x,.3,z,.25,0xf5bd78);}}
function rock(x,z,r){const o=mesh(new THREE.DodecahedronGeometry(r,0),mat([0x383746,0x4e4559,0x625166][Math.floor(rand()*3)]),x,r*.45,z);o.scale.set(1,.8,1);o.rotation.set(rand(),rand(),rand());}
if(theme===0){
 for(const [x,z] of [[-7,-7],[6,-10],[-9,1]])tank(x,z);
 for(const [x,z,h] of [[-9,-11,3.7],[9,-6,3.2],[8,5,3.4],[-8,8,2.8],[-4,-12,3]])tree(x,z,h);
 for(let i=0;i<28;i++){const x=(rand()-.5)*21,z=(rand()-.5)*25;if(Math.abs(x)>3.4){grass(x,z);if(i%3===0)mushroom(x,z,.6+rand()*.6);}}
 tube([[-7,.5,-7],[-7,.5,-3],[-5,.5,-3],[-5,.5,3],[-9,.5,3]],.13,0x79978d);
 for(let i=0;i<5;i++){cube(-6+i*.6,.3,5,.48,.55,.5,0xb7c8ad);cyl(-6+i*.6,.68,5,.12,.25,0x76c9b5);}
 for(let i=0;i<36;i++){const x=(rand()-.5)*21,z=(rand()-.5)*24;for(let j=0;j<3;j++){cyl(x+j*.12,.18,z,.018,.36,0x679676);ball(x+j*.12,.4,z,.1,[0xffe5a8,0xf6c5ce,0xd5c9f2][i%3]);}}
 for(const [x,z] of [[-5,0],[6,3],[-4,7],[5,-5]]){
   cube(x,.28,z,1.8,.5,1.25,0x9baf99);cube(x,.57,z,1.65,.12,1.1,0x667f6d);
   for(let j=0;j<5;j++){const xx=x+(rand()-.5)*1.3,zz=z+(rand()-.5)*.8;cyl(xx,.8,zz,.035,.5,0x73a17d);for(let a=0;a<5;a++)ball(xx+Math.cos(a*1.26)*.12,1.05,zz+Math.sin(a*1.26)*.12,.09,0xe6c6cd);ball(xx,1.07,zz,.07,0xffe1a3);}
 }
 for(const [x,z] of [[-3,-6],[7,7],[-7,5]]){cube(x,.5,z,1.8,.12,.75,0xd9cfac);for(const xx of [-.7,.7])cube(x+xx,.25,z,.12,.5,.55,0x638a80);for(let j=0;j<3;j++){const xx=x-.5+j*.5;cyl(xx,.78,z,.16,.45,0xb3e6d5);torus(xx,1.02,z,.16,.025,0xe5f2d4);}}
 for(let j=0;j<12;j++){const a=j*2.4;const x=6+Math.cos(a)*1.2,z=-1+Math.sin(a)*.8;rock(x,z,.22+rand()*.2);}
}else if(theme===1){
 for(const [x,z] of [[-7,-8],[7,-9],[-8,3]])machine(x,z);
 cube(5,.6,-2,3.5,.5,7,0x907b97);cube(5,.88,-2,3.2,.1,6.9,0x606c80);for(let i=0;i<13;i++){const o=cyl(5,.96,-5+i*.5,.12,3.25,0xb9bbcb);o.rotation.z=Math.PI/2;if(i%3===0)sweet(5,-5+i*.5,i);}
 for(const [x,z] of [[-9,-12],[9,6],[-8,9],[9,-12]]){tree(x,z,3);cyl(x+.9,1.5,z,.08,3,0xfff0d6);const pop=ball(x+.9,3.1,z,.7,0xf3a7be,scene,.95);torus(x+.9,3.1,z,.45,.08,0xffe4bf).rotation.x=0;}
 for(let i=0;i<46;i++){const x=(rand()-.5)*20,z=(rand()-.5)*24;if(Math.abs(x)>3)sweet(x,z,i);}
 for(const [x,z] of [[-5,-2],[7,5],[-5,8]]){cyl(x,.55,z,.8,1,0xf0c3b6);cyl(x,1.15,z,.88,.2,0xffe3c7);for(let j=0;j<7;j++)ball(x+Math.cos(j*.9)*.55,1.35,z+Math.sin(j*.9)*.55,.16,0xf1aac4);}
 for(let i=0;i<6;i++){cube(-5+i*.7,.22,8,.65,.4,.65,0x8c665e);cube(-5+i*.7,.45,8,.6,.12,.6,0xe0b28e);}
}else{
 for(let i=0;i<30;i++){const a=i/30*6.28,x=Math.cos(a)*10,z=Math.sin(a)*12;rock(x,z,1+rand()*1.2);if(i%3===0)crystal(x*.86,z*.86,1+rand()*1.5,0xf8a477);}
 for(const x of [-6,6])for(const z of [-8,3]){cube(x,.3,z,1.5,.6,1.5,0x595063);cyl(x,2,z,.45,3.2,0x74687b);cyl(x,3.7,z,.7,.35,0x8e7b8b);torus(x,1.2,z,.48,.07,0xffa56f);rock(x,4,.3);}
 for(let i=0;i<6;i++){const x=-10+i*3.3; tube([[x,.19,-11],[x+1,.19,-7],[x,.19,-4],[x+1,.19,-2]],.07,0xff9259);}
 for(let i=0;i<25;i++){const x=(rand()-.5)*20,z=(rand()-.5)*24;mesh(new THREE.SphereGeometry(.04+rand()*.035,8,6),glow(0xffbd74),x,.5+rand()*3,z);}
 torus(1,.22,-5,3.1,.045,0xff9a6d);torus(1,.22,-5,3.35,.025,0xff655c);
 const lava=new THREE.PointLight(0xff7044,30,16,2);lava.position.set(0,3,-7);scene.add(lava);
}
// Third-pass environment: authored clusters, architectural silhouettes and fine fittings.
function beam(a,b,r,c,parent=scene){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r,dir.length(),10),mat(c,.35,.35),...(av.clone().add(bv).multiplyScalar(.5).toArray()),parent);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return o;}
function bolts(x,y,z,w,d){for(const dx of [-1,1])for(const dz of [-1,1])cyl(x+dx*w*.42,y,z+dz*d*.42,.055,.05,0xd5e4dc);}
function railing(x,z,length,alongX=true){for(let i=0;i<=length;i+=.6){const xx=x+(alongX?i:0),zz=z+(alongX?0:i);cyl(xx,.65,zz,.035,1.1,theme===2?0xa18a80:0xe2dfc9);}for(const y of [.5,1.1])beam([x,y,z],[x+(alongX?length:0),y,z+(alongX?0:length)],.035,theme===2?0xa18a80:0xc8d5bd);}
function crate(x,z,c){cube(x,.38,z,.8,.7,.8,c);for(const dx of [-.3,.3])cube(x+dx,.38,z+.42,.065,.75,.05,0xe3d8b5);cube(x,.38,z+.45,.85,.07,.05,0x97866e);bolts(x,.75,z,.8,.8);}
function lamp(x,z){cyl(x,1.1,z,.045,2,0x778c89);cyl(x,2.17,z,.22,.3,0x445b66);mesh(new THREE.SphereGeometry(.16,12,8),glow(theme===2?0xffac6b:0xffecc1),x,2.2,z);cyl(x,2.4,z,.3,.08,0x8b9e96);}
function steps(x,z,w,c){for(let i=0;i<4;i++)cube(x,.1+i*.12,z-i*.28,w,.2+i*.24,.35,c);}
function gear(x,y,z,r,c){const g=new THREE.Group();scene.add(g);g.position.set(x,y,z);torus(0,0,0,r,.12,c,g).rotation.x=0;for(let i=0;i<12;i++){const a=i*Math.PI/6;const o=cube(Math.cos(a)*r,Math.sin(a)*r,0,.22,.24,.25,c,g);o.rotation.z=a;}const hub=cyl(0,0,0,.18,.35,0xe5d7bc,g);hub.rotation.x=Math.PI/2;for(let i=0;i<6;i++){const a=i*Math.PI/3;beam([0,0,0],[Math.cos(a)*r*.85,Math.sin(a)*r*.85,0],.045,c,g);}return g;}
function building(x,z,c,roof){
 cube(x,.25,z,4.6,.5,3.5,0x859c8d);cube(x,1.6,z,4,2.6,3,c);
 for(const dx of [-1.85,1.85])cube(x+dx,1.7,z+.04,.16,2.85,3.1,0xe8dfc3);
 for(const xx of [-1.15,1.1]){cube(x+xx,1.8,z+1.52,1.12,1.25,.08,0x456c79);cube(x+xx,1.8,z+1.58,.06,1.25,.06,0xd9e2cb);cube(x+xx,1.8,z+1.58,1.12,.06,.06,0xd9e2cb);}
 cube(x,.9,z+1.56,.65,1.5,.1,0x9abeb2);ball(x+.2,.95,z+1.65,.045,0xffd694);
 for(const side of [-1,1]){const ro=cube(x+side*1.15,3.48,z,2.6,.16,3.8,roof);ro.rotation.z=-side*.43;
   for(let row=0;row<5;row++)for(let col=0;col<10;col++){const xx=side*(.2+row*.45);const tile=cube(x+xx,4.02-Math.abs(xx)*.46,z-1.7+col*.37,.48,.045,.34,new THREE.Color(roof).multiplyScalar(.94+rand()*.13));tile.rotation.z=-side*.43;}
 }
 beam([x,4.13,z-2],[x,4.13,z+2],.08,0xe3d6b9);
 cube(x,3.12,z+1.6,4.4,.18,.18,0xeee1bf);
 for(const dx of [-1.85,1.85])beam([x+dx,2.3,z+1.6],[x+dx*.65,2.95,z+1.6],.06,0xb6b798);
 cube(x,2.65,z+1.68,1.4,.4,.08,theme===0?0x689c8a:0xb78aab);for(let j=0;j<4;j++)cube(x-.45+j*.3,2.65,z+1.74,.14,.08,.03,0xf5e4be);
 cyl(x+1.1,4.1,z-.4,.24,1,0xded6bd);cyl(x+1.1,4.65,z-.4,.32,.15,roof);steps(x,z+2.6,1.6,0xc9c7af);
 for(const dx of [-2,2]){cube(x+dx,.7,z+1.8,.7,.6,.6,0xa5af8e);for(let j=0;j<4;j++)ball(x+dx+(rand()-.5)*.4,1.05+rand()*.2,z+1.8,.2,0x8ca982);}
}
if(theme===0){
 building(-5,-5,0xd7d8b7,0x5b8d81);
 // Open greenhouse, translucent roof panes and visible plant shelves.
 const gx=5,gz=0;cube(gx,.25,gz,4.4,.5,4.8,0x9fbaa1);
 const glass=new THREE.MeshPhysicalMaterial({color:0xa8e1cb,transparent:true,opacity:.18,roughness:.16,side:THREE.DoubleSide});
 for(const dx of [-2,2])for(const dz of [-2,2])beam([gx+dx,.4,gz+dz],[gx+dx,3,gz+dz],.07,0xe9e3c8);
 for(let j=0;j<5;j++){const zz=gz-2+j;beam([gx-2,3,zz],[gx,4,zz],.06,0xdce1bf);beam([gx,4,zz],[gx+2,3,zz],.06,0xdce1bf);beam([gx-2,1.5,zz],[gx+2,1.5,zz],.035,0xd9ddbd);}
 beam([gx,4,gz-2.2],[gx,4,gz+2.2],.08,0xe9e3c8);
 for(const dx of [-1,1]){const pane=mesh(new THREE.BoxGeometry(2.25,.025,4.4),glass,gx+dx,3.5,gz);pane.rotation.z=-dx*.46;}
 for(const dx of [-1.1,1.1]){cube(gx+dx,.9,gz,1,.15,3.8,0xc3bb95);for(let j=0;j<6;j++){cyl(gx+dx,1.18,gz-1.6+j*.65,.22,.4,0xb4947c);for(let k=0;k<4;k++){const a=k*1.57;const leaf=ball(gx+dx+Math.cos(a)*.18,1.5,gz-1.6+j*.65+Math.sin(a)*.18,.22,0x79ae8c,scene,.35);leaf.rotation.z=.5;}}}
 // Raised water garden, pump, bridge planks, lily pads.
 cube(-5,.2,4,4.2,.4,3.4,0xa4b3a0);const water=mesh(new THREE.BoxGeometry(3.7,.07,2.9),new THREE.MeshPhysicalMaterial({color:0x60b5b1,metalness:.25,roughness:.12,clearcoat:1}),-5,.43,4);
 for(let j=0;j<8;j++){const xx=-6.5+rand()*3,zz=3+rand()*2;const pad=cyl(xx,.49,zz,.22,.03,0x8bb987);if(j%3===0)ball(xx,.61,zz,.13,0xf3c7c6);}
 for(let j=0;j<7;j++)cube(-5,.65,2.4+j*.5,1.1,.13,.43,0xc2af88);railing(-5.65,2.4,3,false);
 for(const [x,z] of [[-3,8],[5,6]]){crate(x,z,0x9cb79c);crate(x+.9,z+.2,0xb4b798);lamp(x-.7,z+.4);}
 for(let j=0;j<16;j++){const x=(rand()-.5)*20,z=(rand()-.5)*23;if(Math.abs(x)>3){grass(x,z);mushroom(x,z,.35+rand()*.5);}}
 tube([[-7,1,-4],[-8,1,-4],[-8,1,2],[-6,1,2]],.09,0xc7c3a7);
}else if(theme===1){
 building(-5,-5,0xe6b9ae,0xa97c9d);building(6,-7,0xe0c4b0,0x9c91bb);
 // Iced roof, candy trim and bakery display case.
 for(let j=0;j<10;j++)ball(-7+j*.44,3,-3.45,.22,0xffe9d2,scene,.7);
 cube(-5,.6,-2.7,3.5,1.2,.7,0xb2849b);cube(-5,1.2,-2.7,3.7,.14,.85,0xffe9cc);
 for(let j=0;j<7;j++){ball(-6.4+j*.45,1.4,-2.7,.19,[0xffc1ce,0xd6b5db,0xf1d29c][j%3]);}
 const caseGlass=mesh(new THREE.BoxGeometry(3.6,.65,.8),new THREE.MeshPhysicalMaterial({color:0xd7ffff,transparent:true,opacity:.2,roughness:.1}),-5,1.62,-2.7);
 // Chocolate vat with riveted bands, valve wheel and overhead discharge.
 cyl(5,1.2,3,1.45,2.2,0xd1b99a);cyl(5,2.35,3,1.35,.08,0x725048);for(const y of [.4,1.1,2.1])torus(5,y,3,1.47,.08,0x8b92a0);
 for(let j=0;j<12;j++){const a=j*Math.PI/6;ball(5+Math.cos(a)*1.48,1.2,3+Math.sin(a)*1.48,.055,0xf5dabc);}
 tube([[6,3.6,2],[5,3.6,2],[5,2.5,3]],.15,0xe6cbaa);gear(3.8,1.4,4.05,.5,0xc28c9d);
 for(const [x,z] of [[-5,4],[5,7]]){cube(x,.5,z,2.5,1,1.5,0xbc9ba7);cube(x,1.05,z,2.7,.15,1.7,0xffe9ce);for(let j=0;j<8;j++){const xx=x-.9+(j%4)*.6,zz=z-.4+Math.floor(j/4)*.7;const mac=cyl(xx,1.3,zz,.22,.24,[0xd1b9e0,0xa9d7c9,0xf5b6c4][j%3]);torus(xx,1.3,zz,.22,.035,0xffe6bf);}gear(x, .6,z+.83,.3,0x8c889e);}
 for(let j=0;j<9;j++){const z=-1+j*.65;cube(6.7,.95,z,.18,.2,.4,0xefd4b2);}
 for(const [x,z] of [[-3,8],[-7,1],[7,8]]){crate(x,z,0xd2acb4);lamp(x+.8,z);cyl(x,1.2,z-.6,.08,2.4,0xfff0d1);const l=torus(x,2.6,z-.6,.55,.16,0xe4adc7);l.rotation.x=0;}
 for(let j=0;j<50;j++){const x=(rand()-.5)*18,z=(rand()-.5)*21;if(Math.abs(x)>2.5){const sprinkle=cube(x,.2,z,.055,.08,.19,[0xf3dca1,0xe7a8c9,0x91c9bf][j%3]);sprinkle.rotation.y=rand()*6.28;}}
}else{
 // Monumental broken portal, layered stair dais and carved fluted pillars.
 for(let j=0;j<4;j++)cube(1,.1+j*.2,-6,8-j*.55,.22,7-j*.45,0x5d4e62);
 for(const x of [-4,6]){cube(x,.35,-7,1.7,.7,1.7,0x756174);cube(x,4,-7,1.1,7,1.1,0x59465e);for(const xx of [-.4,0,.4])cube(x+xx,4,-6.42,.07,6.1,.04,0x92768a);for(const y of [.9,2.6,5.6,7.3])cube(x,y,-7,1.5,.23,1.5,0x9b7b88);mesh(new THREE.OctahedronGeometry(.3),glow(0xffa36a),x,6.3,-6.3);}
 beam([-4,7.4,-7],[6,7.4,-7],.42,0x6d5368);for(let j=0;j<9;j++)cube(-3.5+j,7.55,-6.8,.7,.35,.7,0x987183);
 const portal=torus(1,4.4,-7,2.3,.18,0xe6a575);portal.rotation.x=0;const inner=torus(1,4.4,-7,1.95,.035,0xffc57d);inner.rotation.x=0;
 for(let j=0;j<12;j++){const a=j*Math.PI/6;mesh(new THREE.OctahedronGeometry(.13),glow(0xffb76c),1+Math.cos(a)*2.3,4.4+Math.sin(a)*2.3,-6.9);}
 // Braziers with layered flames and hanging chains.
 for(const [x,z] of [[-5,1],[5,5],[-6,7]]){cyl(x,.3,z,.7,.5,0x645365);cyl(x,1,z,.35,1.2,0x837083);cyl(x,1.65,z,.65,.3,0xb08d87);for(let j=0;j<5;j++){const fire=mesh(new THREE.ConeGeometry(.18,.7+rand()*.5,7),glow(j%2?0xffb758:0xff7350),x+(rand()-.5)*.6,2,z+(rand()-.5)*.6);fire.rotation.z=(rand()-.5)*.4;}for(let j=0;j<6;j++){const ring=torus(x+.5,.8+j*.16,z,.1,.025,0x7e7183);ring.rotation.x=j%2?0:Math.PI/2;}}
 for(const [x,z] of [[-6,-1],[6,0],[-5,8]]){for(let j=0;j<6;j++){const o=mesh(new THREE.CylinderGeometry(.12,.3,1+rand(),6),mat(0xc7869d,.35,.2),x+(rand()-.5),.8,z+(rand()-.5));o.rotation.z=(rand()-.5)*.8;}rock(x,z,.7);}
 for(let i=0;i<4;i++){const z=2+i*1.3;cube(-7,.25,z,1.6,.5,1,0x74637b);cube(-7,.57,z,.8,.12,.65,0xb38687);}
 for(let j=0;j<35;j++){const x=(rand()-.5)*20,z=(rand()-.5)*22;if(Math.abs(x)>2.5)rock(x,z,.1+rand()*.28);}
 // Fine rune segments around the central arena.
 for(let j=0;j<32;j++){const a=j*Math.PI/16;const o=cube(1+Math.cos(a)*3.65,.27,-5+Math.sin(a)*3.65,.09,.035,.24,0xf5aa74);o.rotation.y=-a;}
}
// Broken-up surface detail along travel lanes, with small stones and tufts.
for(let i=0;i<90;i++){const x=(rand()-.5)*21,z=(rand()-.5)*25;if(Math.abs(x)<2.2&&z>1&&z<5)continue;const s=.035+rand()*.07;ball(x,.14,z,s,theme===2?0x96808f:theme===1?0xe8c0c5:0xaab697,scene,.4);}

// Bake thousands of stationary parts into material batches, preserving visible detail.
scene.updateMatrixWorld(true);
const batches=new Map(), oldGeometries=new Set(), oldMaterials=new Set();
scene.traverse(o=>{
 if(!o.isMesh)return;
 const m=o.material;
 const key=[m.type,m.color?.getHex(),m.emissive?.getHex(),m.emissiveIntensity,m.metalness,m.roughness,m.opacity,m.transparent,m.side,m.clearcoat].join('/');
 if(!batches.has(key))batches.set(key,{material:m,geometries:[],transparent:m.transparent});
 const g=o.geometry.clone().applyMatrix4(o.matrixWorld);
 batches.get(key).geometries.push(g.index?g.toNonIndexed():g);
 oldGeometries.add(o.geometry);oldMaterials.add(m);
});
const lights=scene.children.filter(o=>o.isLight);scene.clear();lights.forEach(o=>scene.add(o));
const retained=new Set();
for(const {material,geometries,transparent} of batches.values()){
 const merged=mergeGeometries(geometries,false);
 if(!merged)throw new Error('Static geometry merge failed');
 const o=new THREE.Mesh(merged,material);o.castShadow=!transparent;o.receiveShadow=true;scene.add(o);retained.add(material);
 geometries.forEach(g=>g.dispose());
}
oldGeometries.forEach(g=>g.dispose());oldMaterials.forEach(m=>{if(!retained.has(m))m.dispose()});
return {scene,camera,palette:p};
}
