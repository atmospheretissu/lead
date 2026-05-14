import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = getSupabaseAdminClient();

  const { data: job, error } = await supabase
    .from('atmolead_jobs')
    .insert({ status: 'pending', triggered_by: 'manual' })
    .select('id')
    .single();

  if (error || !job) {
    return NextResponse.json({ error: error?.message ?? 'failed' }, { status: 500 });
  }

  const workerUrl = process.env.ATMOLEAD_WORKER_URL;
  const triggerSecret = process.env.ATMOLEAD_WORKER_TRIGGER_SECRET;
  if (workerUrl) {
    fetch(`${workerUrl}/trigger`, {
      method: 'POST',
      headers: triggerSecret ? { authorization: `Bearer ${triggerSecret}` } : {},
    }).catch(() => {
      // Worker poller will pick the job up regardless; the nudge is best-effort.
    });
  }

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
