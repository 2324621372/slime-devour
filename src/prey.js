import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {material} from './models.js';
import {STAGES} from './rules.js';

export const PREY_NAMES={dust:'灰尘团',sugar:'糖粒',bug:'小甲虫',cap:'瓶盖',cup:'杯子',fruit:'水果',chair:'扶手椅',pet:'小猫',car:'汽车',streetlamp:'路灯',building:'公寓楼',tower:'高楼'};
const templates=new Map();
function build(kind){
 const g=new THREE.Group();
 function add(geo,c,x,y,z,sx=1,sy=sx,sz=sx){const m=new THREE.Mesh(geo,material(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;}
 const box=(x,y,z,w,h,d,c)=>add(new THREE.BoxGeometry(w,h,d),c,x,y,z);
 const orb=(x,y,z,r,c,sx=1,sy=1,sz=1)=>add(new THREE.SphereGeometry(r,12,8),c,x,y,z,sx,sy,sz);
 const cylinder=(x,y,z,r,h,c)=>add(new THREE.CylinderGeometry(r,r,h,16),c,x,y,z);
 const ring=(x,y,z,r,t,c)=>{const o=add(new THREE.TorusGeometry(r,t,6,20),c,x,y,z);o.rotation.x=Math.PI/2;return o;};
 switch(kind){
  case 'dust':for(let i=0;i<7;i++){const a=i*2.4;orb(Math.cos(a)*.32,.27+(i%3)*.08,Math.sin(a)*.3,.29,[0xb7b8a7,0xc5c9b8,0xd7d5ba][i%3],1,.8,1);}break;
  case 'sugar':box(0,.37,0,.65,.65,.65,0xffd6e5);for(let i=0;i<12;i++){const a=i*2.4;orb(Math.cos(a)*.28,.72,Math.sin(a)*.28,.035,0xfff2db);}break;
  case 'bug':orb(0,.4,0,.5,0xc77980,1,.7,1.2);orb(0,.34,.48,.25,0x454958);box(0,.65,-.03,.035,.025,.65,0x343c49);for(let i=0;i<6;i++){const side=i%2?1:-1;const leg=box(side*.48,.2,-.35+Math.floor(i/2)*.3,.4,.06,.07,0x4d4855);leg.rotation.y=side*.4;orb(side*.22,.64,-.25+(i%3)*.22,.055,0x3f3946);}for(const x of [-.13,.13])orb(x,.4,.68,.055,0xfff6df);break;
  case 'cap':cylinder(0,.18,0,.65,.32,0x77b8ce);ring(0,.36,0,.55,.045,0xd0eff0);for(let i=0;i<20;i++){const a=i*Math.PI/10;const o=box(Math.cos(a)*.64,.2,Math.sin(a)*.64,.055,.25,.09,0x9bd1de);o.rotation.y=-a;}cylinder(0,.35,0,.35,.025,0xffe1a4);break;
  case 'cup':cylinder(0,.48,0,.48,.85,0xd7e9e7);cylinder(0,.92,0,.4,.025,0x937263);ring(0,.95,0,.45,.055,0xffefd7);ring(.56,.5,0,.28,.075,0xd7e9e7).rotation.x=0;ring(0,.08,0,.6,.08,0xe9dfc8);break;
  case 'fruit':orb(0,.5,0,.57,0xf2a579,1,.9,1);cylinder(0,1.05,0,.045,.25,0x897b55);const leaf=orb(.2,1.1,0,.23,0x82b783,1,.18,.6);leaf.rotation.z=.35;break;
  case 'chair':box(0,.45,0,1,.35,.85,0x9db6c7);box(0,.9,-.37,1,.85,.24,0x91aabf);for(const x of [-.52,.52])box(x,.63,0,.2,.5,.9,0xb3c5cf);for(const x of [-.35,.35])for(const z of [-.28,.28])cylinder(x,.12,z,.065,.25,0x9b836e);box(0,.66,.02,.8,.12,.65,0xd9d5bf);break;
  case 'pet':orb(0,.4,0,.52,0xe3c19c,1,.65,1.3);orb(0,.76,.45,.35,0xe8ccaa);for(const x of [-.2,.2]){add(new THREE.ConeGeometry(.15,.32,4),0xd1a483,x,1.08,.46);orb(x*.65,.8,.74,.045,0x465362);for(const z of [-.3,.3])orb(x,.13,z,.13,0xf0d7b6);}const tail=ring(.43,.6,-.38,.26,.085,0xe3c19c);tail.rotation.z=.6;break;
  case 'car':box(0,.45,0,1.15,.45,1.85,0x87bdc6);box(0,.84,-.12,.96,.45,.95,0xa6d2d6);box(0,.9,.37,.8,.27,.035,0x4d7386);box(0,.9,-.61,.8,.27,.035,0x4d7386);for(const x of [-.6,.6])for(const z of [-.56,.56]){const wheel=cylinder(x,.25,z,.22,.15,0x46505b);wheel.rotation.z=Math.PI/2;}for(const x of [-.38,.38])box(x,.5,.94,.2,.12,.035,0xffe9ad);box(0,.23,.97,1,.09,.05,0xe0d3c1);break;
  case 'streetlamp':cylinder(0,.12,0,.28,.2,0x8a9e9a);cylinder(0,1.06,0,.065,1.8,0x7a9595);box(.28,1.95,0,.65,.08,.12,0x789493);box(.55,1.86,0,.36,.14,.28,0xffd991);break;
  case 'building':case 'tower':{
   const h=kind==='tower'?2.4:1.5;box(0,h/2,0,1,h,.85,kind==='tower'?0x7899ab:0xc5b3ad);box(0,h+.06,0,1.12,.12,.97,0xe0d1b9);
   for(let y=.3;y<h-.1;y+=.3)for(const x of [-.3,0,.3]){box(x,y,.435,.14,.16,.025,0xffdfa1);box(.515,y,x,.025,.16,.14,0xaccbd1);}
   box(0,.18,.45,.22,.35,.04,0x526f80);if(kind==='tower'){cylinder(0,h+.35,0,.035,.6,0xcdd6c9);box(0,h+.15,0,.5,.2,.45,0x8aa5ad);}break;
  }
 }
 // Normalize a type once, share its geometry across all instances and pools.
 g.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3());const unit=1/Math.max(size.x/2,size.z/2,size.y*.65);const parts=[];
 g.traverse(o=>{if(o.isMesh){const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.scale(unit,unit,unit);geo.translate(0,-bounds.min.y*unit,0);const color=o.material.color;const flat=geo.index?geo.toNonIndexed():geo;const array=new Float32Array(flat.attributes.position.count*3);for(let i=0;i<array.length;i+=3){array[i]=color.r;array[i+1]=color.g;array[i+2]=color.b;}flat.setAttribute('color',new THREE.BufferAttribute(array,3));parts.push(flat);o.geometry.dispose();}});
 const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());geometry.userData.shared=true;
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.03});
 return {geometry,material:m};
}
export function preyModel(kind){if(!templates.has(kind))templates.set(kind,build(kind));const t=templates.get(kind);const o=new THREE.Mesh(t.geometry,t.material);o.castShadow=true;o.receiveShadow=true;o.userData.kind=kind;return o;}
export function preyKind(stage,index=Math.random()){const list=STAGES[stage].prey;return list[Math.floor(index*list.length)%list.length];}