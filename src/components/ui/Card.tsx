import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ className, children, padding = 'md', ...props }: CardProps) {
  const padMap = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-8' };
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white shadow-sm',
        'dark:border-gray-700/60 dark:bg-gray-800/60',
        padMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
