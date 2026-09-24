import type { RequestData } from "@/types";
/** FUTURE SUPABASE INTEGRATION: replace this local-only stub with a secure server function. */
export async function submitRequest(request: RequestData): Promise<{ id: string }> {
  await new Promise((resolve) => setTimeout(resolve, 650));
  console.info("Local request prepared", {
    ...request,
    files: request.files.map((file) => file.name),
  });
  return { id: `FX-${Date.now().toString().slice(-6)}` };
}

export interface ContactRequest {
  fullName: string;
  phone: string;
  email: string;
  cityZip: string;
  details: string;
  category: string;
  photos: File[];
}

/** Local stand-in until Supabase is connected: validates shape and returns a reference. */
export async function submitContactRequest(request: ContactRequest): Promise<{ id: string }> {
  await new Promise((resolve) => setTimeout(resolve, 650));
  console.info("Local request prepared", {
    ...request,
    photos: request.photos.map((file) => file.name),
  });
  return { id: `FX-${Date.now().toString().slice(-6)}` };
}
