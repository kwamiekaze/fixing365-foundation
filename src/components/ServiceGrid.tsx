import { services } from "@/config/services"; import { ServiceCard } from "./ServiceCard";
export function ServiceGrid({compact=false}:{compact?:boolean}){return <div className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-4">{services.map(service=><ServiceCard key={service.id} service={service} compact={compact}/>)}</div>}
