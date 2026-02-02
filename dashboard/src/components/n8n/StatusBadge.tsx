const colors: Record<string, string> = {
  active: 'bg-emerald-900/30 text-emerald-400',
  inactive: 'bg-n2f-elevated text-n2f-text',
  success: 'bg-emerald-900/30 text-emerald-400',
  error: 'bg-red-900/30 text-red-400',
  pending: 'bg-amber-900/30 text-amber-400',
  waiting: 'bg-amber-900/30 text-amber-400',
  running: 'bg-n2f-accent/10 text-n2f-accent',
  new: 'bg-n2f-accent/10 text-n2f-accent',
  crashed: 'bg-red-900/30 text-red-400',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = colors[status?.toLowerCase()] || 'bg-n2f-elevated text-n2f-text';
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>
      {status}
    </span>
  );
}
