export const flowerRandom=(n:number) => { const v=Math.sin(n*127.1+91.7)*43758.5453; return v-Math.floor(v); };
export type FlowerPoint={x:number;z:number};

/** Preserve existing flowers and add small beds only in empty pockets near the tree. */
export function createFlowerLayout() {
  const positions:FlowerPoint[]=[];
  for(let i=0;i<1800;i++) {
    const near=i<1200,inner=near ? 3.5 : 19,outer=near ? 19 : 40;
    const angle=flowerRandom(i+21)*Math.PI*2,r=Math.sqrt(inner*inner+flowerRandom(i+82)*(outer*outer-inner*inner));
    positions.push({x:Math.cos(angle)*r,z:Math.sin(angle)*r});
  }
  const original=positions.slice(),candidates:(FlowerPoint & {clearance:number})[]=[];
  for(let x=-15;x<=15;x+=1.8) for(let z=-15;z<=15;z+=1.8) {
    if(Math.hypot(x,z)<4.5 || Math.hypot(x,z)>15) continue;
    const clearance=Math.min(...original.map(p=>(p.x-x)**2+(p.z-z)**2));
    if(clearance>.8**2) candidates.push({x,z,clearance});
  }
  candidates.sort((a,b)=>b.clearance-a.clearance);
  const patches:FlowerPoint[]=[];
  for(const candidate of candidates) {
    if(patches.every(p=>(p.x-candidate.x)**2+(p.z-candidate.z)**2>3.2**2)) patches.push(candidate);
    if(patches.length===12) break;
  }
  for(let attempt=0;attempt<30000 && positions.length<2520 && patches.length;attempt++) {
    const patch=patches[attempt%patches.length],angle=flowerRandom(attempt+40001)*Math.PI*2,r=Math.sqrt(flowerRandom(attempt+80003))*1.25;
    const point={x:patch.x+Math.cos(angle)*r,z:patch.z+Math.sin(angle)*r};
    if(original.some(p=>(p.x-point.x)**2+(p.z-point.z)**2<.45**2)) continue;
    positions.push(point);
  }
  return {positions,patches};
}
