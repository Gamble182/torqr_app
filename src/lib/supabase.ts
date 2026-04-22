import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseAdminInstance: SupabaseClient | null = null;

// Server-side only — uses service role key to bypass RLS
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey);
  }

  return supabaseAdminInstance;
}

/**
 * Delete a maintenance photo from Supabase Storage
 */
export async function deleteMaintenancePhoto(url: string): Promise<void> {
  const urlParts = url.split('/maintenance-photos/');
  if (urlParts.length < 2) {
    throw new Error('Invalid photo URL');
  }

  const filePath = urlParts[1];
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage
    .from('maintenance-photos')
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
