export interface StationConfig { id:string; name:string; position:[number,number,number]; rotation:[number,number,number]; cameraTarget:[number,number,number]; cameraPosition:[number,number,number]; accent:string; objectIds:string[]; }
export const stations: StationConfig[] = [
 {id:"handyman",name:"Handyman & Installations",position:[-6,0,-3.4],rotation:[0,.08,0],cameraTarget:[-5.8,1.5,-2.8],cameraPosition:[-2.8,4.2,7],accent:"#f4b942",objectIds:["tv","drill","door","furniture"]},
 {id:"electrical",name:"Electrical & Lighting",position:[-2.3,0,-4.8],rotation:[0,0,0],cameraTarget:[-2.3,1.7,-4.2],cameraPosition:[1,4.4,5.5],accent:"#ffd34d",objectIds:["panel","outlet","fan","ev-charger"]},
 {id:"plumbing",name:"Plumbing & Water",position:[2.1,0,-4.8],rotation:[0,0,0],cameraTarget:[2.1,1.4,-4],cameraPosition:[5,4.1,5.4],accent:"#42cfe8",objectIds:["faucet","toilet","water-heater","shower"]},
 {id:"hvac",name:"Heating & Air",position:[6.1,0,-3.3],rotation:[0,-.08,0],cameraTarget:[5.8,1.5,-2.8],cameraPosition:[8,4.2,6.2],accent:"#71c8ff",objectIds:["thermostat","furnace","condenser","vent"]},
 {id:"appliances",name:"Appliance Repair",position:[-6,0,1.4],rotation:[0,.12,0],cameraTarget:[-5.7,1.4,1.2],cameraPosition:[-2,4.3,8.2],accent:"#ff7d8d",objectIds:["refrigerator","washer","dryer","range"]},
 {id:"interior",name:"Interior Repairs",position:[-2.4,0,1.5],rotation:[0,.05,0],cameraTarget:[-2.3,1.2,1.4],cameraPosition:[.6,4.2,8.4],accent:"#b9a0ff",objectIds:["cabinet","tile","flooring","drywall"]},
 {id:"exterior",name:"Exterior & Structural Repairs",position:[2.5,0,1.7],rotation:[0,-.08,0],cameraTarget:[2.6,1.3,1.5],cameraPosition:[5.8,4.3,8.4],accent:"#64d69a",objectIds:["shingle","gutter","deck","garage"]},
 {id:"smart",name:"Smart Home & Specialty",position:[6.2,0,1.5],rotation:[0,-.12,0],cameraTarget:[6,1.4,1.2],cameraPosition:[8.8,4.2,7.2],accent:"#a7e45b",objectIds:["doorbell","camera","smart-lock","sensor"]},
];
export const getStation = (id?:string|null) => stations.find((station)=>station.id===id);
