/** Bound fragment work on high-DPI displays and projectors. */
export function renderPixelRatio(width:number,height:number,deviceRatio:number) {
  return Math.max(.6,Math.min(deviceRatio,1.25,Math.sqrt(1_600_000 / Math.max(1,width * height))));
}

export function adjustedPixelRatio(current:number,ceiling:number,fps:number) {
  if (fps < 42) return Math.max(.6,current - .12);
  if (fps > 57) return Math.min(ceiling,current + .06);
  return current;
}
