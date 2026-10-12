// Stages of a study abroad application, shared by the member dashboard, the public
// pages and the admin board. The order is the order a student moves through.
// Colours are brand variables, never hex values.

export const STUDY_STAGES = ['enquiry', 'documents', 'submitted', 'offer', 'accepted', 'visa', 'enrolled'] as const;
export const STUDY_ENDED = ['rejected', 'withdrawn'] as const;
export const STUDY_STATUSES = [...STUDY_STAGES, ...STUDY_ENDED] as const;
export type StudyStage = (typeof STUDY_STAGES)[number];
export type StudyStatus = (typeof STUDY_STATUSES)[number];

export const STUDY_META: Record<StudyStatus, { label: string; short: string; hint: string; color: string }> = {
  enquiry: { label: 'Enquiry received', short: 'Enquiry', hint: 'We have your details. A counsellor will review your application and get in touch.', color: 'var(--brand-info)' },
  documents: { label: 'Collecting documents', short: 'Documents', hint: 'Upload the documents on your checklist so we can prepare your application.', color: 'var(--brand-warning)' },
  submitted: { label: 'Application submitted', short: 'Submitted', hint: 'We have sent your application to the university. Decisions can take a few weeks.', color: 'var(--brand-purple)' },
  offer: { label: 'Offer received', short: 'Offer', hint: 'The university has made an offer. Your counsellor will walk you through it.', color: 'var(--brand-success)' },
  accepted: { label: 'Offer accepted', short: 'Accepted', hint: 'You have accepted the offer and we are arranging the required payments.', color: 'var(--brand-success)' },
  visa: { label: 'Visa stage', short: 'Visa', hint: 'We are helping you prepare and submit your study visa application.', color: 'var(--brand-teal)' },
  enrolled: { label: 'Ready to enrol', short: 'Ready', hint: 'You are set to start. Your counsellor will help you prepare to travel.', color: 'var(--brand-success)' },
  rejected: { label: 'Not successful', short: 'Not successful', hint: 'This application was not successful. Talk to your counsellor about other options.', color: 'var(--brand-error)' },
  withdrawn: { label: 'Withdrawn', short: 'Withdrawn', hint: 'This application was withdrawn.', color: 'var(--brand-muted)' },
};

export const isEnded = (s: string) => s === 'rejected' || s === 'withdrawn';
export const stageIndex = (s: string) => STUDY_STAGES.indexOf(s as StudyStage);
export const asStudyStatus = (s: string): StudyStatus => ((STUDY_STATUSES as readonly string[]).includes(s) ? (s as StudyStatus) : 'enquiry');

export const DOC_STATUS_META = {
  requested: { label: 'Needed', color: 'var(--brand-muted)' },
  uploaded: { label: 'Uploaded, under review', color: 'var(--brand-info)' },
  approved: { label: 'Approved', color: 'var(--brand-success)' },
  rejected: { label: 'Needs attention', color: 'var(--brand-error)' },
} as const;
export type DocStatus = keyof typeof DOC_STATUS_META;

export const PROGRAM_LEVELS = [
  { value: 'foundation', label: 'Foundation' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
] as const;
export const levelLabel = (v: string) => PROGRAM_LEVELS.find((l) => l.value === v)?.label ?? v;

export interface StudyDocument {
  id: string;
  application_id: string;
  label: string;
  description: string;
  required: boolean;
  status: DocStatus;
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  staff_note: string;
  sort_order: number;
  uploaded_at: string | null;
}

export interface StudyEvent {
  id: string;
  kind: 'stage' | 'document' | 'note' | 'system' | 'message';
  title: string;
  body: string;
  is_public: boolean;
  created_at: string;
}

export const STUDY_BUCKET = 'study-documents';
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
export const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx';

// ---------------------------------------------------------------------------
// Payments ledger (migration 0049). Students pay TechTour; staff pay the
// university offline and record it. The ledger moves no money, it is the record.
// ---------------------------------------------------------------------------
export const LEDGER_KINDS = {
  charge: { label: 'Fee', hint: 'A fee the student owes', sign: 1 },
  payment: { label: 'Payment received', hint: 'Money the student paid TechTour', sign: -1 },
  refund: { label: 'Refund', hint: 'Money paid back to the student', sign: 1 },
  waiver: { label: 'Waiver', hint: 'A fee TechTour removes', sign: -1 },
  remittance: { label: 'Paid to university', hint: 'Money TechTour paid the university for the student', sign: 0 },
} as const;
export type LedgerKind = keyof typeof LEDGER_KINDS;

export const LEDGER_CATEGORIES = [
  { value: 'application_fee', label: 'Application fee' },
  { value: 'tuition', label: 'Tuition' },
  { value: 'deposit', label: 'Tuition deposit' },
  { value: 'service_fee', label: 'TechTour service fee' },
  { value: 'visa_fee', label: 'Visa fee' },
  { value: 'insurance', label: 'Health insurance' },
  { value: 'other', label: 'Other' },
] as const;
export const LEDGER_CURRENCIES = ['GHS', 'USD', 'CAD', 'GBP', 'EUR'] as const;
export const PAYMENT_METHODS = ['Mobile money', 'Bank transfer', 'Cash', 'Card', 'Other'] as const;

export interface LedgerEntry {
  id: string;
  application_id: string;
  kind: LedgerKind;
  category: string;
  description: string;
  amount: number;
  currency: string;
  method: string;
  reference: string;
  occurred_on: string;
  created_at: string;
  voided_at: string | null;
}

export interface LedgerBalance { currency: string; charged: number; waived: number; paid: number; refunded: number; remitted: number; balance: number }

export const formatMoney = (amount: number, currency: string) =>
  `${currency} ${Number(amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Totals per currency from live (not voided) entries. Same rules as the study_application_balances view. */
export function ledgerBalances(entries: LedgerEntry[]): LedgerBalance[] {
  const by = new Map<string, LedgerBalance>();
  for (const e of entries) {
    if (e.voided_at) continue;
    const b = by.get(e.currency) ?? { currency: e.currency, charged: 0, waived: 0, paid: 0, refunded: 0, remitted: 0, balance: 0 };
    const n = Number(e.amount);
    if (e.kind === 'charge') b.charged += n;
    else if (e.kind === 'waiver') b.waived += n;
    else if (e.kind === 'payment') b.paid += n;
    else if (e.kind === 'refund') b.refunded += n;
    else b.remitted += n;
    by.set(e.currency, b);
  }
  return [...by.values()].map((b) => ({ ...b, balance: Math.round((b.charged - b.waived - b.paid + b.refunded) * 100) / 100 }));
}
