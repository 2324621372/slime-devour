import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const sphere=new THREE.SphereGeometry(1,20,14),eyeGeo=new THREE.SphereGeometry(1,10,8);
sphere.userData.shared=true;eyeGeo.userData.shared=true;
const dark=new THREE.MeshStandardMaterial({color:0x153b47,roughness:.25});
const white=new THREE.MeshBasicMaterial({color:0xffffff});
const blush=new THREE.MeshStandardMaterial({color:0xf4a5b5,roughness:.5});
const mats=new Map();
export function material(color){if(!mats.has(color))mats.set(color,new THREE.MeshPhysicalMaterial({color,roughness:.19,clearcoat:1,clearcoatRoughness:.1}));return mats.get(color);}
function part(g,geo,m,x,y,z,sx,sy=sx,sz=sx){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;g.add(o);return o;}
export function jelly(color,boss=false){
 const g=new THREE.Group(),body=part(g,sphere,material(color),0,.66,0,1,.78,.91);g.userData.body=body;
 const face=new THREE.Group();g.add(face);g.userData.face=face;
 for(const x of [-.32,.32]){part(face,eyeGeo,dark,x,.77,.79,.087,.12,.07);part(face,eyeGeo,white,x-.022,.81,.85,.026);part(face,eyeGeo,blush,x*1.5,.57,.75,.11,.045,.025);}
 const mouth=part(face,new THREE.TorusGeometry(.105,.018,5,12,Math.PI),dark,0,.57,.9,1);mouth.rotation.z=Math.PI;
 for(let i=0;i<3;i++)part(g,sphere,material(color),-.5+i*.5,.14,.38,.34,.14,.32);
 part(g,sphere,white,-.28,1.23,.2,.16,.035,.12);
 if(boss){for(let i=0;i<8;i++){const a=i*Math.PI/4;const spike=part(g,new THREE.ConeGeometry(.14,.5,5),material(0x563d51),Math.cos(a)*.85,1.03,Math.sin(a)*.8,1);spike.rotation.z=-Math.cos(a)*.4;}const crown=part(g,new THREE.TorusGeometry(.4,.065,6,20),material(0xffd681),0,1.53,0,1);crown.rotation.x=Math.PI/2;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(g,new THREE.ConeGeometry(.09,.3,4),material(0xffd681),Math.cos(a)*.4,1.7,Math.sin(a)*.4,1);}}
 if(boss){
  const gold=material(0xffd681),gem=material(0xb8efe4),armor=material(0x725376);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(g,new THREE.OctahedronGeometry(.065,0),gem,Math.cos(a)*.4,1.85,Math.sin(a)*.4,1);}
  for(const x of [-.83,.83]){part(g,new THREE.SphereGeometry(1,12,8),armor,x,.68,0,.18,.33,.45);for(let i=0;i<3;i++)part(g,new THREE.OctahedronGeometry(.07,0),gold,x,.65,-.25+i*.25,1);}
  const band=part(g,new THREE.TorusGeometry(.87,.035,6,36),gold,0,.38,0,1);band.rotation.x=Math.PI/2;
  part(g,new THREE.OctahedronGeometry(.16,0),gem,0,.91,-.85,1,1.5,.5);
 }
 g.updateMatrixWorld(true);
 const batches=new Map();g.traverse(o=>{if(!o.isMesh||o===body)return;if(!batches.has(o.material))batches.set(o.material,[]);const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);batches.get(o.material).push(geo);});
 g.clear();g.add(body);
 for(const [m,geometries] of batches){const merged=mergeGeometries(geometries.map(geo=>geo.index?geo.toNonIndexed():geo),false);const o=new THREE.Mesh(merged,m);o.castShadow=true;g.add(o);geometries.forEach(geo=>geo.dispose());}
 return g;
}
export function spikeBall(){const g=new THREE.Group();part(g,sphere,material(0xb45c7d),0,.65,0,.65);for(let i=0;i<10;i++){const a=i*Math.PI/5;const o=part(g,new THREE.ConeGeometry(.15,.5,5),material(0xffc5b6),Math.cos(a)*.7,.65,Math.sin(a)*.7,1);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(Math.cos(a),0,Math.sin(a)));}return g;}
export function bee(){const g=new THREE.Group();part(g,sphere,material(0xffcf68),0,.9,0,.4,.32,.55);for(const x of [-.4,.4])part(g,sphere,material(0xd9f3ff),x,1.15,0,.36,.045,.22);for(const z of [-.2,.1])part(g,sphere,dark,0,.91,z,.41,.33,.1);return g;}