// Ground-plane contacts: positional separation plus damped impact impulses.
export const anchored = kind => ['streetlamp','building','tower'].includes(kind);
export function resolveContact(a,b,restitution=.18){
 const dx=b.x-a.x,dz=b.z-a.z,distance=Math.hypot(dx,dz),overlap=a.r+b.r-distance;
 if(overlap<=0)return false;
 const nx=distance>1e-8?dx/distance:1,nz=distance>1e-8?dz/distance:0;
 const ia=a.invMass??1,ib=b.invMass??1,total=ia+ib;if(!total)return false;
 a.x-=nx*overlap*ia/total;a.z-=nz*overlap*ia/total;
 b.x+=nx*overlap*ib/total;b.z+=nz*overlap*ib/total;
 const speed=((b.vx||0)-(a.vx||0))*nx+((b.vz||0)-(a.vz||0))*nz;
 if(speed<0){const impulse=-(1+restitution)*speed/total;a.vx=(a.vx||0)-impulse*nx*ia;a.vz=(a.vz||0)-impulse*nz*ia;b.vx=(b.vx||0)+impulse*nx*ib;b.vz=(b.vz||0)+impulse*nz*ib;}
 return {nx,nz,speed:Math.max(0,-speed)};
}