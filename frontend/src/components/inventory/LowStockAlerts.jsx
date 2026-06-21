import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { inventoryApi } from '@/api/inventory.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function LowStockAlerts() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryApi.getLowStock(),
    refetchInterval: 60000,
  });

  const products = data?.data || [];
  const count = products.length;

  const severityColor = count === 0
    ? 'text-muted-foreground'
    : count <= 3
      ? 'text-red-600'
      : count <= 7
        ? 'text-yellow-600'
        : 'text-orange-600';

  const bgColor = count === 0
    ? ''
    : count <= 3
      ? 'bg-red-50 dark:bg-red-950/20'
      : count <= 7
        ? 'bg-yellow-50 dark:bg-yellow-950/20'
        : 'bg-orange-50 dark:bg-orange-950/20';

  return (
    <Card
      className={`cursor-pointer transition-colors hover:shadow-md ${bgColor}`}
      onClick={() => navigate('/admin/inventory')}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
        <AlertTriangle className={`size-4 ${severityColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${severityColor}`}>
          {isLoading ? '...' : count}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {count === 0
            ? 'All products adequately stocked'
            : `Product${count > 1 ? 's' : ''} below minimum threshold`}
        </p>
      </CardContent>
    </Card>
  );
}

export default LowStockAlerts;
