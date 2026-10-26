import * as THREE from 'three';

// Compensate gently for backlighting without flattening the tree's natural shading.
export function daylightBalance(viewDirection:THREE.Vector3,sunDirection:THREE.Vector3) {
  const length=Math.sqrt(viewDirection.lengthSq()*sunDirection.lengthSq());
  const facing=length>0 ? THREE.MathUtils.clamp(viewDirection.dot(sunDirection)/length,-1,1) : 0;
  const backlight=1-THREE.MathUtils.smoothstep(facing,-.8,.8);
  return {fill:.38+.34*backlight,exposure:.94+.045*backlight};
}
