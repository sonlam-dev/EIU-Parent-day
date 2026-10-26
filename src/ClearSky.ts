import * as THREE from 'three';

/** A clear blue sky with soft, world-anchored clouds; the sun is drawn by MorningSky. */
export function createClearSky(scene:THREE.Scene,sunDirection:THREE.Vector3) {
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,toneMapped:false,
    uniforms:{
      horizon:{value:new THREE.Color('#d9edf7')},zenith:{value:new THREE.Color('#65b8ee')},
      cloudColor:{value:new THREE.Color('#fffdf7')},sunDirection:{value:sunDirection},
    },
    vertexShader:`
      varying vec3 vSkyDirection;
      void main() {
        vSkyDirection=position;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }
    `,
    fragmentShader:`
      uniform vec3 horizon,zenith,cloudColor,sunDirection;
      varying vec3 vSkyDirection;
      float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p) {
        vec2 cell=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(cell),hash(cell+vec2(1,0)),f.x),
                   mix(hash(cell+vec2(0,1)),hash(cell+vec2(1,1)),f.x),f.y);
      }
      float fbm(vec2 p) {
        float n=0.0,weight=0.5333;
        for(int i=0;i<4;i++) { n+=weight*noise(p); p=p*2.03+vec2(7.1,3.7); weight*=0.5; }
        return n;
      }
      void main() {
        vec3 direction=normalize(vSkyDirection);
        float height=max(direction.y,0.0);
        vec3 color=mix(horizon,zenith,smoothstep(0.0,0.75,height));
        vec2 cloudUv=direction.xz/(height+0.24)*2.4;
        float density=fbm(cloudUv+vec2(8.3,2.1));
        float clouds=smoothstep(0.52,0.72,density)*smoothstep(0.025,0.16,height);
        color=mix(color,cloudColor,clouds*0.9);
        float glow=pow(max(dot(direction,normalize(sunDirection)),0.0),32.0);
        color=mix(color,cloudColor,glow*0.12);
        gl_FragColor=vec4(color,1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),material);
  sky.name='Clear blue sky with soft clouds'; sky.renderOrder=-1; scene.add(sky);
  return sky;
}
