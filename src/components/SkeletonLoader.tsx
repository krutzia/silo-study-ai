import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass rounded-lg p-6 animate-pulse', className)}>
      <div className="h-4 bg-muted rounded w-3/4 mb-4" />
      <div className="h-3 bg-muted rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted rounded w-2/3" />
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('h-4 bg-muted rounded animate-pulse', className)} />;
}
