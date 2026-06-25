import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Package, ShoppingBag } from 'lucide-react';
import { orderApi } from '@/api/order.api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function OrderConfirmation() {
  const { orderId } = useParams();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getById(orderId),
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-4 text-center">
        <Skeleton className="size-16 mx-auto rounded-full" />
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Order not found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find this order.</p>
        <Button asChild><Link to="/account/orders">My Orders</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <CheckCircle className="size-16 mx-auto text-green-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
      <p className="text-muted-foreground mb-2">Thank you for your order.</p>
      <p className="text-lg font-semibold mb-8">
        Order Number: <span className="text-primary">{order.orderNumber}</span>
      </p>

      <div className="border rounded-lg p-6 mb-8 text-left space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Package className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Status:</span>
          <span className="capitalize font-medium">{order.orderStatus}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ShoppingBag className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Items:</span>
          <span>{order.items?.length || 0}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold">₹{order.total?.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Payment:</span>
          <span className="capitalize">{order.paymentMethod?.replace('_', ' ')}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <Button asChild variant="outline"><Link to="/account/orders">View My Orders</Link></Button>
        <Button asChild><Link to="/products">Continue Shopping</Link></Button>
      </div>
    </div>
  );
}

export default OrderConfirmation;
