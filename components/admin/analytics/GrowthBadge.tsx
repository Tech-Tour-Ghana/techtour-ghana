import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faMinus, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import { formatChange } from '@/lib/analytics/format';
import type { Growth } from '@/lib/analytics/types';

const STYLES = {
  increase: { color: 'var(--adm-success)', bg: 'var(--adm-success-soft)', icon: faArrowUp },
  decrease: { color: 'var(--adm-error)', bg: 'var(--adm-error-soft)', icon: faArrowDown },
  flat: { color: 'var(--adm-text-2)', bg: 'var(--adm-track)', icon: faMinus },
  new: { color: 'var(--adm-primary)', bg: 'var(--adm-primary-soft)', icon: faWandMagicSparkles },
} as const;

/** Change against the previous equivalent period. "New" when there was nothing to compare with, never an invented +100%. */
export default function GrowthBadge({ growth }: { growth: Growth }) {
  const s = STYLES[growth.changeState];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: s.color, background: s.bg }}
      title={`Previous period: ${growth.previous}`}
    >
      <FontAwesomeIcon icon={s.icon} className="h-2.5 w-2.5" />
      {formatChange(growth)}
    </span>
  );
}
