import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

export function isImageFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "size" in value && value.size > 0;
}

// Uploads as the admin (Storage RLS checks is_admin()) and returns the public URL.
export async function uploadImage(supabase: SupabaseClient, file: File, folder: string): Promise<{ url?: string; error?: string }> {
  const ext = TYPES[file.type];
  if (!ext) return { error: "Use a JPG, PNG, WebP or AVIF image." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Images must be 4 MB or smaller." };
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) {
    console.error(error);
    return { error: /bucket/i.test(error.message) ? "The product-images storage bucket is missing. Run the admin migration." : "Upload failed. Please try again." };
  }
  return { url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl };
}

// Removes a file we uploaded earlier. Links to other sites are left alone.
export async function removeUploadedImage(supabase: SupabaseClient, url: string | null | undefined) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([decodeURIComponent(url.slice(i + marker.length))]);
  if (error) console.error(error);
}

// A form can send an uploaded file (image_file) or a link (image_url). The file wins.
export async function resolveImageField(supabase: SupabaseClient, formData: FormData, folder: string) {
  const file = formData.get("image_file");
  if (isImageFile(file)) return uploadImage(supabase, file, folder);
  return { url: undefined };
}
