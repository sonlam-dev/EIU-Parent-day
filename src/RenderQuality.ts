/** Bound fragment work on high-DPI displays and projectors. */
export function renderPixelRatio(width:number,height:number,deviceRatio:number) {
  return Math.max(.6,Math.min(deviceRatio,1.25,Math.sqrt(1_600_000 / Math.max(1,width * height))));
}

export function adjustedPixelRatio(current:number,ceiling:number,fps:number) {
  if (fps < 42) return Math.max(.6,current - .12);
  if (fps > 57) return Math.min(ceiling,current + .06);
  return current;
}

/** Recover quality slowly so marginal GPUs do not continually resize the canvas. */
export class RenderQuality {
  private recoveryTime=0;
  private cooldown=0;

  reset() { this.recoveryTime=0; this.cooldown=0; }

  sample(current:number,ceiling:number,fps:number,seconds:number) {
    this.cooldown=Math.max(0,this.cooldown-seconds);
    this.recoveryTime=fps>57 ? this.recoveryTime+seconds : 0;
    if (this.cooldown>0 || (fps>=42 && this.recoveryTime<12)) return current;
    const next=adjustedPixelRatio(current,ceiling,fps);
    if (Math.abs(next-current)>.01) {
      this.cooldown=6; this.recoveryTime=0;
    }
    return next;
  }
}
