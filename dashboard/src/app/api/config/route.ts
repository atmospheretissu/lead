import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  target_url: z.string().url(),
  cron_expression: z.string().min(1),
  enabled: z.boolean(),
  css_selectors: z.record(z.string(), z.string()),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('atmolead_config')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
