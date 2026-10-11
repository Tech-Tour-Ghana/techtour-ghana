// Study abroad application. The database function submit_study_application()
// validates, decides user_id and status, and blocks duplicates, using the
// visitor's own session. Emails go out afterwards and never fail the request.

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { studyApplicationAck, studyApplicationNotify } from '@/lib/email/templates';
import { sendEmail } from '@/lib/email/send.server';
import { getServerEnv } from '@/lib/env.server';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  destination_id: z.string().uuid().nullable().optional(),
  institution_id: z.string().uuid().nullable().optional(),
  program_id: z.string().uuid().nullable().optional(),
  intake: z.string().max(80).default(''),
  scholarship_id: z.string().uuid().nullable().optional(),
  full_name: z.string().max(120),
  email: z.string().max(200),
  phone: z.string().max(40),
  nationality: z.string().max(80).default(''),
  education_level: z.string().max(80).default(''),
  intended_level: z.string().max(40).default(''),
  field_of_study: z.string().max(120).default(''),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  message: z.string().max(2000).default(''),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please check the form and try again.' }, { status: 400 });
  const a = parsed.data;

  const supabase = await createClient();
  // A programme application goes through start_study_application; the general country enquiry keeps its own function.
  const { data: newId, error } = a.program_id || a.institution_id
    ? await supabase.rpc('start_study_application', {
        p_destination_id: a.destination_id ?? null, p_institution_id: a.institution_id ?? null, p_program_id: a.program_id ?? null, p_intake: a.intake,
        p_full_name: a.full_name, p_email: a.email, p_phone: a.phone, p_nationality: a.nationality, p_education_level: a.education_level, p_message: a.message,
      })
    : await supabase.rpc('submit_study_application', {
        p_destination_id: a.destination_id ?? '', p_scholarship_id: a.scholarship_id ?? null, p_full_name: a.full_name, p_email: a.email, p_phone: a.phone,
        p_nationality: a.nationality, p_education_level: a.education_level, p_intended_level: a.intended_level, p_field_of_study: a.field_of_study,
        p_start_date: a.start_date ?? null, p_message: a.message,
      });
  if (error) {
    // The function's own messages are written for the applicant.
    const known = error.code === 'P0001';
    return NextResponse.json({ error: known ? error.message : 'We could not send your application. Please try again.' }, { status: known ? 400 : 500 });
  }

  const { data: saved } = await supabase.from('study_applications').select('location, university, program_name').eq('id', String(newId)).maybeSingle();
  const country = [saved?.university, saved?.location].filter(Boolean).join(', ') || 'your chosen destination';
  const notifyTo = getServerEnv().CONTACT_NOTIFY_EMAIL;
  await Promise.all([
    sendEmail({ to: a.email, template: 'study_application_ack', ...studyApplicationAck({ name: a.full_name, country }) }),
    notifyTo
      ? sendEmail({ to: notifyTo, template: 'study_application_notify', replyTo: a.email, ...studyApplicationNotify({ name: a.full_name, email: a.email, phone: a.phone, country, field: a.field_of_study || saved?.program_name || '', level: a.intended_level, message: a.message }) })
      : undefined,
  ]);

  return NextResponse.json({ ok: true, id: String(newId) });
}
