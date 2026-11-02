import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = { running: boolean; phase: 'NS GREEN'|'NS AMBER'|'ALL RED 1'|'EW GREEN'|'EW AMBER'|'ALL RED 2'; speed: number; resetKey: number; onCounts: (v:{generated:number;exited:number;queued:number})=>void };
type Vehicle = { mesh: THREE.Group; approach: number; lane: number; progress: number; type: number; speed: number; stopped: boolean };
const vehicleColors = [0x60a5fa,0xfbbf24,0x34d399,0xf87171];

function makeVehicle(type:number):THREE.Group {
  const group = new THREE.Group();
  const dims = type===1 ? [0.48,0.35,1.0] : type===2 ? [1.05,0.65,2.8] : type===3 ? [0.95,0.62,2.5] : [0.82,0.48,1.7];
  const body = new THREE.Mesh(new THREE.BoxGeometry(dims[0],dims[1],dims[2]), new THREE.MeshStandardMaterial({color:vehicleColors[type],roughness:0.62}));
  body.position.y = dims[1]/2 + 0.12; group.add(body);
  if(type===0 || type===2){const cabin=new THREE.Mesh(new THREE.BoxGeometry(dims[0]*.78,.32,dims[2]*.42),new THREE.MeshStandardMaterial({color:0xcce7ff,metalness:.15,roughness:.25}));cabin.position.set(0,dims[1]+.12,-.05);group.add(cabin);}
  if(type===3){const cargo=new THREE.Mesh(new THREE.BoxGeometry(.9,.5,1.35),new THREE.MeshStandardMaterial({color:0xffcaca}));cargo.position.set(0,.75,-.45);group.add(cargo);}
  const wheelMat=new THREE.MeshStandardMaterial({color:0x111827});
  for(const x of [-dims[0]*.42,dims[0]*.42]) for(const z of [-dims[2]*.32,dims[2]*.32]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.09,10),wheelMat);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.13,z);group.add(wheel);}
  return group;
}

