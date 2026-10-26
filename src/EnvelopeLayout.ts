export type Point={x:number;y:number;z:number};
export const DROP_SECONDS=2.2,GLOW_SECONDS=3;

const random=(n:number) => { const v=Math.sin(n * 127.1 + 73.7) * 43758.5453; return v - Math.floor(v); };

/** Stable branch positions: adding a wish never rearranges the existing letters. */
export function envelopeSlot(index:number,anchors:Point[],crownLift=0) {
  const angle=Math.atan2(18,29) + (index * .61803398875 % 1) * Math.PI * 2;
  const radius=4.5 + random(index + 19) * 2;
  const target={x:Math.sin(angle) * radius,y:7.4+crownLift,z:Math.cos(angle) * radius};
  let anchor=target,best=Infinity;
  for (const point of anchors) {
    if (point.y < 5.5+crownLift || point.y > 10.8+crownLift) continue;
    const distance=(point.x-target.x) ** 2 + (point.z-target.z) ** 2 + (point.y-target.y) ** 2 * .2;
    if (distance<best) { best=distance; anchor=point; }
  }
  const drop=Math.max(1.1,anchor.y - (2.7+crownLift + random(index + 41) * 3));
  return {anchor,angle,drop,x:anchor.x + (random(index + 62)-.5) * .7,z:anchor.z + (random(index + 89)-.5) * .7};
}

/** All rectangles share a camera-facing plane, so their projected bounds cannot overlap. */
export function envelopeGrid(count:number) {
  const columns=Math.max(10,Math.ceil(Math.sqrt(count * 3.5))),rows=Math.max(1,Math.ceil(count / columns));
  const cellWidth=12.6 / columns,cellHeight=Math.min(.82,3.45 / rows);
  const scale=Math.min(1,cellWidth / 1.05,cellHeight / .78);
  return {columns,rows,scale,cellWidth,cellHeight,slot(index:number) {
    const row=Math.floor(index / columns),column=index % columns;
    const used=Math.min(columns,count - row * columns);
    return {x:(column - (used - 1) / 2) * cellWidth,y:1.45 - row * cellHeight,row,column};
  }};
}

export function dropStart(time:number,index:number,count:number,reducedMotion:boolean) {
  if (reducedMotion) return time - DROP_SECONDS;
  return time + index / Math.max(1,count - 1) * 1.2;
}

export function arrivalGlow(time:number,born:number) {
  const elapsed=time - born - DROP_SECONDS;
  if (elapsed < 0 || elapsed >= GLOW_SECONDS) return 0;
  return Math.min(1,(elapsed + .02) / .18,(GLOW_SECONDS - elapsed) / .35);
}
