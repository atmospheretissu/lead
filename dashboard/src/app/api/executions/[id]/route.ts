import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const [{ data: exec }, { data: rawLeads }] = await Promise.all([
    supabase.from('atmolead_executions').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('atmolead_leads_raw')
      .select(
        'id, external_ref, raw_data, source_url, inserted, skip_reason, lm_lead_id, client_id, created_at',
      )
      .eq('execution_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (!exec) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ execution: exec, rawLeads: rawLeads ?? [] });
}
