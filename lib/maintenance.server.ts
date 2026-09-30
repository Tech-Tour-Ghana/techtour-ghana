import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { maintenanceFrom, type MaintenanceSettings } from "@/lib/maintenance";
import type { Database } from "@/types/database";

/** Current maintenance settings. site_settings is public, so no cookies are involved. */
export async function getMaintenance(): Promise<MaintenanceSettings> {
  const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("site_settings")
    .select("maintenance_enabled, maintenance_title, maintenance_message, maintenance_eta, maintenance_contact_email")
    .limit(1)
    .maybeSingle();
  return maintenanceFrom(data);
}
