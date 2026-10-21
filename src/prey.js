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
 const orb=(x,y,z,r,c,sx=1,sy=1,sz=1)=>add(new THREE.SphereGeometry(r,20,12),c,x,y,z,sx,sy,sz);
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
 // Small structural details are baked into one draw call per object.
 const rod=(a,b,r,c)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=add(new THREE.CylinderGeometry(r,r,delta.length(),8),c,...start.clone().add(end).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;};
 switch(kind){
  case 'dust':for(let i=0;i<18;i++){const a=i*2.4;rod([Math.cos(a)*.16,.28,Math.sin(a)*.16],[Math.cos(a)*.53,.22+(i%4)*.09,Math.sin(a)*.53],.009,0xadb39c);orb(Math.cos(a)*.4,.35,Math.sin(a)*.4,.045,0xebe4c8);}break;
  case 'sugar':for(let i=0;i<24;i++){const a=i*2.4;const crystal=add(new THREE.OctahedronGeometry(.045,0),i%2?0xfff3df:0xe8b6cd,Math.cos(a)*.325,.12+(i%6)*.105,Math.sin(a)*.325);crystal.rotation.set(a,a*.3,a*.6);}break;
  case 'bug':for(const x of [-.14,.14]){rod([x,.45,.62],[x*2,.75,.83],.018,0x42495b);orb(x*2,.75,.83,.048,0xe6c78f);orb(x,.44,.697,.029,0x252e3b);}for(let i=0;i<6;i++){const side=i%2?1:-1,z=-.35+Math.floor(i/2)*.3;rod([side*.49,.22,z],[side*.69,.12,z+.1],.03,0x535062);orb(side*.5,.22,z,.045,0x93919a);}break;
  case 'cap':for(let i=0;i<8;i++){const a=i*Math.PI/4;box(Math.cos(a)*.18,.372,Math.sin(a)*.18,.045,.018,.045,0xe9f4dc);}ring(0,.08,0,.59,.025,0x577f97);break;
  case 'cup':for(let i=0;i<3;i++)ring(0,.28+i*.13,0,.482,.012,0x96bdc6);orb(0,.925,0,.24,0xc4a384,1,.015,.8);ring(0,.935,0,.2,.013,0xedcf9e);box(0,.6,.48,.19,.18,.025,0xf0bdad);break;
  case 'fruit':for(let i=0;i<40;i++){const a=i*2.4,y=.15+(i%8)*.085,r=Math.sqrt(Math.max(.01,.57**2-(y-.5)**2));orb(Math.cos(a)*r,y,Math.sin(a)*r,.012,0xe28b5b);}orb(.13,.76,.41,.1,0xffcf9c,1,.3,.15);rod([0,1.02,0],[.31,1.12,0],.012,0x4f8c63);break;
  case 'chair':for(const x of [-.38,.38])rod([x,.75,-.22],[x,1.27,-.22],.014,0xdce0d6);for(const x of [-.2,.2])orb(x,.94,-.225,.04,0x6e8a9f,1,1,.4);for(const x of [-.52,.52])box(x,.9,0,.21,.05,.88,0xe2d5c0);box(0,.77,-.04,.31,.25,.14,0xe8baa6).rotation.z=.15;break;
  case 'pet':for(const x of [-.2,.2]){add(new THREE.ConeGeometry(.09,.18,4),0xe6a9ac,x,1.09,.5);orb(x*.65-.015,.82,.78,.014,0xffffff);orb(x*.47,.65,.737,.11,0xf8dfc5,1,.65,.35);for(let j=0;j<3;j++)rod([x*.7,.65-j*.02,.76],[x*2,.66-j*.055,.8],.005,0x8e8177);}orb(0,.72,.798,.032,0xc27d87);for(let i=0;i<4;i++)box(0,.71,-.35+i*.16,.38,.035,.05,0xc49879);ring(0,.59,.43,.27,.025,0x80aeaa);orb(0,.51,.69,.045,0xe3bf70);break;
  case 'car':for(const x of [-.615,.615]){for(const z of [-.56,.56]){const hub=cylinder(x,.25,z,.13,.16,0xcbd6d5);hub.rotation.z=Math.PI/2;for(let i=0;i<5;i++){const a=i*Math.PI/2.5;rod([x*1.02,.25,z],[x*1.02,.25+Math.cos(a)*.11,z+Math.sin(a)*.11],.012,0x698291);}}box(x,.63,.02,.025,.025,1.4,0x547d8a);box(x,.69,-.18,.03,.035,.16,0xd5ded7);box(x*1.05,.84,.26,.15,.09,.18,0xabcdd0);}box(0,.48,.972,.42,.1,.025,0x435d6d);box(0,.32,.998,.23,.065,.02,0xfff0d0);for(const x of [-.4,.4])box(x,.5,-.94,.18,.12,.025,0xe69e9b);box(0,1.075,-.1,.72,.025,.6,0x6e9ba7);break;
  case 'streetlamp':for(let i=0;i<4;i++){const a=i*Math.PI/2;orb(Math.cos(a)*.19,.23,Math.sin(a)*.19,.03,0x526c74);}ring(0,.36,0,.09,.025,0xc2b998);ring(0,1.6,0,.08,.018,0xc2b998);box(.55,1.77,0,.27,.025,.2,0xffefba);for(const x of [.42,.68])rod([x,1.78,-.12],[x,1.95,-.12],.012,0x5d7c80);break;
  case 'building':case 'tower':{const h=kind==='tower'?2.4:1.5;for(let y=.3;y<h-.1;y+=.3){box(0,y-.12,.46,1.05,.045,.12,0xe4d4bc);for(const x of [-.3,0,.3]){box(x-.095,y,.455,.018,.2,.025,0x698393);box(x+.095,y,.455,.018,.2,.025,0x698393);box(x,y,.457,.014,.16,.025,0xdfd3b9);}if(kind==='building'){box(0,y-.08,.57,.8,.035,.25,0xb4aaa2);for(const x of [-.38,-.19,0,.19,.38])rod([x,y-.06,.69],[x,y+.08,.69],.009,0x7d9293);rod([-.4,y+.08,.69],[.4,y+.08,.69],.012,0x7d9293);}}box(0,.035,.59,.5,.07,.3,0xddd5c2);box(0,.42,.49,.4,.06,.2,0x94b5b5);for(const x of [-.3,.3]){box(x,h+.2,0,.2,.2,.3,0x82969b);for(let i=0;i<3;i++)box(x,h+.31,-.1+i*.1,.16,.02,.015,0xd7d9ce);}break;}
 }
 // Normalize a type once, share its geometry across all instances and pools.
 g.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3());const unit=1/Math.max(size.x/2,size.z/2,size.y*.65);const parts=[];
 g.traverse(o=>{if(o.isMesh){const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.scale(unit,unit,unit);geo.translate(0,-bounds.min.y*unit,0);const color=o.material.color;const flat=geo.index?geo.toNonIndexed():geo;const array=new Float32Array(flat.attributes.position.count*3);for(let i=0;i<array.length;i+=3){array[i]=color.r;array[i+1]=color.g;array[i+2]=color.b;}flat.setAttribute('color',new THREE.BufferAttribute(array,3));parts.push(flat);o.geometry.dispose();}});
 const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());geometry.userData.shared=true;
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.03});
 if(kind==='bug'){
  const position=geometry.attributes.position,weights=new Float32Array(position.count*2);
  for(let i=0;i<position.count;i++){
   const x=position.getX(i)/unit,y=position.getY(i)/unit+bounds.min.y,z=position.getZ(i)/unit;
   weights[i*2]=y<.29&&Math.abs(x)>.28?Math.sign(x)*(1-Math.min(1,y/.32)):0;
   weights[i*2+1]=y>.55&&z>.65?1:0;
  }
  geometry.setAttribute('gaitWeight',new THREE.BufferAttribute(weights,2));
  const clock={value:0};m.userData.clock=clock;
  m.onBeforeCompile=shader=>{shader.uniforms.bugTime=clock;shader.vertexShader='uniform float bugTime;\nattribute vec2 gaitWeight;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float gait=sin(bugTime*13.0+position.z*9.0+step(0.0,gaitWeight.x)*3.14159);
    transformed.z+=gait*abs(gaitWeight.x)*${(.16*unit).toFixed(6)};
    transformed.y+=max(0.0,gait)*abs(gaitWeight.x)*${(.09*unit).toFixed(6)};
    transformed.x+=sin(bugTime*5.0+position.x*7.0)*gaitWeight.y*${(.045*unit).toFixed(6)};`);
  };
 }
 const round=['dust','sugar','bug','cap','fruit','pet','streetlamp'].includes(kind);
 // Ground silhouettes exclude projecting lamps and high balconies.
 const footprint=kind==='streetlamp'?{r:.28*unit,ox:0,oz:0}:round?{r:Math.max(size.x,size.z)*unit*.5,ox:(bounds.min.x+bounds.max.x)*unit*.5,oz:(bounds.min.z+bounds.max.z)*unit*.5}:{hx:size.x*unit*.5,hz:size.z*unit*.5,ox:(bounds.min.x+bounds.max.x)*unit*.5,oz:(bounds.min.z+bounds.max.z)*unit*.5};
 return {geometry,material:m,footprint};
}
export function preyModel(kind){if(!templates.has(kind))templates.set(kind,build(kind));const t=templates.get(kind);const o=new THREE.Mesh(t.geometry,t.material);o.castShadow=true;o.receiveShadow=true;o.userData.kind=kind;o.userData.footprint=t.footprint;return o;}
export function preyKind(stage,index=Math.random()){const list=STAGES[stage].prey;return list[Math.floor(index*list.length)%list.length];}
export function animateInsects(time){const t=templates.get('bug');if(t)t.material.userData.clock.value=time;}