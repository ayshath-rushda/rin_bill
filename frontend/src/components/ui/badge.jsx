import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-primary text-primary-foreground shadow-xs',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-white shadow-xs',
  outline: 'text-foreground border',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
};

function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
