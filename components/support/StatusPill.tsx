import { STATUS_META, type TicketStatus } from '@/lib/support/meta';

export default function StatusPill({ status }: { status: TicketStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 14%, transparent)` }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
