'use client';

import { useMemo, useState } from 'react';

import { EmptyBlock } from '@/components/admin/ui';
import { STATUS_META, type TicketStatus } from '@/lib/support/meta';
import TicketCard from './TicketCard';
import { PRIORITY_RANK, soft, type AdminTicket } from './types';

export default function Board({
  tickets,
  columns,
  onOpen,
  onMove,
}: {
  tickets: AdminTicket[];
  columns: TicketStatus[];
  onOpen: (t: AdminTicket) => void;
  onMove: (t: AdminTicket, status: TicketStatus) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TicketStatus | null>(null);

  const byStatus = useMemo(() => {
    const map = new Map<TicketStatus, AdminTicket[]>();
    for (const c of columns) map.set(c, []);
    for (const t of tickets) map.get(t.status)?.push(t);
    for (const list of map.values()) {
      list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.last_activity_at.localeCompare(b.last_activity_at));
    }
    return map;
  }, [tickets, columns]);

  return (
    <div className="flex w-full max-w-full snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-3" role="group" aria-label="Helpdesk board">
      {columns.map((col) => {
        const list = byStatus.get(col) ?? [];
        const meta = STATUS_META[col];
        const over = overCol === col && dragId !== null;
        return (
          <section
            key={col}
            aria-label={`${meta.label}, ${list.length} tickets`}
            onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(col); } }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverCol((c) => (c === col ? null : c)); }}
            onDrop={(e) => {
              e.preventDefault();
              const t = tickets.find((x) => x.id === (dragId ?? e.dataTransfer.getData('text/plain')));
              setDragId(null);
              setOverCol(null);
              if (t && t.status !== col) onMove(t, col);
            }}
            className="flex w-full min-w-full flex-shrink-0 snap-start flex-col rounded-[var(--adm-radius-card)] sm:w-72 sm:min-w-0 lg:w-80"
            style={{
              background: over ? soft(meta.color, 12) : 'var(--adm-track)',
              border: `2px ${over ? 'dashed' : 'solid'} ${over ? meta.color : 'transparent'}`,
            }}
          >
            <header className="flex items-center gap-2 px-3 py-2.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
              <h2 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>{meta.label}</h2>
              <span className="rounded-full px-2 text-xs font-bold" style={{ background: 'var(--adm-card)', color: 'var(--adm-text-2)' }}>{list.length}</span>
            </header>
            <div className="max-h-[65vh] min-h-[8rem] space-y-2 overflow-y-auto px-2 pb-2">
              {list.length === 0 ? (
                <EmptyBlock title="No tickets" body={over ? 'Drop here' : undefined} />
              ) : (
                list.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    dragging={dragId === t.id}
                    onOpen={() => onOpen(t)}
                    onMove={(s) => onMove(t, s)}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
