import * as THREE from 'three';
export function createFloor(edge,palette){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d');
 const ground=new THREE.Color(palette.ground),path=new THREE.Color(palette.path);
 ctx.fillStyle='#'+ground.clone().multiplyScalar(.75).getHexString();ctx.fillRect(0,0,256,256);
 for(let x=0;x<4;x++)for(let y=0;y<4;y++){
  const color=((x+y)%4===0?path:ground).clone().multiplyScalar(.91+((x*7+y*3)%9)*.012);
  ctx.fillStyle='#'+color.getHexString();ctx.fillRect(x*64+1,y*64+1,62,62);
  ctx.fillStyle='rgba(255,255,235,.15)';ctx.fillRect(x*64+2,y*64+2,60,1);
  ctx.fillStyle='rgba(30,45,40,.12)';ctx.fillRect(x*64+2,y*64+62,60,1);
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 const extent=edge*2+400;texture.repeat.set(extent/4.6,extent/4.6);texture.anisotropy=4;
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(extent,extent),new THREE.MeshStandardMaterial({map:texture,roughness:.85}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.08;floor.receiveShadow=true;return floor;
}