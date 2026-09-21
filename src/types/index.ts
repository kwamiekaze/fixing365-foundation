export type VerificationType = "identity" | "insurance" | "license" | "background";
export interface Provider { id: string; name: string; trades: string[]; verifications: Record<VerificationType, boolean>; }
export interface ServiceCategory { id: string; name: string; shortName: string; description: string; services: string[]; licensedProvider: boolean; accent: string; icon: string; }
export interface RequestData { description: string; category: string; files: File[]; address: { street: string; city: string; state: string; zip: string }; urgency: string; engagement: "quotes" | "appointment"; timeWindows: string[]; }
