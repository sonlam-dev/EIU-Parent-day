import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type LeafShoot={point:THREE.Vector3;direction:THREE.Vector3;size:number};
export type BotanicalTree=THREE.Group & {shoots:LeafShoot[];branchAnchors:THREE.Vector3[]};
const random=(n:number)=>{const v=Math.sin(n*127.1+233.99)*43758.5453;return v-Math.floor(v);};

/** One shared relief map adds long bark fissures without extra branch geometry. */
function barkRelief() {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#a4a4a4';ctx.fillRect(0,0,512,1024);
  for(let i=0;i<180;i++) {
    const x=random(i+700)*512,y=random(i+900)*1024;
    const length=50+random(i+1100)*340,drift=4+random(i+1300)*12;
    ctx.strokeStyle=i%3 ? '#626262' : '#d4d4d4';ctx.lineWidth=1+random(i+1500)*3;
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+drift,y+length*.3,x-drift,y+length*.7,x+drift*.3,y+length);ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;
  return texture;
}

/** Broad hardwood trunk and layered crown, with every leaf attached to a twig. */
export function createAncientOak() {
  const oak=new THREE.Group() as BotanicalTree;
  oak.name='Sculpted botanical wish tree';oak.shoots=[];oak.branchAnchors=[];
  const parts:THREE.BufferGeometry[]=[];
  const bark=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,bumpMap:barkRelief(),bumpScale:.12});
  const tint=new THREE.Color(),warm=new THREE.Color('#b58b58'),dark=new THREE.Color('#514032');
  function branch(points:THREE.Vector3[],radius:number,tip:number,segments=10,sides=7) {
    const curve=new THREE.CatmullRomCurve3(points);
    const geometry=new THREE.TubeGeometry(curve,segments,1,sides,false);
    const positions=geometry.attributes.position,uv=geometry.attributes.uv,colors=new Float32Array(positions.count*3);
    const length=curve.getLength();
    for(let i=0;i<positions.count;i++) {
      const t=Math.floor(i/(sides+1))/segments,center=curve.getPointAt(t);
      const angle=(i%(sides+1))/sides*Math.PI*2;
      const flare=radius>1 ? 1+.5*Math.exp(-t*18) : 1;
      const ridge=.055*Math.sin(angle*7+t*2)+.025*Math.sin(angle*13-t*3);
      const width=(tip+(radius-tip)*Math.pow(1-t,.82))*(1+ridge)*flare;
      positions.setXYZ(i,center.x+(positions.getX(i)-center.x)*width,center.y+(positions.getY(i)-center.y)*width,center.z+(positions.getZ(i)-center.z)*width);
      uv.setXY(i,angle/(Math.PI*2)*2,t*length/2.5);
      tint.copy(warm).lerp(dark,.28+.18*Math.sin(angle*7+t*2));tint.toArray(colors,i*3);
    }
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();parts.push(geometry);
    return curve;
  }
  const trunk=branch([new THREE.Vector3(0,0,0),new THREE.Vector3(-.3,3,0),new THREE.Vector3(.15,6.5,-.1),new THREE.Vector3(-.2,10,.1),new THREE.Vector3(.1,14,0)],1.38,.065,36,24);
  for(let i=0;i<18;i++) {
    const angle=i*2.39996+.4,height=3.8+i*.46;
    const radius=6.7*Math.sqrt(Math.max(.15,1-((height-5.2)/8)**2));
    const radial=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle));
    const tangent=new THREE.Vector3(-radial.z,0,radial.x);
    const start=trunk.getPoint(height/14);
    const end=radial.clone().multiplyScalar(radius);end.y=height+2.8;
    const main=branch([start,start.clone().addScaledVector(radial,radius*.32).add(new THREE.Vector3(0,.65,0)),end.clone().addScaledVector(radial,-radius*.26).add(new THREE.Vector3(0,-.9,0)),end],.46-i*.016,.035,14,10);
    for(let j=0;j<7;j++) {
      const t=.22+j*.12,origin=main.getPoint(t),side=j%2 ? -1 : 1;
      const reach=1.1+random(i*31+j)*.85;
      const tip=origin.clone().addScaledVector(radial,.65).addScaledVector(tangent,side*reach);tip.y+=1.1+random(i*31+j+8)*.7;
      const twig=branch([origin,origin.clone().lerp(tip,.5).add(new THREE.Vector3(0,-.15,0)),tip],.095*(1-t*.5),.012,7,6);
      oak.branchAnchors.push(origin.clone(),tip.clone());
      for(let k=0;k<10;k++) {
        const at=.16+k*.085,point=twig.getPoint(at),leafSide=k%2 ? 1 : -1;
        const direction=tangent.clone().multiplyScalar(leafSide*.65).addScaledVector(radial,.35);direction.y=.75+random(i*101+j*11+k)*.6;direction.normalize();
        oak.shoots.push({point,direction,size:1.05+random(i*71+j*7+k)*.55});
      }
      for(let fan=-1;fan<=1;fan++) {
        const direction=radial.clone().multiplyScalar(.45).addScaledVector(tangent,fan*.6).add(new THREE.Vector3(0,1,0)).normalize();
        oak.shoots.push({point:tip.clone(),direction,size:1.2+random(i*17+j+fan+90)*.35});
      }
    }
    oak.shoots.push({point:end,direction:radial.clone().add(new THREE.Vector3(0,1.5,0)).normalize(),size:1.3});
  }
  const geometry=mergeGeometries(parts)!;parts.forEach(part=>part.dispose());parts.length=0;
  const wood=new THREE.Mesh(geometry,bark);wood.name='Continuous branching trunk';wood.castShadow=wood.receiveShadow=true;oak.add(wood);
  for(let i=0;i<7;i++) {
    const a=i*Math.PI*2/7,length=2.6+random(i+90)*.9;
    branch([new THREE.Vector3(Math.cos(a)*.75,.9,Math.sin(a)*.75),new THREE.Vector3(Math.cos(a)*1.7,.17,Math.sin(a)*1.7),new THREE.Vector3(Math.cos(a)*length,-.12,Math.sin(a)*length)],.47,.02,12,10);
  }
  const roots=new THREE.Mesh(mergeGeometries(parts)!,bark);roots.name='Sculpted surface roots';roots.castShadow=roots.receiveShadow=true;parts.forEach(part=>part.dispose());
  return {oak,roots,crownLift:0};
}
