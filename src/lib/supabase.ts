import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a maintenance photo to Supabase Storage
 * Returns the public URL of the uploaded file
 */
export async function uploadMaintenancePhoto(
  file: File,
  maintenanceId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${maintenanceId}-${Date.now()}.${fileExt}`;
  const filePath = `maintenances/${fileName}`;

  const { error } = await supabase.storage
    .from('maintenance-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from('maintenance-photos')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}

/**
 * Delete a maintenance photo from Supabase Storage
 */
export async function deleteMaintenancePhoto(url: string): Promise<void> {
  // Extract file path from URL
  const urlParts = url.split('/maintenance-photos/');
  if (urlParts.length < 2) {
    throw new Error('Invalid photo URL');
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('maintenance-photos')
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
