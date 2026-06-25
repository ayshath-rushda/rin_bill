import { Badge } from '@/components/ui/badge';

const statusConfig = {
  new: { variant: 'default', label: 'New' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  packing: { variant: 'warning', label: 'Packing' },
  dispatched: { variant: 'default', label: 'Dispatched' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
  returned: { variant: 'outline', label: 'Returned' },
};

function StatusBadge({ status, className }) {
  const config = statusConfig[status] || { variant: 'outline', label: status };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

export default StatusBadge;