export default function Intersection3D({running,phase,speed,resetKey,onCounts}:Props){
  const host=useRef<HTMLDivElement>(null); const state=useRef({running,phase,speed});
  useEffect(()=>{state.current={running,phase,speed};},[running,phase,speed]);
  useEffect(()=>{
    if(!host.current)return;
    const el=host.current; const scene=new THREE.Scene(); scene.background=new THREE.Color('#142238'); scene.fog=new THREE.Fog('#142238',42,90);
    const camera=new THREE.PerspectiveCamera(42,el.clientWidth/el.clientHeight,.1,150);camera.position.set(17,21,25);camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xc8e2ff,0x243044,2));const sun=new THREE.DirectionalLight(0xffffff,2.3);sun.position.set(-10,20,10);sun.castShadow=true;scene.add(sun);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshStandardMaterial({color:0x233b35}));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;scene.add(ground);
    const roadMat=new THREE.MeshStandardMaterial({color:0x3b4654,roughness:1});const roadNS=new THREE.Mesh(new THREE.BoxGeometry(12,.12,75),roadMat);roadNS.position.y=.01;scene.add(roadNS);const roadEW=new THREE.Mesh(new THREE.BoxGeometry(75,.12,12),roadMat);roadEW.position.y=.02;scene.add(roadEW);
    const lineMat=new THREE.MeshBasicMaterial({color:0xe8edf2});
    for(let z=-34;z<=34;z+=4){const dash=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,1.7),lineMat);dash.position.set(0,.09,z);scene.add(dash);}for(let x=-34;x<=34;x+=4){const dash=new THREE.Mesh(new THREE.BoxGeometry(1.7,.025,.12),lineMat);dash.position.set(x,.1,0);scene.add(dash);}
    // Stop bars
    for(const [x,z,rot] of [[0,-7,0],[0,7,0],[-7,0,Math.PI/2],[7,0,Math.PI/2]] as number[][]){const bar=new THREE.Mesh(new THREE.BoxGeometry(11,.035,.22),new THREE.MeshBasicMaterial({color:0xffffff}));bar.position.set(x,.12,z);bar.rotation.y=rot;scene.add(bar);}
    // Signal heads at each corner, with independently lit lenses.
    const lamps:THREE.Mesh[][]=[];
    for(const [x,z] of [[-7,-7],[7,7],[7,-7],[-7,7]]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,3.2,8),new THREE.MeshStandardMaterial({color:0x8b98a8}));pole.position.set(x,1.6,z);scene.add(pole);const head=new THREE.Group();head.position.set(x,3.25,z);scene.add(head);const set:THREE.Mesh[]=[];for(let i=0;i<3;i++){const lamp=new THREE.Mesh(new THREE.SphereGeometry(.16,12,12),new THREE.MeshStandardMaterial({color:0x222831,emissive:0x000000}));lamp.position.y=-i*.42;head.add(lamp);set.push(lamp);}lamps.push(set);}
    const vehicles:Vehicle[]=[];let generated=0,exited=0,elapsed=0,spawnAccumulator=0;let alive=true;let last=performance.now();
    const paths=[{start:[-4.2,0,34],end:[-4.2,0,-34],angle:0},{start:[4.2,0,-34],end:[4.2,0,34],angle:Math.PI},{start:[-34,0,4.2],end:[34,0,4.2],angle:Math.PI/2},{start:[34,0,-4.2],end:[-34,0,-4.2],angle:-Math.PI/2}];
    function spawn(){const approach=Math.floor(Math.random()*4),type=Math.random()<.55?0:Math.random()<.7?1:Math.random()<.85?2:3;const path=paths[approach];const mesh=makeVehicle(type);mesh.position.set(path.start[0],0,path.start[2]);mesh.rotation.y=path.angle;scene.add(mesh);vehicles.push({mesh,approach,lane:0,progress:0,type,speed:0,stopped:false});generated++;}
    function animate(now:number){if(!alive)return;const dt=Math.min((now-last)/1000,.05);last=now;const s=state.current;
      if(s.running){elapsed+=dt*s.speed;spawnAccumulator+=dt*s.speed*1.7;while(spawnAccumulator>1){spawn();spawnAccumulator-=1;}}
      const greenNS=s.phase==='NS GREEN',greenEW=s.phase==='EW GREEN';
      for(const v of vehicles){const path=paths[v.approach];const axis=v.approach<2?'z':'x';const start=path.start[axis==='z'?2:0],end=path.end[axis==='z'?2:0];const direction=Math.sign(end-start);const distance=Math.abs(end-start);const pos=Math.abs((v.mesh.position as any)[axis]-start);v.progress=pos/distance;
        const isNS=v.approach<2;const green=isNS?greenNS:greenEW;const stopProgress=.40;const shouldStop=!green&&v.progress<stopProgress;const junctionOccupied=vehicles.some(other=>other!==v&&other.progress>.43&&other.progress<.68);
        let leaderGap=99;for(const other of vehicles){if(other===v||other.approach!==v.approach)continue;const gap=(Math.abs((other.mesh.position as any)[axis]-(v.mesh.position as any)[axis]));if(Math.sign((other.mesh.position as any)[axis]-(v.mesh.position as any)[axis])===direction&&gap<leaderGap)leaderGap=gap;}
        const blocked=leaderGap<2.4;const target=(shouldStop||blocked||occupied&&v.progress<.48)?0:8;v.speed+=Math.sign(target-v.speed)*Math.min(Math.abs(target-v.speed),dt*(target<v.speed?15:5));
        if(s.running){const next=(v.mesh.position as any)[axis]+direction*v.speed*dt*s.speed;if(shouldStop&&((direction>0&&next>0)||(direction<0&&next<0))){(v.mesh.position as any)[axis]=direction>0?-.3:.3;v.speed=0;}else (v.mesh.position as any)[axis]=next;}
      }
      for(let i=vehicles.length-1;i>=0;i--){if(vehicles[i].progress>=.98){scene.remove(vehicles[i].mesh);vehicles.splice(i,1);exited++;}}
      // Set NS/EW signal states. All-red is intentionally dark/amber-safe.
      const ns=s.phase.startsWith('NS'),ew=s.phase.startsWith('EW');lamps.forEach((set,index)=>{const groupNS=index===0||index===1;const active=groupNS?ns:ew;const amber=s.phase.includes('AMBER');set.forEach((lamp,i)=>{const on=active&&(amber?i===1:i===2);const color=on?(amber?0xffbf47:0x28e58b):0x242a33;(lamp.material as THREE.MeshStandardMaterial).color.setHex(color);(lamp.material as THREE.MeshStandardMaterial).emissive.setHex(on?color:0x000000);});});
      onCounts({generated,exited,queued:vehicles.filter(v=>v.speed<.4&&v.progress<.42).length});renderer.render(scene,camera);requestAnimationFrame(animate);}
    const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight);};const observer=new ResizeObserver(resize);observer.observe(el);requestAnimationFrame(animate);
    return()=>{alive=false;observer.disconnect();renderer.dispose();el.removeChild(renderer.domElement);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});};
  },[resetKey,onCounts]);
  return <div className="scene" ref={host} aria-label="Interactive 3D intersection scene"/>;
}
