import type { RequestData } from "@/types";
/** FUTURE SUPABASE INTEGRATION: replace this local-only stub with a secure server function. */
export async function submitRequest(request: RequestData): Promise<{id:string}> { await new Promise((resolve)=>setTimeout(resolve,650)); console.info("Local request prepared", { ...request, files: request.files.map((file)=>file.name) }); return { id:`FX-${Date.now().toString().slice(-6)}` }; }
