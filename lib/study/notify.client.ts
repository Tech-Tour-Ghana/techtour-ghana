// Ask the server to email the student about what staff just did on their
// application. The in-app notification already exists (database triggers), so this
// is best effort: a failure is ignored and never blocks the staff member.

export type StudyEmailKind = 'stage' | 'document' | 'note' | 'system';

export function emailStudent(applicationId: string, kind: StudyEmailKind): void {
  fetch('/api/admin/study-notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId, kind }),
  }).catch(() => {});
}
