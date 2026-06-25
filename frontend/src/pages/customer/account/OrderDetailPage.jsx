import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/api/order.api';
import StatusBadge from '@/components/shared/StatusBadge';
import StatusTimeline from '@/components/shared/StatusTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ArrowLeft, Truck } from 'lucide-react';

function OrderDetailPage() {
  const { orderId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['customer-order', orderId],
    queryFn: () => orderApi.getById(orderId),
  });

  const order = data;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Package className="size-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Button asChild><Link to="/account/orders">Back to My Orders</Link></Button>
      </div>
    );
  }

  const timestamps = {};
  if (order.createdAt) timestamps[order.orderStatus] = order.createdAt;
  if (order.updatedAt) timestamps[order.orderStatus] = order.updatedAt;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/account/orders"><ArrowLeft className="size-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
        <StatusBadge status={order.orderStatus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="size-5" /> Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">Product</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2">Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => (
                <tr key={item._id} className="border-b last:border-0">
                  <td className="py-2 flex items-center gap-2">
                    {item.productSnapshot?.image && (
                      <img src={item.productSnapshot.image} alt="" className="size-10 rounded object-cover" />
                    )}
                    <span>{item.productSnapshot?.name || 'Product'}</span>
                  </td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">₹{item.price?.toLocaleString()}</td>
                  <td className="py-2 text-right">₹{(item.price * item.quantity)?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={3} className="pt-3 text-right">Total:</td>
                <td className="pt-3 text-right">₹{order.total?.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline currentStatus={order.orderStatus} timestamps={timestamps} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">Payment:</span> <span className="capitalize">{order.paymentMethod}</span></p>
              <p><span className="text-muted-foreground">Payment Status:</span> <span className="capitalize">{order.paymentStatus}</span></p>
              <p><span className="text-muted-foreground">Date:</span> {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              <p><span className="text-muted-foreground">Address:</span> {order.addressSnapshot?.line1}, {order.addressSnapshot?.city}</p>
            </CardContent>
          </Card>

          {order.courier && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="size-4" /> Courier
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Courier:</span> {order.courier.courierName}</p>
                <p><span className="text-muted-foreground">Tracking:</span> {order.courier.trackingNumber}</p>
                {order.courier.estimatedDelivery && (
                  <p><span className="text-muted-foreground">Est. Delivery:</span> {new Date(order.courier.estimatedDelivery).toLocaleDateString('en-IN')}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;
