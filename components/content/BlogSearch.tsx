import Button from '@/components/ui/Button';

/** Plain GET form, works without JavaScript. */
export default function BlogSearch({ action, q }: { action: string; q: string }) {
  return (
    <form method="get" action={action} role="search" className="mb-6 flex gap-3">
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search articles"
        aria-label="Search articles"
        className="min-h-[2.75rem] min-w-0 flex-1 rounded-full px-5 text-sm"
        style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' }}
      />
      <Button type="submit" variant="accent">Search</Button>
    </form>
  );
}
