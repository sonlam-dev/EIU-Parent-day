export const flowerRandom=(n:number) => { const v=Math.sin(n*127.1+91.7)*43758.5453; return v-Math.floor(v); };
export type FlowerPoint={x:number;z:number};

/** Small wildflower beds separated by open meadow and a clear space around the roots. */
export function createFlowerLayout() {
  const patches:FlowerPoint[]=Array.from({length:12},(_,i)=>{
    const angle=i*Math.PI*2/12,radius=8+(i%3)*3;
    return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius};
  });
  const positions:FlowerPoint[]=[];
  for(let i=0;i<360;i++) {
    const angle=flowerRandom(i+21)*Math.PI*2,radius=Math.sqrt(36+flowerRandom(i+82)*(38*38-36));
    positions.push({x:Math.cos(angle)*radius,z:Math.sin(angle)*radius});
  }
  for(let i=0;i<480;i++) {
    const patch=patches[i%patches.length],angle=flowerRandom(i+40001)*Math.PI*2,radius=Math.sqrt(flowerRandom(i+80003))*1.65;
    positions.push({x:patch.x+Math.cos(angle)*radius,z:patch.z+Math.sin(angle)*radius});
  }
  return {positions,patches};
}
