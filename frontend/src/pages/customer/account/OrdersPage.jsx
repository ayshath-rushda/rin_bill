import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight } from 'lucide-react';
import { orderApi } from '@/api/order.api';
import Pagination from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-teal-100 text-teal-700',
  packing: 'bg-purple-100 text-purple-700',
  dispatched: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
};

function OrdersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => orderApi.getAll({ page, limit: 10 }),
  });

  const orders = data?.data || [];
  const meta = data?.meta || {};

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Failed to load orders.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Package className="size-6" /> My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
          <Button asChild><Link to="/products">Start Shopping</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order._id} to={`/account/orders/${order._id}`} className="block border rounded-lg p-4 hover:border-muted-foreground transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${statusColors[order.orderStatus] || ''}`}>
                      {order.orderStatus}
                    </Badge>
                    <span className="text-sm font-semibold">₹{order.total?.toLocaleString()}</span>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </Link>
          ))}

          {meta.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
