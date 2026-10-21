// Ground-plane contacts: positional separation plus damped impact impulses.
export const anchored = kind => ['streetlamp','building','tower'].includes(kind);
function manifold(a,b){
 if(a.hx&&b.hx){const dx=b.x-a.x,dz=b.z-a.z,ox=a.hx+b.hx-Math.abs(dx),oz=a.hz+b.hz-Math.abs(dz);if(ox<=0||oz<=0)return null;return ox<oz?{nx:Math.sign(dx)||1,nz:0,overlap:ox}:{nx:0,nz:Math.sign(dz)||1,overlap:oz};}
 if(a.hx||b.hx){const box=a.hx?a:b,circle=a.hx?b:a;const dx=circle.x-box.x,dz=circle.z-box.z;const qx=Math.max(-box.hx,Math.min(box.hx,dx)),qz=Math.max(-box.hz,Math.min(box.hz,dz));const vx=dx-qx,vz=dz-qz,d=Math.hypot(vx,vz);let nx,nz,overlap;
  if(d>1e-8){overlap=circle.r-d;if(overlap<=0)return null;nx=vx/d;nz=vz/d;}
  else{const ex=box.hx-Math.abs(dx),ez=box.hz-Math.abs(dz);if(ex<ez){nx=Math.sign(dx)||1;nz=0;overlap=circle.r+ex;}else{nx=0;nz=Math.sign(dz)||1;overlap=circle.r+ez;}}
  const sign=a.hx?1:-1;return {nx:nx*sign,nz:nz*sign,overlap};
 }
 const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),overlap=a.r+b.r-d;if(overlap<=0)return null;return {nx:d>1e-8?dx/d:1,nz:d>1e-8?dz/d:0,overlap};
}
export function resolveContact(a,b,restitution=.18){
 const contact=manifold(a,b);if(!contact)return false;
 const {nx,nz,overlap}=contact;
 const ia=a.invMass??1,ib=b.invMass??1,total=ia+ib;if(!total)return false;
 a.x-=nx*overlap*ia/total;a.z-=nz*overlap*ia/total;
 b.x+=nx*overlap*ib/total;b.z+=nz*overlap*ib/total;
 const speed=((b.vx||0)-(a.vx||0))*nx+((b.vz||0)-(a.vz||0))*nz;
 if(speed<0){const impulse=-(1+restitution)*speed/total;a.vx=(a.vx||0)-impulse*nx*ia;a.vz=(a.vz||0)-impulse*nz*ia;b.vx=(b.vx||0)+impulse*nx*ib;b.vz=(b.vz||0)+impulse*nz*ib;}
 return {nx,nz,speed:Math.max(0,-speed)};
}