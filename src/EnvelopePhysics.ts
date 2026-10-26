export type EnvelopeBody={x:number;y:number;z:number;vx:number;vy:number;vz:number;roll:number;spin:number};

/** Spatial hash keeps contact checks local even during a large burst. */
export function resolveEnvelopeContacts(bodies:EnvelopeBody[],diameter:number) {
  const cells=new Map<string,number[]>();
  let contacts=0;
  for (let i=0;i<bodies.length;i++) {
    const a=bodies[i],cx=Math.floor(a.x/diameter),cy=Math.floor(a.y/diameter),cz=Math.floor(a.z/diameter);
    for (let x=cx-1;x<=cx+1;x++) for (let y=cy-1;y<=cy+1;y++) for (let z=cz-1;z<=cz+1;z++) {
      for (const j of cells.get(`${x}:${y}:${z}`) || []) {
        const b=bodies[j]; let dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;
        const distance=Math.hypot(dx,dy,dz);
        if (distance>=diameter) continue;
        if (distance<1e-6) { dx=i%2 ? 1 : -1; dy=0; dz=0; }
        else { dx/=distance; dy/=distance; dz/=distance; }
        const separation=(diameter-distance)*.5;
        a.x+=dx*separation; a.y+=dy*separation; a.z+=dz*separation;
        b.x-=dx*separation; b.y-=dy*separation; b.z-=dz*separation;
        const speed=(a.vx-b.vx)*dx+(a.vy-b.vy)*dy+(a.vz-b.vz)*dz;
        if (speed<0) {
          const impulse=-speed*.68;
          a.vx+=dx*impulse; a.vy+=dy*impulse; a.vz+=dz*impulse;
          b.vx-=dx*impulse; b.vy-=dy*impulse; b.vz-=dz*impulse;
          a.spin+=dx*impulse*2; b.spin-=dx*impulse*2;
        }
        contacts++;
      }
    }
    const key=`${cx}:${cy}:${cz}`,bucket=cells.get(key);
    if (bucket) bucket.push(i); else cells.set(key,[i]);
  }
  return contacts;
}
