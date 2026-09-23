import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { neighborhoodZones, problemScenes } from "@/config/problems";

interface Props { selectedProblem:string|null; selectedService:string|null; onSelectProblem:(id:string)=>void; reduced:boolean }

function ProblemMarker({id,position,urgent,active,onSelect,reduced}:{id:string;position:[number,number,number];urgent?:boolean;active:boolean;onSelect:()=>void;reduced:boolean}){
  const ring=useRef<THREE.Mesh>(null);
  useFrame((state)=>{if(!ring.current||reduced)return;const pulse=1+Math.sin(state.clock.elapsedTime*2.4+position[0])*.1;ring.current.scale.setScalar(active?1.22:pulse);ring.current.rotation.z+=.006});
  const color=urgent?"#ff6b4a":"#f4b942";
  return <group position={position} name={`problem-${id}`} onClick={(event)=>{event.stopPropagation();onSelect()}}><mesh ref={ring} rotation-x={Math.PI/2}><torusGeometry args={[.19,.045,8,24]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={active?2.2:1}/></mesh><mesh position={[0,.05,0]} castShadow><sphereGeometry args={[active?.13:.1,12,12]}/><meshStandardMaterial color="#fff8e8" emissive={color} emissiveIntensity={active?2.6:1.4}/></mesh><pointLight color={color} intensity={active?3:1} distance={active?2.5:1.2}/></group>;
}

export function ProblemScenes({selectedProblem,selectedService,onSelectProblem,reduced}:Props){
  const {camera}=useThree();const groups=useRef<Record<string,THREE.Group|null>>({});
  useFrame(()=>{for(const zone of neighborhoodZones){const group=groups.current[zone.id];if(!group)continue;group.visible=camera.position.distanceTo(new THREE.Vector3(...zone.center))<24||Boolean(selectedProblem)||Boolean(selectedService)}});
  return <group name="fixing365-problem-scenes">{neighborhoodZones.map(zone=><group key={zone.id} name={`stream-zone-${zone.id}`} ref={(node)=>{groups.current[zone.id]=node}}>{problemScenes.filter(problem=>problem.zone===zone.id).map(problem=><ProblemMarker key={problem.id} id={problem.id} position={problem.position} urgent={problem.urgent} active={selectedProblem===problem.id} reduced={reduced} onSelect={()=>onSelectProblem(problem.id)}/>)}</group>)}</group>;
}
