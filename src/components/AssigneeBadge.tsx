import { UserIcon } from 'lucide-react';

export type AssigneeBadgeProps = {
  user: { id: string; name: string } | null;
  size?: 'sm' | 'md';
  showName?: boolean;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}

export function AssigneeBadge({ user, size = 'md', showName = true }: AssigneeBadgeProps) {
  const circle = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs';
  const text = size === 'sm' ? 'text-xs' : 'text-sm';

  if (!user) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span
          className={`inline-flex items-center justify-center rounded-full border border-dashed border-muted-foreground/40 ${circle}`}
          aria-hidden="true"
        >
          <UserIcon className="h-3 w-3" />
        </span>
        {showName && <span className={text}>Nicht zugewiesen</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5" title={user.name}>
      <span
        className={`inline-flex items-center justify-center rounded-full bg-primary/15 font-semibold text-primary ${circle}`}
        aria-hidden="true"
      >
        {getInitials(user.name)}
      </span>
      {showName && <span className={`text-muted-foreground ${text}`}>{user.name}</span>}
    </span>
  );
}
