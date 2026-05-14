import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('card', className)}>{children}</div>;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div>
        <div className="text-[13.5px] font-semibold text-ink">{title}</div>
        {subtitle && <div className="mt-0.5 text-[12px] text-muted">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}
