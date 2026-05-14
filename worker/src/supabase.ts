import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabase: SupabaseClient = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application': 'atmolead-worker' } },
  },
);

export type AtmoleadConfig = {
  id: true;
  target_url: string;
  cron_expression: string;
  enabled: boolean;
  css_selectors: Record<string, string>;
  last_run_at: string | null;
  notes: string | null;
};

export async function getConfig(): Promise<AtmoleadConfig> {
  const { data, error } = await supabase
    .from('atmolead_config')
    .select('*')
    .single();
  if (error || !data) throw new Error(`Failed to load atmolead_config: ${error?.message}`);
  return data as AtmoleadConfig;
}

export async function setConfigLastRun(): Promise<void> {
  await supabase
    .from('atmolead_config')
    .update({ last_run_at: new Date().toISOString() })
    .eq('id', true);
}
